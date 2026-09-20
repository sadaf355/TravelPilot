import {useState} from 'react'
import {useNavigate,useLocation,Link} from 'react-router-dom'
import {PlaneTakeoff,Sparkles,Loader2,Mail,Lock,User as UserIcon} from 'lucide-react'
import {useAuth} from '../context/AuthContext'

export default function Login(){
 const {login,signup,loginAsDemo,authError,setAuthError}=useAuth()
 const nav=useNavigate()
 const location=useLocation()
 const dest=location.state?.from||'/dashboard'

 const [mode,setMode]=useState('login') // 'login' | 'signup'
 const [form,setForm]=useState({name:'',email:'',password:''})
 const [busy,setBusy]=useState(null) // 'form' | 'demo' | null

 const submit=async e=>{
  e.preventDefault()
  setBusy('form')
  const ok=mode==='login'?await login(form.email,form.password):await signup(form.name,form.email,form.password)
  setBusy(null)
  if(ok)nav(dest,{replace:true})
 }

 const tryDemo=async()=>{
  setBusy('demo')
  const ok=await loginAsDemo()
  setBusy(null)
  if(ok)nav(dest,{replace:true})
 }

 return <div className='grid min-h-screen place-items-center bg-ink px-5 py-10 text-white grid-bg'>
  <div className='w-full max-w-md'>
   <Link to='/' className='mb-8 flex items-center justify-center gap-2 text-slate-300'>
    <span className='grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary'><PlaneTakeoff size={20}/></span>
    <b className='text-lg'>TravelPilot</b>
   </Link>

   <div className='glass rounded-3xl p-7 shadow-2xl shadow-black/30'>
    <div className='mb-6 flex rounded-xl border border-[rgb(var(--c-overlay)/8%)] p-1 text-sm'>
     <button type='button' onClick={()=>{setMode('login');setAuthError('')}} className={`flex-1 rounded-lg py-2 font-semibold transition ${mode==='login'?'bg-primary text-white':'text-slate-400'}`}>Log in</button>
     <button type='button' onClick={()=>{setMode('signup');setAuthError('')}} className={`flex-1 rounded-lg py-2 font-semibold transition ${mode==='signup'?'bg-primary text-white':'text-slate-400'}`}>Sign up</button>
    </div>

    <form onSubmit={submit} className='space-y-3.5'>
     {mode==='signup'&&<Field icon={UserIcon} type='text' placeholder='Full name' value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>}
     <Field icon={Mail} type='email' placeholder='Email' value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} required/>
     <Field icon={Lock} type='password' placeholder='Password' value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} required minLength={6}/>

     {authError&&<div className='rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger'>{authError}</div>}

     <button type='submit' disabled={busy!==null} className='flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60'>
      {busy==='form'?<Loader2 size={16} className='animate-spin'/>:null}
      {mode==='login'?'Log in':'Create account'}
     </button>
    </form>

    <div className='my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-600'>
     <span className='h-px flex-1 bg-[rgb(var(--c-overlay)/8%)]'/>or<span className='h-px flex-1 bg-[rgb(var(--c-overlay)/8%)]'/>
    </div>

    <button onClick={tryDemo} disabled={busy!==null} type='button' className='flex w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/8 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15 disabled:opacity-60'>
     {busy==='demo'?<Loader2 size={16} className='animate-spin'/>:<Sparkles size={16}/>}
     Continue with demo credentials
    </button>
    <p className='mt-3 text-center text-[11px] text-slate-600'>Signs you in instantly as a real demo account — no signup needed.</p>
   </div>
  </div>
 </div>
}

function Field({icon:Icon,value,onChange,...props}){
 return <div className='flex items-center gap-2.5 rounded-xl border border-[rgb(var(--c-overlay)/9%)] bg-[rgb(var(--c-overlay)/3.5%)] px-3.5 py-3 focus-within:border-primary/50'>
  <Icon size={16} className='shrink-0 text-slate-500'/>
  <input {...props} value={value} onChange={e=>onChange(e.target.value)} className='w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600'/>
 </div>
}
