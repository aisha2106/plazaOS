import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components'
import { AuthProvider } from './context/AuthProvider'
import { AdminDashboard } from './routes/admin/AdminDashboard'
import { AdminCalendar } from './routes/admin/calendar/AdminCalendar'
import { CalendarNew } from './routes/admin/calendar/CalendarNew'
import { Announcements as AdminAnnouncements } from './routes/admin/announcements/Announcements'
import { Notifications as AdminNotifications } from './routes/admin/notifications/Notifications'
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
import { Login } from './routes/Login'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { SetPassword } from './routes/tenant/SetPassword'
import { TenantHome } from './routes/tenant/TenantHome'
import { Profile } from './routes/tenant/Profile'
import { Payments } from './routes/tenant/Payments'
import { PaymentsNew } from './routes/tenant/PaymentsNew'
import { Maintenance } from './routes/tenant/Maintenance'
import { MaintenanceNew } from './routes/tenant/MaintenanceNew'
import { Announcements } from './routes/tenant/Announcements'
import { Notifications } from './routes/tenant/Notifications'
import { Calendar } from './routes/tenant/Calendar'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Dev-only UI kit preview; excluded from production builds by the DEV check below. */}
        {import.meta.env.DEV && <Route path="/dev/kit" element={<DevKit />} />}

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* PRODUCT.md's route map only lists /admin/dashboard, not bare
              /admin — this index redirect keeps the nav's existing "/admin"
              link and ProtectedRoute's role-redirect target working while
              /admin/dashboard remains the documented, canonical route.
              /tenant/dashboard below follows the same pattern. */}
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
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        <Route
          path="/tenant"
          element={
            <ProtectedRoute requiredRole="tenant">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TenantHome />} />
          <Route path="set-password" element={<SetPassword />} />
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
