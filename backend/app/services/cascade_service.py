from app.graph.builder import build_trip_graph, build_graph_from_serialized, serialize_graph, load_demo_trip


def _minutes(hhmm: str) -> int:
    h, m = [int(x) for x in hhmm.split(":")[:2]]
    return h * 60 + m


def _set_time(value: str, delta: int) -> str:
    total = (_minutes(value) + delta) % (24 * 60)
    return f"{total // 60:02d}:{total % 60:02d}"


def simulate_disruption(node_id: str, disruption_type: str = "delay", delay_minutes: int = 300,
                         current_graph: dict | None = None, reset: bool = True) -> dict:
    # Ground on the traveler's actual (possibly personalized) itinerary when
    # the frontend sends it, rather than silently falling back to the static
    # demo data — otherwise node titles here can drift from what the
    # itinerary/dashboard/before-after views are showing for the same ids.
    graph = build_graph_from_serialized(current_graph) if current_graph else build_trip_graph()
    if node_id not in graph:
        raise ValueError(f"Unknown itinerary node: {node_id}")

    if reset:
        # Fresh disruption — clear any previous simulated state first, so
        # results are deterministic for the primary rehearsed demo.
        for n in graph.nodes:
            graph.nodes[n]["status"] = "ok"
            graph.nodes[n]["delay_minutes"] = 0
            graph.nodes[n]["impact_reason"] = ""
    # else: reset=False stacks this disruption on top of whatever state
    # current_graph already carried — used by "simulate another disruption"
    # so a second, independent break doesn't erase the first one's impact.

    if disruption_type == "cancellation":
        delay_minutes = 24 * 60

    graph.nodes[node_id]["status"] = "broken"
    graph.nodes[node_id]["delay_minutes"] = delay_minutes
    graph.nodes[node_id]["impact_reason"] = (
        "Cancelled by disruption" if disruption_type == "cancellation"
        else f"Delayed by {delay_minutes // 60}h {delay_minutes % 60}m"
    )

    origin_label = graph.nodes[node_id].get("title", node_id)
    trace = [
        f"{origin_label} {'cancelled' if disruption_type == 'cancellation' else f'delayed {delay_minutes // 60}h {delay_minutes % 60}m'} — walking dependency graph"
    ]

    affected = []
    queue = [(node_id, delay_minutes)]
    visited = {node_id}

    while queue:
        current, propagated_delay = queue.pop(0)
        current_label = graph.nodes[current].get("title", current)
        for dependent in graph.successors(current):
            edge = graph.edges[current, dependent]
            buffer = int(edge.get("buffer_time", 0))
            dependent_label = graph.nodes[dependent].get("title", dependent)
            # If the delay exceeds available slack, the dependent is impacted.
            if propagated_delay > buffer:
                new_delay = propagated_delay
                status = "broken" if new_delay >= buffer + 90 else "at_risk"
                graph.nodes[dependent]["status"] = status
                graph.nodes[dependent]["delay_minutes"] = new_delay
                graph.nodes[dependent]["impact_reason"] = (
                    f"Upstream delay exceeds {buffer} min buffer"
                )
                affected.append({
                    "id": dependent,
                    "status": status,
                    "delay_minutes": new_delay,
                    "reason": graph.nodes[dependent]["impact_reason"],
                })
                trace.append(
                    f"{current_label} → {dependent_label}: {new_delay}min delay exceeds "
                    f"{buffer}min buffer → status: {status}"
                )
                if dependent not in visited:
                    visited.add(dependent)
                    queue.append((dependent, new_delay))
            else:
                trace.append(
                    f"{current_label} → {dependent_label}: {propagated_delay}min delay within "
                    f"{buffer}min buffer → status: ok"
                )

    trace.append(f"Cascade resolved — {len(affected)} downstream node(s) affected")

    serialized = serialize_graph(graph)
    # Summary reflects the graph's full current state (not just this call's
    # walk) so a stacked second disruption reports the combined picture,
    # not only what changed in this trigger.
    all_affected = [
        {"id": n, "status": d.get("status"), "delay_minutes": d.get("delay_minutes", 0), "reason": d.get("impact_reason", "")}
        for n, d in graph.nodes(data=True) if d.get("status") != "ok"
    ]
    return {
        "disrupted_node": node_id,
        "disruption_type": disruption_type,
        "delay_minutes": delay_minutes,
        "affected_nodes": all_affected,
        "trace": trace,
        "graph": serialized,
        "summary": {
            "total_affected": len(all_affected),
            "broken": sum(1 for x in all_affected if x["status"] == "broken"),
            "at_risk": sum(1 for x in all_affected if x["status"] == "at_risk"),
        },
    }
