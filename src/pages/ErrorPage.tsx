import { CircleAlert, Home, LifeBuoy, RotateCcw, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui'

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-[390px] flex-col items-center justify-center px-5 py-10 text-center">
      <div className="animate-pop relative grid size-[130px] place-items-center rounded-full border-2 border-danger/30 bg-danger/10 text-danger">
        <span className="animate-pulse-ring absolute inset-0 rounded-full border border-danger/30" />
        <TriangleAlert size={58} strokeWidth={1.7} className="animate-wiggle [animation-delay:400ms]" aria-hidden />
      </div>
      <h1 className="animate-rise mt-6 text-[26px] font-bold [animation-delay:100ms]">{t('states.errorTitle')}</h1>
      <p className="animate-rise mt-3 max-w-[260px] text-[13px] leading-relaxed text-muted [animation-delay:160ms]">{t('states.errorBody')}</p>
      <div className="animate-rise mt-6 w-full rounded-[16px] border border-danger/25 bg-danger/8 px-5 py-3 text-start [animation-delay:220ms]">
        <p className="flex items-center gap-1.5 text-[12px] text-danger">
          <CircleAlert size={14} aria-hidden /> {t('states.errorCode')}
        </p>
        <p dir="ltr" className="mt-1 text-end text-[11px] text-muted rtl:text-end ltr:text-start">
          Request ID: NMR-2025-5834
        </p>
      </div>
      <Button className="group mt-6" onClick={onRetry}>
        <RotateCcw size={18} className="transition-transform duration-500 group-hover:-rotate-180" aria-hidden /> {t('states.tryAgain')}
      </Button>
      <Button variant="secondary" className="mt-3 !font-medium" onClick={() => window.location.assign('/home')}>
        <Home size={18} aria-hidden /> {t('states.home')}
      </Button>
      <a href="mailto:support@numrati.jo" className="press mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold text-[#8a6d33] hover:bg-gold-tint">
        <LifeBuoy size={16} aria-hidden /> {t('states.support')}
      </a>
    </main>
  )
}

export function ErrorPage() {
  return <ErrorState onRetry={() => window.history.back()} />
}
