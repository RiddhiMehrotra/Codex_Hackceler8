import { Router } from 'express'
const router = Router()

// naive in-memory store (replace with Mongo later)
const store = []

router.post('/', (req, res) => {
  const { name, email, message } = req.body || {}
  if(!name || !email || !message) return res.status(400).json({ error: 'name/email/message required' })
  store.push({ name, email, message, ts: new Date().toISOString() })
  console.log('Feedback received:', store[store.length-1])
  res.json({ ok: true })
})

router.get('/', (_req, res) => res.json({ count: store.length, items: store }))

export default router
