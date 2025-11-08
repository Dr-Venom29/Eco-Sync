import React, {useState} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Report(){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const navigate = useNavigate()

  async function submit(e){
    e.preventDefault()
    setLoading(true)
    setSuccess(null)
    try{
      // Calls the backend Flask API (proxied by Vite during dev).
      await axios.post('/api/complaints', {title, description})
      setSuccess(true)
      setTitle('')
      setDescription('')
      // navigate to My Complaints so user sees their report
      setTimeout(()=> navigate('/my'), 700)
    }catch(err){
      console.error(err)
      setSuccess(false)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-heading mb-4">Report an Issue</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm">Title</label>
          <input className="w-full border p-2 rounded" value={title} onChange={e=>setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Description</label>
          <textarea className="w-full border p-2 rounded" value={description} onChange={e=>setDescription(e.target.value)} required />
        </div>
        <div>
          <motion.button whileTap={{scale:0.98}} className="px-4 py-2 rounded bg-ecoGreen text-white" disabled={loading}>{loading? 'Submitting...' : 'Submit'}</motion.button>
        </div>
        {success === true && <div className="text-green-700">Submitted successfully. Redirecting to My Complaints...</div>}
        {success === false && <div className="text-red-700">Failed to submit. Check console.</div>}
      </form>
    </div>
  )
}
