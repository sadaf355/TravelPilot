import {useTrip} from '../context/TripContext'
import {CheckCircle2,Clock3,IndianRupee,GitBranch,ArrowRight,Sparkles,ArrowRightLeft,Loader2,ShieldCheck} from 'lucide-react'

function ThreeWay({originalGraph,disruptedGraph,recoveredGraph}){
  if(!originalGraph?.nodes?.length||!disruptedGraph?.nodes?.length)return null
  const beforeMap=Object.fromEntries(originalGraph.nodes.map(n=>[n.id,n]))
  const recoveredMap=recoveredGraph?Object.fromEntries(recoveredGraph.nodes.map(n=>[n.id,n])):null
  const changed=disruptedGraph.nodes.filter(n=>beforeMap[n.id]&&beforeMap[n.id].status!==n.status)
  if(!changed.length)return null
  const cols=recoveredMap?'sm:grid-cols-3':'sm:grid-cols-2'
  return <div className='glass mt-8 rounded-2xl p-6'>
    <div className='flex items-center gap-2 text-slate-300'><ArrowRightLeft size={15} className='text-primary'/><span className='text-xs uppercase tracking-wider text-slate-500'>{recoveredMap?'Original → disrupted → recovered':'Before vs after'}</span></div>
    <div className={`mt-4 grid gap-3 ${cols}`}>
      <Column title='Original itinerary' items={changed.map(n=>({id:n.id,title:beforeMap[n.id].title,status:'ok'}))}/>
      <Column title='After disruption' items={changed.map(n=>({id:n.id,title:n.title,status:n.status}))}/>
      {recoveredMap&&<Column title='After recovery' items={changed.map(n=>({id:n.id,title:recoveredMap[n.id]?.title||n.title,status:recoveredMap[n.id]?.status||n.status}))}/>}
    </div>
  </div>
}
function Column({title,items}){
  return <div>
    <div className='mb-2 text-[11px] uppercase tracking-wider text-slate-600'>{title}</div>
    <div className='space-y-2'>{items.map(n=><div key={n.id} className='flex items-center justify-between rounded-lg border border-[rgb(var(--c-overlay)/7%)] bg-[rgb(var(--c-overlay)/2%)] px-3 py-2 text-sm'>
      <span className='text-slate-400'>{n.title}</span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] ${n.status==='ok'?'bg-success/10 text-success':n.status==='broken'?'bg-danger/10 text-danger':'bg-warning/10 text-warning'}`}>{n.status}</span>
    </div>)}</div>
  </div>
}

export default function Recovery(){
  const {recoveryOptions,recoveryExplanation,disruption,originalGraph,disruptedSnapshot,itinerary,lastRecovery,isRecovering,applyRecoveryOption}=useTrip()

  return <div className='mx-auto max-w-6xl px-5 py-8 sm:px-8'>
    <div className='eyebrow'>RECOVERY ENGINE</div>
    <h1 className='mt-2 text-3xl font-bold'>Ranked ways to get your trip back on track.</h1>
    <p className='mt-2 max-w-2xl text-slate-400'>{disruption?`Triggered by ${disruption.disrupted_node} · ${disruption.delay_minutes} min delay.`:'Trigger a disruption first to generate recovery options.'}</p>

    {lastRecovery&&<div className='mt-6 flex items-center gap-3 rounded-2xl border border-success/25 bg-success/10 p-4 text-sm text-success'>
      <ShieldCheck size={16} className='shrink-0'/>
      <span>{lastRecovery.message}</span>
    </div>}

    {recoveryExplanation&&<div className='mt-6 flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4'>
      <Sparkles size={16} className='mt-0.5 shrink-0 text-primary'/>
      <p className='text-sm leading-6 text-slate-300'>{recoveryExplanation}</p>
    </div>}

    <div className='mt-7 space-y-4'>
      {recoveryOptions.map((o,i)=>{
        const applied=lastRecovery?.option?.id===o.id
        return <div key={o.id} className={`glass rounded-2xl p-5 ${i===0?'border-primary/30':''} ${applied?'ring-1 ring-success/40':''}`}>
          <div className='flex flex-col gap-4 md:flex-row md:items-start'>
            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <span className='rounded-full bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-wider text-primary'>#{i+1}</span>
                {i===0&&<span className='rounded-full bg-success/10 px-2 py-1 text-[10px] text-success'>Top ranked</span>}
                {applied&&<span className='rounded-full bg-success/15 px-2 py-1 text-[10px] font-semibold text-success'>✓ Applied</span>}
              </div>
              <h2 className='mt-3 text-lg font-semibold'>{o.title}</h2>
              <p className='mt-2 text-sm leading-6 text-slate-400'>{o.description}</p>
              <div className='mt-4 flex flex-wrap gap-2'>{o.changes.map(c=><span key={c} className='rounded-lg bg-[rgb(var(--c-overlay)/4%)] px-2.5 py-1.5 text-xs text-slate-400'>{c}</span>)}</div>
            </div>
            <div className='grid min-w-[260px] grid-cols-2 gap-2'>
              <Stat icon={Clock3} label='Schedule' value={`${o.time_recovered}%`}/>
              <Stat icon={IndianRupee} label='Extra cost' value={`₹${o.cost_delta.toLocaleString('en-IN')}`}/>
              <Stat icon={GitBranch} label='Nodes left' value={o.downstream_affected}/>
              <Stat icon={CheckCircle2} label='Score' value={o.score}/>
            </div>
          </div>
          <div className='mt-5 rounded-xl border border-[rgb(var(--c-overlay)/7%)] bg-black/10 p-4'>
            <div className='text-xs uppercase tracking-wider text-slate-500'>Why it ranks here</div>
            <div className='mt-3 grid gap-3 text-xs sm:grid-cols-3'><span>{o.reasoning.time_recovered}</span><span>{o.reasoning.cost}</span><span>{o.reasoning.downstream}</span></div>
          </div>
          <button
            disabled={isRecovering}
            onClick={()=>applyRecoveryOption(o,disruption?.disrupted_node||'flight_1',disruption?.delay_minutes||300)}
            className='mt-4 flex items-center gap-2 text-sm font-semibold text-primary disabled:opacity-50'
          >
            {isRecovering?<><Loader2 size={15} className='animate-spin'/>Applying…</>:<>Apply this recovery <ArrowRight size={15}/></>}
          </button>
        </div>
      })}
    </div>

    <ThreeWay originalGraph={originalGraph} disruptedGraph={disruptedSnapshot||disruption?.graph} recoveredGraph={lastRecovery?itinerary?.graph:null}/>
  </div>
}
function Stat({icon:Icon,label,value}){return <div className='rounded-xl border border-[rgb(var(--c-overlay)/7%)] bg-[rgb(var(--c-overlay)/2.5%)] p-3'><Icon size={14} className='text-primary'/><div className='mt-2 text-xs text-slate-500'>{label}</div><div className='mt-0.5 font-semibold'>{value}</div></div>}
