import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'

const API_BASE = '/api'

interface Notification {
  id: string
  recipientId: string
  channel: string
  status: string
  priority: string
  retryCount: number
  createdAt: string
  recipient?: { email: string; name: string | null }
  template?: { name: string }
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  SKIPPED: 'bg-gray-100 text-gray-800',
}

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/notifications${filter ? `?status=${filter}` : ''}`)
      .then((r) => r.json())
      .then((r) => setNotifications(r.data))
      .catch(console.error)
  }, [filter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="SKIPPED">Skipped</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Recipient</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Channel</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Template</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Retries</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <tr key={n.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{n.recipient?.name || n.recipient?.email || n.recipientId}</td>
                <td className="px-4 py-3 capitalize">{n.channel}</td>
                <td className="px-4 py-3">{n.template?.name || n.id.slice(0, 8)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${n.priority === 'HIGH' ? 'text-red-600' : 'text-gray-500'}`}>
                    {n.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[n.status] || 'bg-gray-100 text-gray-800'}`}>
                    {n.status}
                  </span>
                </td>
                <td className="px-4 py-3">{n.retryCount}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(n.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Link to={`/notifications/${n.id}`} className="text-indigo-600 hover:text-indigo-800">
                    <Eye className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {notifications.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No notifications found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
