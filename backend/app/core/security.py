import os
import time
import jwt
import bcrypt
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.core.db import get_db

SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
ALGO = "HS256"
EXPIRE_SECONDS = 60 * 60 * 24 * 7  # 7 days


def hash_password(password: str) -> str:
    # bcrypt has a 72-byte input limit; truncate defensively rather than
    # erroring on an unusually long password.
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], hashed.encode("utf-8"))
    except ValueError:
        return False


def create_token(user_id: int, email: str) -> str:
    payload = {"sub": str(user_id), "email": email, "exp": int(time.time()) + EXPIRE_SECONDS}
    return jwt.encode(payload, SECRET, algorithm=ALGO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET, algorithms=[ALGO])


def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session — please log in again")

    from app.db_models.user import User  # local import avoids a circular import with db_models

    try:
        user = db.query(User).filter(User.id == int(payload["sub"])).first()
    except Exception:
        # Postgres unreachable — a clean, explicit 503 beats a raw 500 from
        # a driver-level exception leaking out of the request.
        raise HTTPException(status_code=503, detail="Database is not reachable right now. Please try again shortly.")
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session — please log in again")
    return user
