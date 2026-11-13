import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { addFavorite, getMyFavorites, removeFavorite } from '../services/api'
import { useAuth } from './auth'

interface FavoritesValue {
  ids: string[]
  has: (id: string) => boolean
  /** Returns false when the visitor must sign in first */
  toggle: (id: string) => boolean
}

const FavoritesContext = createContext<FavoritesValue | null>(null)

/** Saved plates live on the server; this keeps the ids in memory so every heart updates at once */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, refresh } = useAuth()
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    if (!user) return setIds([])
    getMyFavorites()
      .then((plates) => setIds(plates.map((p) => p.id)))
      .catch(() => undefined)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(
    (id: string) => {
      if (!user) return false
      const saving = !ids.includes(id)
      // update the heart right away, undo it if the server says no
      setIds((prev) => (saving ? [...prev, id] : prev.filter((x) => x !== id)))
      ;(saving ? addFavorite(id) : removeFavorite(id))
        .then(refresh)
        .catch(() => setIds((prev) => (saving ? prev.filter((x) => x !== id) : [...prev, id])))
      return true
    },
    [user, ids, refresh],
  )

  const value = useMemo(() => ({ ids, toggle, has: (id: string) => ids.includes(id) }), [ids, toggle])
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider')
  return ctx
}
