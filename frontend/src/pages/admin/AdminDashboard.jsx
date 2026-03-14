import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { StatCard, Badge, ProgressBar, Spinner, PageHeader, EmptyState } from '../../components/UI'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats]     = useState(null)
  const [tasks, setTasks]     = useState([])
  const [queries, setQueries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, t, q] = await Promise.all([
          api.get('/auth/dashboard/stats/'),
          api.get('/tasks/?page_size=6'),
          api.get('/queries/?status=open&page_size=5'),
        ])
        setStats(s.data)
        setTasks(t.data.results || t.data)
        setQueries(q.data.results || q.data)
      } catch { /* handled by interceptor */ }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name} · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        action={
          <Link to="/admin/tasks" className="btn-primary text-sm px-4 py-2 whitespace-nowrap">+ Assign Task</Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Employees"    value={stats?.total_employees ?? 0} chip={`${stats?.total_employees ?? 0} active`} chipColor="blue" />
        <StatCard label="Active Tasks" value={stats?.active_tasks ?? 0}    chip={`${stats?.overdue_tasks ?? 0} overdue`} chipColor="red" />
        <StatCard label="Companies"    value={stats?.total_companies ?? 0} chipColor="amber" />
        <StatCard label="Open Queries" value={stats?.open_queries ?? 0}    chip="Need response" chipColor="amber" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Tasks — full width on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="section-title">Recent Tasks</h2>
            {/* FIX: Responsive "View All Tasks" button */}
            <Link
              to="/admin/tasks"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              View All Tasks →
            </Link>
          </div>

          {tasks.length === 0 ? <EmptyState message="No tasks yet." /> : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[380px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 label">Task</th>
                    <th className="text-left py-2 px-3 label hidden sm:table-cell">Employee</th>
                    <th className="text-left py-2 px-3 label">Status</th>
                    <th className="text-left py-2 px-3 label hidden md:table-cell">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-800 truncate max-w-[140px] sm:max-w-[200px]">{task.task_title}</p>
                        <p className="text-xs text-slate-400">{task.company_name}</p>
                      </td>
                      <td className="py-3 px-3 hidden sm:table-cell text-slate-600 text-xs">
                        {task.assigned_to_detail?.name || '—'}
                      </td>
                      <td className="py-3 px-3"><Badge value={task.status} /></td>
                      <td className="py-3 px-3 hidden md:table-cell w-28">
                        <ProgressBar percent={task.progress?.progress_percent || 0} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Progress overview */}
          <div className="card">
            <h2 className="section-title mb-4">Task Overview</h2>
            <div className="space-y-3">
              {[
                { label: 'Completed',   pct: stats ? Math.round((stats.completed_tasks  / Math.max(stats.active_tasks + stats.completed_tasks, 1)) * 100) : 0, color: 'bg-emerald-500' },
                { label: 'In Progress', pct: stats ? Math.round((stats.active_tasks     / Math.max(stats.active_tasks + stats.completed_tasks, 1)) * 100) : 0, color: 'bg-blue-500' },
                { label: 'Overdue',     pct: stats ? Math.round((stats.overdue_tasks    / Math.max(stats.active_tasks + stats.completed_tasks, 1)) * 100) : 0, color: 'bg-red-400' },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{label}</span><span>{pct}%</span></div>
                  <ProgressBar percent={pct} color={color} />
                </div>
              ))}
            </div>
          </div>

          {/* Open Queries */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="section-title">Open Queries</h2>
              <Link to="/admin/queries" className="text-xs text-blue-600 hover:underline whitespace-nowrap">View all</Link>
            </div>
            {queries.length === 0 ? <EmptyState message="No open queries." /> : (
              <div className="space-y-3">
                {queries.slice(0, 4).map(q => (
                  <div key={q.id} className="flex items-start justify-between gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{q.company_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{q.query_text}</p>
                    </div>
                    <Badge value={q.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
