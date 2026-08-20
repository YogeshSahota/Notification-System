import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'

const API_BASE = '/api'

interface AnalyticsSummary {
  total: number
  byStatus: Record<string, number>
  byChannel: Record<string, number>
  byPriority: Record<string, number>
  dlqCount: number
  recentHourCount: number
}

const statusColors: Record<string, string> = {
  DELIVERED: 'bg-emerald-500',
  FAILED: 'bg-red-500',
  PENDING: 'bg-yellow-500',
  PROCESSING: 'bg-blue-500',
  SKIPPED: 'bg-gray-400',
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/analytics/summary`)
      .then((r) => r.json())
      .then((r) => setData(r.data))
      .catch(console.error)
  }, [])

  if (!data) return <div className="text-gray-500">Loading...</div>

  const maxStatus = Math.max(...Object.values(data.byStatus), 1)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6" /> Analytics
      </h2>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-indigo-50 rounded-xl p-5">
          <p className="text-sm text-indigo-600 font-medium">Total</p>
          <p className="text-2xl font-bold text-indigo-700">{data.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-5">
          <p className="text-sm text-green-600 font-medium">Last Hour</p>
          <p className="text-2xl font-bold text-green-700">{data.recentHourCount}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-5">
          <p className="text-sm text-orange-600 font-medium">DLQ</p>
          <p className="text-2xl font-bold text-orange-700">{data.dlqCount}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-5">
          <p className="text-sm text-purple-600 font-medium">Delivery Rate</p>
          <p className="text-2xl font-bold text-purple-700">
            {data.total > 0 ? Math.round(((data.byStatus.DELIVERED ?? 0) / data.total) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">By Status</h3>
          <div className="space-y-4">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{status}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${statusColors[status] || 'bg-gray-300'}`}
                    style={{ width: `${(count / maxStatus) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">By Channel</h3>
          <div className="space-y-4">
            {Object.entries(data.byChannel).map(([channel, count]) => (
              <div key={channel} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 capitalize">{channel}</span>
                <span className="text-lg font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
