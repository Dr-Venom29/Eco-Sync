import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListTodo, MapPin, Calendar, CheckCircle, Upload } from 'lucide-react'
import { supabase, storageHelpers } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

export default function TaskList() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [user])

  const fetchTasks = async () => {
    if (!user?.id) return

    try {
      // Fetch tasks assigned to this user (not resolved)
      const { data: assignedData, error: assignedError } = await supabase
        .from('complaints')
        .select('*')
        .eq('assigned_to', user.id)
        .neq('status', 'resolved')
        .order('created_at', { ascending: false })

      if (assignedError) throw assignedError

      // Fetch unassigned tasks that admin made available to all staff (pool)
      // ONLY show if status is 'assigned' (admin explicitly made it available)
      // Do NOT show 'pending' (citizen reported but admin hasn't reviewed yet)
      const { data: availableData, error: availableError } = await supabase
        .from('complaints')
        .select('*')
        .is('assigned_to', null)
        .eq('status', 'assigned')  // Only 'assigned', not 'pending'
        .order('created_at', { ascending: false })

      if (availableError) throw availableError

      console.log('Available pool tasks:', availableData)
      console.log('Tasks assigned to me:', assignedData)

      // Combine: available tasks first then assigned to user
      const combined = [...(availableData || []), ...(assignedData || [])]
      setTasks(combined)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const claimTask = async (taskId) => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .update({ 
          assigned_to: user.id,
          status: 'assigned'  // Keep as 'assigned', not 'in-progress'
        })
        .eq('id', taskId)
        .select()

      if (error) {
        console.error('Error claiming task:', error)
        throw error
      }

      console.log('Task claimed successfully:', data)
      
      toast({ 
        title: 'Task claimed', 
        description: 'You have claimed the task. Click "Start Task" to begin working.' 
      })
      
      // Wait a moment for DB to update, then refresh
      await fetchTasks()
    } catch (error) {
      console.error('Claim task error:', error)
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      })
    }
  }

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          status: newStatus,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', taskId)

      if (error) throw error

      toast({
        title: 'Success!',
        description: `Task marked as ${newStatus}`,
      })

      fetchTasks()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleResolutionUpload = async (task, event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    try {
      // Limit to images only and <= 10MB each
      const images = files.filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024)
      if (images.length === 0) {
        toast({ title: 'Invalid file(s)', description: 'Please select image files under 10MB', variant: 'destructive' })
        return
      }

      const uploadedUrls = []
      for (const file of images) {
        const ext = file.name.split('.').pop()
        const name = `${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`
        const path = `resolutions/${task.id}/${name}`

        const { error: uploadError } = await storageHelpers.uploadFile('complaint-media', path, file)
        if (uploadError) throw uploadError
        const publicUrl = storageHelpers.getPublicUrl('complaint-media', path)
        uploadedUrls.push(publicUrl)
      }

      // Append to existing array
      const current = Array.isArray(task.resolution_media_urls) ? task.resolution_media_urls : []
      const next = [...current, ...uploadedUrls]
      const { error: updateError } = await supabase
        .from('complaints')
        .update({ resolution_media_urls: next })
        .eq('id', task.id)

      if (updateError) throw updateError

      toast({ title: 'Uploaded', description: `${uploadedUrls.length} photo(s) added to resolution` })
      await fetchTasks()
    } catch (err) {
      console.error('Resolution upload failed', err)
      toast({ title: 'Upload failed', description: err.message || 'Please try again', variant: 'destructive' })
    } finally {
      // reset the input value so the same file can be selected again if needed
      event.target.value = ''
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-purple-100 text-purple-800',
      assigned: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Layout role="staff">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-700">My Tasks</h1>
          <p className="text-gray-600 mt-2">View and update your assigned tasks</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-primary"></div>
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-gray-500">
                <ListTodo className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No tasks assigned yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 flex-wrap">
                        {task.title}
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        {!task.assigned_to && (
                          <Badge className="bg-orange-100 text-orange-800">
                            Available to All
                          </Badge>
                        )}
                        {task.assigned_to && task.assigned_to === user?.id && (
                          <Badge className="bg-green-100 text-green-800">
                            Assigned to You
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{task.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {task.media_url && (
                    <div className="mb-4">
                      <img 
                        src={task.media_url} 
                        alt="Task" 
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Existing action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {/* Debug info */}
                    {console.log('Task:', task.id, 'assigned_to:', task.assigned_to, 'user.id:', user.id, 'status:', task.status)}
                    
                    {/* Show "Take Task" only for unassigned tasks */}
                    {!task.assigned_to && (
                      <Button onClick={() => claimTask(task.id)} size="sm">
                        Take Task
                      </Button>
                    )}
                    
                    {/* Show "Start Task" for tasks assigned to me but not started */}
                    {task.assigned_to && task.assigned_to === user?.id && task.status === 'assigned' && (
                      <Button 
                        onClick={() => updateTaskStatus(task.id, 'in-progress')}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Start Task
                      </Button>
                    )}
                    
                    {/* Show "Mark as Resolved" for tasks in progress */}
                    {task.assigned_to && task.assigned_to === user?.id && task.status === 'in-progress' && (
                      <Button 
                        onClick={() => updateTaskStatus(task.id, 'resolved')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Resolved
                      </Button>
                    )}
                    {/* Resolution photo upload: show for tasks assigned to me (assigned or in-progress) */}
                    {task.assigned_to && task.assigned_to === user?.id && (task.status === 'assigned' || task.status === 'in-progress') && (
                      <label className="inline-flex items-center gap-2 text-sm cursor-pointer border rounded px-3 py-1 hover:bg-gray-50">
                        <Upload className="w-4 h-4" />
                        <span>Upload Result Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleResolutionUpload(task, e)}
                        />
                      </label>
                    )}
                  </div>
                  {/* Existing media and resolution gallery */}
                  {Array.isArray(task.resolution_media_urls) && task.resolution_media_urls.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Resolution Photos ({task.resolution_media_urls.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {task.resolution_media_urls.map((url, idx) => (
                          <img 
                            key={idx} 
                            src={url} 
                            alt={`Resolution ${idx + 1}`} 
                            className="w-20 h-20 object-cover rounded" 
                            loading="lazy"
                          />
                        ))}
                      </div>
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
