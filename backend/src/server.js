// backend/src/server.js
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'

// Load .env (optional)
dotenv.config()

// Routes
import authRoutes from './routes/auth.js'
import realtimeRoutes from './routes/realtime.js'

const app = express()

// ---- Core middleware ----
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: false
}))
app.use(express.json({ limit: '1mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ---- Health & root ----
app.get('/', (_req, res) => {
  res.type('text/plain').send('✅ Backend running')
})
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() })
})

// ---- API routes ----
app.use('/api/auth', authRoutes)         // /signup, /signin, /me
app.use('/api/realtime', realtimeRoutes) // /status, /start, /stop, /stream (SSE)

// ---- 404 fallback ----
app.use((req, res, _next) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl })
})

// ---- Error handler ----
app.use((err, _req, res, _next) => {
  console.error('Server error:', err)
  const status = err.status || 500
  res.status(status).json({ error: err.message || 'Server error' })
})

// ---- Start server ----
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on http://localhost:${PORT}`)
  if (process.env.CORS_ORIGIN) {
    console.log(`   CORS origin: ${process.env.CORS_ORIGIN}`)
  }
})
