import { useMemo, useState } from 'react'
import { Maximize2, Minus, Plus, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { typeMeta } from '../data/demoTrip'
const positions={flight_1:[10,28],transfer_1:[34,28],stay_1:[58,20],activity_1:[82,20],transfer_2:[12,68],activity_2:[36,68],activity_3:[60,68],transfer_3:[84,68],activity_4:[84,42],stay_2:[60,42],transfer_4:[36,42],activity_5:[12,42],stay_3:[36,16],transfer_5:[12,84],activity_6:[36,84],stay_4:[60,84],transfer_6:[82,84],flight_2:[94,84]}
const statusStyle={
 ok:{fill:'rgb(var(--c-panel2))',stroke:'rgb(var(--c-overlay) / 18%)',text:'rgb(var(--c-slate-200))'},
 at_risk:{fill:'rgb(var(--c-warning) / 18%)',stroke:'rgb(var(--c-warning))',text:'rgb(var(--c-warning))'},
 broken:{fill:'rgb(var(--c-danger) / 18%)',stroke:'rgb(var(--c-danger))',text:'rgb(var(--c-danger))'},
}
// Nodes without a hand-placed position (e.g. ids the static layout above
// doesn't know about) get spread around a ring by a golden-angle spiral
// instead of all stacking on top of each other at the canvas center.
const fallbackPosition=i=>{const angle=(i*137.508)%360;const r=32+((i*13)%18);const rad=angle*Math.PI/180;return [50+r*Math.cos(rad),50+r*Math.sin(rad)]}

export default function TripGraph({graph,onSelect,animate=false}){
 const [zoom,setZoom]=useState(1); const [hover,setHover]=useState(null)
 const nodes=graph?.nodes||[],edges=graph?.edges||[]
 const nodeMap=useMemo(()=>Object.fromEntries(nodes.map(n=>[n.id,n])),[nodes])
 const idIndex=useMemo(()=>Object.fromEntries(nodes.map((n,i)=>[n.id,i])),[nodes])
 const xy=id=>positions[id]||fallbackPosition(idIndex[id]??0)
 return <div className="relative h-[380px] overflow-hidden rounded-2xl border border-[rgb(var(--c-overlay)/8%)] bg-ink grid-bg sm:h-[460px] lg:h-[560px]">
  <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-[rgb(var(--c-overlay)/8%)] bg-panel/90 px-3 py-2 text-xs text-slate-400"><span className="h-2 w-2 rounded-full bg-success"/> <span className="hidden sm:inline">Live dependency graph</span><span className="sm:hidden">Live graph</span></div>
  <div className="absolute right-4 top-4 z-20 flex gap-2"><button onClick={()=>setZoom(z=>Math.min(1.5,z+.1))} className="graph-control"><Plus size={16}/></button><button onClick={()=>setZoom(z=>Math.max(.7,z-.1))} className="graph-control"><Minus size={16}/></button><button onClick={()=>setZoom(1)} className="graph-control"><Maximize2 size={15}/></button></div>
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" style={{transform:`scale(${zoom})`,transition:'transform .25s'}}>
   <defs><marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill="rgb(var(--c-primary) / 55%)"/></marker></defs>
   {edges.map(e=>{const [x1,y1]=xy(e.source),[x2,y2]=xy(e.target);const impacted=nodeMap[e.source]?.status!=='ok'||nodeMap[e.target]?.status!=='ok';return <line key={`${e.source}-${e.target}`} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke={impacted?'rgb(var(--c-danger) / 65%)':'rgb(var(--c-primary) / 45%)'} strokeWidth={impacted?'.38':'.22'} strokeDasharray={impacted?'1 .4':'.7 .5'} markerEnd="url(#arrow)" vectorEffect="non-scaling-stroke"/>})}
   {nodes.map(n=>{const [x,y]=xy(n.id);const active=hover===n.id;const s=statusStyle[n.status]||statusStyle.ok;return <g key={n.id} onClick={()=>onSelect?.(n)} onMouseEnter={()=>setHover(n.id)} onMouseLeave={()=>setHover(null)} className="cursor-pointer">
    {(n.status!=='ok'||animate)&&<circle cx={`${x}%`} cy={`${y}%`} r="4.5" fill="none" stroke={n.status==='broken'?'rgb(var(--c-danger))':'rgb(var(--c-warning))'} strokeWidth=".35" opacity=".45" className="pulse-ring"/>}
    <circle cx={`${x}%`} cy={`${y}%`} r={active?'3.4':'2.9'} fill={s.fill} stroke={active?'rgb(var(--c-primary))':s.stroke} strokeWidth=".3" vectorEffect="non-scaling-stroke"/>
    {/* Icon only on-canvas — full title/time/cost lives in the hover tooltip and the
        selected-node panel; printing every label inline collided constantly once
        nodes carried longer, personalized titles. */}
    <text x={`${x}%`} y={`${y}%`} dy=".38em" textAnchor="middle" fontSize="2.6">{typeMeta[n.type]?.icon||'•'}</text>
   </g>})}
  </svg>
  {hover&&nodeMap[hover]&&<div className="absolute bottom-4 left-4 z-20 w-[min(18rem,calc(100%-2rem))] rounded-xl border border-[rgb(var(--c-overlay)/10%)] bg-panel/95 p-4 shadow-xl backdrop-blur"><div className="flex items-center justify-between"><div className="text-xs uppercase tracking-wider text-slate-500">{typeMeta[nodeMap[hover].type]?.label}</div><StatusIcon status={nodeMap[hover].status}/></div><div className="mt-1 font-semibold">{nodeMap[hover].title}</div><div className="mt-2 text-xs text-slate-400">{nodeMap[hover].location}</div><div className="mt-1 text-xs text-slate-500">{nodeMap[hover].start_time} – {nodeMap[hover].end_time}</div>{nodeMap[hover].impact_reason&&<div className="mt-3 rounded-lg bg-danger/10 p-2 text-xs text-danger">{nodeMap[hover].impact_reason}</div>}</div>}
 </div>
}
function StatusIcon({status}){return status==='broken'?<XCircle size={15} className="text-danger"/>:status==='at_risk'?<AlertTriangle size={15} className="text-warning"/>:<CheckCircle2 size={15} className="text-success"/>}
