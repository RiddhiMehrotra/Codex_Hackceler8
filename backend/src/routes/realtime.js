import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

const router = Router()

// --- Directories where we’ll look for data
const DATA_DIRS = [
  path.resolve(process.cwd(), 'ml', 'artifacts', 'data'),          // top-level ml/artifacts/data
  path.resolve(process.cwd(), 'ml', 'data'),                       // top-level ml/data
  path.resolve(process.cwd(), 'backend', 'ml', 'artifacts', 'data'), // fallback inside backend
  path.resolve(process.cwd(), 'backend', 'ml', 'data')               // fallback inside backend
]


function getDataDir() {
  for (const dir of DATA_DIRS) {
    if (fs.existsSync(dir)) return dir
  }
  console.warn('Realtime: no data directory found. Checked:', DATA_DIRS)
  return null
}

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

function tokenize(k) {
  return String(k).replace(/[()]/g, '').split(/[^a-z0-9]+/g).filter(Boolean)
}

function scoreKey(key, wantedTokens) {
  const toks = tokenize(key)
  if (!toks.length) return 0
  const canonKey = key
  const canonWanted = wantedTokens.join('_')
  if (canonKey === canonWanted) return 100
  let score = 0
  for (const t of wantedTokens) {
    if (toks.includes(t)) score += 15
    else if (toks.some(x => x.startsWith(t))) score += 8
  }
  const s = new Set(toks)
  if (wantedTokens.includes('temperature') && (s.has('t') || s.has('temp'))) score += 10
  if (wantedTokens.includes('humidity') && (s.has('rh') || s.has('humidity'))) score += 10
  if (wantedTokens.includes('pm') && s.has('pm')) score += 5
  if (wantedTokens.includes('moisture') && (s.has('vwc') || s.has('moisture'))) score += 10
  if (wantedTokens.includes('ph') && s.has('ph')) score += 20
  if (wantedTokens.includes('turbidity') && (s.has('ntu') || s.has('turbidity'))) score += 15
  return score
}

function pickByMeaning(o, meanings) {
  let best = { key: null, val: null, score: -1 }
  for (const k of Object.keys(o)) {
    for (const tokens of meanings) {
      const sc = scoreKey(k, tokens)
      if (sc > best.score) {
        const v = coerce(o[k])
        if (v !== null) best = { key: k, val: v, score: sc }
      }
    }
  }
  return best
}

function norm01(x, max = 100) {
  if (x == null) return null
  const n = x / max
  return Math.max(0, Math.min(1, n))
}

// -------------------- AUTO-DETECTING mapRow --------------------
function mapRow(row) {
  const o = {}
  for (const [k, v] of Object.entries(row)) o[canon(k)] = v

  let ts = o.timestamp || o.ts || o.time || o.date_time || o.datetime || o.date
  if (ts && !isNaN(Date.parse(ts))) ts = new Date(ts).toISOString()
  else ts = new Date().toISOString()

  const want = {
    pm25: [['pm','2','5'], ['pm25']],
    pm10: [['pm','10'], ['pm10']],
    airTemp: [['air','temp'], ['temperature'], ['temp'], ['t']],
    humidity: [['humidity'], ['rh']],
    waterPh: [['ph']],
    turbidity: [['turbidity'], ['ntu']],
    soilMoist: [['soil','moisture'], ['moisture'], ['vwc']],
    soilTemp: [['soil','temp'], ['soil','temperature']]
  }

  const got = {
    pm25: pickByMeaning(o, want.pm25),
    pm10: pickByMeaning(o, want.pm10),
    airTemp: pickByMeaning(o, want.airTemp),
    humidity: pickByMeaning(o, want.humidity),
    waterPh: pickByMeaning(o, want.waterPh),
    turbidity: pickByMeaning(o, want.turbidity),
    soilMoist: pickByMeaning(o, want.soilMoist),
    soilTemp: pickByMeaning(o, want.soilTemp)
  }

  // Heuristics: if mostly water fields → water dataset, else air
  const airScore = Math.max(got.airTemp.score, got.humidity.score, scoreKey(Object.keys(o).join('_'), ['co','gt']))
  const waterScore = Math.max(got.waterPh.score, got.turbidity.score, scoreKey(Object.keys(o).join('_'), ['conductivity']))
  const isAir = airScore >= waterScore

  if (isAir) {
    if (got.airTemp.val == null) {
      const tKey = Object.keys(o).find(k => k === 't' || k === 'temperature')
      if (tKey) got.airTemp = { key: tKey, val: coerce(o[tKey]), score: 50 }
    }
    if (got.humidity.val == null) {
      const rhKey = Object.keys(o).find(k => k === 'rh' || k === 'humidity')
      if (rhKey) got.humidity = { key: rhKey, val: coerce(o[rhKey]), score: 50 }
    }
    if (got.soilMoist.val == null && got.humidity.val != null) {
      got.soilMoist = { key: 'rh_proxy', val: norm01(got.humidity.val, 100), score: 25 }
    }
    if (got.soilTemp.val == null && got.airTemp.val != null) {
      got.soilTemp = { key: 'soil_temp_proxy', val: got.airTemp.val - 5, score: 10 }
    }
  } else {
    if (got.soilMoist.val == null) {
      const ocKey = Object.keys(o).find(k => k === 'organic_carbon')
      if (ocKey) got.soilMoist = { key: ocKey, val: norm01(coerce(o[ocKey]), 20), score: 20 }
    }
    if (got.soilTemp.val == null) {
      const hardKey = Object.keys(o).find(k => k === 'hardness')
      if (hardKey) got.soilTemp = { key: hardKey, val: coerce(o[hardKey]), score: 10 }
    }
  }

  return {
    ts,
    air: { pm25: got.pm25.val, pm10: got.pm10.val, temp: got.airTemp.val, humidity: got.humidity.val },
    water: { ph: got.waterPh.val, turbidity: got.turbidity.val },
    soil: { moisture: got.soilMoist.val, temp: got.soilTemp.val },
    _meta: { isAir }
  }
}

// -------------------- load CSVs --------------------
let CACHE = []
function loadAll() {
  const dir = getDataDir()
  if (!dir) { CACHE = []; return }
  const files = fs.readdirSync(dir).filter(f => /\.(csv|tsv)$/i.test(f))
  const rows = []
  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8')
      const head = raw.split(/\r?\n/)[0] || ''
      const delimiter = detectDelimiter(head)
      const records = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true, delimiter })
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
  if (!CACHE.length) return res.status(404).json({ error: 'no data in cache' })
  if (!STREAM_ENABLED) return res.status(409).json({ error: 'stream disabled' })

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
