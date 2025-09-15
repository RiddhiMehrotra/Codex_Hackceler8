import { Router } from 'express'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'

const router = Router()
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(process.cwd(), 'ml', 'data')

// -------------------- helpers --------------------
function detectDelimiter(line) {
  const c = line.split(',').length
  const s = line.split(';').length
  const t = line.split('\t').length
  const best = Math.max(c, s, t)
  if (best === s) return ';'
  if (best === t) return '\t'
  return ','
}
function coerce(n) {
  if (n === null || n === undefined) return null
  if (typeof n === 'number') return Number.isFinite(n) ? n : null
  let s = String(n).trim()
  if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.')
  else s = s.replace(/,(?=\d{3}\b)/g, '')
  s = s.replace(/[^0-9.\-eE]/g, '')
  if (!s || s === '-' || s === '.') return null
  const v = Number(s)
  return Number.isFinite(v) ? v : null
}
function canon(k) {
  return String(k ?? '').trim().toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[%°]/g, '')
    .replace(/µg\/?m3|ug\/?m3/gi, '')
}
function mapRow(row) {
  const obj = {}
  for (const [k, v] of Object.entries(row)) obj[canon(k)] = v
  const pick = (...keys) => {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== '') return coerce(obj[k])
    }
    return null
  }
  let ts = obj.timestamp || obj.time || obj.ts || obj.date_time || obj.date
  if (ts && !isNaN(Date.parse(ts))) ts = new Date(ts).toISOString()
  else ts = new Date().toISOString()

  return {
    ts,
    air: {
      pm25: pick('pm25', 'pm_2_5', 'pm2_5', 'pm-2-5'),
      pm10: pick('pm10', 'pm_10'),
      temp: pick('temp', 'air_temp', 'temperature'),
      humidity: pick('humidity', 'rh'),
    },
    water: {
      ph: pick('ph'),
      turbidity: pick('turbidity', 'ntu'),
    },
    soil: {
      moisture: pick('soil_moisture', 'soilmoisture', 'moisture'),
      temp: pick('soil_temp', 'soiltemp'),
    },
  }
}

// -------------------- load CSVs --------------------
let CACHE = []
function loadAll() {
  if (!fs.existsSync(DATA_DIR)) {
    console.warn('Realtime: data dir not found:', DATA_DIR)
    CACHE = []
    return
  }
  const files = fs.readdirSync(DATA_DIR).filter(f => /\.(csv|tsv)$/i.test(f))
  const rows = []
  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(DATA_DIR, f), 'utf8')
      const head = raw.split(/\r?\n/)[0] || ''
      const delimiter = detectDelimiter(head)
      const records = parse(raw, {
        columns: true, skip_empty_lines: true,
        relax_column_count: true, trim: true, delimiter
      })
      for (const r of records) rows.push(mapRow(r))
      console.log(`Realtime: loaded ${records.length} rows from ${f}`)
    } catch (e) {
      console.warn(`Realtime: skip ${f}: ${e.message}`)
    }
  }
  CACHE = rows
  console.log('Realtime: cache size =', CACHE.length)
}
loadAll()

// -------------------- control & SSE --------------------
let STREAM_ENABLED = false
let DEFAULT_INTERVAL_MS = 2000

router.get('/status', (_req, res) => {
  res.json({ ok: true, enabled: STREAM_ENABLED, intervalMs: DEFAULT_INTERVAL_MS, cacheSize: CACHE.length })
})

router.post('/start', (req, res) => {
  STREAM_ENABLED = true
  const n = Number(req.body?.intervalMs)
  if (Number.isFinite(n) && n >= 250) DEFAULT_INTERVAL_MS = n
  res.json({ ok: true, enabled: true, intervalMs: DEFAULT_INTERVAL_MS })
})

router.post('/stop', (_req, res) => {
  STREAM_ENABLED = false
  res.json({ ok: true, enabled: false })
})

router.get('/stream', (req, res) => {
  if (!CACHE.length) return res.status(404).json({ error: 'no data in cache (check ml/data/*.csv)' })
  if (!STREAM_ENABLED) return res.status(409).json({ error: 'stream disabled (POST /api/realtime/start first)' })

  const intervalMs = Math.max(250, Number(req.query.intervalMs || DEFAULT_INTERVAL_MS))
  const loop = String(req.query.loop || '1') !== '0'

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })

  let i = 0
  const send = () => {
    if (!STREAM_ENABLED) { clearInterval(timer); res.end(); return }
    if (i >= CACHE.length) { if (!loop) { clearInterval(timer); res.end(); return } i = 0 }
    res.write('event: reading\n')
    res.write(`data: ${JSON.stringify(CACHE[i++])}\n\n`)
  }
  send()
  const timer = setInterval(send, intervalMs)
  req.on('close', () => clearInterval(timer))
})

export default router
