import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  Leaf, 
  LayoutDashboard, 
  FileText, 
  Plus, 
  Award, 
  User,
  LogOut,
  Settings,
  MapPin,
  Users,
  BarChart3,
  ListTodo,
  MessageSquare,
  GitMerge
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { authHelpers } from '@/lib/supabase'

const roleMenus = {
  citizen: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/citizen' },
    { icon: FileText, label: 'My Complaints', path: '/citizen/complaints' },
    { icon: Plus, label: 'Report Issue', path: '/citizen/report' },
    { icon: Award, label: 'Rewards', path: '/citizen/rewards' },
    { icon: MessageSquare, label: 'Forum', path: '/citizen/forum' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: FileText, label: 'Complaints', path: '/admin/complaints' },
    { icon: GitMerge, label: 'Merge Duplicates', path: '/admin/merge' },
    { icon: MapPin, label: 'Zones', path: '/admin/zones' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  ],
  staff: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/staff' },
    { icon: ListTodo, label: 'Tasks', path: '/staff/tasks' },
  ],
}

export default function Layout({ children, role = 'citizen' }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authHelpers.signOut()
    logout()
    navigate('/login')
  }

  const menuItems = roleMenus[role] || roleMenus.citizen

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Leaf className="w-8 h-8 text-primary-600" />
              <span className="text-2xl font-heading font-bold text-primary-700">EcoSync</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  {user?.user_metadata?.full_name?.split(' ')[0] || 'Profile'}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 space-y-2">
            <nav className="bg-white rounded-lg shadow-sm p-4 space-y-1">
              {menuItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={window.location.pathname === item.path ? 'default' : 'ghost'}
                    className="w-full justify-start"
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
