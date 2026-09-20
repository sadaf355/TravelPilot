import {createContext,useContext,useState,useCallback} from 'react'
import {demoTrip} from '../data/demoTrip'
import {generateItinerary,triggerDisruption,getRecoveryOptions,applyRecovery} from '../services/api'
const C=createContext(null)
export function TripProvider({children}){
 const [trip,setTrip]=useState(demoTrip)
 const [itinerary,setItinerary]=useState(null)
 const [selectedNode,setSelectedNode]=useState(null)
 const [disruption,setDisruption]=useState(null)
 const [cascadeTrace,setCascadeTrace]=useState([])
 const [originalGraph,setOriginalGraph]=useState(null)
 // Frozen snapshot of the graph immediately after the most recent
 // disruption cascade resolved, captured *before* any recovery is
 // applied. Kept separate from `disruption.graph` (which recovery goes on
 // to mutate) so the UI can always show a true three-way
 // original → disrupted → recovered comparison instead of losing the
 // "disrupted" state the moment a recovery is applied.
 const [disruptedSnapshot,setDisruptedSnapshot]=useState(null)
 const [recoveryOptions,setRecoveryOptions]=useState([])
 const [recoveryExplanation,setRecoveryExplanation]=useState('')
 const [lastRecovery,setLastRecovery]=useState(null)
 const [isDisrupting,setIsDisrupting]=useState(false)
 const [isRecovering,setIsRecovering]=useState(false)
 const [demoMode,setDemoMode]=useState(true)
 const [toasts,setToasts]=useState([])

 const notify=useCallback((message,type='info')=>{const id=Date.now();setToasts(x=>[...x,{id,message,type}]);setTimeout(()=>setToasts(x=>x.filter(t=>t.id!==id)),3500)},[])

 const loadTrip=useCallback(async payload=>{
   try{
     const data=await generateItinerary(payload)
     setItinerary(data)
     setOriginalGraph(data.graph)
     setTrip({...demoTrip,...payload})
     setDisruption(null); setDisruptedSnapshot(null); setCascadeTrace([]); setRecoveryOptions([]); setRecoveryExplanation(''); setLastRecovery(null)
     if(data.personalized_nodes?.length){
       notify(`AI personalized ${data.personalized_nodes.length} activities for your interests`,'success')
     }else{
       notify('Trip graph loaded successfully','success')
     }
     return data
   }catch(e){
     notify('Backend unavailable — using demo trip','warning')
     return null
   }
 },[notify])

 const simulate=useCallback(async(payload)=>{
   setIsDisrupting(true)
   try{
     const stacking=!!payload.stack
     const body={...payload,current_graph:itinerary?.graph||null,reset:!stacking}
     delete body.stack
     const data=await triggerDisruption(body)
     setDisruption(data)
     setDisruptedSnapshot(data.graph) // freeze this cascade's result for the 3-way comparison
     setLastRecovery(null)
     setCascadeTrace(data.trace||[])
     setItinerary(prev=>{
       if(prev&&!originalGraph)setOriginalGraph(prev.graph)
       return prev?{...prev,graph:data.graph}:prev
     })
     const rec=await getRecoveryOptions(payload.node_id,payload.delay_minutes)
     setRecoveryOptions(rec.options||[])
     setRecoveryExplanation(rec.explanation||'')
     notify(stacking?`Stacked — ${data.summary.total_affected} nodes now affected in total`:`${data.summary.total_affected} downstream nodes analyzed`,'warning')
     return data
   }catch(e){
     notify('Disruption simulation failed','danger')
   }finally{
     setIsDisrupting(false)
   }
 },[notify,originalGraph,itinerary])

 // Actually applies a chosen recovery option: mutates the live graph
 // (affected nodes flip back to ok, the option's extra cost lands on the
 // trip total) instead of only showing a toast, while `disruptedSnapshot`
 // (captured in `simulate`) keeps the pre-recovery state around so the UI
 // can still show a genuine original → disrupted → recovered comparison.
 const applyRecoveryOption=useCallback(async(option,nodeId,delayMinutes)=>{
   setIsRecovering(true)
   try{
     const res=await applyRecovery({option_id:option.id,node_id:nodeId,delay_minutes:delayMinutes,current_graph:itinerary?.graph||disruption?.graph||null})
     const remaining=res.graph.nodes.filter(n=>n.status!=='ok')
     setDisruption(prev=>prev?{...prev,graph:res.graph,affected_nodes:remaining.map(n=>({id:n.id,status:n.status,delay_minutes:n.delay_minutes||0,reason:n.impact_reason||''})),summary:{total_affected:remaining.length,broken:remaining.filter(n=>n.status==='broken').length,at_risk:remaining.filter(n=>n.status==='at_risk').length}}:prev)
     setItinerary(prev=>prev?{...prev,graph:res.graph}:prev)
     setLastRecovery(res)
     notify(res.message||'Recovery applied','success')
     return res
   }catch(e){
     notify('Could not apply recovery','danger')
   }finally{
     setIsRecovering(false)
   }
 },[notify,itinerary,disruption])

 const resetDisruption=()=>{
   setDisruption(null)
   setDisruptedSnapshot(null)
   setCascadeTrace([])
   setRecoveryOptions([])
   setRecoveryExplanation('')
   setLastRecovery(null)
   setItinerary(prev=>prev&&originalGraph?{...prev,graph:originalGraph}:prev)
 }

 return <C.Provider value={{trip,setTrip,itinerary,setItinerary,selectedNode,setSelectedNode,disruption,setDisruption,cascadeTrace,originalGraph,disruptedSnapshot,recoveryOptions,setRecoveryOptions,recoveryExplanation,lastRecovery,isDisrupting,isRecovering,demoMode,setDemoMode,loadTrip,simulate,applyRecoveryOption,resetDisruption,toasts,notify}}>{children}</C.Provider>
}
export const useTrip=()=>useContext(C)
