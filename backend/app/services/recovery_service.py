from app.graph.builder import build_trip_graph, build_graph_from_serialized, serialize_graph
from app.services.llm_client import chat
import networkx as nx


def _downstream(graph, node_id):
    return list(__import__('networkx').descendants(graph, node_id))


def explain_ranking(node_id: str, options: list[dict]) -> str:
    """Ask the LLM to explain, in plain language, why the top-ranked option
    won — grounded in the actual scored options, not free-floating advice.
    The ranking itself stays fully deterministic; only this narration is
    generated. Falls back to a templated explanation if no LLM is
    configured, so the recovery screen never has an empty state."""
    top = options[0]
    live = chat(
        "You are TravelPilot's recovery advisor. You are given a disrupted "
        "itinerary node and 2-3 already-ranked recovery options with their "
        "scores. Explain in 2-3 short sentences why the top option was "
        "ranked first, referencing its actual numbers. Do not propose new "
        "options or invent facts not given.",
        f"Disrupted node: {node_id}\n"
        f"Ranked options: {options}\n"
        f"Top option: {top['title']} (score {top['score']})",
    )
    if live:
        return live.strip()
    return (
        f"{top['title']} ranks first because it preserves {top['time_recovered']}% "
        f"of the original schedule while adding only ₹{top['cost_delta']:,} and "
        f"leaving {top['downstream_affected']} downstream items affected — the best "
        f"balance of the three factors TravelPilot scores on."
    )


def rank_recovery_options(node_id: str, delay_minutes: int = 300):
    graph = build_trip_graph()
    if node_id not in graph:
        raise ValueError(f"Unknown itinerary node: {node_id}")
    downstream = _downstream(graph, node_id)
    impacted = len(downstream)
    options = [
        {
            "id": "move_activity",
            "title": "Move the affected activity",
            "description": "Shift the first affected activity to the next flexible slot while keeping transport and hotel bookings.",
            "cost_delta": 1500,
            "time_recovered": 92,
            "downstream_affected": 0,
            "changes": ["Move activity to Day 2", "Keep flight and hotel unchanged"],
        },
        {
            "id": "rebook_transport",
            "title": "Rebook the connecting transport",
            "description": "Replace the transfer with a later pickup that matches the delayed arrival.",
            "cost_delta": 700,
            "time_recovered": 82,
            "downstream_affected": max(0, impacted - 1),
            "changes": ["Move airport transfer", "Preserve most activities"],
        },
        {
            "id": "change_flight",
            "title": "Change the flight",
            "description": "Switch to another flight to preserve the original downstream schedule.",
            "cost_delta": 4800,
            "time_recovered": 85,
            "downstream_affected": 0,
            "changes": ["Replace disrupted flight", "Keep downstream schedule"],
        },
    ]
    # Transparent deterministic score: schedule preservation is rewarded,
    # cost and remaining downstream impact are penalized.
    for o in options:
        o["score"] = round(
            0.50 * o["time_recovered"]
            - 0.003 * o["cost_delta"]
            - 10 * o["downstream_affected"], 1
        )
        o["reasoning"] = {
            "time_recovered": f"Preserves {o['time_recovered']}% of the original schedule",
            "cost": f"Adds ₹{o['cost_delta']:,} to the trip",
            "downstream": f"Leaves {o['downstream_affected']} downstream nodes affected",
        }
    return sorted(options, key=lambda x: x["score"], reverse=True)[:3]


def apply_recovery_option(node_id: str, option_id: str, delay_minutes: int = 300, current_graph: dict | None = None):
    """Actually mutates the graph rather than only returning a preview
    string: the disrupted node and everything downstream of it that the
    cascade had marked non-'ok' is restored, so the dashboard/graph/before-
    after views reflect the recovery instead of staying frozen mid-disaster.
    The three recovery *candidates* are still the fixed set described in
    rank_recovery_options (a documented limitation) — this only makes
    accepting one of them have a real, visible effect."""
    options = rank_recovery_options(node_id, delay_minutes)
    match = next((o for o in options if o["id"] == option_id), None)
    if not match:
        raise ValueError("Unknown recovery option")

    graph = build_graph_from_serialized(current_graph) if current_graph else build_trip_graph()
    if node_id not in graph:
        raise ValueError(f"Unknown itinerary node: {node_id}")

    restored = []
    for n in [node_id, *nx.descendants(graph, node_id)]:
        if graph.nodes[n].get("status") != "ok":
            graph.nodes[n]["status"] = "ok"
            graph.nodes[n]["delay_minutes"] = 0
            graph.nodes[n]["impact_reason"] = ""
            restored.append(n)

    # The chosen option's extra cost lands on the disrupted node itself, so
    # the trip's total cost (summed from node costs on the dashboard)
    # reflects the real trade-off of the option that was picked — this was
    # previously computed but silently dropped on the floor.
    previous_cost = float(graph.nodes[node_id].get("cost", 0))
    graph.nodes[node_id]["cost"] = previous_cost + match["cost_delta"]
    graph.nodes[node_id]["recovery_applied"] = match["title"]

    return {
        "status": "applied",
        "option": match,
        "restored_nodes": restored,
        "cost_delta": match["cost_delta"],
        "graph": serialize_graph(graph),
        "message": f"Applied \"{match['title']}\" — {len(restored)} node(s) restored to on-schedule, ₹{match['cost_delta']:,} added to the trip cost. No real booking was changed.",
    }
