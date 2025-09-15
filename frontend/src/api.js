import axios from 'axios'
export const api = axios.create({ baseURL: 'http://localhost:4000' })
export function getToken(){ return localStorage.getItem('token') }
export function setToken(t){ localStorage.setItem('token', t) }
export function clearToken(){ localStorage.removeItem('token') }

export async function fetchMe(){
  const token = getToken()
  if(!token) return null
  const res = await fetch('http://localhost:4000/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) return null
  const data = await res.json()
  return data.user // { id, email }
}
