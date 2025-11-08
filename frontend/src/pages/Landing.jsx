import React, {useRef, useEffect} from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'

export default function Landing(){
  const leaves = useRef(null)

  useEffect(()=>{
    // simple GSAP floating animation for decorative leaves/eco elements
    if(!leaves.current) return
    const elems = leaves.current.querySelectorAll('.leaf')
    gsap.fromTo(elems, {y: -10, opacity: 0.8}, {
      y: 10,
      opacity: 1,
      duration: 3,
      repeat: -1,
      yoyo: true,
      stagger: 0.3,
      ease: 'sine.inOut'
    })
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <section className="hero-banner rounded-lg p-8 mb-8 shadow-sm relative overflow-hidden">
        <div ref={leaves} className="absolute -top-8 right-6 opacity-70 pointer-events-none">
          <div className="leaf w-8 h-8 bg-ecoLight rounded-full mb-2" />
          <div className="leaf w-5 h-5 bg-ecoGreen rounded-full" />
          <div className="leaf w-6 h-6 bg-ecoLight rounded-full mt-2" />
        </div>

        <motion.h1 initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="text-4xl font-heading text-ecoGreen">Smart. Clean. Connected.</motion.h1>
        <motion.p initial={{y:10, opacity:0}} animate={{y:0, opacity:1}} className="mt-4 text-gray-700">Report missed pickups, track resolution, and earn rewards for keeping your community clean.</motion.p>
        <div className="mt-6">
          <Link to="/report" className="inline-block px-4 py-2 rounded bg-ecoGreen text-white">Report an Issue</Link>
          <Link to="/my" className="ml-3 inline-block px-4 py-2 rounded border">My Complaints</Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">How it works</div>
        <div className="p-4 border rounded">Eco Impact Stats</div>
        <div className="p-4 border rounded">Top Contributors</div>
      </section>
    </div>
  )
}
