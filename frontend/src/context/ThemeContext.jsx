import {createContext,useContext,useEffect,useState,useCallback} from 'react'

const ThemeContext=createContext(null)

function getInitialTheme(){
 const stored=localStorage.getItem('tp_theme')
 if(stored==='light'||stored==='dark')return stored
 return window.matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark'
}

export function ThemeProvider({children}){
 const [theme,setTheme]=useState(getInitialTheme)

 useEffect(()=>{
  const root=document.documentElement
  root.setAttribute('data-theme',theme)
  root.style.colorScheme=theme
  localStorage.setItem('tp_theme',theme)
 },[theme])

 const toggleTheme=useCallback(()=>setTheme(t=>t==='dark'?'light':'dark'),[])

 return <ThemeContext.Provider value={{theme,toggleTheme,setTheme}}>{children}</ThemeContext.Provider>
}

export const useTheme=()=>useContext(ThemeContext)
