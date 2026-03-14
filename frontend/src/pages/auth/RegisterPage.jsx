import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', mobile: '', role: 'employee',
    skill_set: '', password: '', confirm_password: '',
  })
  const [loading, setLoading] = useState(false)

  // OTP step
  const [step, setStep]     = useState('register') // register | otp
  const [otp, setOtp]       = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [regEmail, setRegEmail]   = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register/', form)
      setRegEmail(data.email || form.email)
      toast.success('OTP sent to your email!')
      setStep('otp')
    } catch (err) {
      const errors = err.response?.data
      if (errors && typeof errors === 'object') {
        Object.values(errors).flat().forEach(msg => toast.error(msg))
      } else {
        toast.error('Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async e => {
    e.preventDefault()
    setVerifying(true)
    try {
      await api.post('/auth/verify-otp/', { email: regEmail, otp, purpose: 'register' })
      toast.success('Email verified! You can now sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP.')
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await api.post('/auth/resend-otp/', { email: regEmail, purpose: 'register' })
      toast.success('New OTP sent!')
    } catch {
      toast.error('Failed to resend OTP.')
    } finally {
      setResending(false)
    }
  }

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-200">
              <span className="text-white font-bold text-lg">ST</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Verify your email</h1>
            <p className="text-sm text-slate-500 mt-1 text-center">
              We sent a 6-digit OTP to <strong>{regEmail}</strong>
            </p>
          </div>

          <div className="card shadow-sm">
            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Enter OTP</label>
                <input
                  type="text" required maxLength={6} value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="6-digit OTP"
                  className="input-field tracking-widest text-center text-2xl font-bold py-3"
                />
              </div>
              <p className="text-xs text-slate-400 text-center">OTP is valid for 10 minutes</p>
              <button type="submit" disabled={verifying}
                className="btn-primary w-full justify-center py-2.5 disabled:opacity-60">
                {verifying ? 'Verifying...' : 'Verify & Activate Account'}
              </button>
              <button type="button" onClick={handleResend} disabled={resending}
                className="text-xs text-blue-600 hover:underline text-center disabled:opacity-50">
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-200">
            <span className="text-white font-bold text-lg">ST</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Create account</h1>
          <p className="text-sm text-slate-500 mt-1">Join SmartTask today</p>
        </div>

        <div className="card shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name</label>
                <input name="name" required value={form.name} onChange={handleChange} placeholder="John Doe" className="input-field" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="john@example.com" className="input-field" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Mobile</label>
                <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="+91 9876543210" className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Register as</label>
                <select name="role" value={form.role} onChange={handleChange} className="input-field">
                  <option value="employee">Employee</option>
                  <option value="company">Company / Client</option>
                </select>
              </div>
              {form.role === 'employee' && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Skills</label>
                  <input name="skill_set" value={form.skill_set} onChange={handleChange} placeholder="React, Python, Django..." className="input-field" />
                </div>
              )}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
                <input name="password" type="password" required minLength={8} value={form.password} onChange={handleChange} placeholder="••••••••" className="input-field" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm Password</label>
                <input name="confirm_password" type="password" required value={form.confirm_password} onChange={handleChange} placeholder="••••••••" className="input-field" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 justify-center mt-1 disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
