// backend/src/routes/auth.js
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

// In-memory users: [{ id, email, password(hash) }]
const USERS = []

function findUserByEmail(email){ return USERS.find(u => u.email === email) }
function findUserById(id){ return USERS.find(u => u.id === id) }

// -------- Signup --------
router.post('/signup', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email & password required' })
  if (findUserByEmail(email)) return res.status(400).json({ error: 'User already exists' })

  const id = crypto.randomUUID()
  const hash = await bcrypt.hash(password, 10)
  USERS.push({ id, email, password: hash })
  // return minimal info
  res.json({ ok: true, user: { id, email } })
})

// -------- Signin --------
router.post('/signin', async (req, res) => {
  const { email, password } = req.body || {}
  const user = findUserByEmail(email)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '1h' })
  // include user object so UI can show immediately
  res.json({ ok: true, token, user: { id: user.id, email: user.email } })
})

// -------- /me (protected) --------
router.get('/me', (req, res) => {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const { sub } = jwt.verify(token, JWT_SECRET) // sub = user.id
    const user = findUserById(sub)
    if (!user) return res.status(401).json({ error: 'Unknown user' })
    res.json({ ok: true, user: { id: user.id, email: user.email } })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
