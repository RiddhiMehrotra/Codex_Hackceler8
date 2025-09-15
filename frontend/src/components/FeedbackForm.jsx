import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function FeedbackForm(){
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit(e){
    e.preventDefault()
    setLoading(true); setDone(false); setError('')
    const form = new FormData(e.currentTarget)
    const body = {
      name: form.get('name'),
      email: form.get('email'),
      message: form.get('message'),
    }
    try{
      // backend route you’ll add below
      const res = await fetch('http://localhost:4000/api/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if(!res.ok) throw new Error('Failed to send')
      setDone(true); e.currentTarget.reset()
    }catch(err){ setError(err.message) }
    finally{ setLoading(false) }
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow p-6 space-y-4"
    >
      <h3 className="text-xl font-semibold">Send Feedback</h3>
      <input name="name" placeholder="Your name" className="w-full border rounded px-3 py-2" required />
      <input name="email" type="email" placeholder="Email" className="w-full border rounded px-3 py-2" required />
      <textarea name="message" placeholder="What can we improve?" rows="4" className="w-full border rounded px-3 py-2" required />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {done && <div className="text-green-700 text-sm">Thanks! We received your feedback.</div>}
      <button disabled={loading} className="bg-black text-white px-5 py-2 rounded-md">
        {loading ? 'Sending…' : 'Submit'}
      </button>
    </motion.form>
  )
}
