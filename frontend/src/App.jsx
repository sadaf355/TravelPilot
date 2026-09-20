import {Routes,Route,Navigate} from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'; import Login from './pages/Login'; import CreateTrip from './pages/CreateTrip'; import Generating from './pages/Generating'; import Dashboard from './pages/Dashboard'; import Itinerary from './pages/Itinerary'; import TripGraph from './pages/TripGraph'; import Disruption from './pages/Disruption'; import Assistant from './pages/Assistant'; import Recovery from './pages/Recovery'; import Weather from './pages/Weather'

export default function App(){
 return <Routes>
  <Route path='/' element={<Landing/>}/>
  <Route path='/login' element={<Login/>}/>
  <Route path='/generating' element={<ProtectedRoute><Generating/></ProtectedRoute>}/>
  <Route element={<ProtectedRoute><AppLayout/></ProtectedRoute>}>
   <Route path='/plan' element={<CreateTrip/>}/>
   <Route path='/dashboard' element={<Dashboard/>}/>
   <Route path='/itinerary' element={<Itinerary/>}/>
   <Route path='/graph' element={<TripGraph/>}/>
   <Route path='/disruption' element={<Disruption/>}/>
   <Route path='/recovery' element={<Recovery/>}/>
   <Route path='/assistant' element={<Assistant/>}/>
   <Route path='/weather' element={<Weather/>}/>
  </Route>
  <Route path='*' element={<Navigate to='/' replace/>}/>
 </Routes>
}
