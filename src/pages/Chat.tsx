import { SendHorizontal, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Card from '../components/Card'
import Input from '../components/Input'
import {
  fetchChatMessages,
  fetchChats,
  sendChatMessage,
  type ChatMessage,
  type ChatSummary,
} from '../services/backendApi'

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatChatTime(value: string) {
  const date = new Date(value)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()

  if (isToday) return formatMessageTime(value)
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function Chat() {
  const [searchParams] = useSearchParams()
  const requestedChatId = searchParams.get('chat') ?? ''
  const [search, setSearch] = useState('')
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [activeChatId, setActiveChatId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messageListRef = useRef<HTMLDivElement | null>(null)

  const activeChat = chats.find((chat) => chat.id === activeChatId)

  const loadChats = async () => {
    const payload = await fetchChats()
    setChats(payload.chats)
    setActiveChatId((current) => {
      if (requestedChatId && payload.chats.some((chat) => chat.id === requestedChatId)) {
        return requestedChatId
      }

      return current || payload.chats[0]?.id || ''
    })
  }

  useEffect(() => {
    let active = true

    setLoadingChats(true)
    loadChats()
      .catch((chatError) => {
        if (active) {
          setError(chatError instanceof Error ? chatError.message : 'Unable to load chats')
          setChats([])
        }
      })
      .finally(() => {
        if (active) setLoadingChats(false)
      })

    const intervalId = window.setInterval(() => {
      loadChats().catch(() => undefined)
    }, 8000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [requestedChatId])

  useEffect(() => {
    if (requestedChatId) {
      setActiveChatId(requestedChatId)
    }
  }, [requestedChatId])

  useEffect(() => {
    if (!activeChatId) return

    let active = true

    const loadMessages = (showLoading: boolean) => {
      if (showLoading) setLoadingMessages(true)
      fetchChatMessages(activeChatId)
        .then((payload) => {
          if (active) setMessages(payload.messages)
        })
        .catch((messageError) => {
          if (active) {
            setError(messageError instanceof Error ? messageError.message : 'Unable to load messages')
            setMessages([])
          }
        })
        .finally(() => {
          if (active && showLoading) setLoadingMessages(false)
        })
    }

    loadMessages(true)
    const intervalId = window.setInterval(() => loadMessages(false), 3000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [activeChatId])

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages.length, activeChatId])

  const filteredChats = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) return chats
    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(query) ||
        chat.message.toLowerCase().includes(query)
    )
  }, [chats, search])

  const handleSend = async () => {
    const body = draft.trim()
    if (!activeChatId || !body) return

    setSending(true)
    setError('')

    const result = await sendChatMessage(activeChatId, body).catch((sendError) => {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send message')
      return null
    })

    setSending(false)

    if (!result) return

    setDraft('')
    setMessages((current) => [...current, result.message])
    setChats((current) =>
      current.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, message: result.message.body, time: result.message.createdAt }
          : chat
      )
    )
  }

  return (
    <section className="space-y-4 p-4">
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Community Chat</h2>
            <p className="mt-1 text-sm text-slate-500">
              Talk with planters in your shared community room.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search chats..."
          />
        </div>
      </Card>

      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-rose-700">
            Dismiss
          </button>
        </div>
      ) : null}

      <Card className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {loadingChats ? (
            <p className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-500">Loading chats...</p>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => setActiveChatId(chat.id)}
                className={`min-w-[11rem] rounded-2xl border p-3 text-left transition ${
                  activeChatId === chat.id
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{chat.name}</p>
                  <span className="text-[11px] font-medium text-slate-400">
                    {formatChatTime(chat.time)}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {chat.message || 'No messages yet'}
                </p>
              </button>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">No chats found.</p>
          )}
        </div>
      </Card>

      <Card className="flex min-h-[26rem] flex-col p-0">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">{activeChat?.name ?? 'Community Chat'}</p>
          <p className="text-xs text-slate-500">
            {activeChat?.kind === 'COMMUNITY' ? 'Live community room' : 'Direct conversation'}
          </p>
        </div>

        <div ref={messageListRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {loadingMessages ? (
            <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">Loading messages...</p>
          ) : messages.length > 0 ? (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 ${
                    message.mine
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  {!message.mine ? (
                    <p className="mb-1 text-[11px] font-semibold text-emerald-700">
                      {message.user.name}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap text-sm leading-5">{message.body}</p>
                  <p className={`mt-1 text-right text-[10px] ${message.mine ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
              No messages yet. Start the conversation.
            </p>
          )}
        </div>

        <form
          className="flex gap-2 border-t border-slate-100 p-3"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSend()
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={1000}
            placeholder="Type a message..."
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim() || !activeChatId}
            aria-label="Send message"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            <SendHorizontal size={20} />
          </button>
        </form>
      </Card>
    </section>
  )
}
