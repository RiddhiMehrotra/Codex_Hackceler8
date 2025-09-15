import { Router } from 'express'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'
import dayjs from 'dayjs'

const router = Router()

// Resolve ../../ml/data relative to this file (projectRoot/ml/data)
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../../ml/data')

// ---------- helpers ----------
function canonKey(k) {
  return String(k ?? '').trim().toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[%°]/g, '')
    .replace(/µg\/?m3|ug\/?m3/gi, '')
}

function coerce(val) {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') return Number.isFinite(val) ? val : null

  let s = String(val).trim()

  // Handle European decimal comma vs thousand separators
  if (s.includes(',') && !s.includes('.')) {
    // likely decimal comma, e.g. "7,2" -> "7.2"
    s = s.replace(',', '.')
  } else {
    // likely thousand separators "1,234.5" -> "1234.5"
    s = s.replace(/,(?=\d{3}\b)/g, '')
  }

  // strip anything not number-ish
  s = s.replace(/[^0-9.\-eE]/g, '')
  if (!s || s === '-' || s === '.') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function mapRow(row) {
  // Normalize keys and map common aliases
  const out = {}
  for (const [k, v] of Object.entries(row)) out[canonKey(k)] = v

  const pick = (...keys) => {
    for (const k of keys) {
      if (out[k] !== undefined && out[k] !== '') return coerce(out[k])
    }
    return null
  }

  // timestamp if present
  let ts = out.timestamp || out.time || out.ts || out.date_time || out.date
  if (ts && !isNaN(Date.parse(ts))) ts = new Date(ts).toISOString(); else ts = null

  return {
    ts,
    air: {
      pm25: pick('pm25','pm_2_5','pm2_5','pm-2-5'),
      pm10: pick('pm10','pm_10'),
      temp: pick('temp','air_temp','temperature'),
      humidity: pick('humidity','rh')
    },
    water: {
      ph: pick('ph'),
      turbidity: pick('turbidity','ntu')
    },
    soil: {
      moisture: pick('soil_moisture','soilmoisture','moisture'),
      temp: pick('soil_temp','soiltemp')
    },
    flat: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, coerce(v)]))
  }
}

// ---------- CSV loader ----------
let CACHE = []

function detectDelimiter(headerLine) {
  // Pick the delimiter that yields more fields
  const comma = headerLine.split(',').length
  const semi  = headerLine.split(';').length
  const tab   = headerLine.split('\t').length
  const best = Math.max(comma, semi, tab)
  if (best === semi) return ';'
  if (best === tab)  return '\t'
  return ','
}

function parseCsv(text) {
  // Use header line to decide delimiter, tolerate weird rows
  const firstLine = text.split(/\r?\n/)[0] || ''
  const delimiter = detectDelimiter(firstLine)

  // If header ends with extra delimiter like "...; ;", trim it
  const cleaned = text.replace(/(\r?\n)[;,\t]+\r?\n/g, '$1') // drop empty columns-only lines

  return parse(cleaned, {
    bom: true,
    columns: true,                // read header row
    skip_empty_lines: true,
    relax_column_count: true,     // tolerate extra/missing fields
    relax_quotes: true,
    trim: true,
    delimiter
  })
}

function loadAllCSVs() {
  if (!fs.existsSync(DATA_DIR)) {
    console.warn('Realtime: data dir not found:', DATA_DIR)
    CACHE = []
    return
  }
  const files = fs.readdirSync(DATA_DIR).filter(f => /\.(csv|tsv)$/i.test(f))
  const rows = []
  for (const f of files) {
    try {
      const full = path.join(DATA_DIR, f)
      const text = fs.readFileSync(full, 'utf8')
      const records = parseCsv(text)
      for (const r of records) rows.push(mapRow(r))
      console.log(`Realtime: loaded ${records.length} rows from ${f}`)
    } catch (e) {
      console.warn(`Realtime: skipping ${f}: ${e.message}`)
    }
  }
  const withTs = rows.filter(r => r.ts)
  const withoutTs = rows.filter(r => !r.ts)
  withTs.sort((a,b) => dayjs(a.ts).valueOf() - dayjs(b.ts).valueOf())
  CACHE = [...withTs, ...withoutTs]
  console.log(`Realtime: total rows in cache = ${CACHE.length}`)
}

loadAllCSVs()

// pointer for sequential APIs
let idx = 0

router.post('/reset', (_req,res) => { idx = 0; res.json({ ok:true, idx, total: CACHE.length }) })

router.get('/next', (_req,res) => {
  if (!CACHE.length) return res.status(404).json({ error: 'no data' })
  const row = CACHE[idx % CACHE.length]; idx++
  res.json(row)
})

// Server-Sent Events stream
router.get('/stream', (req, res) => {
  if (!CACHE.length) return res.status(404).json({ error: 'no data' })
  const intervalMs = Math.max(250, Number(req.query.intervalMs || 2000))
  const loop = String(req.query.loop || '1') !== '0'

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

  send()
  const timer = setInterval(send, intervalMs)
  req.on('close', () => clearInterval(timer))
})

export default router
