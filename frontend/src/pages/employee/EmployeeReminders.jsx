import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Badge, Spinner, PageHeader, EmptyState, Modal } from '../../components/UI'

export default function EmployeeReminders() {
  const [reminders, setReminders] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ task: '', reminder_date: '', reminder_type: 'system' })
  const [saving, setSaving] = useState(false)

  const fetch = () => {
    Promise.all([api.get('/tasks/reminders/'), api.get('/tasks/')]).then(([r, t]) => {
      setReminders(r.data.results || r.data)
      setTasks(t.data.results || t.data)
    }).catch(() => toast.error('Failed to load.')).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleCreate = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/tasks/reminders/', form)
      toast.success('Reminder set!')
      setModal(false)
      setForm({ task: '', reminder_date: '', reminder_type: 'system' })
      fetch()
    } catch { toast.error('Failed to set reminder.') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminders"
        subtitle="Your upcoming task reminders"
        action={<button onClick={() => setModal(true)} className="btn-primary" style={{background:'#d97706'}}>+ Set Reminder</button>}
      />
      <div className="card p-0 overflow-hidden">
        {loading ? <Spinner /> : reminders.length === 0 ? <EmptyState message="No reminders set yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Task','Reminder Date','Type','Status'].map(h=><th key={h} className="text-left py-3 px-4 label">{h}</th>)}</tr>
              </thead>
              <tbody>
                {reminders.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-800">{r.task}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{new Date(r.reminder_date).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 capitalize text-slate-500 text-xs">{r.reminder_type}</td>
                    <td className="py-3 px-4"><Badge value={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Set Reminder">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Task</label>
            <select required value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))} className="input-field">
              <option value="">Select task</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.task_title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Reminder Date & Time</label>
            <input type="datetime-local" required value={form.reminder_date} onChange={e => setForm(f => ({ ...f, reminder_date: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
            <select value={form.reminder_type} onChange={e => setForm(f => ({ ...f, reminder_type: e.target.value }))} className="input-field">
              <option value="system">System</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Set Reminder'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
