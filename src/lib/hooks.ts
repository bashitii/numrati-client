import { useEffect, useState } from 'react'
import type { DependencyList, PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Localized } from '../types'

export function useLocalized() {
  const { i18n } = useTranslation()
  return (value: Localized) => (i18n.language === 'ar' ? value.ar : value.en)
}

export function useAsync<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: boolean }>({
    data: null,
    loading: true,
    error: false,
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: false }))
    load()
      .then((data) => active && setState({ data, loading: false, error: false }))
      .catch(() => active && setState({ data: null, loading: false, error: true }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  return { ...state, retry: () => setAttempt((n) => n + 1) }
}

export const formatNumber = (n: number) => n.toLocaleString('en-US')

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Counts from 0 up to `target` with an ease-out, for numbers that should feel alive
export function useCountUp(target: number, duration = 1100) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  useEffect(() => {
    if (prefersReducedMotion()) return setValue(target)
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 4))))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

// Pointer-follow tilt: spread the returned props on an element with the `tilt` class
export function useTilt(max = 10) {
  const reset = (el: HTMLElement) => {
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }
  return {
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (prefersReducedMotion()) return
      const r = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      e.currentTarget.style.setProperty('--ry', `${x * max * 2}deg`)
      e.currentTarget.style.setProperty('--rx', `${-y * max * 2}deg`)
    },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => reset(e.currentTarget),
    onPointerCancel: (e: PointerEvent<HTMLElement>) => reset(e.currentTarget),
  }
}

/** "5 min ago" / "منذ 5 دقائق", in the current language */
export function useTimeAgo() {
  const { i18n } = useTranslation()
  return (iso: string | null | undefined) => {
    if (!iso) return ''
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })
    const steps: [Intl.RelativeTimeFormatUnit, number][] = [['second', 60], ['minute', 60], ['hour', 24], ['day', 7], ['week', 4.35], ['month', 12], ['year', Infinity]]
    let value = seconds
    for (const [unit, size] of steps) {
      if (Math.abs(value) < size) return rtf.format(Math.round(value), unit)
      value /= size
    }
    return ''
  }
}

/** "March 2024" in the current language */
export function useMonthYear() {
  const { i18n } = useTranslation()
  return (iso: string) => new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-JO' : 'en-GB', { month: 'long', year: 'numeric' }).format(new Date(iso))
}

/** Error text to show in the page (the server's message, or a generic fallback) */
export const errorText = (error: unknown) => (error instanceof Error && error.message ? error.message : 'Something went wrong')
