import {useEffect,useState} from 'react'; import {useLocation,useNavigate} from 'react-router-dom'; import {CheckCircle2,Circle,Loader2,PlaneTakeoff} from 'lucide-react'; import {useTrip} from '../context/TripContext'

const STEPS=[
  'Understanding your preferences',
  'Matching activities to your interests',
  'Building the day-by-day schedule',
  'Connecting transport, stay and activity dependencies',
  'Calculating buffer windows for each connection',
  'Preparing disruption-recovery paths',
]

export default function Generating(){
  const nav=useNavigate(); const {state}=useLocation(); const {loadTrip}=useTrip()
  const [stepIndex,setStepIndex]=useState(0)
  const [summary,setSummary]=useState(null)

  useEffect(()=>{
    if(!state){nav('/plan');return}
    let cancelled=false
    const stepTimer=setInterval(()=>setStepIndex(i=>Math.min(i+1,STEPS.length)),420)
    const minDelay=new Promise(r=>setTimeout(r,STEPS.length*420+300))
    Promise.all([loadTrip(state),minDelay]).then(([data])=>{
      if(cancelled)return
      clearInterval(stepTimer)
      setStepIndex(STEPS.length)
      if(data){
        setSummary({nodes:data.graph?.node_count??data.nodes?.length??0,edges:data.graph?.edge_count??data.edges?.length??0,personalized:data.personalized_nodes?.length||0})
      }
      setTimeout(()=>{if(!cancelled)nav('/dashboard')},900)
    })
    return ()=>{cancelled=true;clearInterval(stepTimer)}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  return <div className='grid min-h-screen place-items-center bg-ink px-5'>
    <div className='w-full max-w-md'>
      <div className='mb-8 flex items-center justify-center gap-2 text-primary'>
        <span className='grid h-10 w-10 place-items-center rounded-xl bg-primary/15'><PlaneTakeoff size={20}/></span>
      </div>
      <h1 className='text-center text-2xl font-bold'>Creating your trip…</h1>
      <p className='mt-2 text-center text-sm text-slate-500'>TravelPilot is building a connected itinerary, not just a list.</p>
      <div className='glass mt-8 rounded-3xl p-6'>
        <div className='space-y-4'>
          {STEPS.map((step,i)=>{
            const done=i<stepIndex, active=i===stepIndex
            return <div key={step} className='flex items-center gap-3'>
              {done?<CheckCircle2 size={18} className='shrink-0 text-success'/>:active?<Loader2 size={18} className='shrink-0 animate-spin text-primary'/>:<Circle size={18} className='shrink-0 text-slate-700'/>}
              <span className={`text-sm ${done?'text-slate-300':active?'text-slate-200':'text-slate-600'}`}>{step}</span>
            </div>
          })}
        </div>
        {summary&&<div className='mt-6 grid grid-cols-3 gap-2 border-t border-[rgb(var(--c-overlay)/7%)] pt-5 text-center'>
          <div><div className='text-lg font-semibold'>{summary.nodes}</div><div className='text-[11px] text-slate-500'>itinerary nodes</div></div>
          <div><div className='text-lg font-semibold'>{summary.edges}</div><div className='text-[11px] text-slate-500'>dependencies</div></div>
          <div><div className='text-lg font-semibold'>{summary.personalized}</div><div className='text-[11px] text-slate-500'>AI-personalized</div></div>
        </div>}
      </div>
    </div>
  </div>
}
