import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Leaf, 
  ClipboardList, 
  MapPin, 
  CheckCircle, 
  Award,
  TrendingUp,
  Users,
  Recycle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

gsap.registerPlugin(ScrollTrigger)

export default function LandingPage() {
  const heroRef = useRef(null)
  const statsRef = useRef(null)
  const [stats, setStats] = useState({
    resolvedComplaints: 0,
    activeUsers: 0,
    totalZones: 0,
    loading: true
  })

  useEffect(() => {
    fetchRealStats()
  }, [])

  const fetchRealStats = async () => {
    try {
      // Check localStorage cache first (cache for 5 minutes)
      const cachedStats = localStorage.getItem('landingPageStats')
      const cacheTimestamp = localStorage.getItem('landingPageStatsTimestamp')
      
      if (cachedStats && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp)
        const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds
        
        if (cacheAge < fiveMinutes) {
          // Use cached data
          setStats({
            ...JSON.parse(cachedStats),
            loading: false
          })
          return
        }
      }

      // Fetch all stats in parallel for better performance
      const [resolvedResult, usersResult, zonesResult] = await Promise.all([
        supabase
          .from('complaints')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'resolved'),
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('zones')
          .select('*', { count: 'exact', head: true })
      ])

      const statsData = {
        resolvedComplaints: resolvedResult.count || 0,
        activeUsers: usersResult.count || 0,
        totalZones: zonesResult.count || 0,
        loading: false
      }

      setStats(statsData)

      // Cache the results
      localStorage.setItem('landingPageStats', JSON.stringify({
        resolvedComplaints: statsData.resolvedComplaints,
        activeUsers: statsData.activeUsers,
        totalZones: statsData.totalZones
      }))
      localStorage.setItem('landingPageStatsTimestamp', Date.now().toString())
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        resolvedComplaints: 0,
        activeUsers: 0,
        totalZones: 0,
        loading: false
      })
    }
  }

  useEffect(() => {
    if (stats.loading) return

    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      // Hero animations
      const ctx = gsap.context(() => {
        gsap.from('.hero-title', {
          opacity: 0,
          y: 50,
          duration: 0.8,
          ease: 'power3.out'
        })

        gsap.from('.hero-subtitle', {
          opacity: 0,
          y: 30,
          duration: 0.8,
          delay: 0.2,
          ease: 'power3.out'
        })

        gsap.from('.hero-buttons', {
          opacity: 0,
          y: 30,
          duration: 0.8,
          delay: 0.4,
          ease: 'power3.out'
        })

        // Floating leaves animation - optimized
        gsap.to('.floating-leaf', {
          y: -20,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.3,
          force3D: true // Enable hardware acceleration
        })

        // Stats counter animation with real values - optimized
        gsap.from('.stat-number', {
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          },
          textContent: 0,
          duration: 1.5,
          snap: { textContent: 1 },
          stagger: 0.15,
          ease: 'power2.out'
        })
      }, heroRef)

      return () => ctx.revert()
    })
  }, [stats.loading])

  const howItWorks = [
    {
      icon: ClipboardList,
      title: 'Report',
      description: 'Submit waste management complaints with photos and location details',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: MapPin,
      title: 'Track',
      description: 'Follow real-time status updates from submission to resolution',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: CheckCircle,
      title: 'Resolve',
      description: 'Staff receives assignments and marks tasks complete',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Award,
      title: 'Reward',
      description: 'Earn points and badges for active community participation',
      color: 'bg-yellow-100 text-yellow-600'
    }
  ]

  return (
    <div ref={heroRef} className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-heading font-bold text-primary-700">EcoSync</span>
          </div>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center relative">
          {/* Floating leaves */}
          <div className="absolute top-0 left-10 floating-leaf">
            <Leaf className="w-12 h-12 text-green-300 opacity-50" />
          </div>
          <div className="absolute top-20 right-20 floating-leaf">
            <Recycle className="w-16 h-16 text-green-400 opacity-40" />
          </div>
          <div className="absolute bottom-10 left-1/4 floating-leaf">
            <Leaf className="w-10 h-10 text-green-200 opacity-60" />
          </div>

          <h1 className="hero-title text-5xl md:text-7xl font-heading font-bold text-primary-700 mb-6">
            Smart. Clean. Connected.
          </h1>
          
          <p className="hero-subtitle text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the movement to make your city cleaner through transparent waste management tracking
          </p>

          <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8">
                Report an Issue
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Track My Reports
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="text-5xl font-bold mb-2">
                <span className="stat-number">{stats.resolvedComplaints}</span>+
              </div>
              <div className="text-xl">Issues Resolved</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="text-5xl font-bold mb-2">
                <span className="stat-number">{stats.activeUsers}</span>+
              </div>
              <div className="text-xl">Active Users</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="text-5xl font-bold mb-2">
                <span className="stat-number">{stats.totalZones}</span>+
              </div>
              <div className="text-xl">Zones Covered</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-heading font-bold text-center mb-12 text-primary-700">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-16 h-16 ${step.color} rounded-full mx-auto flex items-center justify-center mb-4`}>
                      <step.icon className="w-8 h-8" />
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{step.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-green-50">
        <div className="container mx-auto">
          <h2 className="text-4xl font-heading font-bold text-center mb-12 text-primary-700">
            Why Choose EcoSync?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <TrendingUp className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-heading font-semibold mb-3">Real-Time Tracking</h3>
              <p className="text-gray-600">
                Monitor your complaints from submission to resolution with live status updates
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <Users className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-heading font-semibold mb-3">Community Driven</h3>
              <p className="text-gray-600">
                Join thousands of citizens making a difference in urban waste management
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <Award className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-heading font-semibold mb-3">Earn Rewards</h3>
              <p className="text-gray-600">
                Get points and badges for active participation and help create cleaner cities
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 eco-gradient text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-heading font-bold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join EcoSync today and be part of the solution for cleaner, greener cities
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-8 h-8" />
            <span className="text-2xl font-heading font-bold">EcoSync</span>
          </div>
          <p className="text-gray-400">
            Making cities cleaner, one report at a time.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            © 2025 EcoSync. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
