import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './lib/store'
import { Toaster } from './components/ui/toaster'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

// Pages
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CitizenDashboard from './pages/citizen/CitizenDashboard'
import MyComplaints from './pages/citizen/MyComplaints'
import ReportIssue from './pages/citizen/ReportIssue'
import Rewards from './pages/citizen/Rewards'
import CommunityForum from './pages/citizen/CommunityForum'
import NewForumTopic from './pages/citizen/NewForumTopic'
import ForumTopicDetail from './pages/citizen/ForumTopicDetail'
import AdminDashboard from './pages/admin/AdminDashboard'
import ComplaintManagement from './pages/admin/ComplaintManagement'
import ComplaintMerge from './pages/admin/ComplaintMerge'
import ZoneManagement from './pages/admin/ZoneManagement'
import Analytics from './pages/admin/Analytics'
import StaffDashboard from './pages/staff/StaffDashboard'
import TaskList from './pages/staff/TaskList'
import Profile from './pages/Profile'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore()
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        // Fetch role from database
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        // Use database role, fallback to metadata
        const role = userProfile?.role || user?.user_metadata?.role || 'citizen'
        setUserRole(role)
      } catch (error) {
        console.error('Error fetching user role:', error)
        // Fallback to metadata role
        setUserRole(user?.user_metadata?.role || 'citizen')
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [user])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-primary"></div>
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={`/${userRole}`} replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Citizen Routes */}
          <Route
            path="/citizen"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/complaints"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <MyComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/report"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <ReportIssue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/rewards"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <Rewards />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/forum"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CommunityForum />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/forum/new"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <NewForumTopic />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/forum/:topicId"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <ForumTopicDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ComplaintManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/merge"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ComplaintMerge />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/zones"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ZoneManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* Staff Routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/tasks"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <TaskList />
              </ProtectedRoute>
            }
          />

          {/* Common Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App
