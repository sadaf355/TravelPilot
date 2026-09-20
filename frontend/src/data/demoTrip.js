export const demoTrip = {
  trip_id: 'demo_001', destination: 'Ladakh', start_date: '2026-06-12', end_date: '2026-06-17',
  budget: 50000, interests: ['Adventure','Nature','Photography']
}

export const demoItinerary = [
  { time:'06:20', icon:'✈', title:'Delhi → Leh', meta:'Flight AI-982', cost:8500, status:'Confirmed', type:'flight', day:1 },
  { time:'08:45', icon:'🚕', title:'Airport Transfer', meta:'Leh Airport → Hotel', cost:1200, status:'Confirmed', type:'transfer', day:1 },
  { time:'12:00', icon:'🏨', title:'Hotel Check-in', meta:'The Grand Dragon, Leh', cost:4500, status:'Confirmed', type:'stay', day:1 },
  { time:'17:00', icon:'🏔', title:'Leh Market', meta:'Flexible activity', cost:0, status:'Flexible', type:'activity', day:1 },
]

export const typeMeta = {
  flight: { icon:'✈', label:'Flight' }, transfer:{ icon:'🚕', label:'Transfer' }, activity:{ icon:'🏔', label:'Activity' }, stay:{ icon:'🏨', label:'Stay' }
}
