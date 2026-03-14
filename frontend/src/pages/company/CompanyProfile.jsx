import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Spinner, PageHeader } from '../../components/UI'

export default function CompanyProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ company_name: '', email: '', contact_no: '', address: '' })

  useEffect(() => {
    api.get('/companies/profile/')
      .then(({ data }) => { setProfile(data); setForm(data) })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdate = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.patch('/companies/profile/', form)
      setProfile(data)
      setEditing(false)
      toast.success('Profile updated!')
    } catch { toast.error('Failed to update profile.') }
    finally { setSaving(false) }
  }

  const handleCreate = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.post('/companies/create/', createForm)
      setProfile(data)
      setCreating(false)
      toast.success('Company profile created!')
    } catch (err) {
      const errors = err.response?.data
      if (errors) Object.values(errors).flat().forEach(m => toast.error(m))
      else toast.error('Failed to create profile.')
    } finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  if (!profile && !creating) return (
    <div className="space-y-6">
      <PageHeader title="Company Profile" subtitle="Setup your company profile" />
      <div className="card text-center py-16">
        <p className="text-slate-500 mb-4">No company profile found. Create one to get started.</p>
        <button onClick={() => setCreating(true)} className="btn-primary" style={{ background: '#c2410c' }}>
          Create Company Profile
        </button>
      </div>
    </div>
  )

  if (creating) return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Create Company Profile" />
      <div className="card">
        <form onSubmit={handleCreate} className="space-y-4">
          {[
            { name: 'company_name', label: 'Company Name', placeholder: 'e.g. Syndell Technologies' },
            { name: 'email', label: 'Company Email', placeholder: 'info@company.com', type: 'email' },
            { name: 'contact_no', label: 'Contact Number', placeholder: '+91 9876543210' },
          ].map(({ name, label, placeholder, type = 'text' }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
              <input type={type} required value={createForm[name]}
                onChange={e => setCreateForm(f => ({ ...f, [name]: e.target.value }))}
                placeholder={placeholder} className="input-field" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Address</label>
            <textarea required value={createForm.address}
              onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))}
              rows={3} className="input-field resize-none" placeholder="Full company address..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60"
              style={{ background: '#c2410c' }}>{saving ? 'Creating...' : 'Create Profile'}</button>
            <button type="button" onClick={() => setCreating(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader
        title="Company Profile"
        action={!editing && <button onClick={() => setEditing(true)} className="btn-ghost">Edit Profile</button>}
      />
      <div className="card">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xl">
            {profile.company_name?.charAt(0)}
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-lg">{profile.company_name}</h2>
            <p className="text-sm text-slate-500">{profile.email}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            {[
              { name: 'company_name', label: 'Company Name' },
              { name: 'contact_no', label: 'Contact Number' },
            ].map(({ name, label }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
                <input value={form[name] || ''} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} className="input-field" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Address</label>
              <textarea value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={3} className="input-field resize-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {[
              { label: 'Contact Number', value: profile.contact_no },
              { label: 'Address', value: profile.address },
              { label: 'Registered On', value: new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="label mb-0.5">{label}</p>
                <p className="text-sm text-slate-700">{value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
