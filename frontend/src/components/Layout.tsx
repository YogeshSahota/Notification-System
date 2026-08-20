import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Bell, FileText, Users, BarChart3, Settings } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/notifications/new', label: 'Send Notification', icon: Settings },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/recipients', label: 'Recipients', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Notification Platform</h1>
          <p className="text-xs text-gray-500 mt-1">Event-driven pipeline</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
