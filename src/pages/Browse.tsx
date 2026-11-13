import { ArrowRight, ArrowUpDown, Bell, Calculator, Crown, Filter, Hand, LayoutGrid, RotateCcw, Search as SearchIcon, SearchX } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FeaturedCard, GridCard, RecentRow, ResultRow } from '../components/PlateCards'
import { BackButton, Button, Chip, Container, cx, LanguageToggle, SectionHead, SkeletonCards } from '../components/ui'
import { useAsync } from '../lib/hooks'
import { getPlates } from '../services/api'
import { useAuth } from '../store/auth'
import type { Category, PlateQuery, SortKey } from '../types'
import { ErrorState } from './ErrorPage'

const homeChips: (Category | 'all')[] = ['all', 'special', 'sequential', 'repeated']

export function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, stats } = useAuth()
  const [q, setQ] = useState('')
  const [chip, setChip] = useState<Category | 'all'>('all')
  const { data, loading, error, retry } = useAsync(() => getPlates(chip === 'all' ? {} : { category: chip }), [chip])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  const featured = data?.find((p) => p.premium) ?? data?.[0]
  const available = data?.filter((p) => p.id !== featured?.id && !p.sold) ?? []
  const trending = [...available].sort((a, b) => b.views - a.views).slice(0, 4)
  const recent = available.filter((p) => !trending.includes(p)).slice(0, 4)

  return (
    <main>
      <div className="bg-gradient-to-b from-night to-[#1a1408] pt-6 pb-4 lg:pt-10 lg:pb-8">
        <Container>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-[20px] font-bold text-white lg:text-[32px]">
                {t('home.hello', { name: user ? user.fullName.split(' ')[0] : t('more.guest') })}
                <Hand size={22} className="animate-wave origin-[70%_80%] text-gold-light lg:size-8" aria-hidden />
              </h1>
              <p className="mt-1 text-[12px] text-white/70 lg:text-[15px]">{t('home.sub')}</p>
            </div>
            <div className="flex gap-2 lg:hidden">
              <LanguageToggle />
              <Link to="/notifications" aria-label={t('nav.notifications')} className="press group relative grid size-10 place-items-center rounded-[12px] bg-white/10 text-white">
                <Bell size={18} fill="currentColor" className="animate-wiggle" style={{ animationDelay: '0.8s' }} aria-hidden />
                {Boolean(stats?.unreadNotifications) && <span className="absolute end-2 top-2 size-2 animate-pulse rounded-full bg-danger ring-2 ring-night" />}
              </Link>
            </div>
          </div>
          <form
            onSubmit={submit}
            className="mt-5 flex h-[50px] items-center rounded-[16px] border border-white/15 bg-white/8 ps-3.5 pe-1 backdrop-blur transition-all duration-300 focus-within:border-gold focus-within:bg-white/12 focus-within:shadow-[0_0_0_4px_rgb(200_169_107/0.18)] lg:h-[56px]"
          >
            <SearchIcon size={18} className="text-white/60" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              inputMode="numeric"
              placeholder={t('home.searchPh')}
              aria-label={t('home.searchPh')}
              className="min-w-0 flex-1 bg-transparent px-2 text-[14px] text-white outline-none placeholder:text-white/50"
            />
            <button aria-label={t('nav.search')} className="press group grid size-[42px] place-items-center rounded-[12px] bg-gold text-ink hover:bg-gold-light lg:size-[46px]">
              <Filter size={18} strokeWidth={2.2} fill="currentColor" className="transition-transform duration-300 group-hover:scale-110" aria-hidden />
            </button>
          </form>
        </Container>
      </div>

      <Container className="pt-3">
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1">
          {homeChips.map((c) => (
            <button
              key={c}
              onClick={() => setChip(c)}
              aria-pressed={chip === c}
              className={cx(
                'press h-[38px] shrink-0 rounded-full border px-6 text-[13px]',
                chip === c ? 'border-gold bg-gold font-bold text-ink shadow-[0_6px_16px_rgb(200_169_107/0.35)]' : 'border-line bg-white text-[#666] hover:border-gold hover:text-ink',
              )}
            >
              {t(`category.${c}`)}
            </button>
          ))}
        </div>

        <Link
          to="/estimate"
          className="lift press shine mt-3 flex items-center gap-3.5 rounded-[20px] border border-gold/50 bg-gradient-to-br from-[#1a1408] to-night p-4 text-white shadow-l3 hover:border-gold"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-light to-gold text-ink">
            <Calculator size={22} strokeWidth={2.2} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-gold">{t('estimate.badge')}</span>
            <span className="block text-[16px] font-bold">{t('estimate.title')}</span>
            <span className="block text-[12px] text-white/60">{t('home.estimateSub')}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold px-3.5 py-2 text-[12px] font-bold text-ink">
            {t('home.estimateCta')} <ArrowRight size={14} className="rtl:-scale-x-100" aria-hidden />
          </span>
        </Link>

        {error ? (
          <ErrorState onRetry={retry} />
        ) : loading && !data ? (
          <div className="mt-4">
            <SkeletonCards />
          </div>
        ) : (
          // key={chip} replays the entrance each time a filter is picked
          <div key={chip} className="stagger">
            {featured && (
              <section className="mt-3">
                <SectionHead title={t('home.featured')} to="/search" icon={Crown} filled />
                <FeaturedCard plate={featured} />
              </section>
            )}
            {trending.length > 0 && (
              <section className="mt-5">
                <SectionHead title={t('home.trending')} to="/search" />
                <div className="stagger grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-5">
                  {trending.map((p) => (
                    <GridCard key={p.id} plate={p} />
                  ))}
                </div>
              </section>
            )}
            {recent.length > 0 && (
              <section className="mt-5">
                <SectionHead title={t('home.recent')} to="/search" />
                <div className="stagger grid gap-2.5 lg:grid-cols-2">
                  {recent.map((p) => (
                    <RecentRow key={p.id} plate={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </Container>
    </main>
  )
}

const sorts: SortKey[] = ['latest', 'priceHigh', 'priceLow']

export function Search() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [input, setInput] = useState(q)
  const [filter, setFilter] = useState<'all' | 'verified' | 'under' | 'special'>('all')
  const [sort, setSort] = useState<SortKey>('latest')

  const query: PlateQuery = {
    q,
    sort,
    verifiedOnly: filter === 'verified' || undefined,
    maxPrice: filter === 'under' ? 5000 : undefined,
    category: filter === 'special' ? 'special' : undefined,
  }
  const { data, loading, error, retry } = useAsync(() => getPlates(query), [q, sort, filter])

  const reset = () => {
    setInput('')
    setFilter('all')
    setParams({})
  }

  return (
    <main>
      <div className="bg-white">
        <Container className="flex h-[80px] items-center gap-2 !px-3 lg:!px-5">
          <BackButton />
          <form
            className="flex-1"
            onSubmit={(e) => {
              e.preventDefault()
              setParams(input ? { q: input } : {})
            }}
          >
            <div className="flex h-[46px] items-center gap-2 rounded-[14px] border border-line bg-offwhite px-3.5 transition-all duration-300 focus-within:border-gold focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgb(200_169_107/0.15)]">
              <SearchIcon size={18} className="text-muted" aria-hidden />
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('home.searchPh')}
                aria-label={t('home.searchPh')}
                className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted"
              />
            </div>
          </form>
        </Container>
      </div>

      <Container className="pt-5">
        {data && data.length === 0 && !loading ? (
          <div className="animate-rise mx-auto flex max-w-[350px] flex-col items-center py-12 text-center">
            <div className="animate-pop relative grid size-[160px] place-items-center rounded-full border-2 border-line/70 bg-[#f4f2ec]">
              <span className="animate-pulse-ring absolute inset-3 rounded-full border border-gold/30" />
              <span className="animate-float grid size-[100px] place-items-center rounded-full bg-[#efeae0] text-[#a8884a]">
                <SearchX size={48} strokeWidth={1.6} aria-hidden />
              </span>
            </div>
            <h1 className="mt-6 text-[26px] font-bold">{t('search.none')}</h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">{t('search.noneBody')}</p>
            <Button className="mt-8" onClick={reset}>
              <RotateCcw size={18} aria-hidden /> {t('search.modify')}
            </Button>
            <Button variant="secondary" className="mt-3 !font-medium" onClick={reset}>
              <LayoutGrid size={18} aria-hidden /> {t('search.browseAll')}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-bold">{t('search.results', { count: data?.length ?? 0 })}</p>
              <button
                onClick={() => setSort(sorts[(sorts.indexOf(sort) + 1) % sorts.length])}
                className="press group inline-flex h-[36px] items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[12px] hover:border-gold"
              >
                <ArrowUpDown key={sort} size={14} className="animate-pop" aria-hidden /> {t(`search.${sort === 'latest' ? 'sort' : sort}`)}
              </button>
            </div>
            <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 py-1">
              <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
                {t('category.all')}
              </Chip>
              <Chip active={filter === 'verified'} onClick={() => setFilter('verified')}>
                {t('search.verified')}
              </Chip>
              <Chip active={filter === 'under'} onClick={() => setFilter('under')}>
                <span dir="ltr">{t('search.under')}</span>
              </Chip>
              <Chip active={filter === 'special'} onClick={() => setFilter('special')}>
                {t('category.special')}
              </Chip>
            </div>
            <div className="mt-3">
              {error ? (
                <ErrorState onRetry={retry} />
              ) : loading ? (
                <SkeletonCards />
              ) : (
                <div key={`${q}|${sort}|${filter}`} className="stagger grid gap-2.5 lg:grid-cols-2 lg:gap-4">
                  {data?.map((p) => (
                    <ResultRow key={p.id} plate={p} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Container>
    </main>
  )
}
