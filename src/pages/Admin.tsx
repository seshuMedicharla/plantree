import { KeyRound, ShieldCheck, UserCog } from 'lucide-react'
import { useEffect, useState } from 'react'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import {
  fetchAdminPlantings,
  fetchAdminUsers,
  rejectAdminPlanting,
  resetAdminUserPassword,
  updateAdminUserRole,
  verifyAdminPlanting,
  type AdminPlanting,
  type AdminUser,
} from '../services/adminApi'

export default function Admin() {
  const [plantings, setPlantings] = useState<AdminPlanting[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [rejectReason, setRejectReason] = useState('')
  const [selectedPlantingId, setSelectedPlantingId] = useState<string | null>(null)
  const [passwordResetUserId, setPasswordResetUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [message, setMessage] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  const loadAdminData = async () => {
    setLoading(true)
    setError(undefined)

    try {
      const [plantingPayload, userPayload] = await Promise.all([
        fetchAdminPlantings('PENDING'),
        fetchAdminUsers(),
      ])
      setPlantings(plantingPayload.plantings)
      setUsers(userPayload.users)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAdminData()
  }, [])

  const handleVerify = async (plantingId: string) => {
    setError(undefined)
    await verifyAdminPlanting(plantingId)
    setMessage('Planting verified.')
    await loadAdminData()
  }

  const handleReject = async (plantingId: string) => {
    if (rejectReason.trim().length < 3) {
      setError('Add a rejection reason.')
      return
    }

    setError(undefined)
    await rejectAdminPlanting(plantingId, rejectReason.trim())
    setRejectReason('')
    setSelectedPlantingId(null)
    setMessage('Planting rejected.')
    await loadAdminData()
  }

  const handleRoleChange = async (userId: string, role: 'USER' | 'ADMIN') => {
    setError(undefined)
    await updateAdminUserRole(userId, role)
    setMessage('User role updated.')
    await loadAdminData()
  }

  const openPasswordReset = (userId: string) => {
    setPasswordResetUserId((current) => (current === userId ? null : userId))
    setNewPassword('')
    setConfirmPassword('')
    setError(undefined)
    setMessage(undefined)
  }

  const handlePasswordReset = async (user: AdminUser) => {
    const identifier = user.username ?? user.email

    if (!identifier) {
      setError('This user does not have username or email.')
      return
    }

    if (
      newPassword.length < 8 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      setError('Password must be at least 8 characters and include a letter and number.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setResettingPassword(true)
    setError(undefined)

    try {
      await resetAdminUserPassword(identifier, newPassword)
      setMessage(`Password updated for ${user.username ?? user.email}.`)
      setPasswordResetUserId(null)
      setNewPassword('')
      setConfirmPassword('')
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Password reset failed.')
    } finally {
      setResettingPassword(false)
    }
  }

  return (
    <section className="space-y-4 px-4 pb-4">
      <Card>
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-700">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Admin Review</h2>
            <p className="text-sm text-slate-600">Verify plantings and manage user access.</p>
          </div>
        </div>

        {loading ? <p className="mt-4 text-sm text-slate-500">Loading...</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-slate-900">Pending Plantings</h3>
        <div className="mt-3 space-y-3">
          {plantings.length === 0 ? (
            <p className="text-sm text-slate-500">No pending plantings.</p>
          ) : (
            plantings.map((planting) => (
              <div key={planting.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{planting.user.name}</p>
                    <p className="text-xs text-slate-500">
                      {planting.count} {planting.species} tree(s)
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {planting.location.lat.toFixed(5)}, {planting.location.lon.toFixed(5)}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                    {planting.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button onClick={() => void handleVerify(planting.id)}>Verify</Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setSelectedPlantingId((current) => (current === planting.id ? null : planting.id))
                    }
                  >
                    Reject
                  </Button>
                </div>

                {selectedPlantingId === planting.id ? (
                  <div className="mt-3 space-y-2">
                    <Input
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      placeholder="Rejection reason"
                    />
                    <Button variant="secondary" onClick={() => void handleReject(planting.id)}>
                      Confirm Reject
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <UserCog size={18} className="text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Users</h3>
        </div>

        <div className="mt-3 space-y-2">
          {users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.username ?? 'No username'}</p>
                  {user.email ? <p className="truncate text-xs text-slate-500">{user.email}</p> : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openPasswordReset(user.id)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                    aria-label={`Reset password for ${user.username ?? user.email ?? user.name}`}
                  >
                    <KeyRound size={18} />
                  </button>
                  <Button
                    className="w-20 px-2"
                    variant={user.role === 'ADMIN' ? 'secondary' : 'ghost'}
                    onClick={() => void handleRoleChange(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                  >
                    {user.role}
                  </Button>
                </div>
              </div>

              {passwordResetUserId === user.id ? (
                <div className="mt-3 space-y-2 rounded-2xl border border-emerald-100 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Admin password reset
                  </p>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="New password"
                  />
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => void handlePasswordReset(user)}
                      disabled={resettingPassword}
                    >
                      {resettingPassword ? 'Saving...' : 'Save Password'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => openPasswordReset(user.id)}
                      disabled={resettingPassword}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
