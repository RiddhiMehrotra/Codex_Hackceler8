import React from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function Footer(){
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="text-white font-bold text-lg">hack8r</div>
          <p className="text-gray-400 mt-2">Climate action through smart technology.</p>
        </div>
        <div>
          <div className="text-white font-semibold mb-2">Resources</div>
          <ul className="space-y-1 text-sm">
            <li><a className="hover:underline" href="/">Home</a></li>
            <li><a className="hover:underline" href="/dashboard">Dashboard</a></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-2">Contact Us</div>
          <div className="flex items-center gap-2"><Mail size={16}/> hello@hack8r.dev</div>
          <div className="flex items-center gap-2"><Phone size={16}/> +91-00000-00000</div>
          <div className="flex items-center gap-2"><MapPin size={16}/> Anywhere, Earth</div>
        </div>
        <div>
          <div className="text-white font-semibold mb-2">Follow</div>
          <p className="text-sm text-gray-400">Twitter • LinkedIn • GitHub</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} hack8r. All rights reserved.
      </div>
    </footer>
  )
}
