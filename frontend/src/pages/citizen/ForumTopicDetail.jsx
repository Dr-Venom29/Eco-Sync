import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, MessageSquare, Trash2, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

export default function ForumTopicDetail() {
  const { topicId } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [topic, setTopic] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTopicAndReplies()
    incrementViewCount()
  }, [topicId])

  const incrementViewCount = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase.rpc('increment_topic_views', { 
        topic_id: topicId,
        user_id: user.id
      })
      
      if (error) {
        console.error('Error incrementing views:', error)
      } else {
        console.log('View count updated:', data)
      }
    } catch (error) {
      console.error('Error incrementing views:', error)
    }
  }

  const fetchTopicAndReplies = async () => {
    try {
      // Fetch topic
      const { data: topicData, error: topicError } = await supabase
        .from('forum_topics')
        .select('*')
        .eq('id', topicId)
        .single()

      if (topicError) throw topicError

      // Fetch author info
      const { data: authorData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', topicData.user_id)
        .single()

      setTopic({
        ...topicData,
        author_name: authorData?.full_name || 'Unknown',
      })

      // Fetch replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true })

      if (repliesError) throw repliesError

      // Fetch reply authors
      const repliesWithAuthors = await Promise.all(
        (repliesData || []).map(async (reply) => {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', reply.user_id)
            .single()

          return {
            ...reply,
            author_name: userData?.full_name || 'Unknown',
          }
        })
      )

      setReplies(repliesWithAuthors)
    } catch (error) {
      console.error('Error fetching topic:', error)
      toast({
        title: 'Error',
        description: 'Failed to load topic',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setSubmitting(true)

    try {
      const { error } = await supabase.from('forum_replies').insert([
        {
          topic_id: topicId,
          user_id: user.id,
          content: replyContent,
        },
      ])

      if (error) throw error

      toast({
        title: 'Reply posted! 💬',
        description: 'Your reply has been added',
      })

      setReplyContent('')
      fetchTopicAndReplies()
    } catch (error) {
      console.error('Error posting reply:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to post reply',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReply = async (replyId) => {
    if (!confirm('Are you sure you want to delete this reply?')) return

    try {
      const { error } = await supabase
        .from('forum_replies')
        .delete()
        .eq('id', replyId)

      if (error) throw error

      toast({
        title: 'Reply deleted',
        description: 'The reply has been removed',
      })

      fetchTopicAndReplies()
    } catch (error) {
      console.error('Error deleting reply:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete reply',
        variant: 'destructive',
      })
    }
  }

  const handleMarkSolution = async (replyId) => {
    try {
      // Unmark all other solutions
      await supabase
        .from('forum_replies')
        .update({ is_solution: false })
        .eq('topic_id', topicId)

      // Mark this as solution
      const { error } = await supabase
        .from('forum_replies')
        .update({ is_solution: true })
        .eq('id', replyId)

      if (error) throw error

      toast({
        title: 'Solution marked! ✅',
        description: 'This reply has been marked as the solution',
      })

      fetchTopicAndReplies()
    } catch (error) {
      console.error('Error marking solution:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark solution',
        variant: 'destructive',
      })
    }
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

  if (loading) {
    return (
      <Layout role="citizen">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-primary"></div>
        </div>
      </Layout>
    )
  }

  if (!topic) {
    return (
      <Layout role="citizen">
        <div className="text-center py-12">
          <p className="text-gray-500">Topic not found</p>
          <Button onClick={() => navigate('/citizen/forum')} className="mt-4">
            Back to Forum
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="citizen">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/citizen/forum')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Button>
        </div>

        {/* Topic Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge className={getCategoryColor(topic.category)}>
                    {topic.category}
                  </Badge>
                  <Badge className={getStatusColor(topic.status)}>
                    {topic.status}
                  </Badge>
                </div>
                <CardTitle className="text-2xl mb-3">{topic.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span>by {topic.author_name}</span>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{topic.views_count} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{replies.length} replies</span>
                  </div>
                  <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{topic.description}</p>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-bold text-primary-700">
            Replies ({replies.length})
          </h2>

          {replies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {reply.author_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(reply.created_at).toLocaleDateString()}
                      </span>
                      {reply.is_solution && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Solution
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {topic.category === 'qa' &&
                      topic.user_id === user.id &&
                      !reply.is_solution && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkSolution(reply.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    {reply.user_id === user.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteReply(reply.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {topic.status === 'active' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Post a Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReply} className="space-y-4">
                  <textarea
                    placeholder="Share your thoughts..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2"
                    required
                    maxLength={2000}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      {replyContent.length}/2000 characters
                    </p>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Posting...' : 'Post Reply'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {topic.status !== 'active' && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">
                  This topic is {topic.status}. No new replies allowed.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}
