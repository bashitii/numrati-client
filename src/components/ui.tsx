import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, Camera, CircleCheck, FileUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { formatNumber } from '../lib/hooks'
import type { Category } from '../types'

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')
export { cx }

const buttonVariants = {
  primary: 'bg-gold text-ink hover:bg-gold-light',
  secondary: 'bg-white text-ink border border-line hover:border-gold',
  danger: 'bg-[#fdeaea] text-danger border border-danger/40 hover:bg-danger/15',
  success: 'bg-success text-white hover:brightness-105',
  warning: 'bg-[#fdf5e0] text-warning border border-warning/40 hover:bg-warning/15',
  ghostDark: 'bg-white/8 text-white border border-white/40 hover:bg-white/15',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants
  to?: string
  linkState?: unknown
}

export function Button({ variant = 'primary', to, linkState, className, children, ...rest }: ButtonProps) {
  const classes = cx(
    'press inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] px-4 text-[15px] font-bold',
    'hover:shadow-l2 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted disabled:border-transparent disabled:shadow-none',
    variant === 'primary' && 'shine',
    buttonVariants[variant],
    className,
  )
  if (to) {
    return (
      <Link to={to} state={linkState} className={classes}>
        {children}
      </Link>
    )
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}

export function Price({ value, className }: { value: number; className?: string }) {
  return (
    <span dir="ltr" className={cx('inline-block', className)}>
      {formatNumber(value)} JD
    </span>
  )
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'press h-[36px] shrink-0 rounded-full border px-5 text-[13px] whitespace-nowrap',
        active ? 'border-ink bg-ink font-bold text-white shadow-l2' : 'border-line bg-white text-[#666] hover:border-gold hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

const badgeTones = {
  green: 'bg-success/12 text-success',
  gold: 'bg-gold-tint text-gold',
  red: 'bg-danger/10 text-danger',
  yellow: 'bg-warning/15 text-[#c9960c]',
  purple: 'bg-purple/12 text-purple',
}

export function Badge({ tone = 'gold', children, className }: { tone?: keyof typeof badgeTones; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap', badgeTones[tone], className)}>
      {children}
    </span>
  )
}

export function VerifiedBadge() {
  const { t } = useTranslation()
  return (
    <Badge tone="green">
      <BadgeCheck size={12} strokeWidth={2.4} aria-hidden /> {t('common.verified')}
    </Badge>
  )
}

export function CategoryBadge({ category }: { category: Category }) {
  const { t } = useTranslation()
  return <Badge>{t(`category.${category}`)}</Badge>
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; big?: boolean }

export function Field({ label, error, big, className, ...rest }: FieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cx(
          'block rounded-[16px] border bg-white px-4 py-2.5 transition focus-within:border-2 focus-within:border-gold',
          error ? 'border-danger bg-danger/5' : 'border-line',
        )}
      >
        <span className="block text-[11px] text-muted">{label}</span>
        <input
          id={id}
          className={cx('mt-0.5 w-full bg-transparent text-ink outline-none placeholder:text-muted/70', big ? 'text-[26px] font-extrabold' : 'text-[15px]')}
          {...rest}
        />
      </label>
      {error && <p className="mt-1 px-1 text-[11px] text-danger">{error}</p>}
    </div>
  )
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }

export function SelectField({ label, options, ...rest }: SelectFieldProps) {
  const id = useId()
  return (
    <label htmlFor={id} className="relative block rounded-[16px] border border-line bg-white px-4 py-2.5 transition focus-within:border-2 focus-within:border-gold">
      <span className="block text-[11px] text-muted">{label}</span>
      <select id={id} className="mt-0.5 w-full appearance-none bg-transparent text-[15px] text-ink outline-none" {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-[12px] text-muted">
        ▼
      </span>
    </label>
  )
}

export function FileDrop({ title, hint, icon: Icon = FileUp, button, accept = 'image/*', onFile }: { title?: string; hint?: string; icon?: LucideIcon; button?: string; accept?: string; onFile?: (file: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<string>()
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className={cx(
        'press group flex w-full flex-col items-center gap-1.5 rounded-[20px] border-[1.5px] border-dashed bg-white px-4 py-5 text-center hover:border-gold hover:bg-gold-tint/30',
        file ? 'border-success bg-success/5' : 'border-line',
      )}
    >
      <input ref={ref} type="file" accept={accept} hidden onChange={(e) => {
          const picked = e.target.files?.[0] ?? null
          setFile(picked?.name)
          onFile?.(picked)
        }} />
      <span
        className={cx(
          'grid size-12 place-items-center rounded-[14px] transition-colors duration-300',
          file ? 'animate-pop bg-success/12 text-success' : 'bg-gold-tint text-[#a8884a] group-hover:bg-gold group-hover:text-ink',
        )}
      >
        {file ? <CircleCheck size={24} aria-hidden /> : <Icon size={24} strokeWidth={1.9} aria-hidden />}
      </span>
      {title && <span className="text-[15px] font-bold">{title}</span>}
      {hint && <span className="text-[12px] text-muted">{hint}</span>}
      {file ? (
        <span className="max-w-full truncate text-[12px] font-semibold text-success">{file}</span>
      ) : (
        button && (
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-[10px] bg-gold-tint px-5 py-2 text-[12px] font-bold text-[#8a6d33]">
            <Camera size={14} aria-hidden /> {button}
          </span>
        )
      )}
    </button>
  )
}

export function BackButton({ fallback = '/home', light }: { fallback?: string; light?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  return (
    <button
      aria-label={t('common.back')}
      onClick={() => (location.key === 'default' ? navigate(fallback) : navigate(-1))}
      className={cx('press group grid size-11 place-items-center rounded-full', light ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-black/5')}
    >
      <ArrowLeft size={22} strokeWidth={2.2} className="transition-transform duration-300 group-hover:-translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:translate-x-0.5" aria-hidden />
    </button>
  )
}

export function PageHeader({ title, back, right }: { title: ReactNode; back?: string | false; right?: ReactNode }) {
  return (
    <header className="bg-white">
      <div className="mx-auto grid h-[76px] max-w-[1120px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 lg:px-5">
        <div>{back !== false && <BackButton fallback={back} />}</div>
        <h1 className="truncate text-center text-[18px] font-bold">{title}</h1>
        <div className="flex justify-end">{right}</div>
      </div>
    </header>
  )
}

export function Container({ children, narrow, className }: { children: ReactNode; narrow?: boolean; className?: string }) {
  return <div className={cx('mx-auto w-full px-5', narrow ? 'max-w-[560px]' : 'max-w-[1120px]', className)}>{children}</div>
}

export function SectionHead({
  title,
  to,
  action,
  icon: Icon,
  iconClass,
  filled,
}: {
  title: string
  to?: string
  action?: string
  icon?: LucideIcon
  iconClass?: string
  /** Fill the glyph (for closed shapes such as a crown or star) */
  filled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2.5 text-[18px] font-bold">
        {Icon && (
          // Solid gold circle; deeper gold keeps the white glyph readable
          <span
            className={cx(
              'grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#c9a35a] to-[#8a6d33] text-white shadow-[0_6px_14px_-6px_rgb(138_109_51/0.7)] ring-2 ring-white',
              iconClass,
            )}
          >
            <Icon size={18} strokeWidth={2.6} fill={filled ? 'currentColor' : 'none'} aria-hidden />
          </span>
        )}
        {title}
      </h2>
      {to && (
        <Link to={to} className="group inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-semibold text-[#a8884a] transition-colors hover:bg-gold-tint">
          {action ?? t('common.viewAll')}
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-[20px] bg-white shadow-l2', className)}>{children}</div>
}

export function Avatar({ letter, size = 56, className }: { letter: string; size?: number; className?: string }) {
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className={cx('grid shrink-0 place-items-center rounded-full border-[1.5px] border-gold bg-gold-tint font-bold text-gold', className)}
    >
      {letter}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-shimmer rounded-[8px] bg-[linear-gradient(90deg,#ececec_25%,#f6f6f6_50%,#ececec_75%)] bg-[length:200%_100%]', className)} />
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  const { t } = useTranslation()
  return (
    <div role="status" aria-label={t('common.loading')}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-[100px] rounded-[16px]" />
            <Skeleton className="mt-3 h-3 w-1/2" />
            <Skeleton className="mt-2 h-2.5 w-1/3" />
            <Skeleton className="mt-2 h-2 w-1/4" />
          </Card>
        ))}
      </div>
      <p className="mt-5 text-center text-[12px] text-muted">{t('common.loading')}</p>
    </div>
  )
}

export function LanguageToggle({ className }: { className?: string }) {
  const { i18n, t } = useTranslation()
  return (
    <button
      onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
      className={cx('h-10 rounded-[12px] border border-white/20 bg-white/8 px-3 text-[12px] font-semibold text-white transition hover:bg-white/15', className)}
    >
      {t('common.langName')}
    </button>
  )
}
