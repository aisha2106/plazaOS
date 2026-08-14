import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components'
import { AuthProvider } from './context/AuthContext'
import { AdminHome } from './routes/admin/AdminHome'
import { DevKit } from './routes/dev/DevKit'
import { Login } from './routes/Login'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { TenantHome } from './routes/tenant/TenantHome'
import { Profile } from './routes/tenant/Profile'
import { Payments } from './routes/tenant/Payments'
import { PaymentsNew } from './routes/tenant/PaymentsNew'
import { Maintenance } from './routes/tenant/Maintenance'
import { MaintenanceNew } from './routes/tenant/MaintenanceNew'
import { Announcements } from './routes/tenant/Announcements'
import { Notifications } from './routes/tenant/Notifications'
import { Calendar } from './routes/tenant/Calendar'
import { AccountSetup } from './routes/tenant/AccountSetup'
import { TenantSetupGuard } from './routes/tenant/TenantSetupGuard'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* TODO: remove before shipping — see DevKit.tsx */}
        {import.meta.env.DEV && <Route path="/dev/kit" element={<DevKit />} />}

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHome />} />
        </Route>

        <Route
          path="/tenant/account-setup"
          element={
            <ProtectedRoute requiredRole="tenant">
              <AccountSetup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tenant"
          element={
            <ProtectedRoute requiredRole="tenant">
              <TenantSetupGuard>
                <Layout />
              </TenantSetupGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<TenantHome />} />
          <Route path="profile" element={<Profile />} />
          <Route path="payments" element={<Payments />} />
          <Route path="payments/new" element={<PaymentsNew />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="maintenance/new" element={<MaintenanceNew />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="calendar" element={<Calendar />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
