import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

// File where feedback will be saved
const FEEDBACK_FILE = path.resolve(process.cwd(), 'feedbacks.json')

// Ensure file exists
if (!fs.existsSync(FEEDBACK_FILE)) {
  fs.writeFileSync(FEEDBACK_FILE, '[]', 'utf8')
}

// Helper: load + save
function loadFeedbacks() {
  return JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf8'))
}
function saveFeedbacks(data) {
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2), 'utf8')
}

// POST /api/feedback → add one entry
router.post('/', (req, res) => {
  try {
    const { name = '', email = '', rating = '', message = '' } = req.body || {}
    if (!message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const all = loadFeedbacks()
    const entry = {
      id: Date.now(),
      name,
      email,
      rating,
      message,
      ts: new Date().toISOString()
    }
    all.push(entry)
    saveFeedbacks(all)

    res.json({ ok: true, saved: entry })
  } catch (err) {
    console.error('Feedback save error:', err)
    res.status(500).json({ error: 'Could not save feedback' })
  }
})

// GET /api/feedback → list all
router.get('/', (_req, res) => {
  try {
    const all = loadFeedbacks()
    res.json(all)
  } catch (err) {
    res.status(500).json({ error: 'Could not read feedbacks' })
  }
})

export default router
