import {
  Activity,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Calculator,
  Check,
  Flame,
  Gem,
  ListOrdered,
  Loader2,
  Minimize2,
  Repeat,
  Scale,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GoldPlate, PlateTile } from '../components/Plate'
import { Views } from '../components/PlateCards'
import { BackButton, Badge, Button, Card, Container, cx, Field, PageHeader, Price, SelectField, SkeletonCards } from '../components/ui'
import { errorText, formatNumber, useAsync } from '../lib/hooks'
import { detectTraits, estimatePrice, getPlates, saveEstimate } from '../services/api'
import { formatPlateCode, PLATE_CODE_PATTERN } from '../lib/plate'
import { useAuth } from '../store/auth'
import { FormError } from './Auth'
import type { Category, EstimateResult, Governorate } from '../types'
import { categoryOptions, governorateOptions } from './Seller'

type Trait = 'sequential' | 'repeated' | 'short' | 'specialLetters'
const traitLabels: Record<Trait, string> = { sequential: 'sequential', repeated: 'repeated', short: 'short', specialLetters: 'special' }
const traitIcons: Record<Trait, LucideIcon> = { sequential: ListOrdered, repeated: Repeat, short: Minimize2, specialLetters: Gem }

export function EstimateInputPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [category, setCategory] = useState<Category>('special')
  const [governorate, setGovernorate] = useState<Governorate>('amman')
  const [traits, setTraits] = useState<Record<Trait, boolean>>({ sequential: false, repeated: false, short: false, specialLetters: false })
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const valid = PLATE_CODE_PATTERN.test(code)

  const updateCode = (value: string) => {
    const next = formatPlateCode(value)
    setCode(next)
    setTraits((prev) => ({ ...prev, ...detectTraits(next) }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    setBusy(true)
    setError(undefined)
    try {
      const result = await estimatePrice({ code, category, governorate, ...traits })
      navigate('/estimate/result', { state: result })
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <main className="pb-10">
      <div className="bg-gradient-to-b from-night to-[#2a1f0a] pt-4 pb-16">
        <Container className="relative text-center">
          <div className="absolute start-1 top-1 lg:hidden">
            <BackButton light />
          </div>
          <span className="animate-pop inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-3.5 py-1.5 text-[11px] font-semibold text-gold">
            <Sparkles size={13} className="animate-pulse" aria-hidden /> {t('estimate.badge')}
          </span>
          <h1 className="mt-3 text-[28px] font-extrabold text-white lg:text-[38px]">{t('estimate.title')}</h1>
          <p className="mx-auto mt-3 max-w-[300px] text-[12px] text-white/60 lg:max-w-none lg:text-[14px]">{t('estimate.sub')}</p>
        </Container>
      </div>
      <Container narrow className="-mt-8">
        <Card className="animate-rise p-5 shadow-l3 sm:p-6">
          <h2 className="text-[18px] font-bold">{t('estimate.form')}</h2>
          <p className="text-[11px] text-muted">{t('estimate.formSub')}</p>
          <form onSubmit={submit} className="mt-4 space-y-3.5" noValidate>
            <Field
              label={t('listing.number')}
              big
              dir="ltr"
              inputMode="numeric"
              placeholder="10-232"
              value={code}
              maxLength={8}
              onChange={(e) => updateCode(e.target.value)}
              error={touched && !valid ? t('listing.numberError') : undefined}
            />
            <SelectField label={t('listing.category')} value={category} onChange={(e) => setCategory(e.target.value as Category)} options={categoryOptions.map((v) => ({ value: v, label: t(`category.${v}`) }))} />
            <SelectField label={t('listing.governorate')} value={governorate} onChange={(e) => setGovernorate(e.target.value as Governorate)} options={governorateOptions.map((v) => ({ value: v, label: t(`governorate.${v}`) }))} />
            <fieldset>
              <legend className="text-[13px] font-bold">{t('estimate.traits')}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.keys(traitLabels) as Trait[]).map((key) => {
                  const Icon = traitIcons[key]
                  return (
                    <label
                      key={key}
                      className={cx(
                        'press flex cursor-pointer items-center gap-2 rounded-[14px] border px-3 py-2.5 text-[13px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold',
                        traits[key] ? 'border-gold bg-gold-tint font-semibold text-ink' : 'border-line bg-white text-[#666] hover:border-gold',
                      )}
                    >
                      <input type="checkbox" checked={traits[key]} onChange={(e) => setTraits({ ...traits, [key]: e.target.checked })} className="sr-only" />
                      <span className={cx('grid size-7 shrink-0 place-items-center rounded-[9px] transition-colors', traits[key] ? 'bg-gold text-ink' : 'bg-offwhite text-muted')}>
                        {traits[key] ? <Check key="on" size={15} strokeWidth={3} className="animate-pop" aria-hidden /> : <Icon size={15} aria-hidden />}
                      </span>
                      {t(`estimate.${traitLabels[key]}`)}
                    </label>
                  )
                })}
              </div>
            </fieldset>
            <FormError message={error} />
            <Button type="submit" disabled={busy} className="!mt-6">
              {busy ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Calculator size={18} aria-hidden />}
              {busy ? t('common.loading') : t('estimate.submit')}
            </Button>
          </form>
        </Card>
      </Container>
    </main>
  )
}

export function EstimateResultPage() {
  const { t } = useTranslation()
  const { state } = useLocation() as { state: EstimateResult | null }
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  if (!state) return <Navigate to="/estimate" replace />

  const save = async () => {
    if (!user) return navigate('/login', { state: { from: '/estimate' } })
    setSaved(true)
    try {
      await saveEstimate(state.input)
    } catch (err) {
      setSaved(false)
      setSaveError(errorText(err))
    }
  }

  return (
    <main className="pb-10">
      <div className="bg-gradient-to-b from-night to-[#2a1f0a] pb-8">
        <Container narrow className="!px-3">
          <div className="grid h-[76px] grid-cols-[40px_1fr_40px] items-center">
            <BackButton light fallback="/estimate" />
            <h1 className="text-center text-[17px] font-bold text-white">{t('estimate.result')}</h1>
          </div>
          <div className="animate-rise mx-auto w-[200px]">
            <GoldPlate code={state.input.code} label={t(`category.${state.input.category}`)} />
          </div>
          <div className="mx-auto mt-4 max-w-[270px] rounded-[20px] border border-white/15 bg-white/8 px-4 py-3 text-center">
            <p className="text-[12px] text-muted">{t('estimate.estimated')}</p>
            <p dir="ltr" className="text-[25px] font-extrabold text-gold">
              {formatNumber(state.low)} – {formatNumber(state.high)} JD
            </p>
            <p className="text-[12px] text-white">
              {t('estimate.suggested', { price: '' })}
              <Price value={state.suggested} />
            </p>
          </div>
        </Container>
      </div>
      <Container narrow className="space-y-4 pt-5">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="flex items-center gap-2 text-[16px] font-bold">
              <span className="grid size-8 place-items-center rounded-[10px] bg-success/12 text-success">
                <Activity size={17} aria-hidden />
              </span>
              {t('estimate.demand')}
            </h2>
            <Badge tone="green" className="!py-1.5">
              <Target size={12} aria-hidden /> {t('estimate.accuracy', { value: state.confidence })}
            </Badge>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-offwhite">
            <div
              style={{ width: `${state.demand}%` }}
              className="animate-grow h-full origin-left rounded-full bg-gradient-to-r from-success to-gold rtl:origin-right rtl:bg-gradient-to-l"
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px]">
            <span className="text-muted">{t('estimate.low')}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#e5602b]">
              <Flame size={13} aria-hidden /> {t('estimate.high', { value: state.demand })}
            </span>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold">
            <span className="grid size-8 place-items-center rounded-[10px] bg-gold-tint text-[#8a6d33]">
              <Zap size={17} aria-hidden />
            </span>
            {t('estimate.factors')}
          </h2>
          <dl className="stagger">
            {state.factors.map((f) => (
              <div key={f.key} className="flex items-center justify-between rounded-[8px] px-3 py-2.5 text-[13px] odd:bg-offwhite">
                <dt>{t(`estimate.f.${f.key}`)}</dt>
                <dd dir="ltr" className={cx('font-bold', f.key === 'base' ? 'text-gold' : 'text-success')}>
                  {f.key === 'base' ? '' : '+'}
                  {formatNumber(f.amount)} JD
                </dd>
              </div>
            ))}
          </dl>
        </Card>
        <Button to="/estimate/similar" linkState={state} className="!mt-5">
          <Scale size={18} aria-hidden /> {t('estimate.seeSimilar')}
        </Button>
        <FormError message={saveError} />
        <Button variant="secondary" onClick={save} disabled={saved}>
          {saved ? <BookmarkCheck key="saved" size={18} className="animate-pop text-success" aria-hidden /> : <Bookmark size={18} aria-hidden />}
          {saved ? t('estimate.saved') : t('estimate.save')}
        </Button>
        <p className="text-center text-[11px] text-muted">{t('estimate.disclaimer')}</p>
      </Container>
    </main>
  )
}

export function SimilarPlates() {
  const { t } = useTranslation()
  const { state } = useLocation() as { state: EstimateResult | null }
  const { data, loading } = useAsync(() => getPlates({ sort: 'priceLow', category: state?.input.category }), [])
  if (!state) return <Navigate to="/estimate" replace />

  const reference = { code: state.input.code, price: state.suggested, category: state.input.category }
  const list = [...(data ?? [])]
    .filter((p) => !p.premium)
    .sort((a, b) => Math.abs(a.price - reference.price) - Math.abs(b.price - reference.price))
    .slice(0, 4)
    .sort((a, b) => a.price - b.price)

  return (
    <main className="pb-10">
      <PageHeader title={t('estimate.similar')} back="/estimate" />
      <Container className="max-w-[820px] pt-3">
        <div className="rounded-[16px] border border-gold/40 bg-[#1a1408] px-4 py-3">
          <p className="text-[11px] text-white/60">{t('estimate.yourRef')}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[15px] font-bold text-gold">
              <span dir="ltr">{reference.code.replace('-', ' - ')}</span> • {t('estimate.estimateShort', { price: '' })}
              <Price value={reference.price} />
            </p>
            <span className="text-[11px] text-gold/70">{t(`category.${reference.category}`)}</span>
          </div>
        </div>
        <h2 className="mt-4 mb-3 text-[14px] font-bold">{t('estimate.found', { count: list.length })}</h2>
        {loading ? (
          <SkeletonCards count={2} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {list.map((p) => {
              const diff = p.price - reference.price
              const amount = `${formatNumber(Math.abs(diff))} JD`
              return (
                <Card key={p.id} className={cx('relative flex items-center gap-3.5 p-3.5', p.sold && 'bg-[#efefef] shadow-none')}>
                  <div className="relative shrink-0">
                    <PlateTile code={p.code} className="h-[84px] w-[100px] !p-2" />
                    {p.sold && <span className="absolute inset-x-0 -top-1 rounded-[10px] bg-muted py-1 text-center text-[10px] font-bold text-white">{t('estimate.sold')}</span>}
                  </div>
                  <div className={cx('min-w-0 flex-1', p.sold && 'opacity-55')}>
                    <Price value={p.price} className="text-[19px] font-bold" />
                    <div>
                      <Badge tone={diff < 0 ? 'green' : 'red'}>
                        {diff < 0 ? <TrendingDown size={11} aria-hidden /> : <TrendingUp size={11} aria-hidden />}
                        {t(diff < 0 ? 'estimate.cheaper' : 'estimate.pricier', { value: amount })}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted">{t(`category.${p.category}`)}</p>
                    <Views count={p.views} />
                  </div>
                  {!p.sold && (
                    <Link to={`/plates/${p.id}`} className="press group inline-flex items-center gap-1 rounded-[10px] bg-gold px-3.5 py-2.5 text-[12px] font-bold hover:bg-gold-light">
                      {t('common.view')}
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
                    </Link>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </Container>
    </main>
  )
}
