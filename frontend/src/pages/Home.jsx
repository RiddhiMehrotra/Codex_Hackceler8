import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import FeatureCard from '../components/FeatureCard'
import FeedbackForm from '../components/FeedbackForm'
import Footer from '../components/Footer'
import { Sun, Wind, Battery, Brain, Droplets, Recycle, Sparkles } from 'lucide-react'

const ICONS = { sun: Sun, wind: Wind, battery: Battery, brain: Brain, droplets: Droplets, recycle: Recycle, sparkles: Sparkles }
const IconFrom = (key) => {
  const C = ICONS[(key||'').toLowerCase()] || Sparkles
  return <C className="text-emerald-600" />
}

export default function Home(){
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    try{
      const res = await fetch('http://localhost:4000/api/solutions')
      if(!res.ok) throw new Error('API error '+res.status)
      const data = await res.json()
      setFeatures(Array.isArray(data) ? data : [])
      setError('')
    }catch(e){
      setError(e.message)
    }finally{
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 10000) // auto-refresh every 10s (optional)
    return () => clearInterval(t)
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="pt-24">
        <div className="bg-gradient-to-br from-green-500 via-blue-500 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <motion.h1 className="text-4xl md:text-6xl font-extrabold leading-tight"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              Climate Action Through <span className="text-white/90">Smart Technology</span>
            </motion.h1>
            <motion.p className="mt-6 text-lg md:text-xl text-white/90 max-w-3xl"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}>
              Real-time sensing, analytics, and insights that make sustainability visible and actionable.
            </motion.p>
            <motion.div className="mt-10 flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
              <a href="/dashboard" className="bg-white text-black px-5 py-3 rounded-full font-semibold hover:bg-white/90 transition">Open Dashboard</a>
              <a href="/signup" className="border border-white/70 text-white px-5 py-3 rounded-full font-semibold hover:bg-white/10 transition">Create account</a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dynamic features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Innovative Climate Solutions</h2>
        <p className="text-gray-600 text-center mt-2">Cutting-edge tech that delivers sustainable impact.</p>

        {loading && <div className="text-center text-gray-500 mt-10">Loading…</div>}
        {error && <div className="text-center text-red-600 mt-4">{error}</div>}

        {!loading && !error && (
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {features.map(f => (
              <FeatureCard
                key={f.id}
                icon={IconFrom(f.icon)}
                title={f.title}
                desc={f.desc}
                pill={f.pill}
                color={f.color}
              />
            ))}
            {features.length === 0 && (
              <div className="col-span-full text-center text-gray-500">
                No solutions yet — add via POST /api/solutions.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Feedback + footer */}
      <section className="max-w-7xl mx-auto px-6 pb-16 grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-semibold mb-2">Contact Us</h3>
          <p className="text-gray-600">Have questions about pilots or integrations? Reach out.</p>
          <div className="mt-4 text-sm text-gray-700 space-y-1">
            <div>Email: <a className="underline" href="mailto:hello@hack8r.dev">hello@hack8r.dev</a></div>
            <div>Phone: +91-00000-00000</div>
            <div>Address: Anywhere, Earth</div>
          </div>
        </div>
        <FeedbackForm />
      </section>

      <Footer />
    </div>
  )
}
