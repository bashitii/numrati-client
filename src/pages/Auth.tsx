import { ArrowRight, CircleAlert, CreditCard, IdCard, MessageSquareText, PlusCircle, ScanFace, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Star, Tag } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LogoMark } from '../components/Logo'
import { Plate } from '../components/Plate'
import { PhotoCapture } from '../components/CameraCapture'
import { BackButton, Button, cx, Field, LanguageToggle } from '../components/ui'
import { errorText } from '../lib/hooks'
import { forgotPassword, resendCode, submitVerification } from '../services/api'
import { useAuth } from '../store/auth'

const ONBOARDED = 'numrati.onboarded'

function markOnboarded() {
  try {
    localStorage.setItem(ONBOARDED, '1')
  } catch {
    // storage can be unavailable in private windows
  }
}

function wasOnboarded() {
  try {
    return localStorage.getItem(ONBOARDED) === '1'
  } catch {
    return false
  }
}

export function Splash() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate(wasOnboarded() ? '/home' : '/onboarding', { replace: true }), 1800)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0a] to-[#1a1408] px-6 text-center">
      <div className="animate-pop relative grid size-[96px] place-items-center rounded-full border border-gold/70 bg-gold/15 [animation-duration:0.8s]">
        <span className="animate-glow absolute inset-0 rounded-full" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {[320, 220].map((size) => (
            <span
              key={size}
              style={{ width: size, height: size, marginInlineStart: -size / 2, marginTop: -size / 2 }}
              className="animate-pulse-ring absolute rounded-full border border-gold/15"
            />
          ))}
        </div>
        <LogoMark className="relative w-[68px]" />
      </div>
      <h1 className="mt-4 text-[44px] leading-tight font-extrabold text-white">نمرتي</h1>
      <p className="text-[15px] font-bold tracking-wide text-gold">NUMRATI</p>
      <p className="mt-6 text-[14px] text-white/60">{t('splash.tagline')}</p>
      <div className="mt-24 flex items-center gap-4">
        <span className="size-1.5 rounded-full bg-gold/50" />
        <span className="size-2.5 rounded-full bg-gold" />
        <span className="size-1.5 rounded-full bg-gold/50" />
      </div>
      <p className="mt-16 text-[11px] text-white/30">{t('splash.rights')}</p>
    </main>
  )
}

export function Onboarding() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const slides = [
    { title: t('onboarding.s1Title'), body: t('onboarding.s1Body'), code: '11-318', price: '12,000 JD', icon: Tag },
    { title: t('onboarding.s2Title'), body: t('onboarding.s2Body'), code: '10-232', price: 'AI', icon: Sparkles },
    { title: t('onboarding.s3Title'), body: t('onboarding.s3Body'), code: '20-12345', price: '', icon: PlusCircle },
  ]
  const slide = slides[index]
  const last = index === slides.length - 1

  const finish = () => {
    markOnboarded()
    navigate('/login')
  }

  return (
    <main className="flex min-h-dvh flex-col bg-night">
      <div className="relative grid flex-1 place-items-center bg-[#111005] px-8 py-16">
        <LanguageToggle className="absolute end-4 top-4" />
        <div key={index} className="animate-rise relative w-full max-w-[280px] rounded-[20px] border-2 border-gold/40 bg-offwhite px-10 pt-12 pb-3">
          <span dir="ltr" className="animate-pop absolute end-0 top-0 inline-flex items-center gap-1.5 rounded-[20px] bg-gold px-4 py-3 text-[11px] font-bold text-ink [animation-delay:200ms]">
            <slide.icon size={14} strokeWidth={2.4} aria-hidden />
            {slide.price}
          </span>
          <Plate code={slide.code} />
          <p className="stagger mt-6 flex justify-center gap-1.5 text-gold" aria-label="5/5">
            {[0, 1, 2, 3, 4].map((s) => (
              <Star key={s} size={16} fill="currentColor" aria-hidden />
            ))}
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[420px] px-10 pt-6 pb-10 text-center">
        <h1 className="text-[30px] font-extrabold text-white">{slide.title}</h1>
        <p className="mx-auto mt-3 max-w-[290px] text-[13px] leading-relaxed text-muted">{slide.body}</p>
        <div className="mt-6 flex justify-center gap-2">
          {slides.map((s, i) => (
            <span key={s.title} className={cx('h-1.5 rounded-full transition-all', i === index ? 'w-6 bg-gold' : 'w-1.5 bg-gold/30')} />
          ))}
        </div>
        <Button className="group mt-7" onClick={() => (last ? finish() : setIndex(index + 1))}>
          {last ? t('onboarding.start') : t('common.next')}
          <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden />
        </Button>
        <Button variant="ghostDark" className="mt-3" onClick={finish}>
          {t('common.skip')}
        </Button>
      </div>
    </main>
  )
}

function AuthShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-offwhite pb-10">
      <div className="relative bg-night px-5 pt-10 pb-20 text-center">
        <LanguageToggle className="absolute end-4 top-4" />
        {header}
      </div>
      <div className="animate-rise relative mx-auto -mt-10 w-[calc(100%-40px)] max-w-[440px] rounded-[28px] bg-white p-5 shadow-l3 sm:p-7">{children}</div>
    </main>
  )
}

/** Red message box for errors coming back from the server */
export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="animate-rise flex items-start gap-2 rounded-[12px] border border-danger/30 bg-danger/8 px-3 py-2.5 text-[12px] text-danger">
      <CircleAlert size={15} className="mt-px shrink-0" aria-hidden /> {message}
    </p>
  )
}

export function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const from = (location.state as { from?: string } | null)?.from

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!email || !password) return
    setBusy(true)
    setError(undefined)
    try {
      await login(email.trim(), password)
      navigate(from ?? '/home', { replace: true })
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  const forgot = async () => {
    setTouched(true)
    if (!email) return
    await forgotPassword(email.trim()).catch(() => undefined)
    setNotice(t('more.forgotSent'))
  }

  return (
    <AuthShell
      header={
        <>
          <span className="mx-auto grid size-14 place-items-center rounded-full border border-gold/70 bg-gold/15">
            <LogoMark className="w-10" />
          </span>
          <p className="mt-3 text-[18px] font-bold text-white">{t('brand')}</p>
          <p className="text-[13px] text-muted">{t('auth.welcome')}</p>
        </>
      }
    >
      <h1 className="text-[24px] font-bold">{t('auth.signIn')}</h1>
      <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
        <Field label={t('auth.email')} type="email" dir="ltr" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={touched && !email ? t('auth.required') : undefined} autoComplete="email" />
        <Field label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={touched && !password ? t('auth.required') : undefined} autoComplete="current-password" />
        <p className="text-end">
          <button type="button" onClick={forgot} className="text-[12px] font-semibold text-gold hover:underline">
            {t('auth.forgot')}
          </button>
        </p>
        {notice && <p className="rounded-[12px] bg-success/10 px-3 py-2.5 text-[12px] text-success">{notice}</p>}
        <FormError message={error} />
        <Button type="submit" disabled={busy}>
          {busy ? t('common.loading') : t('auth.signIn')}
        </Button>
      </form>
      <p className="mt-5 text-center text-[13px] text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-bold text-gold hover:underline">
          {t('auth.register')}
        </Link>
      </p>
      <p className="mt-2 text-center">
        <Link to="/home" className="text-[12px] text-muted hover:text-ink hover:underline">
          {t('common.skip')}
        </Link>
      </p>
    </AuthShell>
  )
}

export function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register } = useAuth()
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' })
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const missing = (key: keyof typeof form) => (touched && !form[key] ? t('auth.required') : undefined)
  const mismatch = touched && form.confirm && form.password !== form.confirm ? t('auth.mismatch') : undefined
  const tooShort = touched && form.password && form.password.length < 8 ? t('auth.passwordShort') : undefined

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!Object.values(form).every(Boolean) || form.password.length < 8 || form.password !== form.confirm) return
    setBusy(true)
    setError(undefined)
    try {
      const user = await register({ fullName: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone, role })
      // With email confirmation on, the user first types the code we emailed them
      if (user) navigate('/verify-id', { replace: true })
      else navigate('/otp', { state: { email: form.email.trim() } })
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <AuthShell
      header={
        <>
          <p className="text-[22px] font-bold text-white">{t('brand')}</p>
          <p className="mt-1 text-[17px] font-bold text-white">{t('auth.createTitle')}</p>
        </>
      }
    >
      <h1 className="text-[18px] font-bold">{t('auth.details')}</h1>
      <form onSubmit={submit} className="mt-4 space-y-3.5" noValidate>
        <Field label={t('auth.fullName')} value={form.name} onChange={set('name')} error={missing('name')} autoComplete="name" />
        <Field label={t('auth.phone')} type="tel" dir="ltr" placeholder="+962 7X XXX XXXX" value={form.phone} onChange={set('phone')} error={missing('phone')} autoComplete="tel" />
        <Field label={t('auth.email')} type="email" dir="ltr" placeholder="example@email.com" value={form.email} onChange={set('email')} error={missing('email')} autoComplete="email" />
        <Field label={t('auth.password')} type="password" value={form.password} onChange={set('password')} error={missing('password') ?? tooShort} autoComplete="new-password" />
        <Field label={t('auth.confirm')} type="password" value={form.confirm} onChange={set('confirm')} error={missing('confirm') ?? mismatch} autoComplete="new-password" />
        <div className="grid grid-cols-2 gap-3">
          {(['buyer', 'seller'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={role === value}
              onClick={() => setRole(value)}
              className={cx(
                'press inline-flex h-12 items-center justify-center gap-2 rounded-[14px] text-[13px] font-bold',
                role === value ? 'bg-gold text-ink shadow-[0_6px_16px_rgb(200_169_107/0.35)]' : 'border border-line bg-offwhite text-muted hover:border-gold',
              )}
            >
              {value === 'buyer' ? <ShoppingBag key={role} size={17} className={cx(role === value && 'animate-pop')} aria-hidden /> : <Tag key={role} size={17} className={cx(role === value && 'animate-pop')} aria-hidden />}
              {t(`auth.${value}`)}
            </button>
          ))}
        </div>
        <FormError message={error} />
        <Button type="submit" disabled={busy}>
          {busy ? t('common.loading') : t('auth.create')}
        </Button>
      </form>
      <p className="mt-5 text-center text-[13px] text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-bold text-gold hover:underline">
          {t('auth.signIn')}
        </Link>
      </p>
    </AuthShell>
  )
}

export function Otp() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { verifyEmail } = useAuth()
  const email = (useLocation().state as { email?: string } | null)?.email
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [seconds, setSeconds] = useState(30)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (seconds <= 0) return
    const timer = setTimeout(() => setSeconds(seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])

  if (!email) return <Navigate to="/register" replace />

  const change = (i: number, value: string) => {
    // pasting the whole code fills every box
    const pasted = value.replace(/\D/g, '')
    if (pasted.length > 1) {
      setDigits(Array.from({ length: 6 }, (_, n) => pasted[n] ?? ''))
      refs.current[Math.min(pasted.length, 5)]?.focus()
      return
    }
    setDigits(digits.map((d, n) => (n === i ? pasted : d)))
    if (pasted) refs.current[i + 1]?.focus()
  }

  const complete = digits.every(Boolean)

  const verify = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await verifyEmail(email, digits.join(''))
      navigate('/verify-id', { replace: true })
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  const resend = async () => {
    setSeconds(30)
    setError(undefined)
    try {
      await resendCode(email)
      setNotice(t('more.resent'))
    } catch (err) {
      setError(errorText(err))
    }
  }

  return (
    <AuthShell
      header={
        <>
          <span className="animate-glow relative mx-auto grid size-20 place-items-center rounded-full bg-gold/15 text-gold">
            <Smartphone size={34} strokeWidth={1.7} className="animate-wiggle [animation-delay:500ms]" aria-hidden />
            <span className="absolute end-3 top-3 grid size-5 place-items-center rounded-full bg-gold text-ink">
              <MessageSquareText size={11} strokeWidth={2.6} aria-hidden />
            </span>
          </span>
          <p className="mt-2 text-[18px] font-bold text-white">{t('more.emailCodeHeader')}</p>
        </>
      }
    >
      <h1 className="text-[20px] font-bold">{t('auth.otpTitle')}</h1>
      <p className="mt-3 text-[13px] text-muted">
        {t('auth.otpSent')} <span dir="ltr" className="font-semibold text-ink">{email}</span>
      </p>
      <div dir="ltr" className="mt-6 grid grid-cols-6 gap-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            value={digit}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`${i + 1}`}
            onChange={(e) => change(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digit) refs.current[i - 1]?.focus()
            }}
            className={cx('h-14 min-w-0 rounded-[14px] border-2 text-center text-[20px] font-bold outline-none focus:border-gold', digit ? 'border-gold bg-gold-tint' : 'border-line/60 bg-offwhite')}
          />
        ))}
      </div>
      {notice && <p className="mt-4 rounded-[12px] bg-success/10 px-3 py-2.5 text-[12px] text-success">{notice}</p>}
      <div className="mt-4">
        <FormError message={error} />
      </div>
      <Button className="mt-4" disabled={!complete || busy} onClick={verify}>
        {busy ? t('common.loading') : t('auth.verify')}
      </Button>
      <p className="mt-5 text-center text-[13px] text-muted">
        {t('auth.noCode')}{' '}
        <button disabled={seconds > 0} onClick={resend} className="font-bold text-gold disabled:cursor-default">
          {t('auth.resend')} {seconds > 0 && <span dir="ltr">({seconds}s)</span>}
        </button>
      </p>
    </AuthShell>
  )
}

type IdFiles = { idFront: File | null; idBack: File | null; selfie: File | null }

export function VerifyId() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, refresh, logout } = useAuth()
  const [files, setFiles] = useState<IdFiles>({ idFront: null, idBack: null, selfie: null })
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const status = user?.verificationStatus
  const pick = (key: keyof IdFiles) => (file: File | null) => setFiles((prev) => ({ ...prev, [key]: file }))
  const ready = Boolean(files.idFront && files.idBack && files.selfie)
  // Until the photos are sent this step can't be skipped: no back arrow, no skip, only "Log out"
  const required = status !== 'verified' && status !== 'pending'

  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const submit = async () => {
    setTouched(true)
    if (!ready) return
    setBusy(true)
    setError(undefined)
    try {
      await submitVerification(files as { idFront: File; idBack: File; selfie: File })
      await refresh()
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <main className="min-h-dvh bg-offwhite pb-10">
      <header className="bg-white">
        <div className="mx-auto grid h-[76px] max-w-[520px] grid-cols-[40px_1fr_40px] items-center px-3">
          {required ? <span /> : <BackButton fallback="/profile" />}
          <h1 className="text-center text-[18px] font-bold">{t('auth.idTitle')}</h1>
        </div>
      </header>
      <div className="mx-auto max-w-[520px] px-5">
        <div className="mt-0 h-1 rounded-full bg-line">
          <div className="h-1 w-2/3 rounded-full bg-gold" />
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">{t('auth.step', { current: 2, total: 3 })}</p>
        <div className="mt-3 flex items-start gap-3 rounded-[16px] border border-gold/40 bg-cream p-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-gold/20 text-[#8a6d33]">
            <ShieldCheck size={19} aria-hidden />
          </span>
          <div>
            <p className="text-[14px] font-bold">{t('auth.secure')}</p>
            <p className="text-[11px] text-muted">{t('auth.secureBody')}</p>
          </div>
        </div>

        {status === 'verified' || status === 'pending' ? (
          <div className="mt-6 rounded-[20px] bg-white p-6 text-center shadow-l2">
            <ShieldCheck size={40} className={cx('mx-auto', status === 'verified' ? 'text-success' : 'text-warning')} aria-hidden />
            <p className="mt-3 text-[16px] font-bold">{status === 'verified' ? t('common.verifiedAccount') : t('more.verifyPending')}</p>
            <p className="mt-1 text-[12px] text-muted">{t('auth.reviewTime')}</p>
            <Button to="/home" className="mt-5">
              {t('states.backHome')}
            </Button>
          </div>
        ) : (
          <>
            {status === 'rejected' && <p className="mt-3 rounded-[12px] bg-danger/8 px-3 py-2.5 text-[12px] text-danger">{t('more.verifyRejected')}</p>}
            <div className="mt-4 space-y-4">
              <PhotoCapture icon={IdCard} title={t('auth.idFront')} name="id-front" facing="environment" onFile={pick('idFront')} />
              <PhotoCapture icon={CreditCard} title={t('auth.idBack')} name="id-back" facing="environment" onFile={pick('idBack')} />
              <PhotoCapture icon={ScanFace} title={t('auth.selfie')} name="selfie" facing="user" onFile={pick('selfie')} />
            </div>
            {touched && !ready && <p className="mt-3 text-[12px] text-danger">{t('auth.required')}</p>}
            <div className="mt-4">
              <FormError message={error} />
            </div>
            <Button className="mt-4" onClick={submit} disabled={busy}>
              {busy ? t('common.loading') : t('auth.submitReview')}
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted">{t('auth.reviewTime')}</p>
            <p className="mt-4 text-center">
              <button onClick={signOut} className="text-[12px] font-semibold text-muted hover:text-danger hover:underline">
                {t('profile.logout')}
              </button>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
