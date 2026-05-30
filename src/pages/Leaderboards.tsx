import { Info } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import Pill from '../components/Pill'
import UserPreview from '../components/UserPreview'
import { fetchLeaderboard, openDirectChat } from '../services/backendApi'
import type { LeaderRow } from '../services/types'

type BoardTab = 'village' | 'mandal'
type TimeFilter = 'week' | 'month' | 'all-time'

export default function Leaderboards() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<BoardTab>('village')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week')
  const [search, setSearch] = useState('')
  const [hoveredRowKey, setHoveredRowKey] = useState<string | null>(null)
  const [openRowKey, setOpenRowKey] = useState<string | null>(null)
  const [rows, setRows] = useState<LeaderRow[]>([])

  useEffect(() => {
    let active = true

    fetchLeaderboard(tab)
      .then((payload) => {
        if (active) {
          setRows(payload.rows)
        }
      })
      .catch(() => {
        if (active) {
          setRows([])
        }
      })

    return () => {
      active = false
    }
  }, [tab])

  const filtered = useMemo(() => {
    return rows.filter((user) =>
      user.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [rows, search])

  const handleOpenChat = async (userId?: string) => {
    if (!userId) return
    const result = await openDirectChat(userId).catch(() => null)
    if (!result) return
    navigate(`/chat?chat=${encodeURIComponent(result.chat.id)}`)
  }

  return (
    <section className="space-y-4 p-4">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search planter..."
      />

      <div className="grid grid-cols-2 gap-2">
        <Button variant={tab === 'village' ? 'primary' : 'secondary'} onClick={() => setTab('village')}>
          Village/Town
        </Button>
        <Button variant={tab === 'mandal' ? 'primary' : 'secondary'} onClick={() => setTab('mandal')}>
          Mandal
        </Button>
      </div>

      <div className="flex gap-2">
        {(['week', 'month', 'all-time'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTimeFilter(item)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${
              timeFilter === item
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <Card>
        <div className="space-y-2">
          {filtered.map((row) => {
            const rowKey = `${tab}-${row.rank}-${row.name}`
            const showPreview = hoveredRowKey === rowKey || openRowKey === rowKey

            return (
              <div
                key={rowKey}
                className="relative"
                onMouseEnter={() => setHoveredRowKey(rowKey)}
                onMouseLeave={() => setHoveredRowKey(null)}
              >
                <div
                  className={`flex items-center justify-between rounded-2xl p-3 ${
                    row.name === 'Seshu' ? 'bg-emerald-50' : 'bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                      #{row.rank} {row.name}
                      <button
                        type="button"
                        onClick={() =>
                          setOpenRowKey((prev) => (prev === rowKey ? null : rowKey))
                        }
                        className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200"
                        aria-label={`View ${row.name} info`}
                      >
                        <Info size={13} />
                      </button>
                    </p>
                    <p className="text-xs text-slate-500">{row.place}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Pill text={`${row.score} pts`} />
                    <p className="text-xs text-slate-500">{row.trees} trees</p>
                  </div>
                </div>

                {showPreview ? (
                  <div className="absolute left-2 right-2 top-full z-20 mt-2">
                    <UserPreview
                      name={row.name}
                      bio={row.bio}
                      impact={row.impact}
                      joined={row.joined}
                      canChat={Boolean(row.id && !row.isMe)}
                      onChat={() => void handleOpenChat(row.id)}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}

          {filtered.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
              No planters found.
            </p>
          ) : null}
        </div>
      </Card>
    </section>
  )
}
