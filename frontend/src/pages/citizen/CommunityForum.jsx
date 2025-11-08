import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MessageSquare, Eye, Clock, Plus, Pin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

export default function CommunityForum() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [topics, setTopics] = useState([])
  const [filteredTopics, setFilteredTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { value: 'all', label: 'All Topics' },
    { value: 'general', label: 'General' },
    { value: 'waste-management', label: 'Waste Management' },
    { value: 'recycling', label: 'Recycling' },
    { value: 'suggestions', label: 'Suggestions' },
    { value: 'qa', label: 'Q&A' },
  ]

  useEffect(() => {
    fetchTopics()
  }, [])

  useEffect(() => {
    filterTopics()
  }, [searchQuery, selectedCategory, topics])

  const fetchTopics = async () => {
    try {
      const { data: topicsData, error: topicsError } = await supabase
        .from('forum_topics')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

      if (topicsError) throw topicsError

      // Fetch reply counts and user info for each topic
      const topicsWithDetails = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { count: replyCount } = await supabase
            .from('forum_replies')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.id)

          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', topic.user_id)
            .single()

          return {
            ...topic,
            reply_count: replyCount || 0,
            author_name: userData?.full_name || 'Unknown',
          }
        })
      )

      setTopics(topicsWithDetails)
      setFilteredTopics(topicsWithDetails)
    } catch (error) {
      console.error('Error fetching topics:', error)
      toast({
        title: 'Error',
        description: 'Failed to load forum topics',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filterTopics = () => {
    let filtered = [...topics]

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredTopics(filtered)
  }

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      'waste-management': 'bg-green-100 text-green-800',
      recycling: 'bg-blue-100 text-blue-800',
      suggestions: 'bg-purple-100 text-purple-800',
      qa: 'bg-orange-100 text-orange-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Layout role="citizen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary-700">
              Community Forum
            </h1>
            <p className="text-gray-600 mt-2">
              Discuss solutions and share ideas with your community
            </p>
          </div>
          <Button onClick={() => navigate('/citizen/forum/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Topic
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-md bg-background"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-primary"></div>
          </div>
        ) : filteredTopics.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No topics found</p>
                <Button
                  onClick={() => navigate('/citizen/forum/new')}
                  variant="outline"
                  className="mt-4"
                >
                  Start the first discussion
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTopics.map((topic) => (
              <Card
                key={topic.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/citizen/forum/${topic.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {topic.is_pinned && (
                          <Pin className="w-4 h-4 text-primary-600" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {topic.title}
                        </h3>
                        <Badge className={getCategoryColor(topic.category)}>
                          {topic.category}
                        </Badge>
                        <Badge className={getStatusColor(topic.status)}>
                          {topic.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {topic.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{topic.reply_count} replies</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{topic.views_count} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(topic.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span>by {topic.author_name}</span>
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
