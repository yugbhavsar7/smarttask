import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Spinner, PageHeader, EmptyState, Modal } from '../../components/UI'

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [tasks, setTasks] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ task: '', company: '', report_content: '' })
  const [saving, setSaving] = useState(false)

  const fetchReports = async () => {
    try {
      const { data } = await api.get('/tasks/reports/')
      setReports(data.results || data)
    } catch { toast.error('Failed to load reports.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchReports()
    Promise.all([api.get('/tasks/'), api.get('/companies/')]).then(([t, c]) => {
      setTasks(t.data.results || t.data)
      setCompanies(c.data.results || c.data)
    }).catch(() => {})
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/tasks/reports/', form)
      toast.success('Report created!')
      setModal(false)
      setForm({ task: '', company: '', report_content: '' })
      fetchReports()
    } catch { toast.error('Failed to create report.') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate and manage task reports for clients"
        action={<button onClick={() => setModal(true)} className="btn-primary">+ New Report</button>}
      />
      <div className="card p-0 overflow-hidden">
        {loading ? <Spinner /> : reports.length === 0 ? <EmptyState message="No reports generated yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Task','Company','Content','Generated At'].map(h=><th key={h} className="text-left py-3 px-4 label">{h}</th>)}</tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-800">{r.task_title}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{r.company_name}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate">{r.report_content}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">{new Date(r.generated_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Generate Report">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Task</label>
            <select required value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))} className="input-field">
              <option value="">Select task</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.task_title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Company</label>
            <select required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="input-field">
              <option value="">Select company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Report Content</label>
            <textarea required value={form.report_content} onChange={e => setForm(f => ({ ...f, report_content: e.target.value }))} rows={4} className="input-field resize-none" placeholder="Report details..." />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Generate'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
