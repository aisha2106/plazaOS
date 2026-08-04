import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components'
import { AuthProvider } from './context/AuthContext'
import { AdminDashboard } from './routes/admin/AdminDashboard'
import { AdminCalendar } from './routes/admin/calendar/AdminCalendar'
import { Announcements } from './routes/admin/announcements/Announcements'
import { MaintenanceDetail } from './routes/admin/maintenance/MaintenanceDetail'
import { MaintenanceList } from './routes/admin/maintenance/MaintenanceList'
import { PaymentDetail } from './routes/admin/payments/PaymentDetail'
import { PaymentNew } from './routes/admin/payments/PaymentNew'
import { PaymentsList } from './routes/admin/payments/PaymentsList'
import { ReminderDetail } from './routes/admin/reminders/ReminderDetail'
import { ReminderNew } from './routes/admin/reminders/ReminderNew'
import { RemindersList } from './routes/admin/reminders/RemindersList'
import { TenantDetail } from './routes/admin/tenants/TenantDetail'
import { TenantsList } from './routes/admin/tenants/TenantsList'
import { UnitDetail } from './routes/admin/units/UnitDetail'
import { UnitNew } from './routes/admin/units/UnitNew'
import { UnitsList } from './routes/admin/units/UnitsList'
import { DevKit } from './routes/dev/DevKit'
import { Login } from './routes/Login'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { TenantHome } from './routes/tenant/TenantHome'

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
          {/* PRODUCT.md route map has no bare /admin — this keeps the nav's
              existing "/admin" Dashboard link and role-redirect target working. */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="units" element={<UnitsList />} />
          <Route path="units/new" element={<UnitNew />} />
          <Route path="units/:unitId" element={<UnitDetail />} />
          <Route path="tenants" element={<TenantsList />} />
          <Route path="tenants/:tenantId" element={<TenantDetail />} />
          <Route path="payments" element={<PaymentsList />} />
          <Route path="payments/new" element={<PaymentNew />} />
          <Route path="payments/:paymentId" element={<PaymentDetail />} />
          <Route path="maintenance" element={<MaintenanceList />} />
          <Route path="maintenance/:requestId" element={<MaintenanceDetail />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="reminders" element={<RemindersList />} />
          <Route path="reminders/new" element={<ReminderNew />} />
          <Route path="reminders/:reminderId" element={<ReminderDetail />} />
        </Route>

        <Route
          path="/tenant"
          element={
            <ProtectedRoute requiredRole="tenant">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TenantHome />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
