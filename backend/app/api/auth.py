from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import hash_password, verify_password, create_token, get_current_user
from app.db_models.user import User
from app.models.auth import SignupRequest, LoginRequest, TokenResponse, UserOut

router = APIRouter()

DEMO_EMAIL = "demo@travelpilot.app"
DEMO_PASSWORD = "demo1234"
DEMO_NAME = "Priya (Demo)"


def _unavailable():
    raise HTTPException(status_code=503, detail="Database is not reachable. Set DATABASE_URL to a running Postgres instance to enable auth.")


def _user_out(user: User) -> UserOut:
    return UserOut(id=user.id, name=user.name, email=user.email, is_demo=user.is_demo)


def _get_or_create_demo_user(db: Session) -> User:
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if user:
        return user
    user = User(name=DEMO_NAME, email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD), is_demo=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    try:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists")
        user = User(name=payload.name, email=payload.email, password_hash=hash_password(payload.password))
        db.add(user)
        db.commit()
        db.refresh(user)
    except HTTPException:
        raise
    except Exception:
        _unavailable()
    token = create_token(user.id, user.email)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == payload.email).first()
    except Exception:
        _unavailable()
        return
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user.id, user.email)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/demo-login", response_model=TokenResponse)
def demo_login(db: Session = Depends(get_db)):
    """Creates (once) or reuses a fixed demo account and logs straight in —
    real row in Postgres, real password hash, real JWT. Lets judges skip
    signup without the auth layer being fake."""
    try:
        user = _get_or_create_demo_user(db)
    except Exception:
        _unavailable()
        return
    token = create_token(user.id, user.email)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return _user_out(current)
