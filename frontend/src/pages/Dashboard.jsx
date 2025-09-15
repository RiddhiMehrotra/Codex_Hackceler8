import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import ChartCard from '../components/ChartCard'

export default function Dashboard(){
  const [reading, setReading] = useState(null)
  const [series, setSeries] = useState([])

  async function load(){
    const { data } = await api.get('/api/sensors/mock')
    setReading(data)
    setSeries(prev => [...prev.slice(-60), { t: data.ts, temp: data.air.temp, moist: data.soil.moisture }])
  }
  useEffect(()=>{ load(); const t=setInterval(load,3000); return ()=>clearInterval(t) }, [])

  const labels = series.map(p=>p.t)
  const datasets = useMemo(()=>[
    { label:'Air Temp (°C)', data: series.map(p=>p.temp), borderColor:'rgb(59,130,246)' },
    { label:'Soil Moisture', data: series.map(p=>p.moist), borderColor:'rgb(34,197,94)' }
  ], [series])

  async function predict(){
    const body = {
      pm25: reading?.air?.pm25,
      pm10: reading?.air?.pm10,
      temp: reading?.air?.temp,
      humidity: reading?.air?.humidity,
      ph: reading?.water?.ph,
      turbidity: reading?.water?.turbidity,
      soil_moisture: reading?.soil?.moisture,
      soil_temp: reading?.soil?.temp
    }
    const { data } = await api.post('/api/sensors/predict', body)
    alert(data.pred === -1 ? 'Anomaly detected' : 'Normal')  // super simple demo
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {reading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <K label="PM2.5" v={reading.air.pm25} />
          <K label="PM10" v={reading.air.pm10} />
          <K label="Air Temp (°C)" v={reading.air.temp} />
          <K label="Humidity (%)" v={reading.air.humidity} />
          <K label="Water pH" v={reading.water.ph} />
          <K label="Turbidity" v={reading.water.turbidity} />
          <K label="Soil Moisture" v={reading.soil.moisture} />
          <K label="Soil Temp (°C)" v={reading.soil.temp} />
        </div>
      )}
      <div className="mt-6">
        <ChartCard title="Trends" labels={labels} datasets={datasets} />
      </div>
      <button onClick={predict} className="mt-6 bg-blue-600 text-white rounded px-4 py-2">Run Anomaly Check</button>
    </div>
  )
}

function K({label, v}){
  return <div className="bg-white rounded-2xl shadow p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-2xl font-semibold">{v ?? '—'}</div></div>
}
