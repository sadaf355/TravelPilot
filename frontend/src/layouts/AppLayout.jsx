import {NavLink,Outlet} from 'react-router-dom'
import {GitBranch,LayoutDashboard,Map,PlaneTakeoff,Route,Zap,MessageCircle,CloudSun,ShieldCheck,Sun,Moon,LogOut,User as UserIcon} from 'lucide-react'
import {useTrip} from '../context/TripContext'
import {useTheme} from '../context/ThemeContext'
import {useAuth} from '../context/AuthContext'

const links=[['/dashboard',LayoutDashboard,'Overview'],['/itinerary',Map,'Itinerary'],['/graph',GitBranch,'Trip Graph'],['/disruption',Zap,'Disruption'],['/recovery',ShieldCheck,'Recovery'],['/assistant',MessageCircle,'AI Assistant'],['/weather',CloudSun,'Weather']]

export default function AppLayout(){
 const {demoMode,setDemoMode}=useTrip()
 const {theme,toggleTheme}=useTheme()
 const {user,logout}=useAuth()

 return <div className='min-h-screen bg-ink text-slate-200'>
  <header className='sticky top-0 z-40 border-b border-[rgb(var(--c-overlay)/7%)] bg-ink/90 backdrop-blur-xl'>
   <div className='mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-2 px-3 sm:px-5 lg:px-8'>
    <NavLink to='/' className='flex shrink-0 items-center gap-2 font-bold'>
     <span className='grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary'><PlaneTakeoff size={18}/></span>
     <span className='hidden sm:inline'>TravelPilot</span>
     <span className='hidden rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-primary xl:inline'>AI travel OS</span>
    </NavLink>

    <nav className='hidden items-center gap-1 lg:flex'>
     {links.map(([to,I,label])=><NavLink key={to} to={to} className={({isActive})=>`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition ${isActive?'bg-[rgb(var(--c-overlay)/7%)] text-slate-200':'text-slate-500 hover:text-slate-200'}`}><I size={14}/>{label}</NavLink>)}
    </nav>

    <div className='flex items-center gap-1.5 sm:gap-2'>
     <button onClick={()=>setDemoMode(!demoMode)} className={`hidden rounded-lg border px-3 py-2 text-xs md:block ${demoMode?'border-success/25 bg-success/10 text-success':'border-line text-slate-400'}`}>{demoMode?'● Demo safe':'○ Live mode'}</button>
     <button onClick={toggleTheme} title='Toggle theme' className='grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-slate-400 transition hover:text-slate-200'>
      {theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}
     </button>
     <NavLink to='/plan' className='hidden items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white sm:flex'><Route size={14}/>Plan trip</NavLink>
     <NavLink to='/plan' className='grid h-9 w-9 place-items-center rounded-lg bg-primary text-white sm:hidden'><Route size={15}/></NavLink>

     {user&&<div className='group relative ml-0.5 hidden shrink-0 sm:block'>
      <button className='flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-xs text-slate-400 transition hover:text-slate-200'>
       <span className='grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-primary'><UserIcon size={13}/></span>
       <span className='max-w-[90px] truncate'>{user.name}</span>
      </button>
      <div className='invisible absolute right-0 top-[calc(100%+6px)] w-44 rounded-xl border border-line bg-panel p-1.5 opacity-0 shadow-xl shadow-black/30 transition group-hover:visible group-hover:opacity-100'>
       <div className='truncate px-2.5 py-1.5 text-[11px] text-slate-500'>{user.email}</div>
       <button onClick={logout} className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-danger hover:bg-danger/10'><LogOut size={13}/>Log out</button>
      </div>
     </div>}
     {user&&<button onClick={logout} title='Log out' className='grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-slate-400 hover:text-danger sm:hidden'><LogOut size={15}/></button>}
    </div>
   </div>
  </header>

  <main className='pb-24 lg:pb-0'><Outlet/></main>

  {/* Mobile bottom nav — the desktop nav is hidden below lg, this replaces it */}
  <nav className='fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-[rgb(var(--c-overlay)/7%)] bg-ink/95 px-1 py-1.5 backdrop-blur-xl lg:hidden' style={{paddingBottom:'calc(0.375rem + env(safe-area-inset-bottom,0px))'}}>
   {links.map(([to,I,label])=><NavLink key={to} to={to} className={({isActive})=>`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[9px] ${isActive?'text-primary':'text-slate-500'}`}><I size={17}/><span className='max-w-[52px] truncate leading-tight'>{label}</span></NavLink>)}
  </nav>
 </div>
}
