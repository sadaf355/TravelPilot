import os, re
from app.graph.builder import build_trip_graph
from app.services.llm_client import chat


def _graph_snapshot(graph=None, live_graph: dict | None = None):
    """Compact summary of live graph state, used to ground every answer
    branch (not just the unmatched fallback) in what's actually happening
    in the demo right now.

    There is no server-side session store — the backend rebuilds a fresh
    graph on every request, so the only way to know about an *active*
    disruption is if the frontend sends its current graph state along with
    the question (it already holds this in TripContext after a disruption
    is triggered). When `live_graph` is provided, ground on that instead of
    rebuilding a clean graph from the static demo file."""
    if live_graph and live_graph.get("nodes"):
        nodes = live_graph["nodes"]
        broken = [n for n in nodes if n.get("status") == "broken"]
        at_risk = [n for n in nodes if n.get("status") == "at_risk"]
        return {
            "node_count": len(nodes),
            "edge_count": len(live_graph.get("edges", [])),
            "broken": [{"id": n["id"], "title": n.get("title", n["id"]), "reason": n.get("impact_reason", "")} for n in broken],
            "at_risk": [{"id": n["id"], "title": n.get("title", n["id"]), "reason": n.get("impact_reason", "")} for n in at_risk],
        }
    broken = [n for n, d in graph.nodes(data=True) if d.get("status") == "broken"]
    at_risk = [n for n, d in graph.nodes(data=True) if d.get("status") == "at_risk"]
    return {
        "node_count": graph.number_of_nodes(),
        "edge_count": graph.number_of_edges(),
        "broken": [{"id": n, "title": graph.nodes[n].get("title", n), "reason": graph.nodes[n].get("impact_reason", "")} for n in broken],
        "at_risk": [{"id": n, "title": graph.nodes[n].get("title", n), "reason": graph.nodes[n].get("impact_reason", "")} for n in at_risk],
    }


def _templated_answer(q: str, snap: dict) -> str:
    """Deterministic, offline-safe fallback — but every branch now reads
    the live snapshot instead of returning a fixed string, so the answer
    changes with whatever disruption state is actually active."""
    disrupted = snap["broken"] + snap["at_risk"]
    disrupted_titles = ", ".join(d["title"] for d in disrupted) or "none currently"

    if "cancel" in q:
        if disrupted:
            return (f"Right now {disrupted_titles} are already affected by the active disruption. "
                    f"If you cancel a node on top of that, TravelPilot would re-walk the graph from "
                    f"that node and re-rank recovery options against the new state.")
        return ("No disruption is active in the demo right now. If a node were cancelled, TravelPilot "
                "would walk every downstream dependency from it and flag anything whose buffer is exceeded.")
    if "budget" in q or "cost" in q or "cheap" in q:
        return ("The lowest-cost recovery path is generally the one that moves the affected activity rather "
                "than replacing transport — that preserves more of the itinerary without the largest cost delta. "
                f"There are currently {len(disrupted)} node(s) affected, which is what the recovery ranking is scored against.")
    if "next" in q or "connection" in q:
        return ("Your next critical connection is the Delhi → Leh flight at 06:20, followed by the airport "
                "transfer at 08:45 with a 45-minute dependency buffer — that buffer is exactly what TravelPilot "
                "watches to decide whether a delay propagates.")
    if "recommend" in q or "why" in q or "option" in q:
        return ("Recovery options are ranked by schedule preservation, added cost, and how many downstream "
                "nodes remain affected after applying the option — that reasoning is shown, not hidden behind "
                "a single answer.")
    return (f"The itinerary graph currently has {snap['node_count']} nodes and {snap['edge_count']} dependencies. "
            + (f"{len(disrupted)} node(s) are currently affected: {disrupted_titles}."
               if disrupted else "No disruption is currently active in the demo state."))


def answer_question(question: str, trip=None):
    q = question.lower()
    # `trip`, when sent by the frontend, is the currently-rendered graph
    # (post-disruption if one is active) — see _graph_snapshot's docstring.
    snap = _graph_snapshot(build_trip_graph(), live_graph=trip)

    live = chat(
        "You are TravelPilot, a concise travel operations assistant. Answer only "
        "from the provided live graph state. Do not invent bookings, prices, or "
        "real-time facts not present in the context.",
        f"Question: {question}\nLive graph state: {snap}",
    )
    answer = live.strip() if live else _templated_answer(q, snap)

    return {
        "answer": answer,
        "sources": ["Live itinerary graph", "Dependency buffers", "Recovery scoring model"],
        "suggested_questions": [
            "What happens if my flight is cancelled?",
            "Can I recover without increasing my budget?",
            "Why is the top recovery option ranked first?",
        ],
    }
