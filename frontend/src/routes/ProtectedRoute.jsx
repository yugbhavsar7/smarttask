import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Spinner shown while auth loads
const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
  </div>
)

// Protect routes by authentication + optional role
export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard
    const redirects = { admin: '/admin', employee: '/employee', company: '/company' }
    return <Navigate to={redirects[user.role] || '/login'} replace />
  }
  return <Outlet />
}

// Redirect already-logged-in users away from login page
export const PublicRoute = () => {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (user) {
    const redirects = { admin: '/admin', employee: '/employee', company: '/company' }
    return <Navigate to={redirects[user.role] || '/login'} replace />
  }
  return <Outlet />
}
