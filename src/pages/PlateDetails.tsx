import { BadgeCheck, CalendarClock, CircleCheckBig, Home, Loader2, MessageCircle, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom'
import { HeartButton } from '../components/PlateCards'
import { Plate as PlateArt } from '../components/Plate'
import { BackButton, Avatar, Button, Card, Container, Price, SkeletonCards } from '../components/ui'
import { errorText, formatNumber, useAsync, useCountUp, useTilt } from '../lib/hooks'
import { getPlate, requestPurchase, startConversation } from '../services/api'
import { useAuth } from '../store/auth'
import type { Plate } from '../types'
import { FormError } from './Auth'
import { ErrorState } from './ErrorPage'

function CountUp({ to }: { to: number }) {
  return <>{formatNumber(useCountUp(to))}</>
}

const PlateSkeleton = () => (
  <Container className="pt-8">
    <SkeletonCards count={2} />
  </Container>
)

/** Waits until we know who is signed in, so the plate is fetched once (with "saved" / "your listing" info) */
export function PlateDetails() {
  const { loading } = useAuth()
  return loading ? <PlateSkeleton /> : <PlateDetailsContent />
}

function PlateDetailsContent() {
  const tilt = useTilt(9)
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sending, setSending] = useState(false)
  const [actionError, setActionError] = useState<string>()
  const { data, loading, error, retry } = useAsync(() => getPlate(id), [id, user?.id])

  if (error) return <ErrorState onRetry={retry} />
  if (loading) return <PlateSkeleton />
  if (!data)
    return (
      <div className="px-5 py-24 text-center">
        <p className="text-[16px] font-bold">{t('details.notFound')}</p>
        <Button to="/search" className="mx-auto mt-5 max-w-[240px]">
          {t('search.browseAll')}
        </Button>
      </div>
    )

  const { plate, seller, isOwner } = data
  const here = `/plates/${plate.id}`
  const stats = [
    { value: <CountUp to={plate.price} />, label: `${t('details.price')} JD` },
    { value: <CountUp to={plate.views} />, label: t('details.views') },
    { value: <CountUp to={plate.interested} />, label: t('details.interested') },
    { value: plate.verified ? <BadgeCheck size={18} className="mx-auto animate-pop" aria-hidden /> : '–', label: plate.verified ? t('details.verified') : t('details.unverified') },
  ]
  const rows = [
    { label: t('details.number'), value: <span dir="ltr">{plate.code.replace('-', ' - ')}</span> },
    { label: t('details.category'), value: t(`category.${plate.category}`) },
    { label: t('details.governorate'), value: t(`governorate.${plate.governorate}`) },
    { label: t('details.price'), value: <Price value={plate.price} className="text-gold" /> },
    ...(plate.marketValue ? [{ label: t('details.market'), value: <span dir="ltr">~{formatNumber(plate.marketValue)} JD</span> }] : []),
  ]

  // Guests sign in first and come back to this plate
  const needUser = () => {
    if (user) return false
    navigate('/login', { state: { from: here } })
    return true
  }

  const purchase = async () => {
    if (needUser()) return
    if (user!.verificationStatus !== 'verified') return setActionError(t('more.needVerify'))
    setSending(true)
    setActionError(undefined)
    try {
      const result = await requestPurchase(plate.id)
      navigate('/success', { state: { code: plate.code, price: result.offeredPrice, conversationId: result.conversationId } })
    } catch (err) {
      setActionError(errorText(err))
      setSending(false)
    }
  }

  const message = async () => {
    if (needUser()) return
    try {
      const { conversationId } = await startConversation(plate.id)
      navigate(`/chats/${conversationId}`)
    } catch (err) {
      setActionError(errorText(err))
    }
  }

  const unavailable = plate.status !== 'active'
  const actions = isOwner ? (
    <Button variant="secondary" to="/seller">
      {t('more.yourListing')} · {t(`listingStatus.${plate.status}`)}
    </Button>
  ) : (
    <div className="space-y-2">
      <div className="flex gap-3">
        <Button onClick={purchase} disabled={sending || unavailable || Boolean(data.pendingRequestId)} className="flex-1">
          {sending && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {plate.sold ? t('details.sold') : data.pendingRequestId ? t('more.requestSent') : sending ? t('common.loading') : t('details.request')}
        </Button>
        <span className="grid h-[52px] w-[72px] shrink-0 place-items-center rounded-[14px] border border-line bg-offwhite">
          <HeartButton id={plate.id} size={22} />
        </span>
      </div>
      {actionError && (
        <div className="space-y-2">
          <FormError message={actionError} />
          {actionError === t('more.needVerify') && (
            <Button variant="secondary" to="/verify-id" className="!min-h-10 !text-[13px]">
              <ShieldCheck size={16} aria-hidden /> {t('more.verifyNow')}
            </Button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <main className="pb-28 lg:pb-0">
      <div className="bg-gradient-to-b from-night to-[#1a1405] pb-10">
        <Container className="!px-3 lg:!px-5">
          <div className="grid h-[84px] grid-cols-[40px_1fr_40px] items-center">
            <BackButton light fallback="/search" />
            <h1 className="text-center text-[18px] font-bold text-white">{t('details.title')}</h1>
            {!isOwner && <HeartButton id={plate.id} size={24} className="justify-self-center !text-gold hover:!bg-white/10" />}
          </div>
          {/* Soft gold halo behind the plate + pointer tilt */}
          <div className="animate-pop relative mx-auto w-fit">
            <div aria-hidden className="absolute inset-[-30px] rounded-full bg-gold/20 blur-3xl" />
            <div {...tilt} className="tilt relative">
              <div className="shine grid h-[140px] w-[240px] place-items-center rounded-[20px] border-[2.5px] border-gold/60 bg-white p-5 shadow-l4 lg:h-[220px] lg:w-[400px]">
                <PlateArt code={plate.code} />
              </div>
            </div>
          </div>
          <dl className="stagger mx-2 mt-6 grid grid-cols-4 rounded-[16px] border border-white/10 bg-white/8 py-2.5 backdrop-blur lg:mx-auto lg:max-w-[560px]">
            {stats.map((s) => (
              <div key={s.label} className="border-white/15 text-center not-last:border-e">
                <dd dir="ltr" className="text-[16px] font-bold text-gold tabular-nums">
                  {s.value}
                </dd>
                <dt className="text-[11px] text-white/55">{s.label}</dt>
              </div>
            ))}
          </dl>
        </Container>
      </div>

      <Container className="stagger -mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Card className="overflow-hidden">
          <h2 className="p-5 text-[17px] font-bold">{t('details.title')}</h2>
          <dl>
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3 text-[13px] transition-colors odd:bg-offwhite hover:bg-gold-tint/50">
                <dt className="text-muted">{row.label}</dt>
                <dd className="font-bold">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <div className="space-y-4">
          <Card className="flex items-center gap-3.5 p-4">
            <Avatar letter={seller.name.charAt(0)} size={52} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold">{seller.name}</p>
              {seller.verified && (
                <p className="inline-flex items-center gap-1 text-[12px] text-success">
                  <BadgeCheck size={14} aria-hidden /> {t('common.verifiedSeller')}
                </p>
              )}
              <p className="text-[11px] text-muted">{t('details.sales', { count: seller.sales })}</p>
            </div>
            {!isOwner && !unavailable && (
              <button onClick={message} className="press inline-flex items-center gap-1.5 rounded-[12px] bg-gold-tint px-3.5 py-3 text-[12px] font-bold text-[#8a6d33] hover:bg-gold hover:text-ink">
                <MessageCircle size={15} aria-hidden /> {t('details.message')}
              </button>
            )}
            {data.conversationId && unavailable && (
              <Link to={`/chats/${data.conversationId}`} className="press inline-flex items-center gap-1.5 rounded-[12px] bg-gold-tint px-3.5 py-3 text-[12px] font-bold text-[#8a6d33]">
                <MessageCircle size={15} aria-hidden /> {t('details.message')}
              </Link>
            )}
          </Card>
          <div className="hidden lg:block">{actions}</div>
        </div>
      </Container>

      <div className="animate-slide-up fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-white/90 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-xl [animation-delay:250ms] lg:hidden">
        {actions}
      </div>
    </main>
  )
}

export function Success() {
  const { t } = useTranslation()
  const { state } = useLocation() as { state: (Pick<Plate, 'code' | 'price'> & { listing?: boolean; conversationId?: string }) | null }
  if (!state) return <Navigate to="/home" replace />

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-night px-5 py-10 text-center">
      <div className="relative">
        {[340, 280, 200].map((size) => (
          <span
            key={size}
            style={{ width: size, height: size, top: 60 - size / 2, insetInlineStart: 60 - size / 2 }}
            className="animate-pulse-ring absolute rounded-full border border-success/20"
          />
        ))}
        <div className="animate-pop relative grid size-[120px] place-items-center rounded-full border-2 border-success bg-success/10 text-success [animation-duration:0.7s]">
          <CircleCheckBig size={60} strokeWidth={1.8} aria-hidden />
        </div>
      </div>
      <h1 className="relative mt-8 text-[28px] font-extrabold text-white">{t('states.successTitle')}</h1>
      <p className="relative mt-4 max-w-[290px] text-[13px] leading-relaxed text-white/60">{state.listing ? t('listing.publishedBody') : t('states.successBody')}</p>
      <div className="relative mt-8 w-full max-w-[310px] rounded-[20px] border border-success/25 bg-white/5 p-5 text-start">
        <div className="flex justify-between">
          <div>
            <p className="text-[11px] text-muted">{t('states.plate')}</p>
            <p dir="ltr" className="mt-1 text-[22px] font-extrabold text-gold rtl:text-end">
              {state.code.replace('-', ' - ')}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted">{state.listing ? t('listing.price') : t('states.negotiated')}</p>
            <Price value={state.price} className="mt-1 text-[20px] font-extrabold text-success" />
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
          <CalendarClock size={14} aria-hidden /> {t('states.awaiting')}
        </p>
      </div>
      <div className="relative mt-6 w-full max-w-[350px] space-y-3">
        <Button variant="success" to="/home">
          <Home size={18} aria-hidden /> {t('states.backHome')}
        </Button>
        {state.listing ? (
          <Button variant="ghostDark" to="/seller" className="!border-white/20">
            {t('profile.myListings')}
          </Button>
        ) : (
          state.conversationId && (
            <Button variant="ghostDark" to={`/chats/${state.conversationId}`} className="!border-white/20">
              <MessageCircle size={18} aria-hidden /> {t('states.openChat')}
            </Button>
          )
        )}
      </div>
    </main>
  )
}
