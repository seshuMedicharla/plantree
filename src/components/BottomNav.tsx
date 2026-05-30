import { Clapperboard, Home, MessageCircle, Plus, ShieldCheck, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { getAuthUser } from '../services/http'

type NavItem = {
  to: string
  label: string
  icon: typeof Home
  isPost?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/reels', label: 'Reels', icon: Clapperboard },
  { to: '/post', label: 'Post', icon: Plus, isPost: true },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  const user = getAuthUser()
  const visibleItems =
    user?.role === 'ADMIN'
      ? [...navItems, { to: '/admin', label: 'Admin', icon: ShieldCheck }]
      : navItems

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/90 px-3 py-2 shadow-lg backdrop-blur"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))', margin: '0 auto' }}
    >
      <ul
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}
      >
        {visibleItems.map((item) => {
          const Icon = item.icon

          if (item.isPost) {
            return (
              <li key={item.to} className="flex items-center justify-center">
                <NavLink to={item.to} end className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1">
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all duration-200 ${
                          isActive ? 'scale-105' : 'hover:scale-105 active:scale-105'
                        }`}
                      >
                        <Icon size={20} />
                      </span>
                      <span className="text-xs font-medium text-slate-600">Post</span>
                    </>
                  )}
                </NavLink>
              </li>
            )
          }

          return (
            <li key={item.to} className="flex items-center justify-center">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => {
                  return `flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
