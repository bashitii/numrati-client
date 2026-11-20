import { AlertCircle, History, Loader2, MessageCircleQuestion, MessageSquarePlus, SendHorizontal, Sparkles, Trash2, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Markdown } from '../components/Markdown'
import { BackButton, cx } from '../components/ui'
import type { AssistantMessage, SavedChat } from '../services/assistant'
import { askAssistant, deleteSavedChat, getChatHistory, getSavedChat } from '../services/assistant'
import { useAuth } from '../store/auth'

type Group = 'today' | 'yesterday' | 'lastWeek' | 'older'

/** Puts each saved chat under Today, Yesterday, Last 7 days or Older */
function groupChats(chats: SavedChat[]) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const day = 24 * 60 * 60 * 1000
  const groups: { key: Group; chats: SavedChat[] }[] = [
    { key: 'today', chats: [] },
    { key: 'yesterday', chats: [] },
    { key: 'lastWeek', chats: [] },
    { key: 'older', chats: [] },
  ]
  for (const chat of chats) {
    const time = new Date(chat.updatedAt).getTime()
    if (time >= startOfToday.getTime()) groups[0].chats.push(chat)
    else if (time >= startOfToday.getTime() - day) groups[1].chats.push(chat)
    else if (time >= startOfToday.getTime() - 7 * day) groups[2].chats.push(chat)
    else groups[3].chats.push(chat)
  }
  return groups.filter((g) => g.chats.length > 0)
}

export function Assistant() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  // The id of the chat on screen. A new chat gets a new id.
  const [chatId, setChatId] = useState<string>(() => crypto.randomUUID())
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  // Saved chats of the signed-in user
  const [chats, setChats] = useState<SavedChat[]>([])
  const [chatsState, setChatsState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [opening, setOpening] = useState<string | null>(null)
  // The history drawer on phones (on big screens the history is always on the side)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  const suggestions = t('assistant.suggestions', { returnObjects: true }) as string[]

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function loadChats() {
    if (!user) return
    try {
      setChats(await getChatHistory())
      setChatsState('ready')
    } catch {
      setChatsState('error')
    }
  }

  useEffect(() => {
    if (user) loadChats()
    else setChats([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function send(question: string) {
    if (!question.trim() || busy) return
    const withQuestion: AssistantMessage[] = [...messages, { role: 'user', text: question.trim() }]
    setMessages(withQuestion)
    setText('')
    setError(false)
    setBusy(true)
    try {
      // Gemini sends the answer a sentence at a time. We show it word by word:
      // `received` is what has arrived so far, `shown` is how much of it is on screen.
      let received = ''
      let shown = 0
      let finished = false
      await new Promise<void>((resolve, reject) => {
        const timer = setInterval(() => {
          if (shown < received.length) {
            // Show 1 word at a time, or 3 when we are far behind
            const wordsBehind = received.slice(shown).split(/\s+/).length
            const step = wordsBehind > 40 ? 3 : 1
            for (let i = 0; i < step && shown < received.length; i++) {
              const nextWord = received.slice(shown).match(/^\s*\S+\s*/)
              shown += nextWord ? nextWord[0].length : received.length - shown
            }
            setMessages([...withQuestion, { role: 'model', text: received.slice(0, shown) }])
          } else if (finished) {
            clearInterval(timer)
            resolve()
          }
        }, 30)
        askAssistant(chatId, question.trim(), messages, (text) => (received = text))
          .then(() => (finished = true))
          .catch((err) => {
            clearInterval(timer)
            reject(err)
          })
      })
      loadChats() // the chat is now saved, so refresh the list
    } catch {
      setMessages(withQuestion)
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  function startNewChat() {
    setMessages([])
    setChatId(crypto.randomUUID())
    setError(false)
    setDrawerOpen(false)
  }

  async function openChat(id: string) {
    if (busy) return
    setOpening(id)
    try {
      const saved = await getSavedChat(id)
      setMessages(saved.messages)
      setChatId(saved.id)
      setError(false)
      setDrawerOpen(false)
    } catch {
      setChatsState('error')
    } finally {
      setOpening(null)
    }
  }

  async function removeChat(id: string) {
    try {
      await deleteSavedChat(id)
      setChats((items) => items.filter((c) => c.id !== id))
      if (id === chatId) startNewChat()
    } catch {
      setChatsState('error')
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(text)
  }

  const waiting = busy && messages[messages.length - 1]?.role === 'user'

  // The list of past chats. Used in the side panel (big screens) and the drawer (phones).
  const historyList = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <p className="text-[13px] font-bold tracking-wide text-charcoal">{t('assistant.historyTitle')}</p>
        <button
          onClick={() => setDrawerOpen(false)}
          aria-label={t('assistant.closeHistory')}
          className="press grid size-8 place-items-center rounded-full text-muted hover:bg-offwhite lg:hidden"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={startNewChat}
          disabled={busy}
          className="press flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-gold/60 bg-gold-tint text-[14px] font-semibold text-[#6f5523] hover:border-gold hover:bg-gold/20 disabled:opacity-50"
        >
          <MessageSquarePlus size={17} aria-hidden /> {t('assistant.newChat')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {!user && (
          <div className="rounded-[16px] bg-offwhite px-4 py-5 text-center">
            <History size={22} className="mx-auto text-gold" aria-hidden />
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{t('assistant.historyGuest')}</p>
            <Link
              to="/login"
              state={{ from: '/assistant' }}
              className="press mt-3 inline-flex h-9 items-center rounded-full bg-gold px-5 text-[13px] font-semibold text-ink hover:bg-gold-light"
            >
              {t('auth.signIn')}
            </Link>
          </div>
        )}

        {user && chatsState === 'loading' && (
          <div className="space-y-2 px-1 pt-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-[12px] bg-offwhite" />
            ))}
          </div>
        )}

        {user && chatsState === 'error' && (
          <div role="alert" className="rounded-[14px] bg-danger/10 px-4 py-3 text-[13px] text-danger">
            <p className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" aria-hidden /> {t('assistant.historyError')}
            </p>
            <button onClick={loadChats} className="mt-2 font-semibold underline">
              {t('assistant.retry')}
            </button>
          </div>
        )}

        {user && chatsState === 'ready' && chats.length === 0 && (
          <p className="px-2 pt-2 text-center text-[13px] leading-relaxed text-muted">{t('assistant.historyEmpty')}</p>
        )}

        {user &&
          chatsState === 'ready' &&
          groupChats(chats).map((group) => (
            <div key={group.key} className="mb-3">
              <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold text-muted">{t(`assistant.${group.key}`)}</p>
              <ul className="space-y-0.5">
                {group.chats.map((chat) => {
                  const active = chat.id === chatId
                  return (
                    <li key={chat.id} className="group relative">
                      <button
                        onClick={() => openChat(chat.id)}
                        className={cx(
                          'flex w-full items-center gap-2 rounded-[12px] py-2.5 ps-3 pe-10 text-start text-[14px] transition-colors',
                          active ? 'bg-gold-tint font-semibold text-ink' : 'text-charcoal hover:bg-offwhite',
                        )}
                      >
                        {active && <span aria-hidden className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-gold" />}
                        <span dir="auto" className="min-w-0 flex-1 truncate">
                          {chat.title}
                        </span>
                        {opening === chat.id && <Loader2 size={14} className="shrink-0 animate-spin text-gold" aria-hidden />}
                      </button>
                      <button
                        onClick={() => removeChat(chat.id)}
                        aria-label={t('assistant.deleteChat')}
                        className="press absolute end-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted opacity-100 transition-opacity hover:bg-danger/10 hover:text-danger lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
      </div>
    </div>
  )

  return (
    <main className="flex h-dvh flex-col lg:h-[calc(100dvh-73px)]">
      <div className="bg-night">
        <div className="flex h-[76px] items-center gap-2.5 px-3 lg:px-5">
          <BackButton light fallback="/home" />
          <span className="relative grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-gold/60 bg-gold/15 text-gold">
            <Sparkles size={20} className={cx(busy && 'animate-spin [animation-duration:2.5s]')} aria-hidden />
            {/* Online dot */}
            <span className="absolute -end-0.5 -bottom-0.5 size-3 rounded-full bg-success ring-2 ring-night" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-white">{t('assistant.title')}</p>
            <p key={String(busy)} className="animate-rise truncate text-[11px] text-white/60">
              {busy ? t('assistant.typing') : t('assistant.subtitle')}
            </p>
          </div>
          {/* On phones: open the history drawer and start a new chat from the header */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label={t('assistant.history')}
            className="press grid size-9 place-items-center rounded-full border border-white/20 bg-white/8 text-white hover:bg-white/15 lg:hidden"
          >
            <History size={16} aria-hidden />
          </button>
          {messages.length > 0 && (
            <button
              onClick={startNewChat}
              disabled={busy}
              aria-label={t('assistant.newChat')}
              className="press animate-pop grid size-9 place-items-center rounded-full border border-white/20 bg-white/8 text-white hover:bg-white/15 disabled:opacity-50 lg:hidden"
            >
              <MessageSquarePlus size={16} aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* History on the side (big screens) */}
        <aside className="hidden w-[280px] shrink-0 border-e border-line bg-white lg:block">{historyList}</aside>

        {/* The chat */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[720px] px-5 pt-4 pb-4">
              {messages.length === 0 && (
                <div className="pt-6 text-center">
                  <div className="animate-pop relative mx-auto grid size-20 place-items-center">
                    <span aria-hidden className="animate-pulse-ring absolute inset-0 rounded-full bg-gold/20" />
                    <span className="animate-float relative grid size-16 place-items-center rounded-full bg-gradient-to-br from-gold-light to-gold text-ink shadow-l3">
                      <Sparkles size={30} strokeWidth={2} aria-hidden />
                    </span>
                  </div>
                  <h2 className="animate-rise mt-4 text-[20px] font-bold [animation-delay:100ms]">{t('assistant.welcome')}</h2>
                  <p className="animate-rise mx-auto mt-1 max-w-[420px] text-[13px] text-muted [animation-delay:160ms]">{t('assistant.welcomeBody')}</p>
                  <div className="stagger mt-6 grid gap-2.5 [animation-delay:200ms] sm:grid-cols-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="lift group flex items-center gap-3 rounded-[16px] border border-line bg-white px-4 py-3 text-start text-[14px] hover:border-gold"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-tint text-[#8a6d33] transition-colors group-hover:bg-gold group-hover:text-ink">
                          <MessageCircleQuestion size={16} aria-hidden />
                        </span>
                        <span className="flex-1">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={cx('flex items-end gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {m.role === 'model' && (
                      <span className="animate-pop grid size-7 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                        <Sparkles size={14} aria-hidden />
                      </span>
                    )}
                    <div
                      dir="auto"
                      className={cx(
                        'animate-pop max-w-[85%] px-4 py-3 text-[15px] leading-[1.8]',
                        m.role === 'user'
                          ? 'origin-bottom rounded-[20px] rounded-ee-[6px] bg-gradient-to-br from-gold-light to-gold text-ink shadow-l2'
                          : 'origin-bottom rounded-[20px] rounded-es-[6px] bg-white shadow-l1',
                      )}
                    >
                      {m.role === 'user' ? m.text : <Markdown text={m.text} />}
                    </div>
                  </div>
                ))}

                {waiting && (
                  <div className="animate-pop flex items-end justify-start gap-2" role="status" aria-label={t('assistant.typing')}>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                      <Sparkles size={14} aria-hidden />
                    </span>
                    <div className="flex gap-1.5 rounded-[20px] rounded-es-[6px] bg-white px-4 py-4 shadow-l1">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="size-2 animate-bounce rounded-full bg-gold" style={{ animationDelay: `${d * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <p role="alert" className="animate-pop flex items-center gap-2 rounded-[14px] bg-danger/10 px-4 py-3 text-[13px] text-danger">
                    <AlertCircle size={16} className="shrink-0" aria-hidden /> {t('assistant.error')}
                  </p>
                )}
                <div ref={end} />
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="border-t border-line bg-white">
            <div className="mx-auto max-w-[720px] px-4 pt-3 pb-2">
              <div className="flex items-center gap-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('assistant.placeholder')}
                  aria-label={t('assistant.placeholder')}
                  dir="auto"
                  className="h-[48px] min-w-0 flex-1 rounded-full border border-line bg-offwhite px-5 text-[15px] outline-none transition-all duration-300 placeholder:text-muted focus:border-gold focus:bg-white focus:shadow-[0_0_0_4px_rgb(200_169_107/0.15)]"
                />
                <button
                  disabled={busy || !text.trim()}
                  aria-label={t('assistant.send')}
                  className={cx(
                    'press grid size-[48px] shrink-0 place-items-center rounded-full bg-gold text-ink hover:bg-gold-light disabled:bg-line disabled:text-muted',
                    text.trim() && !busy && 'shadow-[0_6px_16px_rgb(200_169_107/0.45)]',
                  )}
                >
                  {busy ? (
                    <Loader2 size={20} className="animate-spin" aria-hidden />
                  ) : (
                    <SendHorizontal size={20} strokeWidth={2.3} className={cx('transition-transform duration-300 rtl:-scale-x-100', text.trim() && '-rotate-12 rtl:rotate-12')} aria-hidden />
                  )}
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted">{t('assistant.disclaimer')}</p>
            </div>
          </form>
        </section>
      </div>

      {/* History drawer (phones): slides in from the side over the chat */}
      <div className={cx('fixed inset-0 z-50 lg:hidden', !drawerOpen && 'pointer-events-none')} aria-hidden={!drawerOpen}>
        <div
          onClick={() => setDrawerOpen(false)}
          className={cx('absolute inset-0 bg-ink/50 transition-opacity duration-300', drawerOpen ? 'opacity-100' : 'opacity-0')}
        />
        <aside
          className={cx(
            'absolute inset-y-0 start-0 w-[86%] max-w-[320px] bg-white shadow-l3 transition-transform duration-300 ease-out',
            drawerOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full',
          )}
        >
          {historyList}
        </aside>
      </div>
    </main>
  )
}
