import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, MapPin, Calendar, User, UserPlus, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function ComplaintManagement() {
  const { toast } = useToast()
  const [complaints, setComplaints] = useState([])
  const [staffMembers, setStaffMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchComplaints()
    fetchStaffMembers()

    // Subscribe to real-time updates on complaints
    const channel = supabase
      .channel('complaints-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'complaints' 
        }, 
        (payload) => {
          console.log('Complaint changed:', payload)
          fetchComplaints() // Refresh complaints when any change occurs
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'staff')

      if (error) {
        console.error('Error fetching staff:', error)
        throw error
      }
      
      console.log('Staff members fetched:', data)
      console.log('Staff count:', data?.length || 0)
      setStaffMembers(data || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const fetchComplaints = async () => {
    try {
      // First, fetch complaints
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })

      if (complaintsError) {
        console.error('Error fetching complaints:', complaintsError)
        throw complaintsError
      }

      // Then fetch user names for each complaint
      const complaintsWithUsers = await Promise.all(
        (complaintsData || []).map(async (complaint) => {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', complaint.user_id)
            .single()

          // Get assigned staff name if exists
          let assignedStaffName = null
          if (complaint.assigned_to) {
            const { data: staffData } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', complaint.assigned_to)
              .single()
            assignedStaffName = staffData?.full_name
          }

          return {
            ...complaint,
            users: userData || { full_name: 'Unknown' },
            assignedStaffName
          }
        })
      )
      
      console.log('Fetched complaints with users:', complaintsWithUsers)
      setComplaints(complaintsWithUsers)
    } catch (error) {
      console.error('Error in fetchComplaints:', error)
    } finally {
      setLoading(false)
    }
  }

  const assignToStaff = async (complaintId, staffId, staffName) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          assigned_to: staffId,
          status: 'assigned'
        })
        .eq('id', complaintId)

      if (error) throw error

      toast({
        title: 'Success!',
        description: `Complaint assigned to ${staffName}`,
      })

      fetchComplaints()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const makeAvailableToAll = async (complaintId) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          assigned_to: null,
          status: 'assigned'
        })
        .eq('id', complaintId)

      if (error) throw error

      toast({
        title: 'Success!',
        description: 'Complaint is now available to all staff members',
      })

      fetchComplaints()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600',
    }
    return colors[priority] || 'text-gray-600'
  }

  const isVideo = (url = '') => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url)

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary-700">Complaint Management</h1>
            <p className="text-gray-600 mt-2">Review, assign, and track complaints</p>
          </div>
          <Button 
            onClick={fetchComplaints}
            variant="outline"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-primary"></div>
          </div>
        ) : complaints.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No complaints to display</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{complaint.title}</h3>
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status}
                        </Badge>
                        <span className={`text-sm font-medium ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority} priority
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{complaint.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{complaint.users?.full_name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{complaint.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Quick preview of first media if any */}
                      {complaint.media_url && (
                        <div className="mt-4">
                          {isVideo(complaint.media_url) ? (
                            <video src={complaint.media_url} className="w-40 h-28 rounded" controls />
                          ) : (
                            <img 
                              src={complaint.media_url} 
                              alt="Complaint" 
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      )}

                      {/* Assignment Section */}
                      <div className="mt-4 pt-4 border-t">
                        {complaint.assignedStaffName ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <UserPlus className="w-4 h-4 text-blue-600" />
                              <span className="text-gray-600">Assigned to:</span>
                              <span className="font-medium text-blue-600">{complaint.assignedStaffName}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setExpandedId(expandedId === complaint.id ? null : complaint.id)}
                                className="flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" /> View
                              </Button>
                              {complaint.status !== 'resolved' && (
                                <Button
                                  onClick={() => makeAvailableToAll(complaint.id)}
                                  variant="outline"
                                  size="sm"
                                >
                                  Make Available to All
                                </Button>
                              )}
                              {complaint.status !== 'resolved' && staffMembers.length > 0 && (
                                <select
                                  onChange={(e) => {
                                    const staff = staffMembers.find(s => s.id === e.target.value)
                                    if (staff) assignToStaff(complaint.id, staff.id, staff.full_name)
                                  }}
                                  className="text-sm border rounded px-2 py-1"
                                  defaultValue=""
                                >
                                  <option value="">Reassign to...</option>
                                  {staffMembers.map((staff) => (
                                    <option key={staff.id} value={staff.id}>
                                      {staff.full_name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <UserPlus className="w-4 h-4 text-gray-400" />
                              {staffMembers.length > 0 ? (
                                <select
                                  onChange={(e) => {
                                    const staff = staffMembers.find(s => s.id === e.target.value)
                                    if (staff) assignToStaff(complaint.id, staff.id, staff.full_name)
                                  }}
                                  className="text-sm border rounded px-3 py-1.5"
                                  defaultValue=""
                                >
                                  <option value="">Assign to staff...</option>
                                  {staffMembers.map((staff) => (
                                    <option key={staff.id} value={staff.id}>
                                      {staff.full_name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-sm text-gray-500">No staff members available</span>
                              )}
                            </div>
                            {complaint.status === 'pending' && (
                              <Button
                                onClick={() => makeAvailableToAll(complaint.id)}
                                variant="outline"
                                size="sm"
                              >
                                Make Available to All Staff
                              </Button>
                            )}
                          </div>
                        )}
                        {/* Expandable viewer - lazy loaded only when expanded */}
                        {expandedId === complaint.id && (
                          <div className="mt-4 border rounded p-3 bg-gray-50">
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
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
