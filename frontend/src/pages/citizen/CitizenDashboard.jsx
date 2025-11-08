import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Plus, 
  Award, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Lightbulb,
  RefreshCw,
  Wind,
  Cloud,
  Star,
  MessageSquare,
  CloudRain,
  Droplets,
  Thermometer
} from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const ECO_TIPS = [
  "Recycle plastic bottles separately from general waste to improve recycling efficiency.",
  "Compost kitchen waste to reduce methane emissions from landfills.",
  "Rinse containers before recycling to prevent contamination.",
  "Use reusable bags instead of plastic bags to reduce waste.",
  "Separate wet and dry waste at source for better waste management.",
  "Glass and metal can be recycled indefinitely without losing quality.",
  "Dispose of batteries at designated e-waste centers, not in regular trash.",
  "Flatten cardboard boxes before recycling to save space.",
  "Use cloth napkins instead of paper to reduce tree cutting.",
  "Buy products with minimal packaging to reduce waste generation.",
  "Set up a small compost bin at home for organic waste.",
  "Avoid single-use plastics like straws and cutlery.",
  "Plant trees to offset your carbon footprint.",
  "Recycle old electronics at e-waste collection centers.",
  "Fix leaky taps to conserve water and reduce waste.",
  "Upcycle old items into useful crafts instead of throwing them away.",
  "Use biodegradable cleaning products to reduce chemical waste.",
  "Recycle newspapers and magazines instead of burning them.",
  "Unplug devices when not in use to save energy.",
  "Support local farmers markets to reduce packaging waste.",
]

export default function CitizenDashboard() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    points: 0,
  })
  const [recentComplaints, setRecentComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [dailyTip, setDailyTip] = useState('')
  const [airQuality, setAirQuality] = useState(null)
  const [loadingAirQuality, setLoadingAirQuality] = useState(false)
  const [weather, setWeather] = useState(null)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [showFeedbackFor, setShowFeedbackFor] = useState(null)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  // Get daily tip based on date
  useEffect(() => {
    const today = new Date().toDateString()
    const storedDate = localStorage.getItem('ecoTipDate')
    const storedTip = localStorage.getItem('ecoTip')

    if (storedDate === today && storedTip) {
      setDailyTip(storedTip)
    } else {
      const randomTip = ECO_TIPS[Math.floor(Math.random() * ECO_TIPS.length)]
      setDailyTip(randomTip)
      localStorage.setItem('ecoTipDate', today)
      localStorage.setItem('ecoTip', randomTip)
    }
  }, [])

  const refreshTip = () => {
    const randomTip = ECO_TIPS[Math.floor(Math.random() * ECO_TIPS.length)]
    setDailyTip(randomTip)
    localStorage.setItem('ecoTip', randomTip)
  }

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        // Fetch user profile for points
        const { data: userProfile } = await supabase
          .from('users')
          .select('total_points')
          .eq('id', user.id)
          .single()

        // Fetch all user complaints
        const { data: complaints } = await supabase
          .from('complaints')
          .select('*, staff_feedback')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (complaints) {
          const total = complaints.length
          const pending = complaints.filter(c => c.status === 'pending').length
          const resolved = complaints.filter(c => c.status === 'resolved').length

          setStats({
            total,
            pending,
            resolved,
            points: userProfile?.total_points || 0,
          })

          // Get recent 5 complaints
          setRecentComplaints(complaints.slice(0, 5))
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  // Fetch air quality data
  const fetchAirQuality = async () => {
    setLoadingAirQuality(true)
    try {
      // Using OpenWeatherMap Air Pollution API (free tier)
      // For Hyderabad coordinates: 17.385044, 78.486671
      const lat = 17.385044
      const lon = 78.486671
      const API_KEY = '55a91f7eadd69c2d875d52d55df7bccd' // Free tier API key (replace with your own)
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setAirQuality(data.list[0])
      } else {
        // Fallback to mock data if API fails
        setAirQuality({
          main: { aqi: 3 },
          components: { pm2_5: 45.2, pm10: 78.5 }
        })
      }
    } catch (error) {
      console.error('Error fetching air quality:', error)
      // Use mock data on error
      setAirQuality({
        main: { aqi: 3 },
        components: { pm2_5: 45.2, pm10: 78.5 }
      })
    } finally {
      setLoadingAirQuality(false)
    }
  }

  useEffect(() => {
    fetchAirQuality()
    fetchWeather()
  }, [])

  // Fetch weather data
  const fetchWeather = async () => {
    setLoadingWeather(true)
    try {
      // Using OpenWeatherMap Current Weather API (free tier)
      // For Hyderabad coordinates: 17.385044, 78.486671
      const lat = 17.385044
      const lon = 78.486671
      const API_KEY = '55a91f7eadd69c2d875d52d55df7bccd' // Same API key
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      )
      
      if (response.ok) {
        const data = await response.json()
        setWeather(data)
      } else {
        // Fallback to mock data if API fails
        setWeather({
          main: { temp: 28, humidity: 65 },
          wind: { speed: 3.5 },
          weather: [{ main: 'Clear', description: 'clear sky' }]
        })
      }
    } catch (error) {
      console.error('Error fetching weather:', error)
      // Use mock data on error
      setWeather({
        main: { temp: 28, humidity: 65 },
        wind: { speed: 3.5 },
        weather: [{ main: 'Clear', description: 'clear sky' }]
      })
    } finally {
      setLoadingWeather(false)
    }
  }

  const getAQIInfo = (aqi) => {
    const levels = {
      1: { label: 'Good', color: 'bg-green-100 text-green-800 border-green-300', emoji: '😊' },
      2: { label: 'Fair', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', emoji: '😐' },
      3: { label: 'Moderate', color: 'bg-orange-100 text-orange-800 border-orange-300', emoji: '😷' },
      4: { label: 'Poor', color: 'bg-red-100 text-red-800 border-red-300', emoji: '😰' },
      5: { label: 'Very Poor', color: 'bg-purple-100 text-purple-800 border-purple-300', emoji: '🤢' },
    }
    return levels[aqi] || levels[3]
  }

  // Staff feedback functions
  const handleSubmitFeedback = async (complaintId) => {
    if (feedbackRating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a star rating',
        variant: 'destructive',
      })
      return
    }

    setSubmittingFeedback(true)
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          staff_feedback: {
            rating: feedbackRating,
            comment: feedbackComment,
            submitted_at: new Date().toISOString(),
          }
        })
        .eq('id', complaintId)

      if (error) throw error

      toast({
        title: 'Feedback submitted! ⭐',
        description: 'Thank you for rating our staff service',
      })

      // Refresh complaints
      setShowFeedbackFor(null)
      setFeedbackRating(0)
      setFeedbackComment('')
      
      // Reload data
      const { data: complaints } = await supabase
        .from('complaints')
        .select('*, staff_feedback')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      setRecentComplaints(complaints.slice(0, 5))
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive',
      })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <Layout role="citizen">
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-heading font-bold text-primary-700">
            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Track your complaints and make a difference in your community
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Link to="/citizen/report">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer eco-gradient text-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Report New Issue</CardTitle>
                    <CardDescription className="text-white/80">
                      Submit a waste management complaint
                    </CardDescription>
                  </div>
                  <Plus className="w-12 h-12" />
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/citizen/rewards">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-yellow-50 border-yellow-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-yellow-800">Your Rewards</CardTitle>
                    <CardDescription className="text-yellow-700">
                      {stats.points} points earned
                    </CardDescription>
                  </div>
                  <Award className="w-12 h-12 text-yellow-600" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-heading font-semibold mb-4">Your Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
                <FileText className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Eco Points</CardTitle>
                <TrendingUp className="w-4 h-4 text-primary-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary-600">{stats.points}</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Eco Widgets Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Eco Tip Widget */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-green-800">Daily Eco Tip</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshTip}
                    className="text-green-600 hover:text-green-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-green-900 text-sm leading-relaxed">
                  {dailyTip}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Weather Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-5 h-5 text-orange-600" />
                    <CardTitle className="text-orange-800">Live Weather</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchWeather}
                    disabled={loadingWeather}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingWeather ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingWeather ? (
                  <div className="text-center py-4">
                    <Cloud className="w-8 h-8 mx-auto text-orange-400 animate-pulse" />
                    <p className="text-sm text-orange-600 mt-2">Loading...</p>
                  </div>
                ) : weather ? (
                  <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-5 h-5 text-orange-600" />
                        <span className="text-3xl font-bold text-orange-900">
                          {Math.round(weather.main?.temp || 0)}°C
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-orange-700 capitalize">
                          {weather.weather?.[0]?.description || 'Clear'}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <motion.div 
                        className="bg-white/50 rounded p-2"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="flex items-center gap-1 text-orange-600 font-semibold">
                          <Droplets className="w-3 h-3" />
                          Humidity
                        </div>
                        <div className="text-orange-900 font-bold">{weather.main?.humidity || 0}%</div>
                      </motion.div>
                      <motion.div 
                        className="bg-white/50 rounded p-2"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="flex items-center gap-1 text-orange-600 font-semibold">
                          <Wind className="w-3 h-3" />
                          Wind
                        </div>
                        <div className="text-orange-900 font-bold">{weather.wind?.speed?.toFixed(1) || 0} m/s</div>
                      </motion.div>
                    </div>
                    <p className="text-xs text-orange-700 mt-2">
                      📍 Hyderabad, India
                    </p>
                  </motion.div>
                ) : (
                  <p className="text-sm text-orange-600">Unable to load weather data</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Air Quality Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-blue-800">Air Quality Index</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchAirQuality}
                    disabled={loadingAirQuality}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAirQuality ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAirQuality ? (
                  <div className="text-center py-4">
                    <Cloud className="w-8 h-8 mx-auto text-blue-400 animate-pulse" />
                    <p className="text-sm text-blue-600 mt-2">Loading...</p>
                  </div>
                ) : airQuality ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-900">Current AQI:</span>
                      <Badge className={`${getAQIInfo(airQuality.main.aqi).color} border text-base px-3 py-1`}>
                        {getAQIInfo(airQuality.main.aqi).emoji} {getAQIInfo(airQuality.main.aqi).label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/50 rounded p-2">
                        <div className="text-blue-600 font-semibold">PM2.5</div>
                        <div className="text-blue-900">{airQuality.components?.pm2_5?.toFixed(1) || 'N/A'} μg/m³</div>
                      </div>
                      <div className="bg-white/50 rounded p-2">
                        <div className="text-blue-600 font-semibold">PM10</div>
                        <div className="text-blue-900">{airQuality.components?.pm10?.toFixed(1) || 'N/A'} μg/m³</div>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      📍 Hyderabad, India
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-blue-600">Unable to load air quality data</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Complaints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold">Recent Complaints</h2>
            <Link to="/citizen/complaints">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading complaints...</p>
                </div>
              ) : recentComplaints.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent complaints. Start by reporting an issue!</p>
                  <Link to="/citizen/report">
                    <Button className="mt-4">Report Issue</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{complaint.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{complaint.location}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              complaint.status === 'resolved' 
                                ? 'bg-green-100 text-green-700'
                                : complaint.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {complaint.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(complaint.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Staff Feedback Section */}
                          {complaint.status === 'resolved' && (
                            <div className="mt-3 pt-3 border-t">
                              {complaint.staff_feedback ? (
                                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                                    <span className="text-sm font-semibold text-yellow-900">
                                      Your Rating: {complaint.staff_feedback.rating}/5
                                    </span>
                                  </div>
                                  {complaint.staff_feedback.comment && (
                                    <p className="text-xs text-yellow-800">
                                      "{complaint.staff_feedback.comment}"
                                    </p>
                                  )}
                                </div>
                              ) : showFeedbackFor === complaint.id ? (
                                <div className="bg-blue-50 p-3 rounded border border-blue-200 space-y-3">
                                  <div>
                                    <label className="text-sm font-semibold text-blue-900 mb-2 block">
                                      Rate Staff Performance:
                                    </label>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          onClick={() => setFeedbackRating(star)}
                                          className="focus:outline-none"
                                        >
                                          <Star
                                            className={`w-6 h-6 ${
                                              star <= feedbackRating
                                                ? 'text-yellow-500 fill-yellow-500'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-blue-900 mb-1 block">
                                      Comment (optional):
                                    </label>
                                    <textarea
                                      value={feedbackComment}
                                      onChange={(e) => setFeedbackComment(e.target.value)}
                                      placeholder="Share your experience..."
                                      className="w-full text-sm rounded border border-blue-300 p-2"
                                      rows={2}
                                      maxLength={200}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSubmitFeedback(complaint.id)}
                                      disabled={submittingFeedback}
                                    >
                                      {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setShowFeedbackFor(null)
                                        setFeedbackRating(0)
                                        setFeedbackComment('')
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowFeedbackFor(complaint.id)}
                                  className="text-xs"
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  Rate Staff Performance
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        <Link to={`/citizen/complaints`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}
