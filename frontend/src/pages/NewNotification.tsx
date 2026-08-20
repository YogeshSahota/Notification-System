import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send } from 'lucide-react'

const API_BASE = '/api'

interface Recipient { id: string; email: string; name: string | null }
interface Template { id: string; name: string; channel: string }

export default function NewNotification() {
  const navigate = useNavigate()
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [form, setForm] = useState({
    recipientId: '',
    channel: 'email',
    templateId: '',
    priority: 'NORMAL',
    variables: '{}',
    sendAt: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(false)

  const fetchData = async () => {
    if (fetched) return
    try {
      const [rRes, tRes] = await Promise.all([
        fetch(`${API_BASE}/recipients`).then((r) => r.json()),
        fetch(`${API_BASE}/templates`).then((r) => r.json()),
      ])
      setRecipients(rRes.data)
      setTemplates(tRes.data)
      setFetched(true)
    } catch {
      setError('Failed to load data')
    }
  }

  useState(() => { fetchData() })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const body: Record<string, unknown> = {
        recipientId: form.recipientId,
        channel: form.channel,
        templateId: form.templateId,
        priority: form.priority,
        variables: JSON.parse(form.variables),
      }
      if (form.sendAt) body.sendAt = new Date(form.sendAt).toISOString()

      const res = await fetch(`${API_BASE}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create notification')
        return
      }

      navigate(`/notifications`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid input')
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter((t) => t.channel === form.channel)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Notification</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl space-y-5">
        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
          <select
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value, templateId: '' })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
          <select
            value={form.recipientId}
            onChange={(e) => setForm({ ...form, recipientId: e.target.value })}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select recipient</option>
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>{r.name || r.email} ({r.email})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
          <select
            value={form.templateId}
            onChange={(e) => setForm({ ...form, templateId: e.target.value })}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select template</option>
            {filteredTemplates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variables (JSON)</label>
          <textarea
            value={form.variables}
            onChange={(e) => setForm({ ...form, variables: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder='{"name": "John", "otp": "1234"}'
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (optional)</label>
          <input
            type="datetime-local"
            value={form.sendAt}
            onChange={(e) => setForm({ ...form, sendAt: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  )
}
