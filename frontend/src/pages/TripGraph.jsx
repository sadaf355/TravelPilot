import { useEffect } from 'react'
import { GitBranch, Network } from 'lucide-react'
import TripGraphView from '../components/TripGraph'
import { useTrip } from '../context/TripContext'
import { getDemoGraph } from '../services/api'
export default function TripGraphPage(){
 const {itinerary,setItinerary,selectedNode,setSelectedNode}=useTrip()
 useEffect(()=>{ if(!itinerary) getDemoGraph().then(graph=>setItinerary(prev=>prev?prev:{graph})).catch(()=>{}) },[itinerary,setItinerary])
 const graph=itinerary?.graph || {nodes:[],edges:[]}
 return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="text-xs uppercase tracking-[.2em] text-primary">04 / Trip graph</div><h1 className="mt-2 text-3xl font-bold">See how your journey is connected.</h1><p className="mt-2 max-w-2xl text-slate-400">Every transport segment, activity and stay is represented as a dependency node. Select a node to inspect its timing and buffer.</p></div><div className="flex gap-3"><Metric icon={Network} value={graph.node_count || graph.nodes.length} label="nodes"/><Metric icon={GitBranch} value={graph.edge_count || graph.edges.length} label="dependencies"/></div></div><div className="mt-7 grid gap-5 xl:grid-cols-[1fr_300px]"><TripGraphView graph={graph} onSelect={setSelectedNode}/><aside className="glass rounded-2xl p-5"><div className="text-xs uppercase tracking-wider text-slate-500">Selected node</div>{selectedNode?<><h2 className="mt-2 font-semibold">{selectedNode.title}</h2><p className="mt-2 text-sm text-slate-400">{selectedNode.description || selectedNode.location}</p><div className="mt-5 space-y-3 text-sm"><Row label="Type" value={selectedNode.type}/><Row label="Time" value={`${selectedNode.start_time} – ${selectedNode.end_time}`}/><Row label="Location" value={selectedNode.location}/><Row label="Cost" value={selectedNode.cost ? `₹${selectedNode.cost.toLocaleString('en-IN')}` : 'Free'}/><Row label="Status" value={selectedNode.status}/></div></>:<div className="mt-5 text-sm leading-6 text-slate-500">Click any node in the graph to inspect it.</div>}</aside></div></div>
}
function Metric({icon:Icon,value,label}){return <div className="glass flex items-center gap-3 rounded-xl px-4 py-3"><Icon size={17} className="text-primary"/><div><div className="font-semibold">{value}</div><div className="text-[11px] text-slate-500">{label}</div></div></div>}
function Row({label,value}){return <div><div className="text-xs text-slate-500">{label}</div><div className="mt-1 capitalize">{value}</div></div>}
