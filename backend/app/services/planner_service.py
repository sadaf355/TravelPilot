from copy import deepcopy
from app.graph.builder import load_demo_trip, build_trip_graph, serialize_graph
from app.services.llm_client import chat


def _score(tags, interests):
    tags = {t.lower() for t in (tags or [])}
    interests = {i.lower() for i in (interests or [])}
    return len(tags & interests)


def _personalize_items(trip: dict, interests: list[str]) -> tuple[list[str], list[str]]:
    """Swap each tagged activity for whichever of its variants best matches
    the traveler's interests. Node ids/types/times never change, so the
    dependency graph and its frontend layout stay valid — only the content
    riding on the node changes. Returns (swapped node ids, human-readable
    reasoning trace). The trace is what lets the UI show *why* the plan
    turned out the way it did, not just a toast that disappears."""
    swapped = []
    trace = [f"Traveler interests: {', '.join(interests) if interests else 'none specified — using defaults'}"]
    for day in trip.get("days", []):
        for item in day.get("items", []):
            variants = item.pop("variants", None) or []
            base_tags = item.pop("tags", None)
            if not variants:
                continue
            base_score = _score(base_tags, interests)
            best_variant = max(variants, key=lambda c: _score(c.get("tags"), interests))
            variant_score = _score(best_variant.get("tags"), interests)
            original_title = item["title"]
            # Prefer the variant whenever it matches the traveler's stated
            # interests at least as well as the default (and matches at
            # least one interest) — ties favor showing personalization.
            if variant_score > 0 and variant_score >= base_score:
                item["title"] = best_variant["title"]
                item["location"] = best_variant["location"]
                item["cost"] = best_variant["cost"]
                item["description"] = best_variant["description"]
                swapped.append(item["id"])
                matched = sorted(set(t.lower() for t in (best_variant.get("tags") or [])) & set(i.lower() for i in interests))
                matched_label = ", ".join(matched) or "general fit"
                trace.append(f"Day {day['day']}: matched '{matched_label}' → swapped '{original_title}' for '{item['title']}'")
            else:
                trace.append(f"Day {day['day']}: kept default '{original_title}' — no stronger interest match found")
    trace.append(f"Personalization complete — {len(swapped)} of the itinerary's flexible activities were tailored")
    return swapped, trace


def _tailor_descriptions(trip: dict, swapped_ids: list[str], interests: list[str]) -> None:
    """Optional flourish: if an LLM is configured, ask it to rewrite the
    one-line description of each swapped activity so it reads as written
    for this traveler's interests. Silently no-ops if no LLM is configured
    or the call fails — the swap above already personalized the content."""
    if not swapped_ids:
        return
    for day in trip.get("days", []):
        for item in day.get("items", []):
            if item["id"] not in swapped_ids:
                continue
            rewritten = chat(
                "You are TravelPilot's itinerary writer. Rewrite the given activity "
                "description in one short sentence (under 20 words), tailored to the "
                "traveler's stated interests. Do not invent new facts about the activity.",
                f"Activity: {item['title']} in {item['location']}. "
                f"Current description: {item['description']}. "
                f"Traveler interests: {', '.join(interests) or 'general travel'}.",
            )
            if rewritten:
                item["description"] = rewritten.strip()


def generate_itinerary(payload):
    trip = deepcopy(load_demo_trip())
    trip["destination"] = payload.destination
    trip["start_date"] = payload.start_date
    trip["end_date"] = payload.end_date
    trip["budget"] = payload.budget
    trip["interests"] = payload.interests
    trip["travel_style"] = payload.travel_style

    # AI-personalization step: pick the activity variant per node that best
    # matches the traveler's interests, then (if an LLM is configured) have
    # it rewrite the chosen activities' descriptions for this traveler.
    swapped, trace = _personalize_items(trip, payload.interests)
    _tailor_descriptions(trip, swapped, payload.interests)
    trip["personalized_nodes"] = swapped
    trip["planning_trace"] = trace

    graph = build_trip_graph(trip)
    return trip, graph
