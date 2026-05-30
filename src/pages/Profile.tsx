import { ArrowUpRight, Award, Gift, LogOut, MessageCircle, Sprout, Trophy, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Pill from '../components/Pill'
import ProfileTree from '../components/ProfileTree'
import { fetchLeaderboard, fetchProfile, openDirectChat } from '../services/backendApi'
import { clearAuth } from '../services/http'
import type { Badge, LeaderRow, PlantingItem } from '../services/types'

const badgeToneByLevel = {
  Bronze: 'border-amber-200 bg-amber-50 text-amber-700',
  Silver: 'border-slate-200 bg-slate-100 text-slate-700',
  Gold: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  Platinum: 'border-cyan-200 bg-cyan-50 text-cyan-700',
}

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    id: 'u1',
    name: 'Seshu',
    place: 'Chennai, Tamil Nadu',
    followers: 0,
    following: 0,
    plantedTrees: 0,
    donatedTrees: 0,
    impact: 0,
    streak: 0,
    bio: '',
    joined: '',
  })
  const [badges, setBadges] = useState<Badge[]>([])
  const [myPlantings, setMyPlantings] = useState<PlantingItem[]>([])
  const [verificationRate, setVerificationRate] = useState(0)
  const [leadersMandal, setLeadersMandal] = useState<LeaderRow[]>([])

  useEffect(() => {
    let active = true

    Promise.all([fetchProfile(), fetchLeaderboard('mandal')])
      .then(([profilePayload, leaderboardPayload]) => {
        if (!active) return
        setProfile(profilePayload.profile)
        setBadges(profilePayload.badges)
        setMyPlantings(profilePayload.plantings)
        setVerificationRate(profilePayload.verificationRate)
        setLeadersMandal(leaderboardPayload.rows)
      })
      .catch(() => null)

    return () => {
      active = false
    }
  }, [])

  const myMandalRank = useMemo(
    () => leadersMandal.find((leader) => leader.name === profile.name),
    [leadersMandal, profile.name]
  )
  const compareCandidates = useMemo(
    () => leadersMandal.filter((leader) => leader.name !== profile.name),
    [leadersMandal, profile.name]
  )
  const [selectedCompareName, setSelectedCompareName] = useState(compareCandidates[0]?.name ?? '')
  useEffect(() => {
    if (compareCandidates.length > 0 && !selectedCompareName) {
      setSelectedCompareName(compareCandidates[0].name)
    }
  }, [compareCandidates, selectedCompareName])

  const selectedCompareUser = compareCandidates.find(
    (leader) => leader.name === selectedCompareName
  )
  const pointsGap = myMandalRank && selectedCompareUser ? selectedCompareUser.score - myMandalRank.score : 0
  const latestBadges = badges.slice(0, 3)

  const statusClassByType = {
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    VERIFIED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/auth', { replace: true })
  }

  const handleOpenChat = async (userId?: string) => {
    if (!userId) return
    const result = await openDirectChat(userId).catch(() => null)
    if (!result) return
    navigate(`/chat?chat=${encodeURIComponent(result.chat.id)}`)
  }

  return (
    <section className="space-y-4 p-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-slate-500">{profile.place}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
            aria-label="Logout"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Community Tree
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Growth dashboard</h3>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Users size={20} />
          </div>
        </div>
        <ProfileTree
          followers={profile.followers}
          plantedTrees={profile.plantedTrees}
          donatedTrees={profile.donatedTrees}
          verificationRate={verificationRate}
          streakDays={profile.streak}
        />
      </Card>

      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Impact Summary
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Planting, donations, and badges
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              A combined snapshot of your verified contribution and recognition.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Award size={20} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Planted Trees
              </p>
              <Sprout size={16} className="text-emerald-600" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {profile.plantedTrees}
            </p>
            <p className="mt-1 text-xs text-slate-500">Directly added through your verified posts.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Donated Trees
              </p>
              <Gift size={16} className="text-emerald-600" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {profile.donatedTrees}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Trees dedicated to your profile by friends and community members.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Badges Earned</p>
              <p className="text-xs text-slate-500">{badges.length} achievements unlocked so far</p>
            </div>
            <Pill text={`${badges.length} total`} className="border-emerald-200 bg-emerald-50 text-emerald-700" />
          </div>

          <div className="mt-3 space-y-2">
            {latestBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{badge.name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{badge.desc}</p>
                </div>
                <Pill text={badge.level} className={badgeToneByLevel[badge.level]} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-slate-900">Verification Rate</p>
        <p className="mt-1 text-2xl font-bold text-emerald-700">{verificationRate}%</p>
        <p className="text-xs text-slate-500">Based on recent planting validations</p>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Profile Comparison
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              See how your profile compares
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose any other profile and compare your current mandal performance.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Trophy size={20} />
          </div>
        </div>

        {myMandalRank && selectedCompareUser ? (
          <>
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {compareCandidates.map((leader) => (
                  <button
                    key={leader.name}
                    type="button"
                    onClick={() => setSelectedCompareName(leader.name)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      selectedCompareName === leader.name
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {leader.name}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Compare With
                </label>
                <select
                  value={selectedCompareName}
                  onChange={(event) => setSelectedCompareName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {compareCandidates.map((leader) => (
                    <option key={leader.name} value={leader.name}>
                      {leader.name} · Rank #{leader.rank}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
                  Your Profile
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{myMandalRank.name}</p>
                <p className="text-xs text-slate-500">
                  Rank #{myMandalRank.rank} in {myMandalRank.place}
                </p>
                <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                  {myMandalRank.score}
                </p>
                <p className="text-xs text-slate-500">Leaderboard points</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Compared Profile
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedCompareUser.name}</p>
                <p className="text-xs text-slate-500">
                  Rank #{selectedCompareUser.rank} in {selectedCompareUser.place}
                </p>
                <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                  {selectedCompareUser.score}
                </p>
                <p className="text-xs text-slate-500">Leaderboard points</p>
                {selectedCompareUser.id ? (
                  <button
                    type="button"
                    onClick={() => void handleOpenChat(selectedCompareUser.id)}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <MessageCircle size={16} />
                    Chat
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Head-to-head comparison</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {pointsGap > 0
                      ? `${pointsGap} points behind ${selectedCompareUser.name}`
                      : pointsGap < 0
                        ? `${Math.abs(pointsGap)} points ahead of ${selectedCompareUser.name}`
                        : `You are tied with ${selectedCompareUser.name}`}
                  </p>
                </div>
                <Pill
                  text={
                    pointsGap > 0
                      ? `+${pointsGap} to pass`
                      : pointsGap < 0
                        ? `${Math.abs(pointsGap)} ahead`
                        : 'Even match'
                  }
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                />
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Your score</span>
                    <span>{myMandalRank.score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{
                        width: `${Math.min((myMandalRank.score / Math.max(myMandalRank.score, selectedCompareUser.score)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{selectedCompareUser.name}'s score</span>
                    <span>{selectedCompareUser.score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-700"
                      style={{
                        width: `${Math.min((selectedCompareUser.score / Math.max(myMandalRank.score, selectedCompareUser.score)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <div className="flex items-start gap-2">
                  <ArrowUpRight size={16} className="mt-0.5 text-emerald-600" />
                  <p className="text-sm text-slate-600">
                    You have {myMandalRank.trees} verified trees versus {selectedCompareUser.trees} for{' '}
                    {selectedCompareUser.name}, with {badges.length} badges currently strengthening your
                    profile.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
            Comparison data is not available right now.
          </p>
        )}
      </Card>

      <Card>
        <p className="text-sm font-semibold text-slate-900">My Plantings</p>
        <div className="mt-3 space-y-2">
          {myPlantings.map((planting) => (
            <div
              key={planting.id}
              className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{planting.place}</p>
                <p className="text-xs text-slate-500">
                  {planting.date} • {planting.trees} trees
                </p>
              </div>
              <Pill text={planting.status} className={statusClassByType[planting.status]} />
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
