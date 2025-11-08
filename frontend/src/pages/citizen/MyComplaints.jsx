import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileText, MapPin, Calendar, AlertCircle, Search, Filter, X, Star, MessageSquare, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Link } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

export default function MyComplaints() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [complaints, setComplaints] = useState([])
  const [filteredComplaints, setFilteredComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showMediaFor, setShowMediaFor] = useState(null)
  
  // Staff feedback states
  const [showFeedbackFor, setShowFeedbackFor] = useState(null)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'missed-pickup', label: 'Missed Pickup' },
    { value: 'overflowing-bin', label: 'Overflowing Bin' },
    { value: 'illegal-dumping', label: 'Illegal Dumping' },
    { value: 'damaged-bin', label: 'Damaged Bin' },
    { value: 'unclean-area', label: 'Unclean Area' },
    { value: 'other', label: 'Other' },
  ]

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
  ]

  const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ]

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setComplaints(data || [])
        setFilteredComplaints(data || [])
      } catch (error) {
        console.error('Error fetching complaints:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchComplaints()
  }, [user])

  const handleSubmitFeedback = async (complaintId) => {
    if (feedbackRating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting',
        variant: 'destructive'
      })
      return
    }

    setSubmittingFeedback(true)

    try {
      const feedbackData = {
        rating: feedbackRating,
        comment: feedbackComment.trim(),
        submitted_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('complaints')
        .update({ staff_feedback: feedbackData })
        .eq('id', complaintId)

      if (error) throw error

      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for rating our staff performance!'
      })

      // Refresh complaints to show updated feedback
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setComplaints(data)
        setFilteredComplaints(data)
      }

      // Reset form
      setShowFeedbackFor(null)
      setFeedbackRating(0)
      setFeedbackComment('')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  // Filter and search logic
  useEffect(() => {
    let result = [...complaints]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (complaint) =>
          complaint.title.toLowerCase().includes(query) ||
          complaint.description.toLowerCase().includes(query) ||
          complaint.location.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((complaint) => complaint.category === selectedCategory)
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter((complaint) => complaint.status === selectedStatus)
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      result = result.filter((complaint) => complaint.priority === selectedPriority)
    }

    setFilteredComplaints(result)
  }, [searchQuery, selectedCategory, selectedStatus, selectedPriority, complaints])

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedStatus('all')
    setSelectedPriority('all')
  }

  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    selectedCategory !== 'all' || 
    selectedStatus !== 'all' || 
    selectedPriority !== 'all'

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'in-progress':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600'
      case 'high':
        return 'text-orange-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const isVideo = (url = '') => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url)

  return (
    <Layout role="citizen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary-700">My Complaints</h1>
            <p className="text-gray-600 mt-2">View and track all your submitted complaints</p>
          </div>
          <Link to="/citizen/report">
            <Button>Report New Issue</Button>
          </Link>
        </div>

        {/* Search and Filter Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter Toggle Button */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                  {hasActiveFilters && (
                    <Badge className="ml-1 bg-primary-600">
                      Active
                    </Badge>
                  )}
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All Filters
                  </Button>
                )}
              </div>

              {/* Filter Options */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="category-filter">Category</Label>
                    <select
                      id="category-filter"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="status-filter">Status</Label>
                    <select
                      id="status-filter"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="priority-filter">Priority</Label>
                    <select
                      id="priority-filter"
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Results Count */}
              <div className="text-sm text-gray-600 pt-2">
                Showing <span className="font-semibold text-primary-700">{filteredComplaints.length}</span> of{' '}
                <span className="font-semibold">{complaints.length}</span> complaint(s)
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading complaints...</p>
              </div>
            </CardContent>
          </Card>
        ) : complaints.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No complaints yet</p>
                <p className="text-sm mt-2">Your submitted complaints will appear here</p>
                <Link to="/citizen/report">
                  <Button className="mt-4">Report Your First Issue</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : filteredComplaints.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-gray-500">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No complaints match your filters</p>
                <p className="text-sm mt-2">Try adjusting your search or filter criteria</p>
                <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredComplaints.map((complaint) => (
              <Card key={complaint.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{complaint.title}</CardTitle>
                      <CardDescription className="mt-2">{complaint.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                      <span className={`text-xs font-medium uppercase ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority} Priority
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 flex items-center gap-2"
                        onClick={() => setShowMediaFor(showMediaFor === complaint.id ? null : complaint.id)}
                      >
                        <Eye className="w-4 h-4" /> View
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span className="capitalize">{complaint.category.replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{complaint.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {complaint.notes && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Staff Notes:</strong> {complaint.notes}
                      </p>
                    </div>
                  )}
                  {complaint.resolved_at && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-900">
                        <strong>Resolved on:</strong> {new Date(complaint.resolved_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {showMediaFor === complaint.id && (
                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Media</p>
                      <div className="flex flex-wrap gap-3">
                        {complaint.media_url && (
                          <div>
                            {isVideo(complaint.media_url) ? (
                              <video 
                                src={complaint.media_url} 
                                className="w-64 rounded" 
                                controls 
                                preload="metadata"
                              />
                            ) : (
                              <img 
                                src={complaint.media_url} 
                                alt="Reported" 
                                className="w-40 h-40 object-cover rounded" 
                                loading="lazy"
                              />
                            )}
                            <p className="text-xs text-gray-600 mt-1">Reported</p>
                          </div>
                        )}
                        {Array.isArray(complaint.resolution_media_urls) && complaint.resolution_media_urls.length > 0 && complaint.resolution_media_urls.map((url, idx) => (
                          <div key={idx}>
                            <img 
                              src={url} 
                              alt={`Resolution ${idx+1}`} 
                              className="w-40 h-40 object-cover rounded" 
                              loading="lazy"
                            />
                            <p className="text-xs text-gray-600 mt-1">Resolution {idx+1}</p>
                          </div>
                        ))}
                        {!complaint.media_url && (!complaint.resolution_media_urls || complaint.resolution_media_urls.length === 0) && (
                          <p className="text-sm text-gray-500">No media attached</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Staff Feedback Section */}
                  {complaint.status === 'resolved' && (
                    <div className="mt-4 pt-4 border-t">
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
                        <div className="bg-blue-50 p-4 rounded border border-blue-200 space-y-3">
                          <div>
                            <label className="text-sm font-semibold text-blue-900 mb-2 block">
                              Rate Staff Performance:
                            </label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setFeedbackRating(star)}
                                  className="focus:outline-none transition-transform hover:scale-110"
                                >
                                  <Star
                                    className={`w-7 h-7 ${
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
                              placeholder="Share your experience with our staff..."
                              className="w-full text-sm rounded border border-blue-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              maxLength={200}
                            />
                            <p className="text-xs text-blue-600 mt-1">
                              {feedbackComment.length}/200 characters
                            </p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
