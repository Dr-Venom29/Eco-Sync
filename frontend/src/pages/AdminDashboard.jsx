import React from 'react'

export default function AdminDashboard(){
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-heading mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border">Statistics & Charts (placeholder)</div>
        <div className="p-4 border">Recent Complaints</div>
      </div>
    </div>
  )
}
