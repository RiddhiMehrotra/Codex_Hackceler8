import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Login(){
  const nav = useNavigate()
  const [email,setEmail] = useState('demo@hack8r.dev')
  const [password,setPassword] = useState('password')
  const [err,setErr] = useState('')

  async function submit(e){
    e.preventDefault()
    setErr('')
    try{
      const { data } = await api.post('/api/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      nav('/dashboard')
    }catch(e){
      setErr('Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="text-gray-600">Use any email/password for the mock login.</p>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <input className="border rounded px-3 py-2 w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input className="border rounded px-3 py-2 w-full" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" />
        {err && <div className="text-red-600">{err}</div>}
        <button className="bg-black text-white rounded px-4 py-2">Login</button>
      </form>
    </div>
  )
}
