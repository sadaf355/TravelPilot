import {Navigate,useLocation} from 'react-router-dom'
import {useAuth} from '../context/AuthContext'

export default function ProtectedRoute({children}){
 const {isAuthenticated,loading}=useAuth()
 const location=useLocation()
 if(loading)return <div className='grid min-h-screen place-items-center bg-ink text-slate-200'><div className='text-sm text-slate-500'>Checking your session…</div></div>
 if(!isAuthenticated)return <Navigate to='/login' replace state={{from:location.pathname}}/>
 return children
}
