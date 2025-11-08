// Floating Leaves Animation Component using GSAP
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Leaf } from 'lucide-react'

export default function FloatingLeaves({ count = 5 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const leaves = containerRef.current.querySelectorAll('.floating-leaf')
    
    leaves.forEach((leaf, i) => {
      // Random starting position
      const startX = Math.random() * window.innerWidth
      const startY = -50
      
      gsap.set(leaf, {
        x: startX,
        y: startY,
        rotation: Math.random() * 360,
        opacity: 0.6 + Math.random() * 0.4,
      })

      // Animate leaf falling with gentle swaying
      const tl = gsap.timeline({ repeat: -1 })
      
      tl.to(leaf, {
        duration: 10 + Math.random() * 10,
        y: window.innerHeight + 100,
        x: `+=${Math.random() * 200 - 100}`,
        rotation: `+=${360 + Math.random() * 720}`,
        ease: 'none',
        onComplete: () => {
          gsap.set(leaf, {
            x: Math.random() * window.innerWidth,
            y: -50,
          })
        },
      })

      // Add gentle swaying motion
      gsap.to(leaf, {
        duration: 2 + Math.random() * 2,
        x: `+=${Math.sin(i) * 30}`,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    })
  }, [count])

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="floating-leaf absolute">
          <Leaf 
            className="text-green-400 opacity-30" 
            size={20 + Math.random() * 20}
          />
        </div>
      ))}
    </div>
  )
}
