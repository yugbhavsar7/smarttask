import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { StatCard, Badge, ProgressBar, Spinner, PageHeader, EmptyState, Modal } from '../../components/UI'
import { useAuth } from '../../context/AuthContext'

export default function CompanyDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/companies/dashboard/'), api.get('/tasks/')]).then(([s, t]) => {
      setStats(s.data)
      setTasks(t.data.results || t.data)
    }).catch(() => toast.error('Failed to load dashboard.')).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <PageHeader title="Client Dashboard" subtitle={user?.name} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Projects"   value={stats?.active_projects ?? 0}   chipColor="blue" />
        <StatCard label="Completed"          value={stats?.completed_projects ?? 0} chipColor="green" />
        <StatCard label="Pending Requests"   value={stats?.pending_requests ?? 0}   chipColor="amber" />
        <StatCard label="Open Queries"       value={stats?.open_queries ?? 0}       chipColor="red" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">My Projects</h2>
        </div>
        {tasks.length === 0 ? <EmptyState message="No projects yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 label">Project</th>
                  <th className="text-left py-2 px-3 label">Assigned To</th>
                  <th className="text-left py-2 px-3 label">Priority</th>
                  <th className="text-left py-2 px-3 label">Status</th>
                  <th className="text-left py-2 px-3 label">Progress</th>
                  <th className="text-left py-2 px-3 label">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-medium text-slate-800">{task.task_title}</td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{task.assigned_to_detail?.name || '—'}</td>
                    <td className="py-3 px-3"><Badge value={task.priority} /></td>
                    <td className="py-3 px-3"><Badge value={task.status} /></td>
                    <td className="py-3 px-3 w-36"><ProgressBar percent={task.progress?.progress_percent || 0} /></td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{task.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
