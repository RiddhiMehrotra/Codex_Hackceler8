import React, { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Leaf, LogOut } from 'lucide-react'
import { fetchMe, clearToken, getToken } from '../api'

// Get initials from email
function initialsFrom(email = '') {
  const user = (email.split('@')[0] || '').replace(/[^a-z0-9]/gi, '')
  const a = user[0]?.toUpperCase() || '?'
  const b = user[1]?.toUpperCase() || ''
  return (a + b).slice(0, 2)
}

export default function Header() {
  const [user, setUser] = useState(null)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Load cached email instantly
    const cachedEmail = localStorage.getItem('userEmail')
    if (cachedEmail) setUser({ email: cachedEmail })

    // Verify with backend if token exists
    if (getToken()) {
      fetchMe().then((u) => {
        if (u) {
          setUser({ email: u.email })
          localStorage.setItem('userEmail', u.email)
        }
      })
    }
  }, [])

  function signOut() {
    clearToken()
    localStorage.removeItem('userEmail')
    setUser(null)
    navigate('/login')
  }

  const NavItem = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md hover:bg-black/5 transition ${
          isActive ? 'font-semibold' : ''
        }`
      }
    >
      {children}
    </NavLink>
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <Leaf className="text-green-600" />
          hack8r
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/dashboard">Dashboard</NavItem>

          {!user ? (
            <>
              <NavItem to="/login">Sign in</NavItem>
              <NavItem to="/signup">Sign up</NavItem>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-black/5"
                title={user.email}
              >
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white grid place-items-center font-semibold">
                  {initialsFrom(user.email)}
                </div>
                <div className="text-left leading-tight">
                  <div className="text-sm font-semibold">{user.email}</div>
                </div>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg p-2">
                  <div className="px-3 py-2 text-xs text-gray-500">
                    Signed in as
                  </div>
                  <div className="px-3 pb-2 text-sm break-all">
                    {user.email}
                  </div>
                  <hr className="my-2" />
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded hover:bg-gray-50 text-sm"
                  >
                    Open Dashboard
                  </Link>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 text-sm text-left"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="md:hidden text-sm text-gray-600">Menu</div>
      </div>
    </header>
  )
}
