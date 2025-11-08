import React from 'react'

export default function ComplaintCard({complaint}){
  return (
    <div className="border rounded p-3">
      <div className="flex justify-between">
        <strong>{complaint.title}</strong>
        <span className="text-sm text-gray-500">{complaint.status || 'Pending'}</span>
      </div>
      <p className="text-sm mt-2 text-gray-700">{complaint.description}</p>
    </div>
  )
}
