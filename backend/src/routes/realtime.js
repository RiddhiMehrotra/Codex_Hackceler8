import { Router } from 'express'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'
import dayjs from 'dayjs'

const router = Router()

// Resolve ml/data relative to this file: backend/src/... -> ../../ml/data
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../../ml/data')

// ---- helpers ----
function canonKey(k) {
  return String(k).trim().toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[%°]/g, '')
    .replace(/µg\/?m3|ug\/?m3/gi, '')
}

function coerce(val) {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') return val
  const s = String(val).replace(/[^0-9.\-eE]/g, '')
  if (!s || s === '-' || s === '.' ) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function mapRow(row) {
  // Normalize keys and map common aliases for your dashboard
  const out = {}
  for (const [k,v] of Object.entries(row)) out[canonKey(k)] = v

  const j = (keys) => {
    for (const k of keys) {
      if (out[k] !== undefined && out[k] !== '') return coerce(out[k])
    }
    return null
  }

  // Try to keep a timestamp if present
  let ts = out.timestamp || out.time || out.ts || out.date_time
  if (ts && !isNaN(Date.parse(ts))) ts = new Date(ts).toISOString(); else ts = null

  return {
    ts,
    air: {
      pm25: j(['pm25','pm_2_5','pm2_5','pm-2-5']),
      pm10: j(['pm10','pm_10']),
      temp: j(['temp','air_temp','temperature']),
      humidity: j(['humidity','rh'])
    },
    water: {
      ph: j(['ph']),
      turbidity: j(['turbidity','ntu'])
    },
    soil: {
      moisture: j(['soil_moisture','soilmoisture','moisture']),
      temp: j(['soil_temp','soiltemp'])
    },
    // raw flattened numeric fields too (handy for ML/debug)
    flat: Object.fromEntries(Object.entries(out).map(([k,v]) => [k, coerce(v)]))
  }
}

// Load and merge all CSVs into memory once
let CACHE = []
function loadAllCSVs() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.toLowerCase().endsWith('.csv'))
  const rows = []
  for (const f of files) {
    const full = path.join(DATA_DIR, f)
    const text = fs.readFileSync(full, 'utf8')
    const records = parse(text, { columns: true, skip_empty_lines: true })
    for (const r of records) rows.push(mapRow(r))
  }
  // sort by ts if present, else keep original order
  const withTs = rows.filter(r => r.ts)
  const withoutTs = rows.filter(r => !r.ts)
  withTs.sort((a,b) => dayjs(a.ts).valueOf() - dayjs(b.ts).valueOf())
  CACHE = [...withTs, ...withoutTs]
  console.log(`Realtime: loaded ${CACHE.length} rows from ${files.length} CSVs`)
}
loadAllCSVs()

// pointer for "next" API and SSE
let idx = 0

router.post('/reset', (_req,res) => {
  idx = 0
  res.json({ ok:true, idx })
})

router.get('/next', (_req,res) => {
  if (CACHE.length === 0) return res.status(404).json({ error: 'no data' })
  const row = CACHE[idx % CACHE.length]
  idx++
  res.json(row)
})

// Server-Sent Events stream: emits a row every intervalMs
router.get('/stream', (req, res) => {
  if (CACHE.length === 0) return res.status(404).json({ error: 'no data' })

  const intervalMs = Math.max(250, Number(req.query.intervalMs || 2000)) // default 2s
  const loop = String(req.query.loop || '1') !== '0' // loop by default

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  })

  let localIdx = 0
  const send = () => {
    if (localIdx >= CACHE.length) {
      if (!loop) { clearInterval(timer); res.end(); return }
      localIdx = 0
    }
    const row = CACHE[localIdx++]
    res.write(`event: reading\n`)
    res.write(`data: ${JSON.stringify(row)}\n\n`)
  }

  // send one immediately, then interval
  send()
  const timer = setInterval(send, intervalMs)

  req.on('close', () => clearInterval(timer))
})

export default router
