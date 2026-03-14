import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Badge, Spinner, PageHeader, EmptyState, Avatar } from '../../components/UI'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (roleFilter) params.append('role', roleFilter)
      if (search) params.append('search', search)
      const { data } = await api.get(`/auth/users/?${params}`)
      setUsers(data.results || data)
    } catch { toast.error('Failed to load users.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [roleFilter, search])

  const handleBlock = async (id, current) => {
    const action = current === 'blocked' ? 'unblock' : 'block'
    try {
      const { data } = await api.post(`/auth/users/${id}/block/`, { action })
      toast.success(data.message)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: data.status } : u))
    } catch { toast.error('Action failed.') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    try {
      await api.delete(`/auth/users/${id}/`)
      toast.success('User deleted.')
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch { toast.error('Failed to delete user.') }
  }

  const avatarColor = role => ({
    admin: 'bg-blue-100 text-blue-700',
    employee: 'bg-emerald-100 text-emerald-700',
    company: 'bg-orange-100 text-orange-700',
  }[role] || 'bg-slate-100 text-slate-700')

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Manage all employees and company accounts" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text" placeholder="Search name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input-field !w-auto min-w-[200px]"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field !w-auto">
          <option value="">All Roles</option>
          <option value="employee">Employee</option>
          <option value="company">Company</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <Spinner /> : users.length === 0 ? <EmptyState message="No users found." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['User', 'Role', 'Mobile', 'Skills', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} color={avatarColor(u.role)} />
                        <div>
                          <p className="font-medium text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><Badge value={u.role} /></td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{u.mobile || '—'}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs max-w-[160px] truncate">{u.skill_set || '—'}</td>
                    <td className="py-3 px-4"><Badge value={u.status} /></td>
                    <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleBlock(u.id, u.status)}
                          className={`text-xs hover:underline ${u.status === 'blocked' ? 'text-emerald-600' : 'text-amber-600'}`}
                        >
                          {u.status === 'blocked' ? 'Unblock' : 'Block'}
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </div>
                    </td>
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
