import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { StatCard, Badge, ProgressBar, Spinner, PageHeader, EmptyState } from '../../components/UI'
import { useAuth } from '../../context/AuthContext'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/tasks/employee/dashboard/'),
      api.get('/tasks/?page_size=5'),
    ]).then(([s, t]) => {
      setStats(s.data)
      setTasks(t.data.results || t.data)
    }).catch(() => toast.error('Failed to load dashboard.'))
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const priorityBar = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Workspace"
        subtitle={`${user?.name} · ${user?.skill_set || 'Employee'}`}
        action={<Link to="/employee/tasks" className="btn-primary" style={{background:'#15803d'}}>View All Tasks</Link>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Tasks"    value={stats?.total_tasks ?? 0}  chip={`${stats?.overdue ?? 0} overdue`}      chipColor={stats?.overdue > 0 ? 'red' : 'green'} />
        <StatCard label="In Progress" value={stats?.in_progress ?? 0}  chipColor="blue" />
        <StatCard label="Completed"   value={stats?.completed ?? 0}    chipColor="green" />
        <StatCard label="Reminders"   value={stats?.reminders_today ?? 0} chip="today" chipColor="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Active Tasks</h2>
            <Link to="/employee/tasks" className="text-xs text-blue-600 hover:underline">All tasks</Link>
          </div>
          {tasks.length === 0 ? <EmptyState message="No tasks assigned yet." /> : (
            <div className="space-y-3">
              {tasks.slice(0, 5).map(task => (
                <Link to={`/employee/tasks/${task.id}`} key={task.id}
                  className="flex gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all block">
                  <div className={`w-1 rounded-full shrink-0 ${priorityBar[task.priority] || 'bg-slate-300'}`} style={{minHeight:52}} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-slate-800 text-sm truncate">{task.task_title}</p>
                      <Badge value={task.priority} />
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{task.company_name || 'Internal'} · Due {task.deadline}</p>
                    <ProgressBar percent={task.progress?.progress_percent || 0} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="section-title mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/employee/tasks', label: 'My Tasks', desc: 'View & update tasks', color: 'bg-blue-50 border-blue-100 text-blue-700' },
              { to: '/employee/reminders', label: 'Reminders', desc: 'Upcoming deadlines', color: 'bg-amber-50 border-amber-100 text-amber-700' },
              { to: '/employee/ai-chat', label: 'AI Assistant', desc: 'Ask anything', color: 'bg-purple-50 border-purple-100 text-purple-700' },
              { to: '/employee/tasks', label: 'Progress', desc: 'Update progress', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
            ].map(({ to, label, desc, color }) => (
              <Link key={to+label} to={to} className={`p-4 rounded-xl border ${color} hover:opacity-80 transition-opacity`}>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs mt-0.5 opacity-70">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
