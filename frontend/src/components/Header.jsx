import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function Header(){
  const loc = useLocation()
  const link = (to,label) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md hover:bg-black/5 transition ${
        loc.pathname===to ? 'font-semibold' : 'text-gray-700'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <Leaf className="text-green-600" />
          hack8r
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {link('/', 'Home')}
          {link('/dashboard', 'Dashboard')}
          {link('/login', 'Sign in')}
          {link('/signup', 'Sign up')}
        </nav>
        <div className="md:hidden text-sm text-gray-600">Menu</div>
      </div>
    </header>
  )
}
