import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components'
import { AuthProvider } from './context/AuthContext'
import { AdminDashboard } from './routes/admin/AdminDashboard'
import { AdminCalendar } from './routes/admin/calendar/AdminCalendar'
import { CalendarNew } from './routes/admin/calendar/CalendarNew'
import { Announcements as AdminAnnouncements } from './routes/admin/announcements/Announcements'
import { MaintenanceDetail } from './routes/admin/maintenance/MaintenanceDetail'
import { MaintenanceList } from './routes/admin/maintenance/MaintenanceList'
import { PaymentDetail } from './routes/admin/payments/PaymentDetail'
import { PaymentNew } from './routes/admin/payments/PaymentNew'
import { PaymentsList } from './routes/admin/payments/PaymentsList'
import { ReminderDetail } from './routes/admin/reminders/ReminderDetail'
import { ReminderNew } from './routes/admin/reminders/ReminderNew'
import { RemindersList } from './routes/admin/reminders/RemindersList'
import { TenantDetail } from './routes/admin/tenants/TenantDetail'
import { TenantNew } from './routes/admin/tenants/TenantNew'
import { TenantsList } from './routes/admin/tenants/TenantsList'
import { UnitDetail } from './routes/admin/units/UnitDetail'
import { UnitNew } from './routes/admin/units/UnitNew'
import { UnitsList } from './routes/admin/units/UnitsList'
import { DevKit } from './routes/dev/DevKit'
import { Landing } from './routes/Landing'
import { Login } from './routes/Login'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { TenantHome } from './routes/tenant/TenantHome'
import { Profile } from './routes/tenant/Profile'
import { Payments } from './routes/tenant/Payments'
import { PaymentsNew } from './routes/tenant/PaymentsNew'
import { Maintenance } from './routes/tenant/Maintenance'
import { MaintenanceNew } from './routes/tenant/MaintenanceNew'
import { Announcements as TenantAnnouncements } from './routes/tenant/Announcements'
import { Notifications } from './routes/tenant/Notifications'
import { Calendar } from './routes/tenant/Calendar'
import { AccountSetup } from './routes/tenant/AccountSetup'
import { TenantSetupGuard } from './routes/tenant/TenantSetupGuard'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
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
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="units" element={<UnitsList />} />
          <Route path="units/new" element={<UnitNew />} />
          <Route path="units/:unitId" element={<UnitDetail />} />
          <Route path="tenants" element={<TenantsList />} />
          <Route path="tenants/new" element={<TenantNew />} />
          <Route path="tenants/:tenantId" element={<TenantDetail />} />
          <Route path="payments" element={<PaymentsList />} />
          <Route path="payments/new" element={<PaymentNew />} />
          <Route path="payments/:paymentId" element={<PaymentDetail />} />
          <Route path="maintenance" element={<MaintenanceList />} />
          <Route path="maintenance/:requestId" element={<MaintenanceDetail />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="calendar/new" element={<CalendarNew />} />
          <Route path="reminders" element={<RemindersList />} />
          <Route path="reminders/new" element={<ReminderNew />} />
          <Route path="reminders/:reminderId" element={<ReminderDetail />} />
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
          <Route path="announcements" element={<TenantAnnouncements />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="calendar" element={<Calendar />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
