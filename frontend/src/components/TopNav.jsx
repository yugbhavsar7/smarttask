import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  RiDashboardLine, RiTaskLine, RiTeamLine, RiBuildingLine,
  RiQuestionLine, RiFileChartLine, RiBellLine, RiUserLine,
  RiLogoutBoxLine, RiMenuLine, RiCloseLine, RiRobot2Line,
  RiAlarmLine, RiCheckLine,
} from 'react-icons/ri'

const navConfig = {
  admin: [
    { to: '/admin',           label: 'Dashboard', icon: RiDashboardLine, end: true },
    { to: '/admin/tasks',     label: 'Tasks',     icon: RiTaskLine },
    { to: '/admin/users',     label: 'Users',     icon: RiTeamLine },
    { to: '/admin/companies', label: 'Companies', icon: RiBuildingLine },
    { to: '/admin/queries',   label: 'Queries',   icon: RiQuestionLine },
    { to: '/admin/reports',   label: 'Reports',   icon: RiFileChartLine },
  ],
  employee: [
    { to: '/employee',           label: 'Dashboard', icon: RiDashboardLine, end: true },
    { to: '/employee/tasks',     label: 'My Tasks',  icon: RiTaskLine },
    { to: '/employee/reminders', label: 'Reminders', icon: RiAlarmLine },
    { to: '/employee/ai-chat',   label: 'AI Chat',   icon: RiRobot2Line },
  ],
  company: [
    { to: '/company',          label: 'Dashboard', icon: RiDashboardLine, end: true },
    { to: '/company/projects', label: 'Projects',  icon: RiTaskLine },
    { to: '/company/queries',  label: 'Queries',   icon: RiQuestionLine },
    { to: '/company/reports',  label: 'Reports',   icon: RiFileChartLine },
    { to: '/company/profile',  label: 'Profile',   icon: RiBuildingLine },
  ],
}

const roleAccent = {
  admin:    'bg-blue-500',
  employee: 'bg-emerald-500',
  company:  'bg-orange-500',
}

const profileRoute = {
  admin:    '/admin/profile',
  employee: '/employee/profile',
  company:  '/company/profile',
}

export default function TopNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen]   = useState(false)
  const [dropOpen, setDropOpen]   = useState(false)
  const [bellOpen, setBellOpen]   = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread]       = useState(0)

  const bellRef = useRef(null)
  const dropRef = useRef(null)
  const links   = navConfig[user?.role] || []

  // Fetch notifications on mount and every 30s
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get('/notifications/')
        setNotifications(data.notifications || [])
        setUnread(data.unread_count || 0)
      } catch { /* ignore */ }
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = e => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => { await logout(); navigate('/login') }

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-read/', {})
      setNotifications(n => n.map(x => ({ ...x, is_read: true })))
      setUnread(0)
    } catch { /* ignore */ }
  }

  const markOneRead = async (id) => {
    try {
      await api.post('/notifications/mark-read/', { id })
      setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
      setUnread(u => Math.max(0, u - 1))
    } catch { /* ignore */ }
  }

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const notifTypeColor = (type) => ({
    task_assigned:  'text-blue-600 bg-blue-50',
    task_accepted:  'text-green-600 bg-green-50',
    task_rejected:  'text-red-600 bg-red-50',
    task_submitted: 'text-orange-600 bg-orange-50',
    query_responded:'text-purple-600 bg-purple-50',
  })[type] || 'text-slate-600 bg-slate-100'

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-14 gap-6">

          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className={`w-7 h-7 rounded-lg ${roleAccent[user?.role] || 'bg-blue-500'} flex items-center justify-center`}>
              <span className="text-white text-xs font-semibold">ST</span>
            </div>
            <span className="text-slate-100 text-sm font-semibold tracking-tight hidden sm:block">SmartTask</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `nav-link flex items-center gap-1.5 whitespace-nowrap ${isActive ? 'nav-link-active' : ''}`
                }>
                <Icon size={15} /><span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0">

            {/* Notification bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => { setBellOpen(v => !v); setDropOpen(false) }}
                className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <RiBellLine size={18} />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-900">Notifications</span>
                    {unread > 0 && (
                      <button onClick={markAllRead}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        <RiCheckLine size={12} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0
                      ? <p className="text-xs text-slate-400 text-center py-8">No notifications yet</p>
                      : notifications.map(n => (
                          <div key={n.id}
                            onClick={() => !n.is_read && markOneRead(n.id)}
                            className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}>
                            <div className="flex items-start gap-2">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${notifTypeColor(n.notif_type)}`}>
                                {n.notif_type.replace('_', ' ')}
                              </span>
                              {!n.is_read && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                            </div>
                            <p className="text-xs font-medium text-slate-800 mt-1">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                    }
                  </div>
                </div>
              )}
            </div>

            {/* User dropdown */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => { setDropOpen(v => !v); setBellOpen(false) }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                {user?.profile_photo
                  ? <img src={user.profile_photo} alt="" className={`w-7 h-7 rounded-lg object-cover ring-2 ring-${roleAccent[user?.role]?.replace('bg-', '')}`} />
                  : <div className={`w-7 h-7 rounded-lg ${roleAccent[user?.role] || 'bg-blue-500'} flex items-center justify-center`}>
                      <span className="text-white text-xs font-medium">{initials}</span>
                    </div>
                }
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-slate-200 leading-tight">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize leading-tight">{user?.role}</p>
                </div>
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setDropOpen(false); navigate(profileRoute[user?.role] || '/login') }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                    <RiUserLine size={14} /> My Profile
                  </button>
                  <hr className="my-1 border-slate-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <RiLogoutBoxLine size={14} /> Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800"
              onClick={() => setMenuOpen(v => !v)}>
              {menuOpen ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden pb-3 flex flex-col gap-0.5">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${
                    isActive ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`
                }>
                <Icon size={16} /> {label}
              </NavLink>
            ))}
            <button
              onClick={() => { setMenuOpen(false); navigate(profileRoute[user?.role]) }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100">
              <RiUserLine size={16} /> My Profile
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
