from __future__ import annotations
import json
from pathlib import Path
import networkx as nx

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "demo_trip.json"


def load_demo_trip() -> dict:
    with DATA_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def build_trip_graph(trip: dict | None = None) -> nx.DiGraph:
    trip = trip or load_demo_trip()
    graph = nx.DiGraph(trip_id=trip["trip_id"], destination=trip["destination"])
    for day in trip.get("days", []):
        for item in day.get("items", []):
            attrs = {k: v for k, v in item.items() if k != "id"}
            attrs.setdefault("status", "ok")
            graph.add_node(item["id"], **attrs)
    for edge in trip.get("edges", []):
        graph.add_edge(edge["source"], edge["target"], type="depends_on", buffer_time=edge.get("buffer_time", 0))
    return graph


def build_graph_from_serialized(serialized: dict) -> nx.DiGraph:
    """Rebuild a networkx graph from a previously-serialized one (the shape
    serialize_graph() produces). Used so the disruption/cascade engine can
    operate on the traveler's actual personalized itinerary — sent by the
    frontend, since there is no server-side session store — instead of
    silently resetting to the static demo data on every request."""
    graph = nx.DiGraph()
    for node in serialized.get("nodes", []):
        node = dict(node)
        node_id = node.pop("id")
        graph.add_node(node_id, **node)
    for edge in serialized.get("edges", []):
        edge = dict(edge)
        source = edge.pop("source")
        target = edge.pop("target")
        graph.add_edge(source, target, **edge)
    return graph


def serialize_graph(graph: nx.DiGraph) -> dict:
    nodes = []
    for node_id, attrs in graph.nodes(data=True):
        nodes.append({"id": node_id, **attrs})
    edges = []
    for source, target, attrs in graph.edges(data=True):
        edges.append({"source": source, "target": target, **attrs})
    return {"nodes": nodes, "edges": edges, "node_count": graph.number_of_nodes(), "edge_count": graph.number_of_edges()}
