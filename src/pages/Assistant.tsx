import { AlertCircle, Loader2, MessageCircleQuestion, RotateCcw, SendHorizontal, Sparkles } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Markdown } from '../components/Markdown'
import { BackButton, Container, cx } from '../components/ui'
import type { AssistantMessage } from '../services/assistant'
import { askAssistant } from '../services/assistant'

export function Assistant() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  const suggestions = t('assistant.suggestions', { returnObjects: true }) as string[]

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function send(question: string) {
    if (!question.trim() || busy) return
    const history: AssistantMessage[] = [...messages, { role: 'user', text: question.trim() }]
    setMessages(history)
    setText('')
    setError(false)
    setBusy(true)
    try {
      await askAssistant(history, (answer) => setMessages([...history, { role: 'model', text: answer }]))
    } catch {
      setMessages(history)
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(text)
  }

  const waiting = busy && messages[messages.length - 1]?.role === 'user'

  return (
    <main className="flex h-dvh flex-col lg:h-[calc(100dvh-72px)]">
      <div className="bg-night">
        <Container className="flex h-[76px] items-center gap-2.5 !px-3 lg:!px-5">
          <BackButton light fallback="/home" />
          <span className="relative grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-gold/60 bg-gold/15 text-gold">
            <Sparkles size={20} className={cx(busy && 'animate-spin [animation-duration:2.5s]')} aria-hidden />
            {/* Online dot */}
            <span className="absolute -end-0.5 -bottom-0.5 size-3 rounded-full bg-success ring-2 ring-night" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-white">{t('assistant.title')}</p>
            <p key={String(busy)} className="animate-rise truncate text-[11px] text-white/60">
              {busy ? t('assistant.typing') : t('assistant.subtitle')}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              disabled={busy}
              className="press animate-pop inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/8 px-3 text-[12px] font-semibold text-white hover:bg-white/15 disabled:opacity-50"
            >
              <RotateCcw size={13} aria-hidden /> {t('assistant.newChat')}
            </button>
          )}
        </Container>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-5 pt-4 pb-4">
          {messages.length === 0 && (
            <div className="pt-6 text-center">
              <div className="animate-pop relative mx-auto grid size-20 place-items-center">
                <span aria-hidden className="animate-pulse-ring absolute inset-0 rounded-full bg-gold/20" />
                <span className="animate-float relative grid size-16 place-items-center rounded-full bg-gradient-to-br from-gold-light to-gold text-ink shadow-l3">
                  <Sparkles size={30} strokeWidth={2} aria-hidden />
                </span>
              </div>
              <h2 className="animate-rise mt-4 text-[20px] font-bold [animation-delay:100ms]">{t('assistant.welcome')}</h2>
              <p className="animate-rise mx-auto mt-1 max-w-[420px] text-[13px] text-muted [animation-delay:160ms]">{t('assistant.welcomeBody')}</p>
              <div className="stagger mt-6 grid gap-2.5 [animation-delay:200ms] sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="lift group flex items-center gap-3 rounded-[16px] border border-line bg-white px-4 py-3 text-start text-[14px] hover:border-gold"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-tint text-[#8a6d33] transition-colors group-hover:bg-gold group-hover:text-ink">
                      <MessageCircleQuestion size={16} aria-hidden />
                    </span>
                    <span className="flex-1">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cx('flex items-end gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'model' && (
                  <span className="animate-pop grid size-7 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                    <Sparkles size={14} aria-hidden />
                  </span>
                )}
                <div
                  dir="auto"
                  className={cx(
                    'animate-pop max-w-[85%] px-4 py-3 text-[15px] leading-[1.8]',
                    m.role === 'user'
                      ? 'origin-bottom rounded-[20px] rounded-ee-[6px] bg-gradient-to-br from-gold-light to-gold text-ink shadow-l2'
                      : 'origin-bottom rounded-[20px] rounded-es-[6px] bg-white shadow-l1',
                  )}
                >
                  {m.role === 'user' ? m.text : <Markdown text={m.text} />}
                </div>
              </div>
            ))}

            {waiting && (
              <div className="animate-pop flex items-end justify-start gap-2" role="status" aria-label={t('assistant.typing')}>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                  <Sparkles size={14} aria-hidden />
                </span>
                <div className="flex gap-1.5 rounded-[20px] rounded-es-[6px] bg-white px-4 py-4 shadow-l1">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="size-2 animate-bounce rounded-full bg-gold" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="animate-pop flex items-center gap-2 rounded-[14px] bg-danger/10 px-4 py-3 text-[13px] text-danger">
                <AlertCircle size={16} className="shrink-0" aria-hidden /> {t('assistant.error')}
              </p>
            )}
            <div ref={end} />
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="border-t border-line bg-white">
        <div className="mx-auto max-w-[720px] px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('assistant.placeholder')}
              aria-label={t('assistant.placeholder')}
              dir="auto"
              className="h-[48px] min-w-0 flex-1 rounded-full border border-line bg-offwhite px-5 text-[15px] outline-none transition-all duration-300 placeholder:text-muted focus:border-gold focus:bg-white focus:shadow-[0_0_0_4px_rgb(200_169_107/0.15)]"
            />
            <button
              disabled={busy || !text.trim()}
              aria-label={t('assistant.send')}
              className={cx(
                'press grid size-[48px] shrink-0 place-items-center rounded-full bg-gold text-ink hover:bg-gold-light disabled:bg-line disabled:text-muted',
                text.trim() && !busy && 'shadow-[0_6px_16px_rgb(200_169_107/0.45)]',
              )}
            >
              {busy ? (
                <Loader2 size={20} className="animate-spin" aria-hidden />
              ) : (
                <SendHorizontal size={20} strokeWidth={2.3} className={cx('transition-transform duration-300 rtl:-scale-x-100', text.trim() && '-rotate-12 rtl:rotate-12')} aria-hidden />
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted">{t('assistant.disclaimer')}</p>
        </div>
      </form>
    </main>
  )
}
