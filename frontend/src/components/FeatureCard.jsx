import React from 'react'
import { motion } from 'framer-motion'

export default function FeatureCard({ icon, title, desc, pill, color='from-emerald-500 to-teal-600' }){
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition"
    >
      <div className={`h-1.5 w-24 rounded-full bg-gradient-to-r ${color} mb-4`} />
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-gray-600">{desc}</p>
      {pill && <span className="mt-4 inline-block text-xs px-3 py-1 rounded-full bg-gray-100">{pill}</span>}
    </motion.div>
  )
}
