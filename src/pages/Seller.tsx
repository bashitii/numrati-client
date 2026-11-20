import { Banknote, ChartColumn, Check, CircleCheckBig, ClipboardList, Eye, FileText, HandCoins, IdCard, ListChecks, Pencil, Plus, Rocket, ShieldAlert, ShieldCheck, Sparkles, Store, Tags, Trash2, TrendingDown, TrendingUp, Users, WandSparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Plate, PlateTile } from '../components/Plate'
import { Views } from '../components/PlateCards'
import { Avatar, Badge, Button, Card, Container, cx, Field, FileDrop, PageHeader, Price, SectionHead, SelectField, SkeletonCards } from '../components/ui'
import { errorText, formatNumber, useAsync } from '../lib/hooks'
import { createListing, detectTraits, estimatePrice, getAnalytics, getMyListings, markSold, removeListing, updateListing } from '../services/api'
import { formatPlateCode, PLATE_CODE_PATTERN } from '../lib/plate'
import { useAuth } from '../store/auth'
import type { Category, Governorate, ListingStatus } from '../types'
import { FormError } from './Auth'
import { ErrorState } from './ErrorPage'

export const categoryOptions: Category[] = ['special', 'exclusive', 'sequential', 'repeated', 'regular']
export const governorateOptions: Governorate[] = ['amman', 'irbid', 'zarqa', 'aqaba', 'balqa', 'karak', 'madaba', 'mafraq', 'jerash', 'ajloun', 'tafilah', 'maan']

const statusTone: Record<ListingStatus, 'green' | 'yellow' | 'red'> = {
  active: 'green', pending: 'yellow', sold: 'green', rejected: 'red', suspended: 'red', removed: 'red',
}

/** Small banner shown to sellers who still need to verify their ID */
function VerifyBanner() {
  const { t } = useTranslation()
  const { user } = useAuth()
  if (!user || user.verificationStatus === 'verified') return null
  const pending = user.verificationStatus === 'pending'
  return (
    <Link to="/verify-id" className="mb-4 flex items-center gap-3 rounded-[16px] border border-warning/40 bg-warning/10 p-3.5">
      <ShieldAlert size={20} className="shrink-0 text-warning" aria-hidden />
      <span className="flex-1 text-[13px] font-semibold">{pending ? t('more.verifyPending') : t('more.needVerify')}</span>
      {!pending && <span className="rounded-[10px] bg-warning px-3 py-1.5 text-[11px] font-bold text-white">{t('more.verifyNow')}</span>}
    </Link>
  )
}

export function SellerDashboard() {
  const { t } = useTranslation()
  const { user, stats: me, refresh } = useAuth()
  const listingsReq = useAsync(getMyListings, [])
  const week = useAsync(() => getAnalytics(7), [])
  const [busyId, setBusyId] = useState<string>()
  const [error, setError] = useState<string>()
  const listings = listingsReq.data ?? []
  const live = listings.filter((p) => p.status === 'active')

  const stats = [
    { icon: Tags, tint: 'bg-gold-tint text-[#8a6d33]', value: live.length, label: t('seller.active') },
    { icon: Eye, tint: 'bg-purple/12 text-purple', value: formatNumber(week.data?.views ?? 0), label: t('seller.weekViews') },
    { icon: Users, tint: 'bg-success/12 text-success', value: week.data?.interested ?? 0, label: t('seller.buyers') },
    { icon: HandCoins, tint: 'bg-sky-500/12 text-sky-600', value: listings.reduce((n, p) => n + (p.pendingRequests ?? 0), 0), label: t('seller.requests') },
  ]

  // Runs an action on one listing, then reloads the list
  const act = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id)
    setError(undefined)
    try {
      await action()
      listingsReq.retry()
      refresh()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusyId(undefined)
    }
  }

  const editPrice = (id: string, current: number) => {
    const answer = window.prompt(t('more.newPrice'), String(current))
    const price = Number(answer?.replace(/\D/g, ''))
    if (!answer || !price || price === current) return
    act(id, async () => {
      const result = await updateListing(id, { price })
      if (result.status === 'pending') window.alert(t('more.sentForReview'))
    })
  }

  if (!user) return null

  return (
    <main>
      <div className="bg-gradient-to-b from-night to-[#1a1408] py-8 lg:py-10">
        <Container className="flex items-center gap-3">
          <Avatar letter={user.fullName.charAt(0)} size={52} className="border-2 !bg-gold/15" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate text-[16px] font-bold text-white">
              {user.fullName}
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] text-gold">
                <Store size={11} aria-hidden /> {t('seller.badge')}
              </span>
            </p>
            {user.verificationStatus === 'verified' ? (
              <p className="inline-flex items-center gap-1 text-[12px] text-success">
                <ShieldCheck size={14} aria-hidden /> {t('common.verifiedAccount')}
              </p>
            ) : (
              <p className="text-[12px] text-warning">{t('more.unverifiedAccount')}</p>
            )}
            <p className="text-[11px] text-white/55">{t('seller.salesLine', { count: me?.sales ?? 0 })}</p>
          </div>
          <Button to="/seller/new" className="!min-h-[38px] !w-auto !text-[12px]">
            <Plus size={15} strokeWidth={2.6} aria-hidden /> {t('seller.add')}
          </Button>
        </Container>
      </div>
      <Container className="pt-6">
        <VerifyBanner />
        <SectionHead title={t('seller.stats')} to="/seller/analytics" icon={ChartColumn} />
        <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="lift flex items-center gap-3 p-4">
              <span className={cx('grid size-11 shrink-0 place-items-center rounded-[14px]', s.tint)}>
                <s.icon size={20} strokeWidth={2.1} aria-hidden />
              </span>
              <div className="min-w-0">
                <p dir="ltr" className="text-[22px] leading-tight font-extrabold rtl:text-end">
                  {s.value}
                </p>
                <p className="text-[11px] text-muted">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <SectionHead title={t('seller.listings')} to="/seller/analytics" action={t('seller.manage')} icon={ListChecks} />
          {error && (
            <div className="mb-3">
              <FormError message={error} />
            </div>
          )}
          {listingsReq.error ? (
            <ErrorState onRetry={listingsReq.retry} />
          ) : listingsReq.loading && !listingsReq.data ? (
            <SkeletonCards count={2} />
          ) : listings.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-[15px] font-bold">{t('more.noListings')}</p>
              <Button to="/seller/new" className="mx-auto mt-4 max-w-[240px]">
                <Plus size={16} aria-hidden /> {t('listing.title')}
              </Button>
            </Card>
          ) : (
            <div className="stagger grid gap-3 lg:grid-cols-2">
              {listings.map((p) => (
                <Card key={p.id} className={cx('lift flex items-center gap-3 p-3.5', busyId === p.id && 'opacity-60')}>
                  <Link to={`/plates/${p.id}`} className="shrink-0">
                    <PlateTile code={p.code} className="h-[56px] w-[84px] !p-1.5" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Price value={p.price} className="text-[16px] font-bold" />
                    <p>
                      <Views count={p.views} />
                    </p>
                    <Badge tone={statusTone[p.status]} className="mt-1">
                      {p.status === 'active' && <span className="size-1.5 animate-pulse rounded-full bg-success" />}
                      {t(`listingStatus.${p.status}`)}
                    </Badge>
                    {p.rejectionReason && <p className="mt-1 text-[11px] text-danger">{p.rejectionReason}</p>}
                  </div>
                  {['active', 'pending', 'rejected'].includes(p.status) && (
                    <div className="flex flex-col gap-1.5">
                      <button disabled={busyId === p.id} onClick={() => editPrice(p.id, p.price)} className="press inline-flex items-center justify-center gap-1 rounded-[10px] bg-gold-tint px-3.5 py-2 text-[11px] font-bold text-[#8a6d33] hover:bg-gold/30">
                        <Pencil size={12} aria-hidden /> {t('seller.edit')}
                      </button>
                      {p.status === 'active' && (
                        <button disabled={busyId === p.id} onClick={() => act(p.id, () => markSold(p.id))} className="press inline-flex items-center justify-center gap-1 rounded-[10px] bg-success/12 px-3.5 py-2 text-[11px] font-bold text-success hover:bg-success/20">
                          <CircleCheckBig size={12} aria-hidden /> {t('more.markSold')}
                        </button>
                      )}
                      <button
                        disabled={busyId === p.id}
                        onClick={() => window.confirm(t('more.confirmRemove')) && act(p.id, () => removeListing(p.id))}
                        className="press inline-flex items-center justify-center gap-1 rounded-[10px] bg-danger/10 px-3.5 py-2 text-[11px] font-bold text-danger hover:bg-danger/20"
                      >
                        <Trash2 size={12} aria-hidden /> {t('seller.remove')}
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
    </main>
  )
}


function StepTitle({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[16px] font-bold">
      <span className="animate-pop grid size-8 place-items-center rounded-[10px] bg-gold-tint text-[#8a6d33]">
        <Icon size={17} strokeWidth={2.2} aria-hidden />
      </span>
      {children}
    </h2>
  )
}

function Stepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="flex justify-between px-1">
      {labels.map((label, i) => (
        <li key={label} className="flex flex-1 flex-col items-center gap-1 text-center">
          <span
            className={cx(
              'grid size-[30px] place-items-center rounded-full border-2 text-[12px] font-bold transition-all duration-500',
              i < step ? 'border-gold bg-gold' : i === step ? 'animate-glow border-gold bg-gold-tint text-[#8a6d33]' : 'border-line text-muted',
            )}
          >
            {i < step ? <Check key="done" size={15} strokeWidth={3} className="animate-pop" aria-hidden /> : i + 1}
          </span>
          <span className={cx('text-[11px]', i === step ? 'font-bold text-[#8a6d33]' : 'text-muted')}>{label}</span>
        </li>
      ))}
    </ol>
  )
}

export function AddListing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const [step, setStep] = useState(0)
  const [code, setCode] = useState('')
  const [category, setCategory] = useState<Category>('special')
  const [governorate, setGovernorate] = useState<Governorate>('amman')
  const [doc, setDoc] = useState<File | null>(null)
  const [owner, setOwner] = useState(user?.fullName ?? '')
  const [nationalId, setNationalId] = useState('')
  const [price, setPrice] = useState('')
  const [suggested, setSuggested] = useState<number>()
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const codeValid = PLATE_CODE_PATTERN.test(code)
  const labels = [t('listing.stepInfo'), t('listing.stepOwner'), t('listing.stepPrice'), t('listing.stepPublish')]
  const nextLabels = [t('listing.nextOwner'), t('listing.nextPrice'), t('listing.nextPublish'), t('listing.publish')]

  useEffect(() => {
    if (step !== 2) return
    let active = true
    setSuggested(undefined)
    estimatePrice({ code, category, governorate, specialLetters: false, ...detectTraits(code) })
      .then((r) => active && setSuggested(r.suggested))
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [step, code, category, governorate])

  const stepValid = [codeValid, Boolean(owner.trim().length >= 2 && /^\d{10}$/.test(nationalId)), Number(price) >= 50, true][step]

  const publish = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await createListing({ code, category, governorate, price: Number(price), ownerName: owner.trim(), ownerNationalId: nationalId, estimatedValue: suggested, ownershipDoc: doc })
      refresh()
      navigate('/success', { state: { code, price: Number(price), listing: true } })
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  const next = () => {
    setTouched(true)
    if (!stepValid) return
    setTouched(false)
    if (step === 3) publish()
    else setStep(step + 1)
  }

  const required = t('auth.required')
  const summary = [
    { label: t('listing.number'), value: <span dir="ltr">{code}</span> },
    { label: t('listing.category'), value: t(`category.${category}`) },
    { label: t('listing.governorate'), value: t(`governorate.${governorate}`) },
    { label: t('listing.ownerName'), value: owner },
    { label: t('details.price'), value: <Price value={Number(price)} className="text-gold" /> },
  ]

  return (
    <main className="pb-10">
      <PageHeader title={t('listing.title')} back="/seller" />
      <Container narrow className="pt-4">
        <VerifyBanner />
        <Stepper step={step} labels={labels} />
        <Card key={step} className="animate-rise mt-4 space-y-3.5 p-5">
          {step === 0 && (
            <>
              <StepTitle icon={ClipboardList}>{t('listing.info')}</StepTitle>
              <Field
                label={t('listing.number')}
                dir="ltr"
                inputMode="numeric"
                placeholder={t('listing.numberPh')}
                value={code}
                maxLength={8}
                onChange={(e) => setCode(formatPlateCode(e.target.value))}
                error={touched && !codeValid ? t('listing.numberError') : undefined}
              />
              <SelectField label={t('listing.category')} value={category} onChange={(e) => setCategory(e.target.value as Category)} options={categoryOptions.map((v) => ({ value: v, label: t(`category.${v}`) }))} />
              <SelectField label={t('listing.governorate')} value={governorate} onChange={(e) => setGovernorate(e.target.value as Governorate)} options={governorateOptions.map((v) => ({ value: v, label: t(`governorate.${v}`) }))} />
              <div className="rounded-[20px] border border-gold/30 bg-cream/60 p-4 text-center">
                <p className="mb-2 text-[12px] text-muted">{t('listing.preview')}</p>
                <div className="mx-auto max-w-[200px]">
                  <Plate code={code || '15-51552'} />
                </div>
              </div>
              <h3 className="flex items-center gap-1.5 text-[14px] font-bold"><FileText size={16} className="text-[#8a6d33]" aria-hidden /> {t('listing.uploadDoc')}</h3>
              <FileDrop hint={t('listing.uploadHint')} accept=".pdf,image/jpeg,image/png,image/webp" button={t('common.upload')} onFile={setDoc} />
            </>
          )}
          {step === 1 && (
            <>
              <StepTitle icon={IdCard}>{t('listing.ownerTitle')}</StepTitle>
              <Field label={t('listing.ownerName')} value={owner} onChange={(e) => setOwner(e.target.value)} error={touched && owner.trim().length < 2 ? required : undefined} />
              <Field label={t('listing.ownerId')} dir="ltr" inputMode="numeric" maxLength={10} placeholder="9XXXXXXXXX" value={nationalId} onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))} error={touched && !/^\d{10}$/.test(nationalId) ? required : undefined} />
            </>
          )}
          {step === 2 && (
            <>
              <StepTitle icon={Banknote}>{t('listing.priceTitle')}</StepTitle>
              <Field label={t('listing.price')} dir="ltr" inputMode="numeric" big value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} error={touched && Number(price) < 50 ? required : undefined} />
              <div className="flex items-center justify-between rounded-[16px] border border-gold/30 bg-cream/60 p-4">
                <div>
                  <p className="flex items-center gap-1 text-[12px] text-muted"><Sparkles size={13} className="text-gold" aria-hidden /> {t('listing.aiHint')}</p>
                  {suggested ? <Price value={suggested} className="text-[20px] font-extrabold text-gold" /> : <p className="text-[13px] text-muted">{t('common.loading')}</p>}
                </div>
                <button disabled={!suggested} onClick={() => setPrice(String(suggested))} className="press inline-flex items-center gap-1 rounded-[10px] bg-gold px-3 py-2 text-[12px] font-bold hover:bg-gold-light disabled:opacity-50">
                  <WandSparkles size={14} aria-hidden /> {t('listing.useSuggested')}
                </button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <StepTitle icon={Rocket}>{t('listing.publishTitle')}</StepTitle>
              <div className="mx-auto max-w-[220px] py-2">
                <Plate code={code} />
              </div>
              <dl>
                {summary.map((row) => (
                  <div key={row.label} className="flex justify-between rounded-[8px] px-3 py-2.5 text-[13px] odd:bg-offwhite">
                    <dt className="text-muted">{row.label}</dt>
                    <dd className="font-bold">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-center text-[12px] text-muted">{t('listing.publishedBody')}</p>
              <FormError message={error} />
            </>
          )}
        </Card>
        <Button className="mt-5" onClick={next} disabled={busy}>
          {busy ? t('common.loading') : nextLabels[step]}
        </Button>
        {step > 0 && (
          <Button variant="secondary" className="mt-3 !font-medium" onClick={() => setStep(step - 1)} disabled={busy}>
            {t('common.back')}
          </Button>
        )}
        <p className="mt-3 text-center text-[11px] text-muted">{t('listing.stepOf', { current: step + 1, total: 4 })}</p>
      </Container>
    </main>
  )
}

const ranges = [
  { days: 7, label: 'r7' },
  { days: 30, label: 'r30' },
  { days: 90, label: 'r3m' },
  { days: 365, label: 'r1y' },
]

/** Groups the daily views into 7 bars, so every range shows the same chart */
function toBars(series: { day: string; views: number }[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const chunk = series.slice(Math.round((i * series.length) / 7), Math.round(((i + 1) * series.length) / 7))
    return { views: chunk.reduce((n, d) => n + d.views, 0), last: chunk[chunk.length - 1]?.day ?? '' }
  }).filter((b) => b.last)
}

export function SellerAnalytics() {
  const { t, i18n } = useTranslation()
  const [days, setDays] = useState(30)
  const { data, loading, error, retry } = useAsync(() => getAnalytics(days), [days])
  const bars = data ? toBars(data.series) : []
  const maxBar = Math.max(...bars.map((b) => b.views), 1)
  const maxViews = Math.max(...(data?.listings ?? []).map((p) => p.views), 1)
  const change = data && data.viewsPrevious > 0 ? Math.round(((data.views - data.viewsPrevious) / data.viewsPrevious) * 100) : null
  const label = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-JO' : 'en-GB', days === 7 ? { weekday: 'short' } : { day: 'numeric', month: 'short' }).format(new Date(iso))
  const totals = [
    { icon: Eye, value: formatNumber(data?.views ?? 0), label: t('analytics.views') },
    { icon: Users, value: data?.interested ?? 0, label: t('analytics.interested') },
    { icon: HandCoins, value: data?.requests ?? 0, label: t('analytics.requests') },
  ]

  if (error) return <ErrorState onRetry={retry} />

  return (
    <main className="pb-10">
      <PageHeader title={t('seller.analytics')} back="/seller" />
      <Container className="max-w-[820px] pt-5">
        <div className="grid grid-cols-4 rounded-[14px] bg-white p-1">
          {ranges.map((r) => (
            <button key={r.days} aria-pressed={days === r.days} onClick={() => setDays(r.days)} className={cx('h-9 rounded-[12px] text-[13px] transition', days === r.days ? 'bg-gold font-bold' : 'text-muted')}>
              {t(`analytics.${r.label}`)}
            </button>
          ))}
        </div>
        <Card className={cx('mt-4 p-5 transition-opacity', loading && 'opacity-60')}>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold">{t('analytics.views')}</h2>
            {change !== null && (
              <span className={cx('inline-flex items-center gap-1 text-[11px] font-semibold', change >= 0 ? 'text-success' : 'text-danger')}>
                {change >= 0 ? <TrendingUp size={13} aria-hidden /> : <TrendingDown size={13} aria-hidden />} {t('more.vsLastPeriod', { value: change >= 0 ? `+${change}` : change })}
              </span>
            )}
          </div>
          <div className="mt-4 flex h-[150px] items-end gap-4 lg:h-[220px]">
            {bars.map((bar) => (
              <div key={bar.last} title={formatNumber(bar.views)} className="flex h-full flex-1 flex-col justify-end">
                <div style={{ height: `${Math.max(4, (bar.views / maxBar) * 100)}%` }} className="rounded-[8px] bg-gradient-to-b from-[#ecdcbb] to-gold transition-[height] duration-500" />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-4">
            {bars.map((bar) => (
              <span key={bar.last} className="flex-1 text-center text-[10px] text-muted">
                {label(bar.last)}
              </span>
            ))}
          </div>
        </Card>
        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          {totals.map((s) => (
            <Card key={s.label} className="p-3 text-center">
              <span className="mx-auto grid size-9 place-items-center rounded-[12px] bg-gold-tint text-[#8a6d33]"><s.icon size={18} aria-hidden /></span>
              <p dir="ltr" className="text-[22px] font-extrabold">
                {s.value}
              </p>
              <p className="text-[10px] text-muted">{s.label}</p>
            </Card>
          ))}
        </div>
        <h2 className="mt-5 mb-3 text-[16px] font-bold">{t('analytics.performance')}</h2>
        {data ? (
          <div className="space-y-2.5">
            {data.listings.map((p) => (
              <Card key={p.id} className="flex items-center gap-3.5 p-3">
                <PlateTile code={p.code} className="h-[50px] w-[76px] shrink-0 !p-1" />
                <div className="min-w-0 flex-1">
                  <Views count={p.views} />
                  <p className="flex items-center gap-1 text-[11px] text-muted"><Users size={12} aria-hidden /> {t('analytics.interestedCount', { count: p.interested })}</p>
                  <Price value={p.price} className="text-[13px] font-bold" />
                </div>
                <div className="w-[34%]">
                  <div className="h-2 rounded-full bg-offwhite">
                    <div style={{ width: `${(p.views / maxViews) * 100}%` }} className="h-2 rounded-full bg-gold/70" />
                  </div>
                  <p className="mt-1 text-[10px] text-muted">{t(`listingStatus.${p.status}`)}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <SkeletonCards count={2} />
        )}
      </Container>
    </main>
  )
}
