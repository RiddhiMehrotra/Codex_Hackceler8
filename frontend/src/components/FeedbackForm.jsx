import React, { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function FeedbackForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setSending(true)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, rating, message }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setResult({ ok: true, msg: '✅ Thanks! Your feedback has been sent.' })
      setName(''); setEmail(''); setRating(''); setMessage('')
    } catch (err) {
      setResult({ ok: false, msg: err.message || 'Something went wrong' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="w-full">
      <form
        onSubmit={onSubmit}
        className="max-w-lg mx-auto bg-white rounded-2xl shadow p-6 space-y-4"
      >
        <h3 className="text-xl font-semibold">Send Feedback</h3>

        <input
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-emerald-200"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-emerald-200"
          type="email"
          placeholder="Your email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-emerald-200"
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
          className="w-full border rounded-lg px-3 py-2 min-h-[120px] focus:outline-none focus:ring focus:ring-emerald-200"
          placeholder="Your message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={sending}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition"
          >
            {sending ? 'Sending…' : 'Submit'}
          </button>

          {result && (
            <span
              className={`text-sm ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {result.msg}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
