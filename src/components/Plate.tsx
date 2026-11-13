import { useTranslation } from 'react-i18next'
import { cx } from './ui'

// Approximate rendered width in em: digits at 0.66, plus the " - " separator
function numberSize(code: string) {
  const widthInEm = code.replace(/\D/g, '').length * 0.66 + 1
  return Math.min(18, 68 / widthInEm)
}

export function Plate({ code }: { code: string }) {
  return (
    <div className="plate" role="img" aria-label={code}>
      <div className="plate-face">
        <div className="plate-country">
          <div>الأردن</div>
          <div style={{ fontSize: '0.72em' }}>JORDAN</div>
        </div>
        <div className="plate-number" style={{ fontSize: `${numberSize(code)}cqw` }}>
          {code.replace('-', ' - ')}
        </div>
      </div>
    </div>
  )
}

export function GoldPlate({ code, label }: { code: string; label?: string }) {
  const { t } = useTranslation()
  return (
    <div className="plate" role="img" aria-label={code}>
      <div className="plate-gold">
        <div className="plate-number">{code}</div>
        <small>{t('jordan')}</small>
        {label && <small style={{ color: 'var(--color-gold)', fontWeight: 600 }}>{label}</small>}
      </div>
    </div>
  )
}

export function PlateTile({ code, className }: { code: string; className?: string }) {
  return (
    <div className={cx('grid place-items-center rounded-[16px] border-[1.5px] border-gold/50 bg-offwhite p-[9%]', className)}>
      <Plate code={code} />
    </div>
  )
}
