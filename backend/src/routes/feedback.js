// backend/src/routes/feedback.js
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

// Where we persist feedback
const FEEDBACK_FILE = path.resolve(process.cwd(), 'feedbacks.json')

// Ensure the file exists
function ensureFile() {
  if (!fs.existsSync(FEEDBACK_FILE)) {
    fs.writeFileSync(FEEDBACK_FILE, '[]', 'utf8')
  }
}
ensureFile()

function loadAll() {
  ensureFile()
  try {
    const raw = fs.readFileSync(FEEDBACK_FILE, 'utf8') || '[]'
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function saveAll(arr) {
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(arr, null, 2), 'utf8')
}

// POST /api/feedback  → add one feedback
router.post('/', (req, res) => {
  try {
    const { name = '', email = '', rating = '', message = '' } = req.body || {}
    if (!String(message || '').trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const entry = {
      id: Date.now(),                // simple unique id
      ts: new Date().toISOString(),  // timestamp
      name: String(name || '').trim(),
      email: String(email || '').trim(),
      rating: String(rating || '').trim(),
      message: String(message || '').trim(),
    }

    const all = loadAll()
    all.push(entry)
    saveAll(all)

    res.json({ ok: true, saved: entry })
  } catch (err) {
    console.error('Feedback save error:', err)
    res.status(500).json({ error: 'Could not save feedback' })
  }
})

// GET /api/feedback  → list all feedback (JSON)
router.get('/', (_req, res) => {
  try {
    const all = loadAll()
    res.json(all)
  } catch (err) {
    res.status(500).json({ error: 'Could not read feedbacks' })
  }
})

// GET /api/feedback/export.csv  → download as CSV
router.get('/export.csv', (_req, res) => {
  try {
    const all = loadAll()
    const headers = ['id', 'ts', 'name', 'email', 'rating', 'message']
    const escape = (v) =>
      `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
    const rows = [
      headers.join(','),
      ...all.map((r) => headers.map((h) => escape(r[h])).join(',')),
    ]
    const csv = rows.join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="feedbacks.csv"')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: 'Could not export CSV' })
  }
})

export default router
