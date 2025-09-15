import { Router } from 'express'
const router = Router()

// In-memory demo data (swap later for DB reads)
let SOLUTIONS = [
  { id: 'solar',   icon: 'sun',      title: 'Smart Solar',        desc: 'AI-optimized generation & storage.', pill: '40% more output',    color: 'from-amber-500 to-orange-600' },
  { id: 'wind',    icon: 'wind',     title: 'Wind Analytics',     desc: 'Predictive placement & performance.', pill: '25% more renewable', color: 'from-sky-500 to-cyan-600' },
  { id: 'storage', icon: 'battery',  title: 'Energy Storage',     desc: 'Smart grid-ready batteries.',        pill: '60% efficiency',      color: 'from-emerald-600 to-teal-700' },
  { id: 'carbon',  icon: 'brain',    title: 'Carbon AI',          desc: 'Track & reduce footprints.',         pill: '35% less emissions',  color: 'from-fuchsia-500 to-purple-600' },
  { id: 'water',   icon: 'droplets', title: 'Water Conservation', desc: 'IoT for efficient water use.',       pill: '50% savings',         color: 'from-indigo-500 to-violet-600' },
  { id: 'circular',icon: 'recycle',  title: 'Circular Tech',      desc: 'Scale recycling & upcycling.',       pill: '70% waste cut',       color: 'from-green-600 to-lime-600' },
]

// GET all
router.get('/', (_req, res) => res.json(SOLUTIONS))

// (Optional) Add a new card
router.post('/', (req, res) => {
  const { id, icon, title, desc, pill, color } = req.body || {}
  if (!id || !title) return res.status(400).json({ error: 'id and title required' })
  SOLUTIONS.push({ id, icon: icon || 'sparkles', title, desc: desc || '', pill: pill || '', color: color || 'from-emerald-500 to-teal-600' })
  res.json({ ok: true })
})
router.post('/reset', (_req,res)=>{
  SOLUTIONS = SOLUTIONS.slice(0,6)  // ensure defaults above remain
  res.json({ ok:true, count: SOLUTIONS.length })
})

export default router
