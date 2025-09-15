import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// In-memory store for demo — replace with Postgres/Mongo
const USERS = []

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

// -------- Signup --------
router.post('/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email & password required' })
  const existing = USERS.find(u => u.email === email)
  if (existing) return res.status(400).json({ error: 'User already exists' })

  const hash = await bcrypt.hash(password, 10)
  USERS.push({ email, password: hash })
  res.json({ ok: true, msg: 'User created' })
})

// -------- Signin --------
router.post('/signin', async (req, res) => {
  const { email, password } = req.body
  const user = USERS.find(u => u.email === email)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' })
  res.json({ ok: true, token })
})

// -------- Profile (protected) --------
router.get('/me', (req, res) => {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    res.json({ ok: true, user: decoded })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
