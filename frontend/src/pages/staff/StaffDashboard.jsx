import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ListTodo, CheckCircle, Calendar, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export default function StaffDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    assigned: 0,
    completed: 0,
  })
  const [recentCompleted, setRecentCompleted] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return

      try {
        // Fetch complaints assigned to this staff member
        const { data: complaints, error } = await supabase
          .from('complaints')
          .select('*')
          .eq('assigned_to', user.id)
          .order('resolved_at', { ascending: false })

        if (error) throw error

        // Calculate stats
        const assigned = complaints.filter(c => c.status === 'assigned' || c.status === 'in-progress').length
        const completed = complaints.filter(c => c.status === 'resolved').length
        
        // Get recent completed tasks (last 5)
        const recentlyCompleted = complaints
          .filter(c => c.status === 'resolved')
          .slice(0, 5)

        setStats({ assigned, completed })
        setRecentCompleted(recentlyCompleted)
      } catch (error) {
        console.error('Error fetching staff stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  return (
    <Layout role="staff">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-700">Staff Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your assigned tasks and routes</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
              <ListTodo className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
              <p className="text-xs text-gray-500">Pending completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-gray-500">All time</p>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Recent Completed Tasks */}
        {!loading && recentCompleted.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-heading font-bold text-primary-700 mb-4">
              Recently Completed Tasks
            </h2>
            <div className="space-y-3">
              {recentCompleted.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{task.title}</h3>
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{task.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Completed: {new Date(task.resolved_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
