import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChartCard from '../components/ChartCard'
import { Play, Square, Activity, Download, AlertTriangle, Clock4 } from 'lucide-react'

export default function Dashboard(){
  const [reading, setReading] = useState(null)
  const [series, setSeries] = useState([])
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState({ enabled: false, intervalMs: 2000, cacheSize: 0 })
  const [intervalMs, setIntervalMs] = useState(2000)
  const [autoAnomaly, setAutoAnomaly] = useState(false)
  const [anomaly, setAnomaly] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [err, setErr] = useState('')

  const esRef = useRef(null)
  const timerRef = useRef(null)
  const t0Ref = useRef(null)

  async function refreshStatus(){
    try{
      const res = await fetch('http://localhost:4000/api/realtime/status')
      if (res.ok) setStatus(await res.json())
    } catch {}
  }

  function quickAnomalyCheck(data){
    const bad =
      (data.air?.pm25 ?? 0) > 60 ||
      (data.air?.pm10 ?? 0) > 100 ||
      (data.water?.ph != null && (data.water?.ph < 6.5 || data.water?.ph > 8.5)) ||
      (data.soil?.moisture != null && data.soil?.moisture < 0.15)
    setAnomaly(bad ? 'alert' : 'ok')
  }

  function openStream(){
    if (esRef.current) { esRef.current.close(); esRef.current = null }
    const url = `http://localhost:4000/api/realtime/stream?intervalMs=${intervalMs}`
    const es = new EventSource(url)
    es.addEventListener('reading', (ev) => {
      try{
        const data = JSON.parse(ev.data)
        setReading(data)
        setSeries(prev => [...prev.slice(-180), {
          t: data.ts || new Date().toISOString(),
          temp: data.air?.temp ?? null,
          moist: data.soil?.moisture ?? null,
          pm25: data.air?.pm25 ?? null,
          pm10: data.air?.pm10 ?? null,
          ph: data.water?.ph ?? null
        }])
        if (autoAnomaly) quickAnomalyCheck(data)
      }catch{}
    })
    es.onerror = () => setErr('Stream error: check backend /start and data files.')
    esRef.current = es
  }

  function closeStream(){ if (esRef.current) { esRef.current.close(); esRef.current = null } }

  async function handleStart(){
    setErr('')
    const res = await fetch('http://localhost:4000/api/realtime/start', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ intervalMs })
    })
    if (!res.ok) {
      const data = await res.json().catch(()=>({}))
      setErr(data.error || 'Unable to start stream.')
      return
    }
    setRunning(true)
    setAnomaly(null)
    setElapsed(0)
    t0Ref.current = Date.now()
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - t0Ref.current)/1000)), 1000)
    openStream()
    refreshStatus()
  }

  async function handleStop(){
    await fetch('http://localhost:4000/api/realtime/stop', { method: 'POST' })
    setRunning(false)
    closeStream()
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    refreshStatus()
  }

  function exportCSV(){
    const headers = ['time','air_temp','soil_moisture','pm25','pm10','water_ph']
    const rows = series.map(r => [r.t, r.temp ?? '', r.moist ?? '', r.pm25 ?? '', r.pm10 ?? '', r.ph ?? ''])
    const csv = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `readings_${new Date().toISOString().replace(/[:.]/g,'-')}.csv`
    document.body.appendChild(a); a.click(); a.remove()
  }

  useEffect(() => { refreshStatus() }, [])
  useEffect(() => () => { closeStream(); if (timerRef.current) clearInterval(timerRef.current) }, [])

  const labels = series.map(p => p.t)
  const datasets = useMemo(() => [
    { label:'Air Temp (°C)', data: series.map(p=>p.temp), borderColor:'rgb(59,130,246)' },
    { label:'Soil Moisture', data: series.map(p=>p.moist), borderColor:'rgb(34,197,94)' }
  ], [series])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Control Bar */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${running ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
            <span className="inline-flex items-center gap-1">
              <Activity size={16} />
              {running ? 'Live' : 'Idle'}
            </span>
          </span>
          {running && (
            <span className="hidden md:inline-flex items-center gap-1 text-sm text-gray-600">
              <Clock4 size={16} /> {Math.floor(elapsed/60)}m {elapsed%60}s
            </span>
          )}
          <select disabled={running} value={intervalMs} onChange={e=>setIntervalMs(Number(e.target.value))}
            className="border rounded-lg px-2 py-1 text-sm">
            <option value={500}>0.5s</option>
            <option value={1000}>1s</option>
            <option value={2000}>2s</option>
            <option value={5000}>5s</option>
          </select>
          <button onClick={()=>setAutoAnomaly(v=>!v)}
            className={`px-3 py-1 rounded-lg text-sm border ${autoAnomaly ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-white'}`}>
            <span className="inline-flex items-center gap-1">
              <AlertTriangle size={16} />
              {autoAnomaly ? 'Auto-Anomaly: ON' : 'Auto-Anomaly: OFF'}
            </span>
          </button>
          <button onClick={exportCSV}
            className="px-3 py-1 rounded-lg text-sm border hover:bg-gray-50 inline-flex items-center gap-1">
            <Download size={16} /> Export
          </button>
          {!running ? (
            <button onClick={handleStart}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2">
              <Play size={16} /> Start
            </button>
          ) : (
            <button onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2">
              <Square size={16} /> Stop
            </button>
          )}
        </motion.div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {err && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3">
            {err} — Ensure CSVs exist in <code>ml/data/</code> and press <b>Start</b>.
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards — always shown and updated */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <K label="PM2.5" v={reading?.air?.pm25} />
        <K label="PM10" v={reading?.air?.pm10} />
        <K label="Air Temp (°C)" v={reading?.air?.temp} />
        <K label="Humidity (%)" v={reading?.air?.humidity} />
        <K label="Water pH" v={reading?.water?.ph} />
        <K label="Turbidity" v={reading?.water?.turbidity} />
        <K label="Soil Moisture" v={reading?.soil?.moisture} />
        <K label="Soil Temp (°C)" v={reading?.soil?.temp} />
      </div>

      {/* Alert banner */}
      <AnimatePresence>
        {anomaly === 'alert' && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3">
            Potential anomaly detected — check PM/Soil/Water ranges.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart */}
      <div className="mt-6">
        <ChartCard title="Trends" labels={labels} datasets={datasets} />
      </div>
    </div>
  )
}

function K({ label, v }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{fmt(v)}</div>
    </div>
  )
}
function fmt(x){
  if (x === null || x === undefined) return '—'
  if (typeof x === 'number') return Number.isFinite(x) ? Number(x.toFixed(2)) : '—'
  return String(x)
}
