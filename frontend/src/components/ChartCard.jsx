import React from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip } from 'chart.js'
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip)

export default function ChartCard({ title, labels, datasets }){
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="font-semibold mb-2">{title}</div>
      <Line data={{ labels, datasets }} />
    </div>
  )
}
