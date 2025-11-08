import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { 
  Search, 
  MapPin, 
  GitMerge, 
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react'

export default function ComplaintMerge() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [complaints, setComplaints] = useState([])
  const [selectedParent, setSelectedParent] = useState(null)
  const [selectedDuplicates, setSelectedDuplicates] = useState([])
  const [duplicates, setDuplicates] = useState([])
  const [searching, setSearching] = useState(false)
  const [merging, setMerging] = useState(false)
  const [mergeReason, setMergeReason] = useState('')
  const [searchRadius, setSearchRadius] = useState(50)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('is_merged', false)
        .neq('status', 'resolved')
        .order('created_at', { ascending: false })

      if (error) throw error
      setComplaints(data || [])
    } catch (error) {
      console.error('Error fetching complaints:', error)
      toast({
        title: 'Error',
        description: 'Failed to load complaints',
        variant: 'destructive',
      })
    }
  }

  const findDuplicates = async (complaint) => {
    if (!complaint.latitude || !complaint.longitude) {
      toast({
        title: 'Error',
        description: 'This complaint has no location data',
        variant: 'destructive',
      })
      return
    }

    setSearching(true)
    setSelectedParent(complaint)
    setSelectedDuplicates([])

    try {
      const { data, error } = await supabase.rpc('find_duplicate_complaints', {
        complaint_lat: complaint.latitude,
        complaint_lng: complaint.longitude,
        max_distance_meters: searchRadius
      })

      if (error) throw error

      // Filter out the selected complaint itself
      const filtered = (data || []).filter(d => d.id !== complaint.id)
      setDuplicates(filtered)

      if (filtered.length === 0) {
        toast({
          title: 'No duplicates found',
          description: `No complaints found within ${searchRadius}m radius`,
        })
      }
    } catch (error) {
      console.error('Error finding duplicates:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to find duplicates',
        variant: 'destructive',
      })
    } finally {
      setSearching(false)
    }
  }

  const toggleDuplicateSelection = (duplicate) => {
    setSelectedDuplicates(prev => {
      const exists = prev.find(d => d.id === duplicate.id)
      if (exists) {
        return prev.filter(d => d.id !== duplicate.id)
      } else {
        return [...prev, duplicate]
      }
    })
  }

  const handleMerge = async () => {
    if (!selectedParent || selectedDuplicates.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select duplicates to merge',
        variant: 'destructive',
      })
      return
    }

    if (!mergeReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for merging',
        variant: 'destructive',
      })
      return
    }

    setMerging(true)

    try {
      const childIds = selectedDuplicates.map(d => d.id)
      
      const { data, error } = await supabase.rpc('merge_complaints', {
        parent_id: selectedParent.id,
        child_ids: childIds,
        merged_by_user: user.id,
        reason: mergeReason
      })

      if (error) throw error

      toast({
        title: 'Success! 🎉',
        description: `Merged ${data.merged_count} duplicate complaint(s)`,
      })

      // Reset state
      setSelectedParent(null)
      setSelectedDuplicates([])
      setDuplicates([])
      setMergeReason('')
      fetchComplaints()
    } catch (error) {
      console.error('Error merging complaints:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to merge complaints',
        variant: 'destructive',
      })
    } finally {
      setMerging(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-700 mb-2">
            Complaint Merge Tool
          </h1>
          <p className="text-gray-600">
            Find and merge duplicate complaints from the same location
          </p>
        </div>

        {/* Search Radius Setting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="radius">Search Radius (meters):</Label>
              <Input
                id="radius"
                type="number"
                min="10"
                max="500"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-gray-500">
                Complaints within this distance will be considered duplicates
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complaints List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Complaints ({complaints.length})</CardTitle>
              <p className="text-sm text-gray-600">
                Click on a complaint to find nearby duplicates
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {complaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    onClick={() => findDuplicates(complaint)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedParent?.id === complaint.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm">{complaint.title}</h3>
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {complaint.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{complaint.location}</span>
                    </div>
                    {complaint.latitude && complaint.longitude && (
                      <div className="text-xs text-gray-400 mt-1">
                        📍 {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                      </div>
                    )}
                  </div>
                ))}
                {complaints.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No active complaints found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Duplicates & Merge Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitMerge className="w-5 h-5" />
                Potential Duplicates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedParent ? (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a complaint from the left to find duplicates</p>
                </div>
              ) : searching ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Searching for duplicates...</p>
                </div>
              ) : duplicates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>No duplicates found within {searchRadius}m</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Parent Complaint */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-700">
                        Parent Complaint (Keep This)
                      </span>
                    </div>
                    <h3 className="font-semibold">{selectedParent.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedParent.description}
                    </p>
                  </div>

                  {/* Duplicates */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {duplicates.map((dup) => {
                      const isSelected = selectedDuplicates.some(d => d.id === dup.id)
                      return (
                        <div
                          key={dup.id}
                          onClick={() => toggleDuplicateSelection(dup)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 hover:border-red-300'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-1">
                              {isSelected ? (
                                <XCircle className="w-5 h-5 text-red-600" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{dup.title}</h4>
                              <p className="text-xs text-gray-600 line-clamp-1">
                                {dup.description}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>{Math.round(dup.distance_meters)}m away</span>
                                <Badge className={getStatusColor(dup.status)}>
                                  {dup.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Merge Controls */}
                  {selectedDuplicates.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <Label htmlFor="reason">Merge Reason</Label>
                        <textarea
                          id="reason"
                          placeholder="Why are these complaints duplicates? (e.g., 'Same overflowing bin at park entrance')"
                          value={mergeReason}
                          onChange={(e) => setMergeReason(e.target.value)}
                          className="w-full mt-1 min-h-[80px] rounded-md border border-input bg-background px-3 py-2"
                          required
                        />
                      </div>
                      <Button
                        onClick={handleMerge}
                        disabled={merging}
                        className="w-full"
                      >
                        {merging ? 'Merging...' : `Merge ${selectedDuplicates.length} Duplicate(s)`}
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        Selected duplicates will be marked as resolved and linked to the parent
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
