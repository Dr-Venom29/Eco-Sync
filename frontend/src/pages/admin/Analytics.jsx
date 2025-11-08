import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function Analytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    totalPoints: 0,
    avgResolutionTime: 0,
  })
  const [categoryStats, setCategoryStats] = useState([])
  const [zoneStats, setZoneStats] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Fetch overall stats
      const { data: users } = await supabase
        .from('users')
        .select('total_points')

      const { data: complaints } = await supabase
        .from('complaints')
        .select('*, zones(name)')

      if (users && complaints) {
        const totalPoints = users.reduce((sum, u) => sum + (u.total_points || 0), 0)
        const resolved = complaints.filter(c => c.status === 'resolved')
        const pending = complaints.filter(c => c.status === 'pending')

        // Calculate average resolution time
        const resolvedWithTime = resolved.filter(c => c.resolved_at && c.created_at)
        const avgTime = resolvedWithTime.length > 0
          ? resolvedWithTime.reduce((sum, c) => {
              const created = new Date(c.created_at)
              const resolvedAt = new Date(c.resolved_at)
              return sum + (resolvedAt - created) / (1000 * 60 * 60 * 24) // days
            }, 0) / resolvedWithTime.length
          : 0

        setStats({
          totalUsers: users.length,
          totalComplaints: complaints.length,
          resolvedComplaints: resolved.length,
          pendingComplaints: pending.length,
          totalPoints,
          avgResolutionTime: avgTime.toFixed(1),
        })

        // Category breakdown
        const categories = {}
        complaints.forEach(c => {
          categories[c.category] = (categories[c.category] || 0) + 1
        })
        setCategoryStats(
          Object.entries(categories).map(([name, count]) => ({ name, count }))
        )

        // Zone breakdown
        const zones = {}
        complaints.forEach(c => {
          const zoneName = c.zones?.name || 'Unassigned'
          zones[zoneName] = (zones[zoneName] || 0) + 1
        })
        setZoneStats(
          Object.entries(zones).map(([name, count]) => ({ name, count }))
        )

        // Recent activity
        setRecentActivity(
          complaints
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10)
        )
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`w-4 h-4 ${color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  if (loading) {
    return (
      <Layout role="admin">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-700">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Performance metrics and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="text-blue-600"
          />
          <StatCard
            title="Total Complaints"
            value={stats.totalComplaints}
            icon={FileText}
            color="text-purple-600"
          />
          <StatCard
            title="Resolved"
            value={stats.resolvedComplaints}
            icon={CheckCircle}
            color="text-green-600"
            description={`${((stats.resolvedComplaints / stats.totalComplaints) * 100 || 0).toFixed(1)}% resolution rate`}
          />
          <StatCard
            title="Pending"
            value={stats.pendingComplaints}
            icon={Clock}
            color="text-yellow-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="Total Points Awarded"
            value={stats.totalPoints.toLocaleString()}
            icon={Award}
            color="text-primary-600"
          />
          <StatCard
            title="Avg Resolution Time"
            value={`${stats.avgResolutionTime} days`}
            icon={TrendingUp}
            color="text-orange-600"
          />
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Category</CardTitle>
              <CardDescription>Distribution across different issue types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats.map((cat, index) => {
                  const percentage = (cat.count / stats.totalComplaints) * 100
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">
                          {cat.name.replace('-', ' ')}
                        </span>
                        <span className="text-sm text-gray-600">{cat.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="bg-primary-600 h-2 rounded-full"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Zone Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Zone</CardTitle>
              <CardDescription>Geographical distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {zoneStats.map((zone, index) => {
                  const percentage = (zone.count / stats.totalComplaints) * 100
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{zone.name}</span>
                        <span className="text-sm text-gray-600">{zone.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="bg-green-600 h-2 rounded-full"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest complaint submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-gray-500">
                      {activity.zones?.name || 'No zone'} • {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activity.status === 'resolved' 
                      ? 'bg-green-100 text-green-700'
                      : activity.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {activity.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
