import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  Heart,
  HeartCrack,
  Languages,
  LogOut,
  MessageCircle,
  MessagesSquare,
  Scale,
  Search as SearchIcon,
  SendHorizontal,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Tags,
  TrendingDown,
  TrendingUp,
  BadgeDollarSign,
  CircleX,
  Ban,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { HeartButton } from '../components/PlateCards'
import { PlateTile } from '../components/Plate'
import { Avatar, BackButton, Badge, Button, Card, Chip, Container, cx, PageHeader, Price, SkeletonCards } from '../components/ui'
import { errorText, formatNumber, useAsync, useMonthYear, useTimeAgo } from '../lib/hooks'
import { getConversations, getMessages, getMyFavorites, getNotifications, markConversationRead, markNotificationsRead, sendMessage, startConversation } from '../services/api'
import { useAuth } from '../store/auth'
import { useFavorites } from '../store/favorites'
import type { ChatMessage, NotificationItem, NotificationType, SortKey } from '../types'
import { FormError } from './Auth'
import { ErrorState } from './ErrorPage'

const sorters: Record<SortKey, (a: { price: number; createdAt: string }, b: { price: number; createdAt: string }) => number> = {
  latest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  priceHigh: (a, b) => b.price - a.price,
  priceLow: (a, b) => a.price - b.price,
}

export function Favorites() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { ids } = useFavorites()
  const [sort, setSort] = useState<SortKey>('latest')
  const { data, loading, error, retry } = useAsync(getMyFavorites, [])
  // hearts un-ticked on this page disappear right away
  const saved = (data ?? []).filter((p) => ids.includes(p.id)).sort(sorters[sort])
  const options: SortKey[] = ['latest', 'priceHigh', 'priceLow']

  const contact = async (plateId: string) => {
    const { conversationId } = await startConversation(plateId)
    navigate(`/chats/${conversationId}`)
  }

  return (
    <main>
      <PageHeader
        back={false}
        title={t('favorites.title')}
        right={<span className="text-[13px] whitespace-nowrap text-muted">{t('favorites.count', { count: ids.length })}</span>}
      />
      <Container className="pt-5">
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1">
          {options.map((o) => (
            <Chip key={o} active={sort === o} onClick={() => setSort(o)}>
              {t(`search.${o}`)}
            </Chip>
          ))}
        </div>
        <div className="mt-4">
          {error ? (
            <ErrorState onRetry={retry} />
          ) : loading ? (
            <SkeletonCards />
          ) : saved.length === 0 ? (
            <div className="py-20 text-center">
              <span className="animate-pop relative mx-auto grid size-24 place-items-center rounded-full bg-danger/8 text-danger/70">
                <span className="animate-pulse-ring absolute inset-0 rounded-full border border-danger/20" />
                <HeartCrack size={42} strokeWidth={1.6} className="animate-float" aria-hidden />
              </span>
              <p className="mt-3 text-[18px] font-bold">{t('favorites.empty')}</p>
              <p className="mt-1 text-[13px] text-muted">{t('favorites.emptyBody')}</p>
              <Button to="/search" className="mx-auto mt-6 max-w-[240px]">
                {t('search.browseAll')}
              </Button>
            </div>
          ) : (
            <div className="animate-rise grid gap-3 lg:grid-cols-2 lg:gap-4">
              {saved.map((p) => (
                <Card key={p.id} className="relative flex items-center gap-4 p-4">
                  <Link to={`/plates/${p.id}`} className="shrink-0">
                    <PlateTile code={p.code} className="h-[84px] w-[106px] !p-2" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-muted">{t(`category.${p.category}`)}</p>
                    <Price value={p.price} className="text-[20px] font-bold" />
                    <p className={cx('inline-flex items-center gap-1 text-[11px]', p.weeklyChange >= 0 ? 'text-success' : 'text-danger')}>
                      {p.weeklyChange >= 0 ? <TrendingUp size={13} aria-hidden /> : <TrendingDown size={13} aria-hidden />}
                      <span dir="ltr">
                        {p.weeklyChange >= 0 ? '+' : ''}
                        {p.weeklyChange}%
                      </span>{' '}
                      {t('favorites.week')}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Link to="/estimate" className="press inline-flex items-center justify-center gap-1 rounded-[10px] bg-gold-tint py-1.5 text-[11px] font-bold text-[#8a6d33] hover:bg-gold/30">
                        <Scale size={13} aria-hidden /> {t('favorites.compare')}
                      </Link>
                      <button
                        onClick={() => contact(p.id)}
                        disabled={p.sold}
                        className="press inline-flex items-center justify-center gap-1 rounded-[10px] bg-gold py-1.5 text-[11px] font-bold text-ink hover:bg-gold-light disabled:bg-line disabled:text-muted"
                      >
                        <MessageCircle size={13} aria-hidden /> {p.sold ? t('details.sold') : t('common.contact')}
                      </button>
                    </div>
                  </div>
                  <span className="absolute end-2 top-2">
                    <HeartButton id={p.id} className="bg-danger/10" />
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
    </main>
  )
}

const notificationIcons: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  message: { icon: MessageCircle, tone: 'bg-sky-500/12 text-sky-600' },
  favorite: { icon: Heart, tone: 'bg-danger/10 text-danger' },
  price_change: { icon: TrendingUp, tone: 'bg-gold-tint text-[#8a6d33]' },
  purchase_request: { icon: BadgeDollarSign, tone: 'bg-success/12 text-success' },
  purchase_update: { icon: BadgeDollarSign, tone: 'bg-gold-tint text-[#8a6d33]' },
  listing_approved: { icon: BadgeCheck, tone: 'bg-success/12 text-success' },
  listing_rejected: { icon: CircleX, tone: 'bg-danger/10 text-danger' },
  listing_suspended: { icon: ShieldAlert, tone: 'bg-warning/15 text-warning' },
  verification_approved: { icon: ShieldCheck, tone: 'bg-success/12 text-success' },
  verification_rejected: { icon: ShieldAlert, tone: 'bg-danger/10 text-danger' },
  report_update: { icon: Bell, tone: 'bg-gold-tint text-[#8a6d33]' },
  account_banned: { icon: Ban, tone: 'bg-danger/10 text-danger' },
}

/** Where tapping a notification takes you */
function notificationLink(n: NotificationItem) {
  if (n.data.conversation_id) return `/chats/${n.data.conversation_id}`
  if (n.type.startsWith('listing_')) return '/seller'
  if (n.type.startsWith('verification_')) return '/verify-id'
  if (n.data.plate_id) return `/plates/${n.data.plate_id}`
  return undefined
}

export function Notifications() {
  const { t } = useTranslation()
  const timeAgo = useTimeAgo()
  const { refresh } = useAuth()
  const { data, loading, error, retry } = useAsync(getNotifications, [])
  const [allRead, setAllRead] = useState(false)

  const text = (n: NotificationItem, part: 'title' | 'body') => {
    const values: Record<string, unknown> = { ...n.data, reason: n.data.reason ?? '—' }
    for (const key of ['offered_price', 'old_price', 'new_price']) if (typeof n.data[key] === 'number') values[key] = formatNumber(n.data[key] as number)
    if (n.data.status) values.status = t(`requestStatus.${n.data.status}`)
    return t(`notif.${n.type}.${part}`, values)
  }

  const markAll = async () => {
    setAllRead(true)
    await markNotificationsRead().catch(() => undefined)
    refresh()
  }

  return (
    <main>
      <PageHeader
        title={t('notifications.title')}
        right={
          <button onClick={markAll} className="press inline-flex items-center gap-1 rounded-[10px] bg-gold-tint px-3 py-2 text-[11px] font-bold whitespace-nowrap text-[#8a6d33] hover:bg-gold/30">
            <CheckCheck size={14} aria-hidden /> {t('notifications.markAll')}
          </button>
        }
      />
      <div className="stagger mx-auto mt-4 max-w-[720px] space-y-2 lg:space-y-3">
        {error ? (
          <ErrorState onRetry={retry} />
        ) : loading ? (
          <Container>
            <SkeletonCards count={2} />
          </Container>
        ) : data?.items.length === 0 ? (
          <p className="py-20 text-center text-[15px] font-bold text-muted">{t('more.noNotifications')}</p>
        ) : (
          data?.items.map((n) => {
            const unread = n.unread && !allRead
            const { icon: Icon, tone } = notificationIcons[n.type] ?? { icon: Bell, tone: 'bg-gold-tint text-[#8a6d33]' }
            const to = notificationLink(n)
            const inner = (
              <>
                <span className={cx('grid size-11 shrink-0 place-items-center rounded-[14px]', tone)}>
                  <Icon size={20} strokeWidth={2.1} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">{text(n, 'title')}</p>
                  <p className="mt-1 text-[12px] text-muted">{text(n, 'body')}</p>
                </div>
                <div className="flex flex-col items-end gap-5">
                  <span className="text-[10px] whitespace-nowrap text-muted">{timeAgo(n.createdAt)}</span>
                  {unread && <span className="size-2.5 animate-pulse rounded-full bg-gold" />}
                </div>
              </>
            )
            const classes = cx('flex items-start gap-3.5 px-5 py-5 transition-colors duration-500 lg:rounded-[16px]', unread ? 'bg-cream' : 'bg-white', to && 'hover:bg-gold-tint/40')
            return to ? (
              <Link key={n.id} to={to} onClick={() => markNotificationsRead([n.id]).then(refresh)} className={classes}>
                {inner}
              </Link>
            ) : (
              <div key={n.id} className={classes}>
                {inner}
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}

export function Chats() {
  const { t } = useTranslation()
  const timeAgo = useTimeAgo()
  const [q, setQ] = useState('')
  const { data, loading, error, retry } = useAsync(getConversations, [])
  const list = data?.filter((c) => `${c.otherName} ${c.plateCode}`.toLowerCase().includes(q.toLowerCase())) ?? []

  return (
    <main>
      <PageHeader title={t('chats.title')} />
      <div className="mx-auto max-w-[720px]">
        <div className="px-5 py-5">
          <label className="flex h-[46px] items-center gap-2 rounded-[14px] border border-line bg-white px-3.5 transition-all duration-300 focus-within:border-gold focus-within:shadow-[0_0_0_4px_rgb(200_169_107/0.15)]">
            <SearchIcon size={17} className="text-muted" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('chats.search')}
              aria-label={t('chats.search')}
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted"
            />
          </label>
        </div>
        {error ? (
          <ErrorState onRetry={retry} />
        ) : loading ? (
          <Container>
            <SkeletonCards count={2} />
          </Container>
        ) : list.length === 0 ? (
          <p className="py-16 text-center text-[15px] font-bold text-muted">{t('more.noChats')}</p>
        ) : (
          <div className="stagger space-y-2">
            {list.map((c) => (
              <Link key={c.id} to={`/chats/${c.id}`} className="press flex items-center gap-3.5 bg-white px-4 py-3 hover:bg-cream/60 lg:rounded-[16px]">
                <Avatar letter={c.otherName.charAt(0)} size={48} className="!font-semibold" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">{c.otherName}</p>
                  <Badge className="my-0.5 !font-medium">
                    <span dir="ltr">{c.plateCode}</span>
                  </Badge>
                  <p className="truncate text-[12px] text-muted">{c.lastMessage ?? '…'}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] whitespace-nowrap text-muted">{timeAgo(c.lastMessageAt ?? c.createdAt)}</span>
                  {c.unread > 0 && <span className="animate-pop grid size-5 place-items-center rounded-full bg-gold text-[10px] font-bold">{c.unread}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

const POLL_MS = 4000

export function ChatConversation() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { refresh } = useAuth()
  const { data: conversations, error: listError, retry } = useAsync(getConversations, [id])
  const thread = conversations?.find((c) => c.id === id)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sendError, setSendError] = useState<string>()
  const end = useRef<HTMLDivElement>(null)
  const lastId = useRef(0)

  // Load the history, then ask for new messages every few seconds
  useEffect(() => {
    let active = true
    lastId.current = 0
    setMessages([])
    const load = async () => {
      try {
        const fresh = await getMessages(id, lastId.current || undefined)
        if (!active || fresh.length === 0) return
        lastId.current = fresh[fresh.length - 1].id
        setMessages((prev) => [...prev, ...fresh.filter((m) => !prev.some((p) => p.id === m.id))])
        markConversationRead(id).then(refresh).catch(() => undefined)
      } catch {
        // keep polling; the list error below covers a missing conversation
      }
    }
    load()
    const timer = setInterval(load, POLL_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setText('')
    setSendError(undefined)
    try {
      const message = await sendMessage(id, body)
      lastId.current = Math.max(lastId.current, message.id)
      setMessages((prev) => [...prev, message])
    } catch (err) {
      setText(body)
      setSendError(errorText(err))
    }
  }

  if (listError) return <ErrorState onRetry={retry} />
  if (conversations && !thread)
    return (
      <div className="px-5 py-24 text-center">
        <p className="text-[16px] font-bold">{t('more.noChats')}</p>
        <Button to="/chats" className="mx-auto mt-5 max-w-[240px]">
          {t('chats.title')}
        </Button>
      </div>
    )

  const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <main className="flex h-dvh flex-col lg:h-[calc(100dvh-72px)]">
      <div className="bg-night">
        <Container className="flex h-[76px] items-center gap-2.5 !px-3 lg:!px-5">
          <BackButton light fallback="/chats" />
          <Avatar letter={thread?.otherName.charAt(0) ?? ''} size={40} className="border-gold/60 !bg-gold/15" />
          <div>
            <p className="text-[15px] font-bold text-white">{thread?.otherName}</p>
            {thread?.otherVerified && (
              <p className="flex items-center gap-1 text-[11px] text-success">
                <BadgeCheck size={13} aria-hidden /> {t('common.verified')}
              </p>
            )}
          </div>
        </Container>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-5 pt-3 pb-4">
          {thread && (
            <div className="flex items-center justify-between rounded-[16px] border border-gold/40 bg-cream px-4 py-3">
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#8a6d33]">
                  <Tag size={14} aria-hidden /> {t('chats.plate', { code: '' })}
                  <span dir="ltr">{thread.plateCode}</span>
                </p>
                <p className="text-[11px]">
                  {t('chats.price', { price: '' })}
                  <Price value={thread.platePrice} /> • {thread.plateStatus === 'sold' ? t('chats.statusSold') : thread.plateStatus === 'active' ? t('chats.status') : t(`listingStatus.${thread.plateStatus}`)}
                </p>
              </div>
              <Link to={`/plates/${thread.plateId}`} className="press group inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-bold text-[#8a6d33] hover:bg-gold/20">
                {t('common.view')}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
              </Link>
            </div>
          )}
          <div className="mt-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={cx('animate-pop flex flex-col', m.mine ? 'items-end' : 'items-start')}>
                <p
                  dir="auto"
                  className={cx(
                    'max-w-[78%] rounded-[20px] px-4 py-2.5 text-[14px] whitespace-pre-wrap',
                    m.mine ? 'rounded-ee-[6px] bg-gradient-to-br from-gold-light to-gold text-ink shadow-l2' : 'rounded-es-[6px] bg-white shadow-l1',
                  )}
                >
                  {m.body}
                </p>
                <span dir="ltr" className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted">
                  {time(m.createdAt)}
                  {m.mine && <CheckCheck size={13} className="text-sky-500" aria-hidden />}
                </span>
              </div>
            ))}
            <div ref={end} />
          </div>
        </div>
      </div>
      <form onSubmit={send} className="border-t border-line bg-white">
        {sendError && (
          <div className="mx-auto max-w-[720px] px-4 pt-3">
            <FormError message={sendError} />
          </div>
        )}
        <div className="mx-auto flex max-w-[720px] items-center gap-3 px-4 py-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            placeholder={t('chats.placeholder')}
            aria-label={t('chats.placeholder')}
            className="h-[48px] min-w-0 flex-1 rounded-full border border-line bg-offwhite px-5 text-[14px] outline-none transition-all duration-300 placeholder:text-muted focus:border-gold focus:bg-white focus:shadow-[0_0_0_4px_rgb(200_169_107/0.15)]"
          />
          <button aria-label={t('chats.send')} disabled={!text.trim()} className="press grid size-[48px] shrink-0 place-items-center rounded-full bg-gold text-ink hover:bg-gold-light disabled:bg-line disabled:text-muted">
            <SendHorizontal size={20} strokeWidth={2.3} className="rtl:-scale-x-100" aria-hidden />
          </button>
        </div>
      </form>
    </main>
  )
}

function MenuRow({ icon: Icon, label, to, badge, onClick, tone = 'bg-gold-tint text-[#8a6d33]', danger }: { icon: LucideIcon; label: string; to?: string; badge?: number; onClick?: () => void; tone?: string; danger?: boolean }) {
  const inner = (
    <>
      <span className={cx('grid size-10 shrink-0 place-items-center rounded-[12px] transition-transform duration-300 group-hover:scale-110', danger ? 'bg-danger/10 text-danger' : tone)}>
        <Icon size={19} strokeWidth={2.1} aria-hidden />
      </span>
      <span className={cx('flex-1 text-start text-[14px]', danger && 'font-semibold text-danger')}>{label}</span>
      {badge ? <span className="grid size-6 place-items-center rounded-full bg-gold text-[11px] font-bold">{badge}</span> : null}
      <ChevronRight size={18} className="text-muted transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
    </>
  )
  const classes = 'lift group flex w-full items-center gap-3 rounded-[16px] bg-white px-3.5 py-2.5 shadow-l1'
  return to ? (
    <Link to={to} className={classes}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={classes}>
      {inner}
    </button>
  )
}

export function Profile() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const monthYear = useMonthYear()
  const { user, stats, logout } = useAuth()
  const { data: chats } = useAsync(getConversations, [])
  if (!user) return null
  const unreadChats = chats?.reduce((sum, c) => sum + c.unread, 0) ?? 0
  const verified = user.verificationStatus === 'verified'

  const cells = [
    { value: stats?.sales ?? 0, label: t('profile.sales') },
    { value: stats?.favorites ?? 0, label: t('profile.favorites') },
    { value: stats?.listings ?? 0, label: t('profile.listings') },
  ]

  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main>
      <div className="bg-gradient-to-b from-night to-[#1a1408] pt-5 pb-14 text-center">
        <Container>
          <h1 className="text-[18px] font-bold text-white">{t('profile.title')}</h1>
          <div className="animate-pop relative mx-auto mt-4 size-[84px]">
            <span className="animate-glow absolute inset-0 rounded-full" />
            <Avatar letter={user.fullName.charAt(0)} size={84} className="border-2 !bg-gold/15" />
            {verified && (
              <span className="absolute end-0 bottom-0 grid size-6 place-items-center rounded-full border-2 border-night bg-success text-white">
                <Check size={13} strokeWidth={3} aria-hidden />
              </span>
            )}
          </div>
          <p className="mt-3 text-[18px] font-bold text-white">{user.fullName}</p>
          <p dir="ltr" className="text-[12px] text-white/50">{user.email}</p>
          {verified ? (
            <p className="inline-flex items-center gap-1 text-[12px] text-success">
              <ShieldCheck size={14} aria-hidden /> {t('common.verifiedAccount')}
            </p>
          ) : (
            <Link to="/verify-id" className="mt-1 inline-flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1 text-[12px] font-semibold text-warning">
              <ShieldAlert size={14} aria-hidden /> {user.verificationStatus === 'pending' ? t('more.verifyPending') : t('more.verifyNow')}
            </Link>
          )}
          <p className="mt-1 text-[11px] text-muted">{t('profile.since', { date: monthYear(user.createdAt) })}</p>
        </Container>
      </div>
      <Container narrow className="-mt-9">
        <Card className="stagger grid grid-cols-3 py-3.5">
          {cells.map((s) => (
            <div key={s.label} className="border-line text-center not-last:border-e">
              <p dir="ltr" className="text-[20px] font-bold text-gold">
                {s.value}
              </p>
              <p className="text-[10px] text-muted">{s.label}</p>
            </div>
          ))}
        </Card>
        <h2 className="mt-6 mb-2.5 text-[13px] font-bold text-muted">{t('profile.account')}</h2>
        <div className="stagger space-y-2">
          <MenuRow icon={Tags} label={t('profile.myListings')} to="/seller" />
          <MenuRow icon={Heart} tone="bg-danger/10 text-danger" label={t('profile.saved')} to="/favorites" />
          <MenuRow icon={MessagesSquare} tone="bg-sky-500/12 text-sky-600" label={t('profile.chats')} to="/chats" badge={unreadChats} />
        </div>
        <h2 className="mt-6 mb-2.5 text-[13px] font-bold text-muted">{t('profile.settings')}</h2>
        <div className="stagger space-y-2">
          <MenuRow icon={BellRing} label={t('profile.notifications')} to="/notifications" badge={stats?.unreadNotifications} />
          <MenuRow icon={ShieldCheck} tone="bg-success/12 text-success" label={t('profile.security')} to="/verify-id" />
          {user.role === 'admin' && <MenuRow icon={ShieldAlert} tone="bg-purple/12 text-purple" label={t('admin.panel')} to="/admin/dashboard" />}
          <MenuRow icon={Languages} tone="bg-sky-500/12 text-sky-600" label={`${t('common.language')}: ${t('common.langName')}`} onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')} />
          <MenuRow icon={LogOut} danger label={t('profile.logout')} onClick={signOut} />
        </div>
      </Container>
    </main>
  )
}
