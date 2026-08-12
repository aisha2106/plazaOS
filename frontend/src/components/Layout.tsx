import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import type { Role } from '../context/AuthContext'
import { Button } from './Button'
import { Text } from './Text'

interface NavItem {
  label: string
  to: string
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Units', to: '/admin/units' },
    { label: 'Tenants', to: '/admin/tenants' },
    { label: 'Maintenance', to: '/admin/maintenance' },
    { label: 'Announcements', to: '/admin/announcements' },
    { label: 'Reminders', to: '/admin/reminders' },
    { label: 'Calendar', to: '/admin/calendar' },
    { label: 'Notifications', to: '/admin/notifications' },
  ],
  tenant: [
    { label: 'Home', to: '/tenant' },
    { label: 'Profile', to: '/tenant/profile' },
    { label: 'Payments', to: '/tenant/payments' },
    { label: 'Maintenance', to: '/tenant/maintenance' },
    { label: 'Announcements', to: '/tenant/announcements' },
    { label: 'Notifications', to: '/tenant/notifications' },
    { label: 'Calendar', to: '/tenant/calendar' },
  ],
}

/** One shell for both roles — sidebar links and topbar identity swap based on AuthContext's role. */
export function Layout() {
  const { role, user, logout } = useAuth()
  const navItems = role ? NAV_ITEMS[role] : []

  return (
    <div className="flex min-h-screen bg-slate-200/20">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white p-4">
        <Text variant="h2" className="mb-6 text-primary">
          Plaza OS
        </Text>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${role}`}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center rounded-button px-3 text-[15px] font-medium ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex min-h-[44px] items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <Text variant="body" className="text-slate-500">
            {user?.name} · <span className="capitalize">{role}</span>
          </Text>
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
