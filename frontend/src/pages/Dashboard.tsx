import { useEffect, useState } from 'react'

const API_BASE = '/api'

interface AnalyticsSummary {
  total: number
  byStatus: Record<string, number>
  byChannel: Record<string, number>
  byPriority: Record<string, number>
  dlqCount: number
  recentHourCount: number
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/analytics/summary`)
      .then((r) => r.json())
      .then((r) => setAnalytics(r.data))
      .catch(console.error)
  }, [])

  if (!analytics) {
    return <div className="text-gray-500">Loading...</div>
  }

  const cards = [
    { label: 'Total Notifications', value: analytics.total, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Last Hour', value: analytics.recentHourCount, color: 'bg-green-50 text-green-700' },
    { label: 'Delivered', value: analytics.byStatus.DELIVERED ?? 0, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Failed', value: analytics.byStatus.FAILED ?? 0, color: 'bg-red-50 text-red-700' },
    { label: 'Pending', value: (analytics.byStatus.PENDING ?? 0) + (analytics.byStatus.PROCESSING ?? 0), color: 'bg-yellow-50 text-yellow-700' },
    { label: 'DLQ', value: analytics.dlqCount, color: 'bg-orange-50 text-orange-700' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, color }) => (
          <div key={label} className={`${color} rounded-xl p-6`}>
            <p className="text-sm font-medium opacity-80">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">By Channel</h3>
          <div className="space-y-3">
            {Object.entries(analytics.byChannel).map(([channel, count]) => (
              <div key={channel} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{channel}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">By Priority</h3>
          <div className="space-y-3">
            {Object.entries(analytics.byPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{priority}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
