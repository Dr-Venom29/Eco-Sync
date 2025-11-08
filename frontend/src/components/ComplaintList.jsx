import React, {useEffect, useState} from 'react'
import axios from 'axios'
import ComplaintCard from './ComplaintCard'

export default function ComplaintList(){
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    async function fetchComplaints(){
      setLoading(true)
      try{
        const res = await axios.get('/api/complaints')
        if(mounted){
          setComplaints(res.data?.data || [])
        }
      }catch(err){
        console.error(err)
        setError('Failed to load complaints')
      }finally{
        if(mounted) setLoading(false)
      }
    }
    fetchComplaints()
    // simple polling every 20s for live updates
    const id = setInterval(fetchComplaints, 20000)
    return ()=>{ mounted = false; clearInterval(id) }
  }, [])

  if(loading) return <div className="text-center py-8">Loading complaints...</div>
  if(error) return <div className="text-red-600 py-8">{error}</div>

  if(complaints.length === 0) return <div className="text-center py-8 text-gray-600">No complaints yet.</div>

  return (
    <div className="grid gap-4">
      {complaints.map(c => (
        <ComplaintCard key={c.id || c.created_at} complaint={c} />
      ))}
    </div>
  )
}
