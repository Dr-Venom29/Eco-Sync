import React from 'react'
import ComplaintList from '../components/ComplaintList'

export default function MyComplaints(){
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-heading mb-4">My Complaints</h2>
      <p className="mb-4 text-sm text-gray-600">Below are recent complaints (this view currently lists most recent complaints; in the next step we can filter by logged-in user via Supabase auth).</p>
      <ComplaintList />
    </div>
  )
}
