import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ZoneManagement() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchZones = async () => {
      try {
        // Fetch zones with complaint counts
        const { data: zonesData, error } = await supabase
          .from('zones')
          .select('*')
          .order('name')

        if (error) throw error

        // For each zone, count complaints
        const zonesWithStats = await Promise.all(
          (zonesData || []).map(async (zone) => {
            const { count } = await supabase
              .from('complaints')
              .select('*', { count: 'exact', head: true })
              .eq('zone_id', zone.id)

            return {
              ...zone,
              complaintCount: count || 0
            }
          })
        )

        setZones(zonesWithStats)
      } catch (error) {
        console.error('Error fetching zones:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchZones()
  }, [])

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary-700">Zone Management</h1>
          <p className="text-gray-600 mt-2">Manage city zones and coverage areas</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-primary"></div>
          </div>
        ) : zones.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-gray-500">
                <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No zones configured yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => (
              <Card key={zone.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-eco-primary" />
                    {zone.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Complaints</span>
                      <Badge variant="secondary">{zone.complaintCount}</Badge>
                    </div>
                    {zone.description && (
                      <p className="text-sm text-gray-500">{zone.description}</p>
                    )}
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
