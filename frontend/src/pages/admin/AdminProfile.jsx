import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { PageHeader, Spinner } from '../../components/UI'
import { RiCameraLine, RiLockLine } from 'react-icons/ri'

export default function AdminProfile() {
  const { user, updateUser } = useAuth()
  const fileRef = useRef(null)

  const [form, setForm]     = useState({ name: user?.name || '', mobile: user?.mobile || '', skill_set: user?.skill_set || '' })
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(user?.profile_photo || null)

  const [pw, setPw]         = useState({ old_password: '', new_password: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)

  const handlePhotoChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    // upload immediately
    const fd = new FormData()
    fd.append('profile_photo', file)
    api.patch('/auth/profile/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(({ data }) => { updateUser(data); toast.success('Profile photo updated!') })
      .catch(() => toast.error('Failed to upload photo.'))
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.patch('/auth/profile/', { name: form.name, mobile: form.mobile, skill_set: form.skill_set })
      updateUser(data)
      toast.success('Profile updated!')
    } catch { toast.error('Failed to update profile.') }
    finally { setSaving(false) }
  }

  const handlePwChange = async e => {
    e.preventDefault()
    if (pw.new_password !== pw.confirm) { toast.error('Passwords do not match.'); return }
    setPwSaving(true)
    try {
      await api.post('/auth/change-password/', { old_password: pw.old_password, new_password: pw.new_password })
      toast.success('Password changed!')
      setPw({ old_password: '', new_password: '', confirm: '' })
    } catch (err) {
      const msg = err.response?.data?.old_password?.[0] || err.response?.data?.non_field_errors?.[0] || 'Failed to change password.'
      toast.error(msg)
    } finally { setPwSaving(false) }
  }

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'AD'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your account details and password" />

      {/* Profile card */}
      <div className="card">
        {/* Avatar */}
        <div className="flex items-center gap-5 pb-5 mb-5 border-b border-slate-100">
          <div className="relative">
            {photoPreview
              ? <img src={photoPreview} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              : <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">{initials}</div>
            }
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors">
              <RiCameraLine size={12} className="text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-lg">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize font-medium">{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Mobile</label>
              <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="input-field" placeholder="+91 9876543210" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email <span className="text-slate-400">(cannot change)</span></label>
              <input value={user?.email} disabled className="input-field opacity-60 cursor-not-allowed" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
          <RiLockLine size={16} /> Change Password
        </h2>
        <form onSubmit={handlePwChange} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Current Password</label>
            <input type="password" required value={pw.old_password}
              onChange={e => setPw(p => ({ ...p, old_password: e.target.value }))} className="input-field" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">New Password</label>
              <input type="password" required minLength={8} value={pw.new_password}
                onChange={e => setPw(p => ({ ...p, new_password: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm New Password</label>
              <input type="password" required value={pw.confirm}
                onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} className="input-field" />
            </div>
          </div>
          <button type="submit" disabled={pwSaving} className="btn-primary disabled:opacity-60">
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
