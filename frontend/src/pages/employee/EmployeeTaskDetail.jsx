import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Badge, ProgressBar, Spinner } from '../../components/UI'
import { RiGithubLine, RiExternalLinkLine } from 'react-icons/ri'

export default function EmployeeTaskDetail() {
  const { id } = useParams()
  const [task, setTask]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [notes, setNotes]     = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get(`/tasks/${id}/`).then(({ data }) => {
      setTask(data)
      setProgress(data.progress?.progress_percent || 0)
      setNotes(data.progress?.notes || '')
      setGithubUrl(data.github_repo_url || '')
    }).catch(() => toast.error('Task not found.')).finally(() => setLoading(false))
  }, [id])

  const handleUpdate = async () => {
    if (!githubUrl.trim()) {
      toast.error('Please provide your GitHub repository link.')
      return
    }
    if (progress === 100 && !githubUrl.trim()) {
      toast.error('Please provide your GitHub repository link before marking as complete.')
      return
    }
    setSaving(true)
    try {
      const payload = { progress_percent: progress, notes, github_repo_url: githubUrl }
      await api.patch(`/tasks/${id}/progress/`, payload)
      toast.success(progress === 100 ? 'Task submitted for review!' : 'Progress updated!')
      setTask(prev => ({
        ...prev,
        status: progress === 100 ? 'under_review' : prev.status,
        github_repo_url: githubUrl,
        progress: { ...prev.progress, progress_percent: progress, notes },
      }))
    } catch { toast.error('Failed to update progress.') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />
  if (!task)   return <div className="text-center py-20 text-slate-400">Task not found.</div>

  const priorityColors = {
    high:   'border-red-300 bg-red-50',
    medium: 'border-amber-300 bg-amber-50',
    low:    'border-green-300 bg-green-50',
  }

  const isLocked = ['under_review', 'accepted', 'rejected', 'completed'].includes(task.status)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link to="/employee/tasks" className="hover:text-blue-600 transition-colors">My Tasks</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium truncate">{task.task_title}</span>
      </div>

      {/* Task info card */}
      <div className={`card border-l-4 ${priorityColors[task.priority] || ''}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{task.task_title}</h1>
            <p className="text-sm text-slate-500 mt-1">{task.company_name || 'Internal Project'}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge value={task.priority} />
            <Badge value={task.status} />
          </div>
        </div>
        <p className="text-sm text-slate-600 mt-4 leading-relaxed">{task.task_description}</p>
        <div className="flex flex-wrap gap-6 mt-4 text-sm text-slate-500">
          <div><span className="label block mb-0.5">Deadline</span>{task.deadline}</div>
          <div><span className="label block mb-0.5">Created</span>{new Date(task.created_at).toLocaleDateString('en-IN')}</div>
        </div>

        {/* Rejection feedback */}
        {task.status === 'rejected' && task.rejection_reason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs font-semibold text-red-700 mb-1">❌ Rejection Reason</p>
            <p className="text-sm text-red-700">{task.rejection_reason}</p>
          </div>
        )}

        {/* Accepted message */}
        {task.status === 'accepted' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm font-semibold text-green-700">✅ Task accepted by the company!</p>
          </div>
        )}
      </div>

      {/* GitHub repo (read-only if submitted) */}
      {task.github_repo_url && (
        <div className="card">
          <h2 className="section-title mb-3 flex items-center gap-2">
            <RiGithubLine size={16} /> GitHub Repository
          </h2>
          <a href={task.github_repo_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline text-sm break-all">
            <RiExternalLinkLine size={14} />
            {task.github_repo_url}
          </a>
        </div>
      )}

      {/* Progress update — locked when under review / accepted */}
      <div className="card">
        <h2 className="section-title mb-4">Update Progress</h2>

        {isLocked ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">
              {task.status === 'under_review'
                ? '⏳ Task is under review by the company.'
                : task.status === 'accepted'
                ? '✅ Task has been accepted. Well done!'
                : task.status === 'rejected'
                ? '❌ Task was rejected. Contact your admin for next steps.'
                : 'Task is complete.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Slider */}
            <div>
              <div className="flex justify-between text-sm text-slate-600 mb-2">
                <span>Completion</span>
                <span className="font-semibold text-slate-900">{progress}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={progress}
                onChange={e => setProgress(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer" />
              <ProgressBar percent={progress} />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Progress Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                rows={3} className="input-field resize-none"
                placeholder="Describe what you've done so far..." />
            </div>

            {/* GitHub URL — always required */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                <RiGithubLine size={13} />
                GitHub Repository URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url" required value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourname/your-repo"
                className={`input-field ${!githubUrl ? 'border-red-300 focus:border-red-400' : ''}`}
              />
              {!githubUrl && (
                <p className="text-xs text-red-500 mt-1">GitHub repository link is required.</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 items-center">
              <button onClick={handleUpdate} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : progress === 100 ? 'Submit for Review' : 'Update Progress'}
              </button>
              <Link to="/employee/tasks" className="btn-ghost">Back to Tasks</Link>
            </div>

            {progress === 100 && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                🎉 Great work! Submitting at 100% will send this task for company review. Make sure your GitHub link is correct.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}