import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Badge, ProgressBar, Spinner, PageHeader, EmptyState } from '../../components/UI'

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const params = filter ? `?status=${filter}` : ''
    api.get(`/tasks/${params}`)
      .then(({ data }) => setTasks(data.results || data))
      .catch(() => toast.error('Failed to load tasks.'))
      .finally(() => setLoading(false))
  }, [filter])

  const priorityDot = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' }

  return (
    <div className="space-y-6">
      <PageHeader title="My Tasks" subtitle="All tasks assigned to you" />

      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'in_progress', 'under_review', 'completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${filter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            {s === '' ? 'All' : s === 'in_progress' ? 'In Progress' : s === 'under_review' ? 'Under Review' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : tasks.length === 0 ? <EmptyState message="No tasks found." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map(task => (
            <Link to={`/employee/tasks/${task.id}`} key={task.id}
              className="card hover:shadow-md hover:border-slate-300 transition-all cursor-pointer block">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[task.priority]}`} />
                  <h3 className="font-medium text-slate-800 text-sm leading-snug">{task.task_title}</h3>
                </div>
                <Badge value={task.priority} />
              </div>
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.task_description}</p>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span>{task.company_name || 'Internal'}</span>
                <span className="font-medium text-slate-600">Due {task.deadline}</span>
              </div>
              <ProgressBar percent={task.progress?.progress_percent || 0} />
              <div className="flex items-center justify-between mt-3">
                <Badge value={task.status} />
                <span className="text-xs text-blue-600 font-medium">Update →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
