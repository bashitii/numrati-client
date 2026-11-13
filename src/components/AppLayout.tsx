import { Bell, Heart, Home, MessageCircle, Plus, Search, Sparkles, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { LogoMark } from './Logo'
import { useAuth } from '../store/auth'
import { Button, cx, LanguageToggle } from './ui'

const tabs: { to: string; icon: LucideIcon; key: string }[] = [
  { to: '/home', icon: Home, key: 'home' },
  { to: '/search', icon: Search, key: 'search' },
  { to: '/assistant', icon: Sparkles, key: 'assistant' },
  { to: '/favorites', icon: Heart, key: 'favorites' },
  { to: '/profile', icon: User, key: 'profile' },
]

// Matches the design: only these screens carry the bottom tab bar on phones.
const withBottomNav = ['/home', '/search', '/favorites', '/profile']

function TopNav() {
  const { t } = useTranslation()
  const { stats } = useAuth()
  return (
    <header className="sticky top-0 z-30 hidden border-b border-white/5 bg-night/90 backdrop-blur-xl lg:block">
      <div className="mx-auto flex h-[72px] max-w-[1120px] items-center gap-8 px-5">
        <Link to="/home" className="press group flex items-center gap-2.5 text-white">
          <LogoMark className="h-9 transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110" />
          <span className="text-[20px] font-bold">{t('brand')}</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cx(
                  'press relative flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-[14px]',
                  isActive ? 'bg-gold/15 font-bold text-gold' : 'text-white/70 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <tab.icon size={16} strokeWidth={2.2} aria-hidden />
              {t(`nav.${tab.key}`)}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/chats" aria-label={t('nav.chats')} className="press group grid size-10 place-items-center rounded-[12px] bg-white/8 text-white hover:bg-white/15">
            <MessageCircle size={18} className="transition group-hover:scale-110" aria-hidden />
          </Link>
          <Link to="/notifications" aria-label={t('nav.notifications')} className="press group relative grid size-10 place-items-center rounded-[12px] bg-white/8 text-white hover:bg-white/15">
            <Bell size={18} className="group-hover:animate-wiggle" aria-hidden />
            {Boolean(stats?.unreadNotifications) && <span className="absolute end-2 top-2 size-2 rounded-full bg-danger ring-2 ring-night" />}
          </Link>
          <LanguageToggle />
          <Button to="/seller/new" className="!min-h-10 !w-auto !text-[13px]">
            <Plus size={16} strokeWidth={2.6} aria-hidden /> {t('nav.sell')}
          </Button>
        </div>
      </div>
    </header>
  )
}

function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid h-[76px] grid-cols-5 border-t border-line/70 bg-white/90 px-2 pt-1.5 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      {tabs.map((tab) => {
        // Sanadak gets a raised gold button in the middle, like a familiar "main action" tab
        if (tab.key === 'assistant') {
          return (
            <NavLink key={tab.to} to={tab.to} aria-label={t(`nav.${tab.key}`)} className="press flex flex-col items-center gap-1 text-[11px] font-bold text-gold">
              <span className="animate-glow -mt-6 grid size-[54px] place-items-center rounded-full bg-gradient-to-br from-gold-light to-gold text-ink shadow-l3 ring-4 ring-white">
                <Sparkles size={24} strokeWidth={2.2} aria-hidden />
              </span>
              <span>{t(`nav.${tab.key}`)}</span>
            </NavLink>
          )
        }
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => cx('press flex flex-col items-center justify-start gap-1 py-1 text-[11px]', isActive ? 'font-bold text-gold' : 'text-muted')}
          >
            {({ isActive }) => (
              <>
                <span className={cx('relative grid h-8 w-14 place-items-center rounded-full transition-colors duration-300', isActive && 'bg-gold/12')}>
                  {/* key forces the bounce to replay each time the tab becomes active */}
                  <tab.icon
                    key={String(isActive)}
                    size={22}
                    strokeWidth={isActive ? 2.4 : 1.8}
                    fill={isActive && tab.key === 'favorites' ? 'currentColor' : 'none'}
                    className={cx(isActive && 'animate-pop')}
                    aria-hidden
                  />
                </span>
                <span>{t(`nav.${tab.key}`)}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

export function AppLayout() {
  const { pathname } = useLocation()
  const showBottom = withBottomNav.includes(pathname)
  return (
    <div className={cx('min-h-dvh bg-offwhite lg:pb-10', showBottom && 'pb-[92px]')}>
      <TopNav />
      {/* Keyed by path so every screen change plays a soft entrance */}
      <div key={pathname} className="animate-page">
        <Outlet />
      </div>
      {showBottom && <BottomNav />}
    </div>
  )
}
