import React from 'react'
import { Link } from 'react-router-dom'

export default function Header(){
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ecoGreen flex items-center justify-center text-white font-bold" aria-hidden>ES</div>
          <div>
            <div className="font-heading text-lg">Eco Sync</div>
            <div className="text-xs text-gray-500">Local Waste Management Tracker</div>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/" className="text-sm">Home</Link>
          <Link to="/report" className="text-sm">Report</Link>
          <Link to="/my" className="text-sm">My Complaints</Link>
          <Link to="/admin" className="text-sm">Admin</Link>
        </nav>
      </div>
    </header>
  )
}
