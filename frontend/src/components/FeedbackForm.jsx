import React, { useState } from 'react'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function FeedbackForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setSending(true); setStatus(null)
    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, rating, message }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)

      setStatus({ ok: true, msg: 'Thanks! Your feedback was saved.' })
      setName(''); setEmail(''); setRating(''); setMessage('')
    } catch (e) {
      setStatus({ ok: false, msg: e.message || 'Failed to save feedback' })
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="relative w-full">
      {/* softly animated translucent blobs behind everything */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-16 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-400 via-sky-400 to-blue-500 opacity-20 blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-gradient-to-tr from-amber-400 via-pink-400 to-fuchsia-500 opacity-20 blur-3xl animate-blob animate-blob-delay" />
      </div>

      {/* content grid: form + illustration */}
      <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-10 items-stretch">
        {/* form */}
        <form
          onSubmit={onSubmit}
          className="w-full bg-white/90 backdrop-blur rounded-2xl shadow p-10 space-y-6"
        >
          <h3 className="text-2xl font-semibold text-center">Send Feedback</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <input
              className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="email"
              placeholder="Your email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <select
            className="w-full border rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          >
            <option value="">Rating (optional)</option>
            <option>⭐</option>
            <option>⭐⭐</option>
            <option>⭐⭐⭐</option>
            <option>⭐⭐⭐⭐</option>
            <option>⭐⭐⭐⭐⭐</option>
          </select>

          <textarea
            className="w-full border rounded px-4 py-3 min-h-[160px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
            placeholder="Your message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div className="flex items-center gap-4">
            <button
              disabled={sending}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-60"
            >
              {sending ? 'Submitting…' : 'Submit'}
            </button>

            {status && (
              <span className={status.ok ? 'text-emerald-600' : 'text-red-600'}>
                {status.msg}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-500 text-center">
            Admin:{' '}
            <a
              className="text-emerald-700 underline"
              href={`${API_BASE}/api/feedback/export.csv`}
              target="_blank"
              rel="noreferrer"
            >
              Download CSV
            </a>
          </div>
        </form>

        {/* animated eco illustration (floats) */}
        <div className="hidden md:flex items-center justify-center">
          <EcoIllustration className="w-full max-w-md opacity-90 animate-float" />
        </div>
      </div>
    </section>
  )
}

/** Inline SVG so you don’t need to manage assets. */
function EcoIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="g2" x1="0" x2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
      </defs>

      {/* ground circle */}
      <circle cx="200" cy="220" r="120" fill="url(#g1)" opacity="0.18" />
      {/* stem */}
      <rect x="195" y="170" width="10" height="90" rx="5" fill="#10b981" />
      {/* leaves */}
      <path
        d="M200 200 C 150 170, 140 140, 170 120 C 205 100, 220 120, 210 150 C 205 170, 200 180, 200 200 Z"
        fill="#34d399"
        opacity="0.9"
      />
      <path
        d="M200 210 C 250 180, 270 150, 245 135 C 220 120, 200 140, 205 170 C 208 188, 200 195, 200 210 Z"
        fill="#22d3ee"
        opacity="0.9"
      />
      {/* sun / energy badge */}
      <circle cx="290" cy="110" r="26" fill="url(#g2)" opacity="0.9" />
      <g transform="translate(278,98)" opacity="0.95">
        <rect x="7" y="3" width="8" height="18" rx="2" fill="#fff" />
        <rect x="3" y="7" width="16" height="8" rx="2" fill="#fff" />
      </g>
    </svg>
  )
}
