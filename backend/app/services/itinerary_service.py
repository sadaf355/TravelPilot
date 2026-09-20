from app.models.itinerary import ItineraryRequest, ItineraryResponse, ItineraryNode, ItineraryEdge
from app.services.planner_service import generate_itinerary
from app.graph.builder import build_trip_graph, serialize_graph

def generate_demo_itinerary(payload: ItineraryRequest) -> ItineraryResponse:
    trip, graph=generate_itinerary(payload)
    nodes=[ItineraryNode(**{'id':node_id,**attrs}) for node_id,attrs in graph.nodes(data=True)]
    edges=[ItineraryEdge(source=s,target=t,**attrs) for s,t,attrs in graph.edges(data=True)]
    return ItineraryResponse(trip_id=trip['trip_id'],destination=trip['destination'],start_date=trip['start_date'],end_date=trip['end_date'],budget=trip['budget'],interests=trip['interests'],days=trip['days'],nodes=nodes,edges=edges,graph=serialize_graph(graph),personalized_nodes=trip.get('personalized_nodes',[]),planning_trace=trip.get('planning_trace',[]))
def get_demo_graph(): return serialize_graph(build_trip_graph())
