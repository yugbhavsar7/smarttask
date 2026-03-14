import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Badge, Spinner, PageHeader, EmptyState, Modal } from '../../components/UI'

export default function CompanyQueries() {
  const [queries, setQueries] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)

  const fetch = () => {
    api.get('/queries/').then(({ data }) => setQueries(data.results || data))
      .catch(() => toast.error('Failed to load queries.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    try {
      await api.post('/queries/', { query_text: text })
      toast.success('Query submitted! Admin will respond soon.')
      setText('')
      setModal(false)
      fetch()
    } catch { toast.error('Failed to submit query.') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Queries"
        subtitle="Submit and track your queries to the admin team"
        action={
          <button onClick={() => setModal(true)} className="btn-primary" style={{ background: '#c2410c' }}>
            + New Query
          </button>
        }
      />

      {loading ? <Spinner /> : queries.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-400 text-sm mb-4">No queries yet. Submit your first query!</p>
          <button onClick={() => setModal(true)} className="btn-primary" style={{ background: '#c2410c' }}>
            + Submit Query
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {queries.map(q => (
            <div key={q.id} className="card cursor-pointer hover:border-slate-300 transition-all"
              onClick={() => setSelected(q)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 mb-1">{q.query_text}</p>
                  <p className="text-xs text-slate-400">{new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <Badge value={q.status} />
              </div>
              {q.response_text && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Admin Response:</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{q.response_text}</p>
                  {q.responded_by_name && (
                    <p className="text-xs text-slate-400 mt-1">— {q.responded_by_name}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Query Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setText('') }} title="Submit a Query">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Your Query</label>
            <textarea
              required value={text} onChange={e => setText(e.target.value)}
              rows={5} className="input-field resize-none"
              placeholder="Describe your query or concern in detail..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60"
              style={{ background: '#c2410c' }}>
              {saving ? 'Submitting...' : 'Submit Query'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Query detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Query Detail">
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Your Query</p>
              <p className="text-sm text-slate-800 leading-relaxed">{selected.query_text}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <Badge value={selected.status} />
            </div>
            {selected.response_text ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs font-medium text-emerald-700 mb-1">Admin Response</p>
                <p className="text-sm text-slate-700 leading-relaxed">{selected.response_text}</p>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-700">Awaiting admin response...</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
