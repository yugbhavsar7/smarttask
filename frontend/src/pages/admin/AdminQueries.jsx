// AdminQueries.jsx
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Badge, Spinner, PageHeader, EmptyState, Modal } from '../../components/UI'

export function AdminQueries() {
  const [queries, setQueries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [response, setResponse] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch = async () => {
    try {
      const { data } = await api.get('/queries/')
      setQueries(data.results || data)
    } catch { toast.error('Failed to load queries.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const handleRespond = async () => {
    if (!response.trim()) { toast.error('Enter a response.'); return }
    setSaving(true)
    try {
      await api.post(`/queries/${selected.id}/respond/`, { response_text: response, status: 'closed' })
      toast.success('Response sent!')
      setSelected(null)
      setResponse('')
      fetch()
    } catch { toast.error('Failed to respond.') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Client Queries" subtitle="Respond to queries from client companies" />
      <div className="card p-0 overflow-hidden">
        {loading ? <Spinner /> : queries.length === 0 ? <EmptyState message="No queries found." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Company','Query','Status','Date','Action'].map(h=><th key={h} className="text-left py-3 px-4 label">{h}</th>)}</tr>
              </thead>
              <tbody>
                {queries.map(q => (
                  <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-800">{q.company_name}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{q.query_text}</td>
                    <td className="py-3 px-4"><Badge value={q.status} /></td>
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">{new Date(q.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4">
                      {q.status === 'open' && (
                        <button onClick={() => { setSelected(q); setResponse('') }} className="text-xs text-blue-600 hover:underline">Respond</button>
                      )}
                      {q.status === 'closed' && <span className="text-xs text-slate-400">Responded</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Respond to ${selected?.company_name}`}>
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">{selected?.query_text}</div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Your Response</label>
            <textarea value={response} onChange={e => setResponse(e.target.value)} rows={4} className="input-field resize-none" placeholder="Type your response..." />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setSelected(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleRespond} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Sending...' : 'Send Response'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminQueries
