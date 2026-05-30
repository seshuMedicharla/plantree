import { Bell, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import Input from '../components/Input'
import PlanTreeLogo from '../components/PlanTreeLogo'
import {
  fetchNotifications,
  markNotificationRead,
  searchAll,
  type NotificationItem,
  type SearchResult,
} from '../services/backendApi'

export default function AppShell() {
  const [panel, setPanel] = useState<'none' | 'notifications' | 'search'>('none')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  )

  useEffect(() => {
    if (panel !== 'notifications') {
      return
    }

    let active = true
    setLoadingNotifications(true)

    fetchNotifications()
      .then((payload) => {
        if (active) {
          setNotifications(payload.notifications)
        }
      })
      .catch(() => {
        if (active) {
          setNotifications([])
        }
      })
      .finally(() => {
        if (active) {
          setLoadingNotifications(false)
        }
      })

    return () => {
      active = false
    }
  }, [panel])

  useEffect(() => {
    if (panel !== 'search') {
      return
    }

    const query = searchQuery.trim()
    if (!query) {
      setSearchResults([])
      return
    }

    let active = true
    setLoadingSearch(true)

    const timeoutId = window.setTimeout(() => {
      searchAll(query)
        .then((payload) => {
          if (active) {
            setSearchResults(payload.results)
          }
        })
        .catch(() => {
          if (active) {
            setSearchResults([])
          }
        })
        .finally(() => {
          if (active) {
            setLoadingSearch(false)
          }
        })
    }, 220)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      setLoadingSearch(false)
    }
  }, [panel, searchQuery])

  const handleMarkRead = async (notificationId: string) => {
    await markNotificationRead(notificationId).catch(() => null)
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item
      )
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-emerald-50/30">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-slate-100 bg-white/80 shadow-sm">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <PlanTreeLogo className="h-11 w-11" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">PlanTree</h1>
                <p className="text-[11px] text-slate-500">Plant - Reels - Badges</p>
              </div>
            </div>

            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPanel((current) => (current === 'notifications' ? 'none' : 'notifications'))
                }
                aria-label="Notifications"
                className="relative rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              >
                <Bell size={18} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setPanel((current) => (current === 'search' ? 'none' : 'search'))}
                aria-label="Search"
                className="rounded-2xl bg-emerald-600 p-2 text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <Search size={18} />
              </button>
            </div>
          </div>
        </header>

        {panel !== 'none' ? (
          <div className="border-b border-slate-200 bg-white/95 px-4 py-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                {panel === 'notifications' ? 'Notifications' : 'Search'}
              </h2>
              <button
                type="button"
                onClick={() => setPanel('none')}
                className="rounded-xl p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close panel"
              >
                <X size={16} />
              </button>
            </div>

            {panel === 'notifications' ? (
              <div className="space-y-2">
                {loadingNotifications ? (
                  <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">Loading notifications...</p>
                ) : notifications.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">No notifications found.</p>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleMarkRead(notification.id)}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        notification.read
                          ? 'border-slate-200 bg-slate-50'
                          : 'border-emerald-200 bg-emerald-50'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{notification.body}</p>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search profile, post, badge..."
                />

                {loadingSearch ? (
                  <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">Searching...</p>
                ) : searchQuery.trim() && searchResults.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">No results found.</p>
                ) : (
                  searchResults.map((result) => (
                    <div key={`${result.type}-${result.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">{result.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{result.subtitle}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.15em] text-emerald-700">
                        {result.type}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : null}

        <main className="flex-1 pb-24">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
