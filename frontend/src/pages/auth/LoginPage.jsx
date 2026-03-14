import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { RiEyeLine, RiEyeOffLine, RiMailLine, RiLockLine } from 'react-icons/ri'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm]         = useState({ email: '', password: '' })
  const [loading, setLoading]   = useState(false)
  const [showPw, setShowPw]     = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Forgot password flow states
  const [mode, setMode]               = useState('login') // login | forgot_email | forgot_otp | forgot_reset
  const [fpEmail, setFpEmail]         = useState('')
  const [fpOtp, setFpOtp]             = useState('')
  const [fpNewPw, setFpNewPw]         = useState('')
  const [fpConfirm, setFpConfirm]     = useState('')
  const [fpLoading, setFpLoading]     = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password, rememberMe)
      toast.success(`Welcome back, ${user.name}!`)
      const redirects = { admin: '/admin', employee: '/employee', company: '/company' }
      navigate(redirects[user.role] || '/login', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0]
        || 'Login failed. Check your credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Forgot password steps ────────────────────────────────────────────
  const handleForgotRequest = async e => {
    e.preventDefault()
    setFpLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail }),
      })
      await res.json()
      toast.success('OTP sent to your email!')
      setMode('forgot_otp')
    } catch {
      toast.error('Failed to send OTP. Try again.')
    } finally {
      setFpLoading(false)
    }
  }

  const handleForgotVerify = async e => {
    e.preventDefault()
    setFpLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail, otp: fpOtp, purpose: 'forgot_password' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid OTP')
      toast.success('OTP verified!')
      setMode('forgot_reset')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setFpLoading(false)
    }
  }

  const handleForgotReset = async e => {
    e.preventDefault()
    if (fpNewPw !== fpConfirm) { toast.error('Passwords do not match.'); return }
    setFpLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail, new_password: fpNewPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reset failed')
      toast.success('Password reset! Please log in.')
      setMode('login')
      setFpEmail(''); setFpOtp(''); setFpNewPw(''); setFpConfirm('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setFpLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-200">
            <span className="text-white font-bold text-lg">ST</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">SmartTask</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'login'        ? 'Sign in to your account' :
             mode === 'forgot_email' ? 'Reset your password' :
             mode === 'forgot_otp'   ? 'Enter the OTP sent to your email' :
                                       'Set a new password'}
          </p>
        </div>

        <div className="card shadow-sm">

          {/* ── Normal Login ── */}
          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Email address</label>
                <div className="relative">
                  <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    name="email" type="email" required
                    autoComplete="email"
                    value={form.email} onChange={handleChange}
                    placeholder="you@example.com"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    name="password" type={showPw ? 'text' : 'password'} required
                    autoComplete="current-password"
                    value={form.password} onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field pl-9 pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox" checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-blue-600"
                  />
                  <span className="text-xs text-slate-600">Remember me</span>
                </label>
                <button type="button" onClick={() => setMode('forgot_email')}
                  className="text-xs text-blue-600 hover:underline">
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-1 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  : 'Sign in'}
              </button>

              <p className="text-center text-sm text-slate-500 mt-1">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:underline font-medium">Register</Link>
              </p>
            </form>
          )}

          {/* ── Forgot: Enter Email ── */}
          {mode === 'forgot_email' && (
            <form onSubmit={handleForgotRequest} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Registered email</label>
                <input
                  type="email" required value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                  placeholder="you@example.com" className="input-field"
                />
              </div>
              <button type="submit" disabled={fpLoading}
                className="btn-primary w-full justify-center py-2.5 disabled:opacity-60">
                {fpLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
              <button type="button" onClick={() => setMode('login')}
                className="text-xs text-slate-500 hover:underline text-center">← Back to login</button>
            </form>
          )}

          {/* ── Forgot: Enter OTP ── */}
          {mode === 'forgot_otp' && (
            <form onSubmit={handleForgotVerify} className="flex flex-col gap-4">
              <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                OTP sent to <strong>{fpEmail}</strong>. Valid for 10 minutes.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Enter OTP</label>
                <input
                  type="text" required maxLength={6} value={fpOtp} onChange={e => setFpOtp(e.target.value)}
                  placeholder="6-digit OTP" className="input-field tracking-widest text-center text-lg font-bold"
                />
              </div>
              <button type="submit" disabled={fpLoading}
                className="btn-primary w-full justify-center py-2.5 disabled:opacity-60">
                {fpLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button type="button" onClick={handleForgotRequest}
                className="text-xs text-blue-600 hover:underline text-center">Resend OTP</button>
            </form>
          )}

          {/* ── Forgot: New Password ── */}
          {mode === 'forgot_reset' && (
            <form onSubmit={handleForgotReset} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">New password</label>
                <input
                  type="password" required minLength={8} value={fpNewPw}
                  onChange={e => setFpNewPw(e.target.value)}
                  placeholder="Min. 8 characters" className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm new password</label>
                <input
                  type="password" required value={fpConfirm}
                  onChange={e => setFpConfirm(e.target.value)}
                  placeholder="Re-enter password" className="input-field"
                />
              </div>
              <button type="submit" disabled={fpLoading}
                className="btn-primary w-full justify-center py-2.5 disabled:opacity-60">
                {fpLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Smart Employee Task Automation &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
