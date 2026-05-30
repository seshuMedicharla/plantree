import { MessageCircle } from 'lucide-react'

type UserPreviewProps = {
  name: string
  bio: string
  impact: number
  joined: string
  canChat?: boolean
  onChat?: () => void
}

export default function UserPreview({ name, bio, impact, joined, canChat = false, onChat }: UserPreviewProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        {canChat ? (
          <button
            type="button"
            onClick={onChat}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            <MessageCircle size={14} />
            Chat
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-slate-600">{bio}</p>
      <p className="mt-2 text-xs text-slate-700">Impact Score: {impact}</p>
      <p className="text-xs text-slate-500">Joined: {joined}</p>
    </div>
  )
}
