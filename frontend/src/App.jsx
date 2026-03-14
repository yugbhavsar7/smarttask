import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute'

// Auth
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Admin
import AdminLayout    from './components/layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers     from './pages/admin/AdminUsers'
import AdminTasks     from './pages/admin/AdminTasks'
import AdminQueries   from './pages/admin/AdminQueries'
import AdminCompanies from './pages/admin/AdminCompanies'
import AdminReports   from './pages/admin/AdminReports'
import AdminProfile   from './pages/admin/AdminProfile'

// Employee
import EmployeeLayout     from './components/layouts/EmployeeLayout'
import EmployeeDashboard  from './pages/employee/EmployeeDashboard'
import EmployeeTasks      from './pages/employee/EmployeeTasks'
import EmployeeTaskDetail from './pages/employee/EmployeeTaskDetail'
import EmployeeReminders  from './pages/employee/EmployeeReminders'
import EmployeeProfile    from './pages/employee/EmployeeProfile'
import AIChat             from './pages/employee/AIChat'

// Company
import CompanyLayout   from './components/layouts/CompanyLayout'
import CompanyDashboard from './pages/company/CompanyDashboard'
import CompanyProjects  from './pages/company/CompanyProjects'
import CompanyQueries   from './pages/company/CompanyQueries'
import CompanyReports   from './pages/company/CompanyReports'
import CompanyProfile   from './pages/company/CompanyProfile'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicRoute />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index             element={<AdminDashboard />} />
          <Route path="users"      element={<AdminUsers />} />
          <Route path="tasks"      element={<AdminTasks />} />
          <Route path="companies"  element={<AdminCompanies />} />
          <Route path="queries"    element={<AdminQueries />} />
          <Route path="reports"    element={<AdminReports />} />
          <Route path="profile"    element={<AdminProfile />} />
        </Route>
      </Route>

      {/* Employee */}
      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index               element={<EmployeeDashboard />} />
          <Route path="tasks"        element={<EmployeeTasks />} />
          <Route path="tasks/:id"    element={<EmployeeTaskDetail />} />
          <Route path="reminders"    element={<EmployeeReminders />} />
          <Route path="ai-chat"      element={<AIChat />} />
          <Route path="profile"      element={<EmployeeProfile />} />
        </Route>
      </Route>

      {/* Company */}
      <Route element={<ProtectedRoute allowedRoles={['company']} />}>
        <Route path="/company" element={<CompanyLayout />}>
          <Route index             element={<CompanyDashboard />} />
          <Route path="projects"   element={<CompanyProjects />} />
          <Route path="queries"    element={<CompanyQueries />} />
          <Route path="reports"    element={<CompanyReports />} />
          <Route path="profile"    element={<CompanyProfile />} />
        </Route>
      </Route>

      <Route path="/"  element={<Navigate to="/login" replace />} />
      <Route path="*"  element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
