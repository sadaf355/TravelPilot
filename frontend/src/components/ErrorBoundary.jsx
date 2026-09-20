import {Component} from 'react'
import {AlertTriangle,RotateCcw} from 'lucide-react'

export default class ErrorBoundary extends Component{
  constructor(props){super(props);this.state={hasError:false,error:null}}
  static getDerivedStateFromError(error){return {hasError:true,error}}
  componentDidCatch(error,info){console.error('TravelPilot UI error:',error,info)}
  render(){
    if(!this.state.hasError) return this.props.children
    return <div className='grid min-h-screen place-items-center bg-ink px-5 text-center text-slate-200'>
      <div className='glass max-w-md rounded-3xl p-8'>
        <AlertTriangle className='mx-auto text-warning' size={28}/>
        <h1 className='mt-4 text-lg font-semibold'>Something went wrong in the UI.</h1>
        <p className='mt-2 text-sm leading-6 text-slate-500'>{this.state.error?.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={()=>{this.setState({hasError:false,error:null});window.location.href='/dashboard'}}
          className='mx-auto mt-6 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white'
        >
          <RotateCcw size={14}/>Back to dashboard
        </button>
      </div>
    </div>
  }
}
