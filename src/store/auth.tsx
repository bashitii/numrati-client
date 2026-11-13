import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import * as api from '../services/api'
import { getSession, setSession } from '../services/http'
import type { User, UserStats } from '../types'

interface AuthValue {
  user: User | null
  stats: UserStats | null
  /** true until we know whether a saved session is still valid */
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  /** Returns the user when signed in right away, or null when an email code is needed first */
  register: (input: Parameters<typeof api.register>[0]) => Promise<User | null>
  verifyEmail: (email: string, code: string) => Promise<User>
  logout: () => Promise<void>
  /** Reload the profile and counters (after verification, a new listing, reading notifications...) */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(Boolean(getSession()))

  const refresh = useCallback(async () => {
    if (!getSession()) {
      setUser(null)
      setStats(null)
      setLoading(false)
      return
    }
    try {
      const me = await api.getMe()
      setUser(me.user)
      setStats(me.stats)
    } catch (error) {
      // a dead session is cleared by the http helper; other errors (server down) keep it for later
      if ((error as { status?: number }).status === 401 || (error as { status?: number }).status === 403) setSession(null)
      setUser(null)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    // another tab signed in or out, or the token could not be refreshed
    const onChange = () => {
      if (!getSession()) {
        setUser(null)
        setStats(null)
      }
    }
    window.addEventListener('numrati:session', onChange)
    return () => window.removeEventListener('numrati:session', onChange)
  }, [refresh])

  const signedIn = useCallback(
    async (result: api.SignedIn) => {
      setSession(result.session)
      setUser(result.user)
      await refresh()
      return result.user
    },
    [refresh],
  )

  const value = useMemo<AuthValue>(
    () => ({
      user,
      stats,
      loading,
      refresh,
      login: async (email, password) => signedIn(await api.login(email, password)),
      register: async (input) => {
        const result = await api.register(input)
        return 'session' in result ? signedIn(result) : null
      },
      verifyEmail: async (email, code) => signedIn(await api.verifyEmail(email, code)),
      logout: async () => {
        await api.logout().catch(() => undefined)
        setSession(null)
        setUser(null)
        setStats(null)
      },
    }),
    [user, stats, loading, refresh, signedIn],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

function FullPageSpinner() {
  return (
    <div className="grid min-h-[60dvh] place-items-center">
      <span className="size-8 animate-spin rounded-full border-[3px] border-gold/30 border-t-gold" />
    </div>
  )
}

/** Pages that need a signed-in user. Guests go to /login and come back afterwards. */
export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to={admin ? '/admin' : '/login'} replace state={{ from: location.pathname }} />
  if (admin && user.role !== 'admin') return <Navigate to="/admin" replace />
  return <>{children}</>
}
