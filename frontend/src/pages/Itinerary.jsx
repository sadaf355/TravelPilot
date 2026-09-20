import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import ItineraryTimeline from '../components/ItineraryTimeline'
import { useTrip } from '../context/TripContext'
import { getDemoItinerary } from '../services/api'
export default function Itinerary(){
 const {itinerary,setItinerary,setSelectedNode}=useTrip()
 useEffect(()=>{if(!itinerary) getDemoItinerary().then(setItinerary).catch(()=>{})},[itinerary,setItinerary])
 const days=itinerary?.days || []
 return <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="text-xs uppercase tracking-[.2em] text-primary">03 / Itinerary</div><h1 className="mt-2 text-3xl font-bold">Your Ladakh journey, day by day.</h1><p className="mt-2 text-slate-400">A detailed timeline generated from the same data that powers the dependency graph.</p></div><Link to="/graph" className="flex items-center gap-2 rounded-xl border border-[rgb(var(--c-overlay)/10%)] px-4 py-2 text-sm hover:bg-[rgb(var(--c-overlay)/5%)]">Open trip graph <ArrowUpRight size={15}/></Link></div><div className="mt-8 glass rounded-3xl p-6"><ItineraryTimeline days={days} onSelect={setSelectedNode} personalized={itinerary?.personalized_nodes||[]}/></div></div>
}
