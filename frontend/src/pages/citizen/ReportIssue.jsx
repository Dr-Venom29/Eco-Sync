import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Send, Loader2 } from 'lucide-react'
import { supabase, storageHelpers } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import FileUpload from '@/components/FileUpload'

export default function ReportIssue() {
  const { user } = useAuthStore()
  const fileUploadRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'missed-pickup',
  })
  const [coordinates, setCoordinates] = useState(null)
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const fetchCurrentLocation = async () => {
    setFetchingLocation(true)
    
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      })
      setFetchingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCoordinates({ lat: latitude, lng: longitude })
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          
          const address = data.display_name || `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
          setFormData({ ...formData, location: address })
          
          toast({
            title: 'Location Fetched! 📍',
            description: 'Your current location has been added',
          })
        } catch (error) {
          // Fallback to coordinates if geocoding fails
          setFormData({ 
            ...formData, 
            location: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}` 
          })
          toast({
            title: 'Location Fetched! 📍',
            description: 'Coordinates added successfully',
          })
        }
        setFetchingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        let errorMessage = 'Unable to fetch location'
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }
        
        toast({
          title: 'Location Error',
          description: errorMessage,
          variant: 'destructive',
        })
        setFetchingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get media URL if files were uploaded
      const mediaUrl = uploadedFiles.length > 0 ? uploadedFiles[0] : null

      // Get a default zone (first zone in database)
      const { data: zones } = await supabase
        .from('zones')
        .select('id')
        .limit(1)
        .single()

      // Insert complaint into database
      const { data, error } = await supabase
        .from('complaints')
        .insert([
          {
            user_id: user.id,
            title: formData.title,
            description: formData.description,
            location: formData.location,
            category: formData.category,
            media_url: mediaUrl,
            zone_id: zones?.id || null,
            status: 'pending',
            priority: 'medium',
          }
        ])
        .select()

      if (error) {
        console.error('Complaint insert error:', error)
        throw error
      }

      console.log('Complaint created:', data)

      // Award points for reporting (10 points + 5 bonus for media)
      const points = mediaUrl ? 15 : 10
      const { error: pointsError } = await supabase.rpc('add_user_points', {
        user_id: user.id,
        points,
        reason: mediaUrl ? 'Complaint with media submitted' : 'Complaint submitted',
        complaint_id: data[0].id
      })

      if (pointsError) console.error('Error awarding points:', pointsError)

      toast({
        title: 'Success! 🎉',
        description: `Your complaint has been submitted successfully. You earned ${points} points!`,
      })

      navigate('/citizen/complaints')
    } catch (error) {
      console.error('Error submitting complaint:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit complaint. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout role="citizen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-700">Report an Issue</h1>
          <p className="text-gray-600 mt-2">Help us keep your community clean</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complaint Details</CardTitle>
            <CardDescription>Provide information about the waste management issue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="missed-pickup">Missed Pickup</option>
                  <option value="overflowing-bin">Overflowing Bin</option>
                  <option value="illegal-dumping">Illegal Dumping</option>
                  <option value="damaged-bin">Damaged Bin</option>
                  <option value="unclean-area">Unclean Area</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Provide detailed information about the issue..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      placeholder="Street address or landmark"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fetchCurrentLocation}
                    disabled={fetchingLocation}
                    className="w-full"
                  >
                    {fetchingLocation ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Fetching Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        Use My Current Location
                      </>
                    )}
                  </Button>
                  {coordinates && (
                    <p className="text-xs text-green-600">
                      ✓ Location captured: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload Photo/Video (Optional - Earn 5 bonus points!)</Label>
                <FileUpload 
                  ref={fileUploadRef}
                  onUploadComplete={setUploadedFiles}
                  maxFiles={3}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  )
}
