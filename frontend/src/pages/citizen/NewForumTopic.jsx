import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

export default function NewForumTopic() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
  })

  const categories = [
    { value: 'general', label: 'General Discussion' },
    { value: 'waste-management', label: 'Waste Management' },
    { value: 'recycling', label: 'Recycling Tips' },
    { value: 'suggestions', label: 'Suggestions' },
    { value: 'qa', label: 'Questions & Answers' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('forum_topics')
        .insert([
          {
            user_id: user.id,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            status: 'active',
          },
        ])
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Success! 🎉',
        description: 'Your topic has been created',
      })

      navigate(`/citizen/forum/${data.id}`)
    } catch (error) {
      console.error('Error creating topic:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create topic',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
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

        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-700">
            Start a New Discussion
          </h1>
          <p className="text-gray-600 mt-2">
            Share your ideas and questions with the community
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Topic Details</CardTitle>
            <CardDescription>
              Provide clear information to help others understand and engage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="What's your topic about?"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  maxLength={200}
                />
                <p className="text-xs text-gray-500">
                  {formData.title.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Describe your topic in detail..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2"
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500">
                  {formData.description.length}/2000 characters
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Topic'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/citizen/forum')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
