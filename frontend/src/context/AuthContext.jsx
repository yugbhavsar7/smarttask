import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: restore user from storage (localStorage = remember me / sessionStorage = session only)
  useEffect(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user')
    const token  = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    if (stored && token) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password, rememberMe = false) => {
    const { data } = await api.post('/auth/login/', { email, password })
    const store = rememberMe ? localStorage : sessionStorage
    store.setItem('access_token',  data.access)
    store.setItem('refresh_token', data.refresh)
    store.setItem('user', JSON.stringify(data.user))
    // Always put in localStorage so interceptor finds it
    localStorage.setItem('access_token',  data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token')
      await api.post('/auth/logout/', { refresh })
    } catch { /* ignore */ }
    localStorage.clear()
    sessionStorage.clear()
    setUser(null)
    toast.success('Logged out successfully.')
  }, [])

  const updateUser = useCallback((updated) => {
    const merged = { ...user, ...updated }
    setUser(merged)
    localStorage.setItem('user', JSON.stringify(merged))
    sessionStorage.setItem('user', JSON.stringify(merged))
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
