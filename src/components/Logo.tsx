const GOLD = '#D4A84A'
const SAND = '#F5F1E8'
const NIGHT = '#0E0F12'

// Numrati mark, drawn for dark backgrounds
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="168 254 464 285" className={className} aria-hidden="true">
      <g fill="none" stroke={GOLD} strokeWidth="13">
        <path d="M532 287H218a40 40 0 0 0-40 40v162a40 40 0 0 0 40 40h348a40 40 0 0 0 40-40V349" />
        <path d="M276 287v242" />
      </g>
      <g fill={GOLD}>
        <circle cx="228" cy="361" r="10.5" />
        <circle cx="228" cy="407" r="10.5" />
        <circle cx="228" cy="454" r="10.5" />
        <circle cx="588" cy="298" r="40" />
      </g>
      <path d="M360 462V352L510 462V352" fill="none" stroke={SAND} strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M565 300l15 15 30-31" fill="none" stroke={NIGHT} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
