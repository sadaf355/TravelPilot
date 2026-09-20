import {createContext,useContext,useState,useEffect,useCallback} from 'react'
import {login as apiLogin,signup as apiSignup,demoLogin as apiDemoLogin,getMe} from '../services/api'

const AuthContext=createContext(null)

export function AuthProvider({children}){
 const [user,setUser]=useState(null)
 const [token,setToken]=useState(()=>localStorage.getItem('tp_token'))
 const [loading,setLoading]=useState(true)
 const [authError,setAuthError]=useState('')

 useEffect(()=>{
  let cancelled=false
  async function restore(){
   const stored=localStorage.getItem('tp_token')
   if(!stored){setLoading(false);return}
   try{
    const me=await getMe()
    if(!cancelled){setUser(me);setToken(stored)}
   }catch(e){
    localStorage.removeItem('tp_token')
    if(!cancelled){setUser(null);setToken(null)}
   }finally{
    if(!cancelled)setLoading(false)
   }
  }
  restore()
  return ()=>{cancelled=true}
 },[])

 const applySession=useCallback(res=>{
  localStorage.setItem('tp_token',res.access_token)
  setToken(res.access_token)
  setUser(res.user)
 },[])

 const login=useCallback(async(email,password)=>{
  setAuthError('')
  try{
   const res=await apiLogin({email,password})
   applySession(res)
   return true
  }catch(e){
   setAuthError(e?.response?.data?.detail||'Could not log in — check your email and password.')
   return false
  }
 },[applySession])

 const signup=useCallback(async(name,email,password)=>{
  setAuthError('')
  try{
   const res=await apiSignup({name,email,password})
   applySession(res)
   return true
  }catch(e){
   setAuthError(e?.response?.data?.detail||'Could not create your account.')
   return false
  }
 },[applySession])

 const loginAsDemo=useCallback(async()=>{
  setAuthError('')
  try{
   const res=await apiDemoLogin()
   applySession(res)
   return true
  }catch(e){
   setAuthError('Demo login is unavailable — is the backend/database running?')
   return false
  }
 },[applySession])

 const logout=useCallback(()=>{
  localStorage.removeItem('tp_token')
  setUser(null)
  setToken(null)
 },[])

 return <AuthContext.Provider value={{user,token,loading,authError,setAuthError,login,signup,loginAsDemo,logout,isAuthenticated:!!user}}>{children}</AuthContext.Provider>
}

export const useAuth=()=>useContext(AuthContext)
