// ── StatCard ──────────────────────────────────────────────
export function StatCard({ label, value, chip, chipColor = 'blue' }) {
  const colors = {
    blue:  'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red:   'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="stat-card">
      <p className="label">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {chip && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${colors[chipColor]}`}>
          {chip}
        </span>
      )}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────
export function Badge({ value }) {
  const map = {
    // priority
    high:   'badge-high', medium: 'badge-medium', low: 'badge-low',
    // task status
    pending:      'badge-pending',
    in_progress:  'badge-in_progress',
    under_review: 'badge-under_review',
    completed:    'badge-completed',
    accepted:     'badge-completed',
    rejected:     'badge-rejected',
    // query status
    open: 'badge-open', closed: 'badge-closed',
    // user status
    active: 'badge-completed', blocked: 'badge-rejected', inactive: 'badge-pending',
  }
  const label = {
    in_progress:  'In Progress',
    under_review: 'Under Review',
    accepted:     'Accepted ✅',
    rejected:     'Rejected ❌',
  }
  return (
    <span className={map[value] || 'badge-pending'}>
      {label[value] || (value ? value.charAt(0).toUpperCase() + value.slice(1) : '—')}
    </span>
  )
}

// ── ProgressBar ───────────────────────────────────────────
export function ProgressBar({ percent = 0, color = 'bg-blue-500' }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{percent}%</span>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex justify-center py-10">
      <div className={`${s[size]} border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin`} />
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────
export function EmptyState({ message = 'No data found.' }) {
  return (
    <div className="py-16 text-center text-slate-400 text-sm">{message}</div>
  )
}

// ── Modal ─────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────
export function Avatar({ name = '', color = 'bg-blue-100 text-blue-700', size = 'w-8 h-8' }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className={`${size} ${color} rounded-lg flex items-center justify-center text-xs font-semibold shrink-0`}>
      {initials || 'U'}
    </div>
  )
}
