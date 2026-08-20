import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'

const API_BASE = '/api'

interface Template {
  id: string
  name: string
  channel: string
  subject: string | null
  body: string
  createdAt: string
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState({ name: '', channel: 'email', subject: '', body: '' })
  const [error, setError] = useState('')

  const fetchTemplates = () => {
    fetch(`${API_BASE}/templates`)
      .then((r) => r.json())
      .then((r) => setTemplates(r.data))
      .catch(console.error)
  }

  useEffect(() => { fetchTemplates() }, [])

  const resetForm = () => {
    setForm({ name: '', channel: 'email', subject: '', body: '' })
    setEditing(null)
    setShowForm(false)
    setError('')
  }

  const handleEdit = (t: Template) => {
    setEditing(t)
    setForm({ name: t.name, channel: t.channel, subject: t.subject || '', body: t.body })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const payload: Record<string, unknown> = {
      name: form.name,
      channel: form.channel,
      body: form.body,
    }
    if (form.channel === 'email' && form.subject) payload.subject = form.subject

    try {
      const res = await fetch(
        editing ? `${API_BASE}/templates/${editing.id}` : `${API_BASE}/templates`,
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed')
        return
      }
      resetForm()
      fetchTemplates()
    } catch {
      setError('Request failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    await fetch(`${API_BASE}/templates/${id}`, { method: 'DELETE' })
    fetchTemplates()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Templates</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 max-w-2xl space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
            <select
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          {form.channel === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="Hello {{name}}!"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
              placeholder="Hi {{name}}, your code is {{otp}}."
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              {editing ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {templates.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{t.channel}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(t)} className="text-gray-400 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {t.subject && <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Subject:</span> {t.subject}</p>}
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.body}</p>
          </div>
        ))}
        {templates.length === 0 && <p className="text-gray-500 text-sm">No templates yet</p>}
      </div>
    </div>
  )
}
