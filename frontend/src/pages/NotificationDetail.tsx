import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const API_BASE = '/api'

interface Notification {
  id: string
  recipientId: string
  channel: string
  templateId: string
  variables: Record<string, string>
  status: string
  priority: string
  sendAt: string | null
  retryCount: number
  failureReason: string | null
  idempotencyKey: string | null
  createdAt: string
  updatedAt: string
  recipient?: { email: string; name: string | null; phone: string | null }
  template?: { name: string; subject: string | null; body: string }
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  SKIPPED: 'bg-gray-100 text-gray-800',
}

export default function NotificationDetail() {
  const { id } = useParams<{ id: string }>()
  const [notification, setNotification] = useState<Notification | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`${API_BASE}/notifications/${id}`)
      .then((r) => r.json())
      .then((r) => setNotification(r.data))
      .catch(console.error)
  }, [id])

  if (!notification) {
    return <div className="text-gray-500">Loading...</div>
  }

  return (
    <div>
      <Link to="/notifications" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to list
      </Link>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Detail</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[notification.status] || 'bg-gray-100 text-gray-800'}`}>
            {notification.status}
          </span>
          <span className={`text-sm font-medium ${notification.priority === 'HIGH' ? 'text-red-600' : 'text-gray-500'}`}>
            {notification.priority}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Recipient</h4>
            <p className="text-sm text-gray-900">{notification.recipient?.name || 'N/A'}</p>
            <p className="text-sm text-gray-600">{notification.recipient?.email}</p>
            {notification.recipient?.phone && <p className="text-sm text-gray-600">{notification.recipient.phone}</p>}
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Channel</h4>
            <p className="text-sm text-gray-900 capitalize">{notification.channel}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Template</h4>
            <p className="text-sm text-gray-900">{notification.template?.name || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Retry Count</h4>
            <p className="text-sm text-gray-900">{notification.retryCount}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Scheduled At</h4>
            <p className="text-sm text-gray-900">{notification.sendAt ? new Date(notification.sendAt).toLocaleString() : 'Immediate'}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Idempotency Key</h4>
            <p className="text-sm text-gray-900 font-mono">{notification.idempotencyKey || 'N/A'}</p>
          </div>
        </div>

        {notification.failureReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-1">Failure Reason</h4>
            <p className="text-sm text-red-700">{notification.failureReason}</p>
          </div>
        )}

        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Variables</h4>
          <pre className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-800">
            {JSON.stringify(notification.variables, null, 2)}
          </pre>
        </div>

        <div className="grid grid-cols-2 gap-6 text-xs text-gray-500">
          <div>Created: {new Date(notification.createdAt).toLocaleString()}</div>
          <div>Updated: {new Date(notification.updatedAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}
