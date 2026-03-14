import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Badge, ProgressBar, Spinner, PageHeader, EmptyState, Modal } from '../../components/UI'

const EMPTY_FORM = {
  task_title: '', task_description: '', priority: 'medium',
  deadline: '', assigned_to: '', company: '', status: 'pending'
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState({ status: '', priority: '' })

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.status) params.append('status', filter.status)
      if (filter.priority) params.append('priority', filter.priority)
      const { data } = await api.get(`/tasks/?${params}`)
      setTasks(data.results || data)
    } catch { toast.error('Failed to load tasks.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [e, c] = await Promise.all([
          api.get('/auth/users/?role=employee'),
          api.get('/companies/'),
        ])
        setEmployees(e.data.results || e.data)
        setCompanies(c.data.results || c.data)
      } catch {}
    }
    fetchInit()
  }, [])

  useEffect(() => { fetchTasks() }, [filter])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/tasks/', form)
      toast.success('Task assigned successfully!')
      setModal(false)
      setForm(EMPTY_FORM)
      fetchTasks()
    } catch (err) {
      const errors = err.response?.data
      if (errors) Object.values(errors).flat().forEach(m => toast.error(m))
      else toast.error('Failed to create task.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${id}/`)
      toast.success('Task deleted.')
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch { toast.error('Failed to delete task.') }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Management"
        subtitle="Assign and manage all employee tasks"
        action={<button onClick={() => setModal(true)} className="btn-primary">+ Assign Task</button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} className="input-field !w-auto">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="under_review">Under Review</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))} className="input-field !w-auto">
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? <Spinner /> : tasks.length === 0 ? <EmptyState message="No tasks found." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Task', 'Assigned To', 'Company', 'Priority', 'Deadline', 'Status', 'Progress', ''].map(h => (
                    <th key={h} className="text-left py-3 px-4 label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800 max-w-[180px] truncate">{task.task_title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-[180px] truncate">{task.task_description}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{task.assigned_to_detail?.name || '—'}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{task.company_name || '—'}</td>
                    <td className="py-3 px-4"><Badge value={task.priority} /></td>
                    <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">{task.deadline}</td>
                    <td className="py-3 px-4"><Badge value={task.status} /></td>
                    <td className="py-3 px-4 w-32"><ProgressBar percent={task.progress?.progress_percent || 0} /></td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleDelete(task.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setForm(EMPTY_FORM) }} title="Assign New Task">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Task Title</label>
            <input name="task_title" required value={form.task_title} onChange={handleChange} className="input-field" placeholder="e.g. API Integration" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
            <textarea name="task_description" required value={form.task_description} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="Task details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="input-field">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Deadline</label>
              <input name="deadline" type="date" required value={form.deadline} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Assign to Employee</label>
              <select name="assigned_to" required value={form.assigned_to} onChange={handleChange} className="input-field">
                <option value="">Select employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Company</label>
              <select name="company" value={form.company} onChange={handleChange} className="input-field">
                <option value="">Select company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Assign Task'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
