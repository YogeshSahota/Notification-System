import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'

const API_BASE = '/api'

interface Recipient {
  id: string
  email: string
  phone: string | null
  name: string | null
  createdAt: string
}

export default function RecipientList() {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Recipient | null>(null)
  const [form, setForm] = useState({ email: '', phone: '', name: '' })
  const [error, setError] = useState('')

  const fetchRecipients = () => {
    fetch(`${API_BASE}/recipients`)
      .then((r) => r.json())
      .then((r) => setRecipients(r.data))
      .catch(console.error)
  }

  useEffect(() => { fetchRecipients() }, [])

  const resetForm = () => {
    setForm({ email: '', phone: '', name: '' })
    setEditing(null)
    setShowForm(false)
    setError('')
  }

  const handleEdit = (r: Recipient) => {
    setEditing(r)
    setForm({ email: r.email, phone: r.phone || '', name: r.name || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const payload: Record<string, unknown> = { email: form.email }
    if (form.name) payload.name = form.name
    if (form.phone) payload.phone = form.phone

    try {
      const res = await fetch(
        editing ? `${API_BASE}/recipients/${editing.id}` : `${API_BASE}/recipients`,
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
      fetchRecipients()
    } catch {
      setError('Request failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recipient?')) return
    await fetch(`${API_BASE}/recipients/${id}`, { method: 'DELETE' })
    fetchRecipients()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recipients</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Add Recipient
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 max-w-lg space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recipients.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{r.name || '—'}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.phone || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(r)} className="text-gray-400 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {recipients.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No recipients yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
