import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Plate, PlateTile } from '../components/Plate'
import { Avatar, Badge, Button, Card, Container, cx, Field, LanguageToggle, PageHeader, Price } from '../components/ui'
import { errorText, formatNumber, useAsync, useTimeAgo } from '../lib/hooks'
import { admin } from '../services/api'
import { useAuth } from '../store/auth'
import type { AdminActivity, DvldPlate, ReportStatus } from '../types'
import { FormError } from './Auth'
import { ErrorState } from './ErrorPage'

export function AdminLogin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, login, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!email || !password) return
    setBusy(true)
    setError(undefined)
    try {
      const signedIn = await login(email.trim(), password)
      if (signedIn.role !== 'admin') {
        await logout()
        setError(t('more.notAdmin'))
        setBusy(false)
        return
      }
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  const inputClass = '[&_label]:!border-white/20 [&_label]:!bg-white/5 [&_input]:!text-white [&_input]:placeholder:!text-white/40'

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-night px-5 pt-16 pb-10 text-center">
      <LanguageToggle className="absolute end-4 top-4 z-10" />
      <div className="relative grid size-[100px] place-items-center rounded-full border border-gold/50 bg-gold/15 text-[44px]">
        {[260, 360, 480].map((size) => (
          <span key={size} style={{ width: size, height: size, top: 50 - size / 2, insetInlineStart: 50 - size / 2 }} className="animate-pulse-ring absolute rounded-full border border-white/5" />
        ))}
        🛡️
      </div>
      <h1 className="relative mt-5 text-[26px] font-extrabold text-white">{t('admin.panel')}</h1>
      <p className="relative mt-1 text-[12px] text-muted">🔒 {t('admin.restricted')}</p>

      {user?.role === 'admin' ? (
        <div className="relative mt-8 w-full max-w-[350px] space-y-3 rounded-[28px] border border-white/15 bg-surface p-5">
          <p className="text-[13px] text-white/70">{t('more.welcomeAdmin', { name: user.fullName })}</p>
          <Button to="/admin/dashboard">{t('common.open')}</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="relative mt-8 w-full max-w-[350px] space-y-3.5 rounded-[28px] border border-white/15 bg-surface p-5 text-start">
          <Field className={inputClass} label={t('auth.email')} type="email" dir="ltr" placeholder="admin@numrati.jo" value={email} onChange={(e) => setEmail(e.target.value)} error={touched && !email ? t('auth.required') : undefined} />
          <Field className={inputClass} label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={touched && !password ? t('auth.required') : undefined} />
          <FormError message={error} />
          <Button type="submit" disabled={busy}>
            {busy ? t('common.loading') : t('admin.secureLogin')}
          </Button>
        </form>
      )}
      <p className="relative mt-6 max-w-[300px] text-[11px] text-white/30">{t('admin.notice')}</p>
    </main>
  )
}

function AdminStat({ icon, tint, value, label }: { icon: string; tint: string; value: string; label: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={cx('grid size-11 shrink-0 place-items-center rounded-full text-[18px]', tint)}>{icon}</span>
      <div>
        <p dir="ltr" className="text-[24px] leading-tight font-extrabold rtl:text-end">
          {value}
        </p>
        <p className="text-[11px] text-muted">{label}</p>
      </div>
    </Card>
  )
}

const activityIcon = (action: string) =>
  action.endsWith('approve') || action.endsWith('restore') || action === 'report_closed'
    ? { icon: '✅', tint: 'bg-success/12' }
    : action.endsWith('reject') || action.endsWith('ban') || action.endsWith('remove')
      ? { icon: '🚫', tint: 'bg-danger/10' }
      : { icon: '⚠️', tint: 'bg-warning/15' }

export function AdminDashboard() {
  const { t } = useTranslation()
  const timeAgo = useTimeAgo()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { data, error, retry } = useAsync(admin.dashboard, [])

  if (error) return <ErrorState onRetry={retry} />

  const stats = [
    { icon: '👥', tint: 'bg-gold-tint', value: formatNumber(data?.users ?? 0), label: t('admin.users') },
    { icon: '⏳', tint: 'bg-warning/15', value: formatNumber(data?.pendingVerifications ?? 0), label: t('admin.pendingVerify') },
    { icon: '🏷️', tint: 'bg-success/12', value: formatNumber(data?.activeListings ?? 0), label: t('admin.activeListings') },
    { icon: '🚨', tint: 'bg-danger/10', value: formatNumber(data?.openReports ?? 0), label: t('admin.openReports') },
  ]
  const actions = [
    { icon: '👤', tint: 'bg-gold-tint', title: t('admin.reviewUsers'), count: data?.pendingVerifications ?? 0, color: 'text-gold', badge: 'bg-gold', to: '/admin/users' },
    { icon: '🏷️', tint: 'bg-success/12', title: t('admin.approveListings'), count: data?.pendingListings ?? 0, color: 'text-success', badge: 'bg-success', to: '/admin/listings' },
    { icon: '🚨', tint: 'bg-danger/10', title: t('admin.manageReports'), count: data?.openReports ?? 0, color: 'text-danger', badge: 'bg-danger', to: '/admin/reports' },
    { icon: '🏛️', tint: 'bg-sky-500/12', title: t('dvldAdmin.card'), count: data?.dvldListings ?? 0, color: 'text-sky-700', badge: 'bg-sky-600', to: '/admin/dvld' },
    { icon: '🏠', tint: 'bg-purple/12', title: t('states.home'), count: 0, color: 'text-purple', badge: '', to: '/home' },
  ]
  const describe = (a: AdminActivity) => t(`more.activity.${a.action}`, { target: a.details?.code ?? a.details?.name ?? a.targetId, defaultValue: a.action.replaceAll('_', ' ') })

  return (
    <main className="min-h-dvh bg-offwhite pb-10">
      <div className="bg-gradient-to-b from-night to-[#1a1408] py-9">
        <Container className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full border border-gold/60 bg-gold/15 text-[22px]">🛡️</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[18px] font-bold text-white">{t('admin.panel')}</h1>
            <button onClick={() => logout().then(() => navigate('/admin'))} className="text-[11px] text-muted hover:text-white hover:underline">
              {t('profile.logout')}
            </button>
          </div>
          <LanguageToggle />
          {Boolean(data?.newReports) && (
            <Link to="/admin/reports" className="rounded-[10px] border border-danger/50 bg-danger/20 px-2.5 py-2 text-[12px] font-bold whitespace-nowrap text-danger">
              {t('admin.alerts', { count: data?.newReports })}
            </Link>
          )}
        </Container>
      </div>
      <Container className="pt-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <AdminStat key={s.label} {...s} />
          ))}
        </div>
        <h2 className="mt-6 mb-3 text-[18px] font-bold">{t('admin.quick')}</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {actions.map((a) => (
            <Link key={a.title} to={a.to} className="rounded-[20px] bg-white p-3.5 shadow-l2 transition hover:shadow-l3">
              <div className="flex items-start gap-2.5">
                <span className={cx('grid size-11 shrink-0 place-items-center rounded-full text-[18px]', a.tint)}>{a.icon}</span>
                <p className="text-[13px] font-bold">{a.title}</p>
              </div>
              <div className="mt-2 flex h-7 items-center justify-between">
                <span className={cx('text-[12px] font-bold', a.color)}>
                  <span className="inline-block rtl:-scale-x-100">→</span> {t('common.open')}
                </span>
                {a.count > 0 && <span className={cx('grid size-7 place-items-center rounded-full text-[11px] font-bold text-white', a.badge)}>{a.count}</span>}
              </div>
            </Link>
          ))}
        </div>
        <h2 className="mt-6 mb-3 text-[18px] font-bold">{t('admin.recent')}</h2>
        <div className="space-y-2">
          {data?.recentActivity.map((a) => {
            const { icon, tint } = activityIcon(a.action)
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-[16px] bg-white p-3 shadow-l1">
                <span className={cx('grid size-9 shrink-0 place-items-center rounded-full text-[15px]', tint)}>{icon}</span>
                <p className="flex-1 text-[13px]">{describe(a)}</p>
                <span className="text-[10px] whitespace-nowrap text-muted">{timeAgo(a.createdAt)}</span>
              </div>
            )
          })}
        </div>
      </Container>
    </main>
  )
}

function PendingCount({ count }: { count: number }) {
  const { t } = useTranslation()
  return <span className="text-[13px] font-bold whitespace-nowrap text-warning">{t('common.pending', { count })}</span>
}

function DocPhoto({ url, label }: { url: string | null; label: string }) {
  const { t } = useTranslation()
  const [broken, setBroken] = useState(false)
  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-offwhite text-center">
      {url && !broken ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={label} onError={() => setBroken(true)} className="h-[110px] w-full object-cover" />
        </a>
      ) : (
        <div className="grid h-[110px] place-items-center">
          <span>
            <span className="block text-[26px]">🪪</span>
            <span className="text-[10px] text-muted">{t('more.photoMissing')}</span>
          </span>
        </div>
      )}
      <p className="py-1.5 text-[11px] text-muted">{label}</p>
    </div>
  )
}

export function AdminUsers() {
  const { t } = useTranslation()
  const timeAgo = useTimeAgo()
  const { data, error, loading, retry } = useAsync(admin.verifications, [])
  const [done, setDone] = useState<number[]>([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string>()
  const queue = (data ?? []).filter((r) => !done.includes(r.id))
  const current = queue[0]
  const waiting = queue.slice(1)

  const decide = async (approve: boolean) => {
    setBusy(true)
    setActionError(undefined)
    try {
      await admin.reviewVerification(current.id, approve, note)
      setDone([...done, current.id])
      setNote('')
    } catch (err) {
      setActionError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  if (error) return <ErrorState onRetry={retry} />

  return (
    <main className="min-h-dvh bg-offwhite pb-10">
      <PageHeader title={`👤 ${t('admin.reviewUsers')}`} back="/admin/dashboard" right={<PendingCount count={queue.length} />} />
      <Container narrow className="pt-4">
        {loading ? (
          <Card className="p-10 text-center text-muted">{t('common.loading')}</Card>
        ) : current ? (
          <>
            <Card key={current.id} className="animate-rise p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-bold">{t('admin.reqTitle', { id: current.id })}</h2>
                <Badge tone="yellow" className="!py-1.5">
                  {t('admin.awaiting')}
                </Badge>
              </div>
              <div className="mt-4 flex items-center gap-3 border-b border-line pb-4">
                <Avatar letter={current.fullName.charAt(0)} size={56} />
                <div className="min-w-0">
                  <p className="text-[17px] font-bold">{current.fullName}</p>
                  <p dir="ltr" className="truncate text-[12px] text-muted rtl:text-end">
                    {current.email} {current.phone && `· ${current.phone}`}
                  </p>
                  <p className="text-[11px] text-muted">{t('admin.registered', { date: new Date(current.registeredAt).toLocaleDateString('en-GB') })}</p>
                </div>
              </div>
              <h3 className="mt-3 text-[13px] font-bold">{t('admin.docs')}</h3>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <DocPhoto url={current.idFrontUrl} label={t('admin.front')} />
                <DocPhoto url={current.idBackUrl} label={t('admin.backSide')} />
                <DocPhoto url={current.selfieUrl} label={t('admin.selfie')} />
              </div>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} aria-label={t('admin.note')} placeholder={t('admin.note')} className="mt-3 h-[40px] w-full rounded-[12px] border border-line bg-offwhite px-3 text-[12px] outline-none focus:border-gold" />
            </Card>
            <div className="mt-3">
              <FormError message={actionError} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button variant="success" disabled={busy} onClick={() => decide(true)}>
                {t('admin.approve')}
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => decide(false)}>
                {t('admin.reject')}
              </Button>
            </div>
          </>
        ) : (
          <Card className="p-10 text-center text-[16px] font-bold">{t('admin.allDone')}</Card>
        )}
        {waiting.length > 0 && (
          <>
            <div className="mt-6 mb-2.5 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">{t('admin.queue')}</h2>
              <span className="text-[12px] text-muted">{t('admin.remaining', { count: waiting.length })}</span>
            </div>
            <div className="space-y-2">
              {waiting.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-[14px] bg-white p-3 shadow-l1">
                  <Avatar letter={u.fullName.charAt(0)} size={34} className="!border-gold/40" />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold">{u.fullName}</p>
                    <p className="text-[10px] text-muted">{timeAgo(u.submittedAt)}</p>
                  </div>
                  <Badge className="!py-1.5">{t('common.review')}</Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </Container>
    </main>
  )
}

export function AdminListings() {
  const { t } = useTranslation()
  const { data, error, loading, retry } = useAsync(admin.listings, [])
  const [done, setDone] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string>()
  const queue = (data ?? []).filter((p) => !done.includes(p.id))
  const plate = queue[0]

  const decide = async (action: 'approve' | 'reject' | 'suspend') => {
    setBusy(true)
    setActionError(undefined)
    try {
      await admin.reviewListing(plate.id, action, reason)
      setDone([...done, plate.id])
      setReason('')
    } catch (err) {
      setActionError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  if (error) return <ErrorState onRetry={retry} />

  if (!plate)
    return (
      <main className="min-h-dvh bg-offwhite">
        <PageHeader title={t('admin.approveListings')} back="/admin/dashboard" />
        <Container narrow className="pt-6">
          <Card className="p-10 text-center text-[16px] font-bold">{loading ? t('common.loading') : t('admin.allDone')}</Card>
        </Container>
      </main>
    )

  const risky = plate.riskScore >= 60
  const rows = [
    { label: t('auth.seller'), value: `${plate.sellerName} ${plate.sellerVerified ? '✅' : '⚠️'}` },
    { label: t('details.price'), value: <Price value={plate.price} className="text-gold" /> },
    ...(plate.estimatedValue ? [{ label: t('details.market'), value: <Price value={plate.estimatedValue} /> }] : []),
    { label: t('details.category'), value: t(`category.${plate.category}`) },
    { label: t('details.governorate'), value: t(`governorate.${plate.governorate}`) },
    { label: t('listing.ownerName'), value: plate.ownerName },
    { label: t('more.nationalId'), value: <span dir="ltr">{plate.ownerNationalId}</span> },
  ]

  return (
    <main className="min-h-dvh bg-offwhite pb-10">
      <PageHeader title={`🏷️ ${t('admin.approveListings')}`} back="/admin/dashboard" right={<PendingCount count={queue.length} />} />
      <Container narrow className="pt-4">
        <Card key={plate.id} className="animate-rise p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold" dir="ltr">{plate.code}</h2>
            <Badge className="!py-1.5">{t('admin.newListing')}</Badge>
          </div>
          <div className="mx-auto mt-4 w-[240px] rounded-[20px] border-2 border-gold/50 bg-offwhite px-6 pt-6 pb-3 text-center">
            <Plate code={plate.code} />
            <p className="mt-3 text-[11px] text-gold">{t(`category.${plate.category}`)}</p>
          </div>
          <h3 className="mt-5 border-t border-line pt-4 text-[14px] font-bold">{t('admin.listingDetails')}</h3>
          <dl className="mt-2">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between rounded-[8px] px-3 py-2.5 text-[13px] odd:bg-offwhite">
                <dt className="text-muted">{r.label}</dt>
                <dd className="font-bold">{r.value}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-3 text-[13px] font-bold">{t('admin.owner')}</h3>
          {plate.ownershipDocUrl ? (
            <a href={plate.ownershipDocUrl} target="_blank" rel="noreferrer" className="mt-1.5 block rounded-[10px] bg-success/10 px-3 py-2 text-[11px] font-semibold text-success hover:underline">
              📄 {t('more.viewDoc')}
            </a>
          ) : (
            <p className="mt-1.5 rounded-[10px] bg-warning/10 px-3 py-2 text-[11px] text-warning">{t('more.noDoc')}</p>
          )}
        </Card>
        <div className={cx('mt-4 rounded-[16px] border px-4 py-3', risky ? 'border-danger/30 bg-danger/8' : 'border-success/25 bg-success/8')}>
          <p className="text-[13px] font-bold">{t('admin.ai')}</p>
          <p className={cx('mt-1 text-[12px] font-semibold', risky ? 'text-danger' : 'text-success')}>{t('more.risk', { score: plate.riskScore })}</p>
          {plate.riskFlags.length ? (
            <ul className="mt-1 list-inside list-disc text-[11px] text-muted">
              {plate.riskFlags.map((f) => (
                <li key={f}>{t(`riskFlag.${f}`, { defaultValue: f })}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] text-muted">{t('more.riskLow')}</p>
          )}
        </div>
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} aria-label={t('more.reasonPh')} placeholder={t('more.reasonPh')} className="mt-4 h-[42px] w-full rounded-[12px] border border-line bg-white px-3 text-[12px] outline-none focus:border-gold" />
        <div className="mt-3">
          <FormError message={actionError} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button variant="success" disabled={busy} onClick={() => decide('approve')}>
            {t('admin.publish')}
          </Button>
          <Button variant="danger" disabled={busy} onClick={() => decide('reject')}>
            {t('admin.rejectListing')}
          </Button>
        </div>
        <Button variant="warning" className="mt-3" disabled={busy} onClick={() => decide('suspend')}>
          {t('admin.suspend')}
        </Button>
      </Container>
    </main>
  )
}

const statusStyle: Record<ReportStatus, { bar: string; tone: 'red' | 'yellow' | 'green'; label: string; icon: string }> = {
  new: { bar: 'border-danger', tone: 'red', label: 'sNew', icon: '🔴' },
  review: { bar: 'border-warning', tone: 'yellow', label: 'sReview', icon: '🟡' },
  closed: { bar: 'border-success', tone: 'green', label: 'sClosed', icon: '🟢' },
}

export function AdminReports() {
  const { t } = useTranslation()
  const timeAgo = useTimeAgo()
  const [tab, setTab] = useState<'all' | 'active' | 'closed'>('all')
  const { data, error, retry } = useAsync(() => admin.reports('all'), [])
  const [changed, setChanged] = useState<Record<number, ReportStatus>>({})
  const [actionError, setActionError] = useState<string>()
  const reports = (data ?? []).map((r) => ({ ...r, status: changed[r.id] ?? r.status }))
  const counts = { all: reports.length, active: reports.filter((r) => r.status !== 'closed').length, closed: reports.filter((r) => r.status === 'closed').length }
  const tabLabels = { all: t('admin.tAll'), active: t('admin.tActive'), closed: t('admin.tClosed') }
  const visible = reports.filter((r) => tab === 'all' || (tab === 'closed' ? r.status === 'closed' : r.status !== 'closed'))

  const setStatus = async (id: number, status: ReportStatus, banUserId?: string | null) => {
    setActionError(undefined)
    try {
      if (banUserId) await admin.banUser(banUserId, t(`reportReason.${reports.find((r) => r.id === id)?.reason ?? 'other'}`))
      await admin.updateReport(id, status)
      setChanged((prev) => ({ ...prev, [id]: status }))
    } catch (err) {
      setActionError(errorText(err))
    }
  }

  if (error) return <ErrorState onRetry={retry} />

  return (
    <main className="min-h-dvh bg-white pb-10">
      <PageHeader title={t('admin.reports')} back="/admin/dashboard" />
      <div className="mx-auto grid max-w-[720px] grid-cols-3">
        {(['all', 'active', 'closed'] as const).map((key) => (
          <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)} className={cx('border-b-2 py-3 text-[14px] transition', tab === key ? 'border-gold font-bold text-gold' : 'border-transparent text-muted')}>
            {tabLabels[key]} ({counts[key]})
          </button>
        ))}
      </div>
      <div className="min-h-[70dvh] bg-offwhite pt-4">
        <Container className="max-w-[720px] space-y-3.5">
          <FormError message={actionError} />
          {visible.map((r) => {
            const style = statusStyle[r.status]
            return (
              <Card key={r.id} className={cx('animate-rise border-s-4 p-5', style.bar)}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[16px] font-bold">
                    {style.icon} {t(`reportReason.${r.reason}`)}
                  </h2>
                  <Badge tone={style.tone} className="!px-4 !py-1.5">
                    {t(`admin.${style.label}`)}
                  </Badge>
                </div>
                {r.plateCode && (
                  <Link to={`/plates/${r.plateId}`} dir="ltr" className="mt-1 inline-block text-[12px] font-bold text-gold hover:underline">
                    {r.plateCode}
                  </Link>
                )}
                <p className="mt-1.5 text-[11px] text-muted">{r.details}</p>
                <div className="mt-4 flex justify-between border-t border-line pt-3 text-[11px] text-muted">
                  <span>{t('admin.reporter', { name: r.reporterName ?? '—' })}</span>
                  <span>{timeAgo(r.createdAt)}</span>
                </div>
                {r.status !== 'closed' && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button disabled={r.status === 'review'} onClick={() => setStatus(r.id, 'review')} className="rounded-[10px] bg-gold-tint py-2 text-[11px] font-bold text-gold disabled:opacity-50">
                      {t('admin.investigate')}
                    </button>
                    <button onClick={() => setStatus(r.id, 'closed')} className="rounded-[10px] bg-success/12 py-2 text-[11px] font-bold text-success">
                      {t('admin.close')}
                    </button>
                    <button disabled={!r.reportedUserId} onClick={() => setStatus(r.id, 'closed', r.reportedUserId)} className="rounded-[10px] bg-danger/10 py-2 text-[11px] font-bold text-danger disabled:opacity-50">
                      {t('admin.ban')}
                    </button>
                  </div>
                )}
              </Card>
            )
          })}
        </Container>
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// DVLD plates: numbers DVLD still sells. The DVLD account can't sign in, so admins manage them here.
// ---------------------------------------------------------------------------

/** Turns pasted Excel rows or a CSV file into plates: the plate number, then its price, on each line */
function parsePlateList(text: string) {
  const plates: { code: string; price: number }[] = []
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split(/[,\t;]/).map((c) => c.trim().replace(/^"|"$/g, ''))
    const at = cells.findIndex((c) => /^\d{1,2}-\d{1,5}$/.test(c))
    if (at < 0) continue // blank lines and header rows like "Plate, Price"
    const price = cells
      .slice(at + 1)
      .map((c) => Number(c.replace(/[^\d.]/g, '')))
      .find((n) => n >= 50)
    plates.push({ code: cells[at], price: price ?? Number.NaN })
  }
  return plates
}

type AddResult = { added: number; skipped: { code: string; reason: string }[] }

function AddResultBox({ result }: { result?: AddResult }) {
  const { t } = useTranslation()
  if (!result) return null
  return (
    <div className="animate-rise mt-3 rounded-[12px] bg-offwhite px-3 py-2.5 text-[12px]">
      <p className="font-bold">
        <span className="text-success">{t('dvldAdmin.resultAdded', { count: result.added })}</span>
        {result.skipped.length > 0 && <span className="text-warning"> · {t('dvldAdmin.resultSkipped', { count: result.skipped.length })}</span>}
      </p>
      {result.skipped.length > 0 && (
        <ul className="mt-1.5 max-h-[140px] space-y-0.5 overflow-y-auto text-muted">
          {result.skipped.map((s, i) => (
            <li key={i}>
              <span dir="ltr" className="font-semibold text-ink">{s.code || '—'}</span>: {s.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DvldRow({ plate, onChanged }: { plate: DvldPlate; onChanged: () => void }) {
  const { t } = useTranslation()
  const [price, setPrice] = useState(String(plate.price))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const changed = Number(price) !== plate.price && Number(price) >= 50

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError(undefined)
    try {
      await action()
      onChanged()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-3">
      <div className="flex flex-wrap items-center gap-3">
        <PlateTile code={plate.code} className="h-[46px] w-[76px] shrink-0 !rounded-[10px] !p-1" />
        <div className="min-w-[90px] flex-1">
          <p dir="ltr" className="text-[14px] font-bold rtl:text-end">{plate.code}</p>
          <p className="text-[11px] text-muted">
            {t(`category.${plate.category}`)} · {formatNumber(plate.views)} 👁
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-muted">
          {t('dvldAdmin.changePrice')}
          <input
            dir="ltr"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
            className="h-9 w-[100px] rounded-[10px] border border-line bg-offwhite px-2.5 text-[13px] font-bold text-ink outline-none focus:border-gold"
          />
        </label>
        <button
          disabled={!changed || busy}
          onClick={() => run(() => admin.updateDvldPrice(plate.id, Number(price)))}
          className="press h-9 rounded-[10px] bg-gold px-3 text-[12px] font-bold text-ink disabled:bg-line disabled:text-muted"
        >
          {t('dvldAdmin.save')}
        </button>
        <button
          disabled={busy}
          onClick={() => window.confirm(t('dvldAdmin.confirmRemove', { code: plate.code })) && run(() => admin.removeDvldPlate(plate.id))}
          className="press h-9 rounded-[10px] bg-danger/10 px-3 text-[12px] font-bold text-danger hover:bg-danger/20"
        >
          {t('dvldAdmin.remove')}
        </button>
      </div>
      {error && <p className="mt-2 text-[11px] text-danger">{error}</p>}
    </Card>
  )
}

export function AdminDvld() {
  const { t } = useTranslation()
  // single plate
  const [code, setCode] = useState('')
  const [price, setPrice] = useState('')
  const [oneBusy, setOneBusy] = useState(false)
  const [oneResult, setOneResult] = useState<AddResult>()
  const [oneError, setOneError] = useState<string>()
  // a pasted / uploaded list
  const [text, setText] = useState('')
  const [listBusy, setListBusy] = useState(false)
  const [listResult, setListResult] = useState<AddResult>()
  const [listError, setListError] = useState<string>()
  const fileInput = useRef<HTMLInputElement>(null)
  // the listed plates
  const [search, setSearch] = useState('')
  const [version, setVersion] = useState(0)
  const [pages, setPages] = useState(1)
  const reload = () => setVersion((v) => v + 1)
  const list = useAsync(async () => {
    const all = await Promise.all(Array.from({ length: pages }, (_, i) => admin.dvldPlates(search, i + 1)))
    return { items: all.flatMap((p) => p.items), total: all[0]?.total ?? 0 }
  }, [search, version, pages])

  const addOne = async (e: FormEvent) => {
    e.preventDefault()
    setOneBusy(true)
    setOneError(undefined)
    try {
      const result = await admin.addDvldPlates([{ code: code.trim(), price: Number(price) }])
      setOneResult(result)
      if (result.added) {
        setCode('')
        setPrice('')
        reload()
      }
    } catch (err) {
      setOneError(errorText(err))
    } finally {
      setOneBusy(false)
    }
  }

  const addList = async () => {
    const plates = parsePlateList(text)
    if (!plates.length) return setListError(t('dvldAdmin.nothingToAdd'))
    setListBusy(true)
    setListError(undefined)
    try {
      const result = await admin.addDvldPlates(plates)
      setListResult(result)
      if (result.added) {
        setText('')
        reload()
      }
    } catch (err) {
      setListError(errorText(err))
    } finally {
      setListBusy(false)
    }
  }

  const readFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setText(await file.text())
    e.target.value = ''
  }

  return (
    <main className="min-h-dvh bg-offwhite pb-10">
      <PageHeader title={`🏛️ ${t('dvldAdmin.title')}`} back="/admin/dashboard" />
      <Container className="max-w-[820px] space-y-4 pt-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-[15px] font-bold">{t('dvldAdmin.addOne')}</h2>
            <form onSubmit={addOne} className="mt-3 space-y-3">
              <Field label={t('dvldAdmin.number')} dir="ltr" placeholder="31-1234" value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d-]/g, ''))} />
              <Field label={t('dvldAdmin.price')} dir="ltr" inputMode="numeric" placeholder="1000" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} />
              <Button type="submit" disabled={oneBusy || !code || !price}>
                {oneBusy ? t('common.loading') : t('dvldAdmin.add')}
              </Button>
            </form>
            <FormError message={oneError} />
            <AddResultBox result={oneResult} />
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-bold">{t('dvldAdmin.addMany')}</h2>
            <p className="mt-1 text-[11px] text-muted">{t('dvldAdmin.manyHint')}</p>
            <textarea
              dir="ltr"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={'31-1234, 1000\n44-25, 120000\n36-99989, 3000'}
              className="mt-3 w-full rounded-[12px] border border-line bg-offwhite p-3 font-mono text-[12px] outline-none focus:border-gold"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => fileInput.current?.click()} className="!min-h-[44px] !text-[13px]">
                {t('dvldAdmin.upload')}
              </Button>
              <Button onClick={addList} disabled={listBusy} className="!min-h-[44px] !text-[13px]">
                {listBusy ? t('common.loading') : t('dvldAdmin.addList')}
              </Button>
            </div>
            <input ref={fileInput} type="file" accept=".csv,.txt,text/csv,text/plain" hidden onChange={readFile} />
            <div className="mt-2">
              <FormError message={listError} />
            </div>
            <AddResultBox result={listResult} />
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <h2 className="text-[16px] font-bold">{t('dvldAdmin.listTitle', { count: list.data?.total ?? 0 })}</h2>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPages(1)
            }}
            placeholder={t('dvldAdmin.searchPh')}
            aria-label={t('dvldAdmin.searchPh')}
            className="h-10 w-[220px] rounded-[12px] border border-line bg-white px-3 text-[13px] outline-none focus:border-gold"
          />
        </div>
        {list.error ? (
          <ErrorState onRetry={list.retry} />
        ) : !list.data ? (
          <Card className="p-8 text-center text-muted">{t('common.loading')}</Card>
        ) : list.data.items.length === 0 ? (
          <Card className="p-8 text-center text-muted">{t('dvldAdmin.empty')}</Card>
        ) : (
          <div className="space-y-2">
            {list.data.items.map((p) => (
              <DvldRow key={`${p.id}-${p.price}`} plate={p} onChanged={reload} />
            ))}
            {list.data.items.length < list.data.total && (
              <Button variant="secondary" onClick={() => setPages((n) => n + 1)} className="mx-auto mt-3 max-w-[280px]">
                {t('search.showMore')}
              </Button>
            )}
          </div>
        )}
      </Container>
    </main>
  )
}
