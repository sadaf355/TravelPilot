from app.graph.builder import build_trip_graph

def optimize_budget(budget=50000, delay_minutes=300):
    g=build_trip_graph(); total=sum(float(d.get('cost',0)) for _,d in g.nodes(data=True))
    savings=[
      {"action":"Move flexible activity","saving":1500,"tradeoff":"Moves one activity to a later slot"},
      {"action":"Use shared transfer","saving":900,"tradeoff":"Longer pickup window"},
      {"action":"Downgrade one stay","saving":1800,"tradeoff":"Lower room category"},
    ]
    current=total
    target=max(0,budget)
    if current<=target: status='within_budget'
    else: status='over_budget'
    return {"original_cost":round(current,2),"budget":budget,"status":status,"recommended_savings":sum(x['saving'] for x in savings[:2]),"options":savings}
