import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'

export default function App(){
  const loc = useLocation()
  return (
    <div>
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="font-bold text-lg">🌿 hack8r</div>
          <div className="flex gap-4">
            <Link className={link(loc,'/login')} to="/login">Login</Link>
            <Link className={link(loc,'/dashboard')} to="/dashboard">Dashboard</Link>
          </div>
        </div>
      </nav>
      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  )
}
function link(loc, path){ return `hover:underline ${loc.pathname===path?'font-semibold':''}` }
