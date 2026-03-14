import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Badge, ProgressBar, Spinner, PageHeader, EmptyState, Modal } from '../../components/UI'
import { RiGithubLine, RiExternalLinkLine, RiCheckLine, RiCloseLine } from 'react-icons/ri'

export default function CompanyProjects() {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')

  // Review modal
  const [reviewTask, setReviewTask]       = useState(null)
  const [rejection, setRejection]         = useState('')
  const [reviewing, setReviewing]         = useState(false)

  const fetch = (f = filter) => {
    const params = f ? `?status=${f}` : ''
    api.get(`/tasks/${params}`)
      .then(({ data }) => setTasks(data.results || data))
      .catch(() => toast.error('Failed to load projects.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [filter])

  const handleReview = async (action) => {
    if (action === 'reject' && !rejection.trim()) {
      toast.error('Please provide a rejection reason.')
      return
    }
    setReviewing(true)
    try {
      await api.post(`/tasks/${reviewTask.id}/review/`, {
        action,
        rejection_reason: action === 'reject' ? rejection : '',
      })
      toast.success(`Task ${action === 'accept' ? 'accepted ✅' : 'rejected ❌'}!`)
      setReviewTask(null)
      setRejection('')
      setLoading(true)
      fetch(filter)
    } catch (err) {
      toast.error(err.response?.data?.rejection_reason?.[0] || 'Failed to submit review.')
    } finally { setReviewing(false) }
  }

  const statusSteps = ['pending', 'in_progress', 'under_review', 'accepted']

  const filters = [
    { val: '',             label: 'All' },
    { val: 'pending',      label: 'Pending' },
    { val: 'in_progress',  label: 'In Progress' },
    { val: 'under_review', label: 'Under Review' },
    { val: 'accepted',     label: 'Accepted' },
    { val: 'rejected',     label: 'Rejected' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="My Projects" subtitle="Track all your project assignments and deliveries" />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(({ val, label }) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
              filter === val
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading
        ? <Spinner />
        : tasks.length === 0
          ? <EmptyState message="No projects found." />
          : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tasks.map(task => (
            <div key={task.id} className="card hover:shadow-md hover:border-slate-300 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{task.task_title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{task.assigned_to_detail?.name || 'Unassigned'}</p>
                </div>
                <Badge value={task.priority} />
              </div>

              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.task_description}</p>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Progress</span>
                  <span className="font-medium text-slate-700">{task.progress?.progress_percent || 0}%</span>
                </div>
                <ProgressBar percent={task.progress?.progress_percent || 0} />
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-1 mb-4">
                {statusSteps.map((step, i) => {
                  const current = statusSteps.indexOf(task.status)
                  const done    = i <= current
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full h-1 rounded-full ${done ? 'bg-orange-400' : 'bg-slate-200'}`} />
                      <span className={`text-[10px] hidden sm:block ${done ? 'text-orange-600 font-medium' : 'text-slate-400'}`}>
                        {step === 'in_progress' ? 'Progress' : step === 'under_review' ? 'Review' : step.charAt(0).toUpperCase() + step.slice(1)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* GitHub link */}
              {task.github_repo_url && (
                <a href={task.github_repo_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-3 break-all">
                  <RiGithubLine size={13} />
                  {task.github_repo_url}
                  <RiExternalLinkLine size={11} />
                </a>
              )}

              {/* Rejection reason */}
              {task.status === 'rejected' && task.rejection_reason && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                  <span className="font-semibold">Rejection reason: </span>{task.rejection_reason}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3 flex-wrap">
                <Badge value={task.status} />
                <span className="text-xs text-slate-400">Due <span className="font-medium text-slate-600">{task.deadline}</span></span>
              </div>

              {/* Review buttons — only when under_review */}
              {task.status === 'under_review' && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-orange-600 font-medium mb-2">⏳ Employee submitted — review required</p>
                  <button
                    onClick={() => { setReviewTask(task); setRejection('') }}
                    className="w-full text-sm font-medium py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                    Review Submission
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal open={!!reviewTask} onClose={() => { setReviewTask(null); setRejection('') }} title="Review Task Submission">
        {reviewTask && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="font-semibold text-slate-800 text-sm">{reviewTask.task_title}</p>
              <p className="text-xs text-slate-500 mt-1">By {reviewTask.assigned_to_detail?.name}</p>
            </div>

            {/* GitHub link in modal */}
            {reviewTask.github_repo_url ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1.5">
                  <RiGithubLine size={13} /> GitHub Repository Submitted
                </p>
                <a href={reviewTask.github_repo_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-700 hover:underline break-all flex items-center gap-1.5">
                  <RiExternalLinkLine size={13} />
                  {reviewTask.github_repo_url}
                </a>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                ⚠️ No GitHub repository link was submitted.
              </div>
            )}

            {/* Rejection reason */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Rejection Reason <span className="text-slate-400">(required only if rejecting)</span>
              </label>
              <textarea value={rejection} onChange={e => setRejection(e.target.value)}
                rows={3} className="input-field resize-none"
                placeholder="Explain what needs to be improved..." />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={() => handleReview('accept')} disabled={reviewing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                <RiCheckLine size={16} /> Accept Task
              </button>
              <button onClick={() => handleReview('reject')} disabled={reviewing || !rejection.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                <RiCloseLine size={16} /> Reject Task
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
