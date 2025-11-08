import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Award, Trophy, Star, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export default function Rewards() {
  const { user } = useAuthStore()
  const [points, setPoints] = useState(0)
  const [totalComplaints, setTotalComplaints] = useState(0)
  const [earnedBadges, setEarnedBadges] = useState([])
  const [loading, setLoading] = useState(true)

  // Level system based on points
  const getLevelInfo = (pts) => {
    if (pts >= 1000) return { 
      level: 4, 
      name: 'Eco Hero', 
      theme: 'Earth glow',
      color: 'from-blue-500 to-green-500',
      textColor: 'text-blue-900',
      bgColor: 'bg-gradient-to-br from-blue-50 to-green-50',
      borderColor: 'border-blue-300',
      nextLevel: 5, 
      nextLevelPoints: 2000 
    }
    if (pts >= 500) return { 
      level: 3, 
      name: 'Eco Guardian', 
      theme: 'Forest theme',
      color: 'from-green-600 to-green-800',
      textColor: 'text-green-900',
      bgColor: 'bg-gradient-to-br from-green-100 to-emerald-100',
      borderColor: 'border-green-400',
      nextLevel: 4, 
      nextLevelPoints: 1000 
    }
    if (pts >= 100) return { 
      level: 2, 
      name: 'Eco Learner', 
      theme: 'Green fade',
      color: 'from-green-400 to-green-600',
      textColor: 'text-green-800',
      bgColor: 'bg-gradient-to-br from-green-50 to-lime-50',
      borderColor: 'border-green-300',
      nextLevel: 3, 
      nextLevelPoints: 500 
    }
    return { 
      level: 1, 
      name: 'Eco Beginner', 
      theme: 'Light green',
      color: 'from-green-300 to-green-400',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      nextLevel: 2, 
      nextLevelPoints: 100 
    }
  }

  // Badge definitions with unlock conditions
  const badgeDefinitions = [
    { 
      id: 1, 
      name: 'Seed Starter', 
      icon: '🌿', 
      description: 'File your 1st complaint',
      points: 5,
      checkEarned: (complaints, pts) => complaints >= 1
    },
    { 
      id: 2, 
      name: 'Eco Citizen', 
      icon: '🌱', 
      description: '5 complaints filed',
      points: 10,
      checkEarned: (complaints, pts) => complaints >= 5
    },
    { 
      id: 3, 
      name: 'Consistent Helper', 
      icon: '�', 
      description: '10+ complaints filed',
      points: 15,
      checkEarned: (complaints, pts) => complaints >= 10
    },
    { 
      id: 4, 
      name: 'Eco Circle', 
      icon: '🧍‍♀️', 
      description: 'Join a group cleanup event',
      points: 10,
      checkEarned: (complaints, pts) => false // Manual unlock by admin
    },
  ]

  useEffect(() => {
    fetchUserData()
  }, [user])

  const fetchUserData = async () => {
    if (!user) return

    try {
      // Fetch user points
      const { data: userProfile } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', user.id)
        .single()

      // Fetch user complaints count
      const { data: complaints } = await supabase
        .from('complaints')
        .select('id')
        .eq('user_id', user.id)

      const userPoints = userProfile?.total_points || 0
      const complaintsCount = complaints?.length || 0

      setPoints(userPoints)
      setTotalComplaints(complaintsCount)

      // Calculate earned badges
      const earned = badgeDefinitions.map(badge => ({
        ...badge,
        earned: badge.checkEarned(complaintsCount, userPoints)
      }))
      setEarnedBadges(earned)

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const levelInfo = getLevelInfo(points)

  if (loading) {
    return (
      <Layout role="citizen">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="citizen">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-700">Rewards & Achievements</h1>
          <p className="text-gray-600 mt-2">Track your progress and earn badges</p>
        </div>

        {/* Points Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="eco-gradient text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Star className="w-5 h-5" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{points}</div>
            </CardContent>
          </Card>

          <Card className={`${levelInfo.bgColor} ${levelInfo.borderColor} border-2`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${levelInfo.textColor}`}>
                <Trophy className="w-5 h-5" />
                Current Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${levelInfo.textColor}`}>
                Level {levelInfo.level}
              </div>
              <p className={`text-sm ${levelInfo.textColor} opacity-80 mt-1`}>
                {levelInfo.name}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <TrendingUp className="w-5 h-5" />
                Next Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {levelInfo.nextLevelPoints - points} points
              </div>
              <Progress value={(points / levelInfo.nextLevelPoints) * 100} className="mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-heading font-semibold mb-4">Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={badge.earned ? 'border-primary-300 bg-primary-50' : 'opacity-60'}>
                  <CardHeader>
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <CardTitle className="text-lg">{badge.name}</CardTitle>
                    <CardDescription>{badge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      {badge.earned ? (
                        <div className="flex items-center text-primary-600 text-sm font-medium">
                          <Award className="w-4 h-4 mr-1" />
                          Earned
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Locked</div>
                      )}
                      <div className="text-sm font-semibold text-green-600">
                        +{badge.points} pts
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Level Progression Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-heading font-semibold mb-4">Level Progression</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Level</th>
                      <th className="text-left py-3 px-4 font-semibold">Points Range</th>
                      <th className="text-left py-3 px-4 font-semibold">Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-green-50">
                      <td className="py-3 px-4 font-bold">🌱 Level 1</td>
                      <td className="py-3 px-4">0 – 99</td>
                      <td className="py-3 px-4 text-green-700 font-semibold">Eco Beginner</td>
                    </tr>
                    <tr className="border-b hover:bg-green-100">
                      <td className="py-3 px-4 font-bold">🌿 Level 2</td>
                      <td className="py-3 px-4">100 – 249</td>
                      <td className="py-3 px-4 text-green-800 font-semibold">Eco Learner</td>
                    </tr>
                    <tr className="border-b hover:bg-green-200">
                      <td className="py-3 px-4 font-bold">🌳 Level 3</td>
                      <td className="py-3 px-4">250 – 499</td>
                      <td className="py-3 px-4 text-green-900 font-semibold">Eco Guardian</td>
                    </tr>
                    <tr className="border-b hover:bg-blue-50">
                      <td className="py-3 px-4 font-bold">🌏 Level 4</td>
                      <td className="py-3 px-4">500 – 999</td>
                      <td className="py-3 px-4 text-blue-900 font-semibold">Eco Hero</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}
