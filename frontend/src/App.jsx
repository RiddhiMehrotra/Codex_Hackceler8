import React from 'react'
import { Outlet, Link, useLocation, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

function Shell(){ return (<><Header /><div className="pt-16"><Outlet /></div></>) }

export default function App(){
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        {/* Basic signup placeholder */}
        <Route path="/signup" element={<div className="max-w-md mx-auto px-6 py-10"><h1 className="text-3xl font-bold">Create Account</h1><p className="text-gray-600">Coming soon — use Login for demo.</p></div>} />
      </Route>
    </Routes>
  )
}
