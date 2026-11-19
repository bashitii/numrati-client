import { ArrowRight, BadgeCheck, ChevronRight, Crown, Eye, Heart, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { formatNumber } from '../lib/hooks'
import { useFavorites } from '../store/favorites'
import type { Plate } from '../types'
import { Plate as PlateArt, PlateTile } from './Plate'
import { Badge, CategoryBadge, cx, OwnershipBadge, Price, VerifiedBadge } from './ui'

export function HeartButton({ id, className, size = 20 }: { id: string; className?: string; size?: number }) {
  const { has, toggle } = useFavorites()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const on = has(id)
  // Bumped on every "like" so the pop + burst replay
  const [bump, setBump] = useState(0)
  return (
    <button
      aria-label={t('nav.favorites')}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        // guests are sent to sign in first
        if (!toggle(id)) return navigate('/login', { state: { from: `/plates/${id}` } })
        if (!on) setBump((n) => n + 1)
      }}
      className={cx('relative grid size-9 place-items-center rounded-full transition-colors hover:bg-black/5', on ? 'text-danger' : 'text-[#888]', className)}
    >
      {bump > 0 && on && <span key={`b${bump}`} aria-hidden className="animate-burst absolute inset-1 rounded-full border-2 border-danger/60" />}
      <Heart key={`h${bump}`} size={size} strokeWidth={2.2} fill={on ? 'currentColor' : 'none'} className={cx(bump > 0 && on && 'animate-heart')} aria-hidden />
    </button>
  )
}

export function Views({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] whitespace-nowrap text-muted">
      <Eye size={13} aria-hidden /> <span dir="ltr">{formatNumber(count)}</span>
    </span>
  )
}

function ContactHint({ dvld }: { dvld?: boolean }) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#a8884a]">
      {dvld ? t('ownership.buyAtDvld') : t('common.contact')}
      <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden />
    </span>
  )
}

export function FeaturedCard({ plate }: { plate: Plate }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/plates/${plate.id}`}
      className="shine lift group flex items-stretch gap-3 rounded-[22px] border border-gold/50 bg-[radial-gradient(120%_140%_at_100%_0%,#3a2c10_0%,#1a1408_55%,#0f0c05_100%)] p-3.5 shadow-l4 hover:border-gold lg:gap-8 lg:p-6"
    >
      <div className="grid flex-[1.1] place-items-center rounded-[16px] bg-white p-[5%]">
        <div className="animate-float w-full max-w-[420px]">
          <PlateArt code={plate.code} />
        </div>
      </div>
      <div className="relative z-[2] flex flex-1 flex-col items-start justify-center gap-1">
        <span className="inline-flex items-center gap-1 rounded-[10px] bg-gold px-2.5 py-1.5 text-[11px] font-bold text-ink">
          <Crown size={13} strokeWidth={2.4} aria-hidden /> {t('home.premium')}
        </span>
        <Price value={plate.price} className="mt-1 text-[24px] font-extrabold text-white lg:text-[36px]" />
        <span className="text-[11px] text-white/55">{plate.ownership === 'dvld' ? t('ownership.officialPrice') : t('home.asking')}</span>
        {plate.ownership === 'dvld' ? (
          <OwnershipBadge ownership="dvld" className="!bg-sky-400/15 !text-sky-300" />
        ) : (
          plate.verified && (
            <span className="inline-flex items-center gap-1 text-[12px] text-success">
              <BadgeCheck size={14} aria-hidden /> {t('common.verifiedSeller')}
            </span>
          )
        )}
        <span className="inline-flex items-center gap-1 text-[12px] text-white/55">
          <MapPin size={13} aria-hidden /> {t(`governorate.${plate.governorate}`)}
        </span>
      </div>
    </Link>
  )
}

export function GridCard({ plate }: { plate: Plate }) {
  return (
    <Link to={`/plates/${plate.id}`} className="lift group block rounded-[20px] border border-transparent bg-white p-3.5 shadow-l2 hover:border-gold/40">
      <div className="relative">
        <PlateTile code={plate.code} className="h-[96px] !py-0 transition-colors duration-300 group-hover:bg-gold-tint/60" />
        <span className="absolute end-1 top-1">
          <HeartButton id={plate.id} className="bg-white/80 backdrop-blur" size={18} />
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <OwnershipBadge ownership={plate.ownership} />
        <CategoryBadge category={plate.category} />
      </div>
      <Price value={plate.price} className="mt-2 text-[18px] font-bold" />
      <div className="mt-1 flex items-center justify-between">
        <Views count={plate.views} />
        <ContactHint dvld={plate.ownership === 'dvld'} />
      </div>
    </Link>
  )
}

export function ResultRow({ plate }: { plate: Plate }) {
  const { t } = useTranslation()
  return (
    <Link to={`/plates/${plate.id}`} className="lift group flex items-center gap-3.5 rounded-[20px] border border-transparent bg-white p-3 shadow-l2 hover:border-gold/40">
      <PlateTile code={plate.code} className="h-[56px] w-[90px] shrink-0 !p-1.5 transition-colors duration-300 group-hover:bg-gold-tint/60" />
      <div className="min-w-0 flex-1">
        <Price value={plate.price} className="text-[18px] font-bold" />
        <p className="text-[12px] text-muted">{t(`category.${plate.category}`)}</p>
        <div className="mt-0.5 flex flex-wrap gap-1">
          <OwnershipBadge ownership={plate.ownership} />
          {plate.ownership === 'owned' && plate.verified && <VerifiedBadge />}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <Views count={plate.views} />
          <HeartButton id={plate.id} />
        </div>
        <Badge className="!px-3 !py-2 !text-[11px] transition-colors group-hover:bg-gold group-hover:text-ink">
          {plate.ownership === 'dvld' ? t('ownership.buyAtDvld') : t('common.contact')}
        </Badge>
      </div>
    </Link>
  )
}

export function RecentRow({ plate }: { plate: Plate }) {
  const { t } = useTranslation()
  return (
    <Link to={`/plates/${plate.id}`} className="lift group flex items-center gap-3 rounded-[16px] border border-transparent bg-white p-3 shadow-l1 hover:border-gold/40">
      <PlateTile code={plate.code} className="h-[46px] w-[72px] shrink-0 !rounded-[10px] !p-1" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted">{t(`category.${plate.category}`)}</p>
        <Price value={plate.price} className="text-[16px] font-bold" />
      </div>
      <OwnershipBadge ownership={plate.ownership} />
      <ChevronRight size={20} className="text-line transition duration-300 group-hover:translate-x-1 group-hover:text-gold rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden />
    </Link>
  )
}

