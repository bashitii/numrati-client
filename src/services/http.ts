// Small fetch wrapper for the Numrati API (Capstone2-server).
// In development Vite forwards /api to http://localhost:4000 (see vite.config.ts).
const BASE = import.meta.env.VITE_API_URL ?? '/api'
const SESSION_KEY = 'numrati.session'

export interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // storage can be unavailable in private windows
  }
  window.dispatchEvent(new Event('numrati:session'))
}

// One refresh at a time, shared by every request that hit an expired token
let refreshing: Promise<boolean> | null = null
function refreshSession() {
  refreshing ??= (async () => {
    const current = getSession()
    if (!current) return false
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      })
      if (!res.ok) throw new Error()
      setSession((await res.json()).session)
      return true
    } catch {
      setSession(null)
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

type Body = Record<string, unknown> | FormData | undefined

async function send<T>(method: string, path: string, body?: Body, retry = true): Promise<T> {
  const session = getSession()
  // Refresh a minute before the token runs out
  if (session && retry && session.expiresAt * 1000 < Date.now() + 60_000) await refreshSession()

  const token = getSession()?.accessToken
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (body && !(body instanceof FormData)) headers['content-type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is it running?')
  }

  if (res.status === 401 && token && retry && (await refreshSession())) return send<T>(method, path, body, false)

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Something went wrong')
  return data as T
}

export const http = {
  get: <T>(path: string) => send<T>('GET', path),
  post: <T>(path: string, body?: Body) => send<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body?: Body) => send<T>('PATCH', path, body ?? {}),
  delete: <T>(path: string) => send<T>('DELETE', path),
}

/** Builds "?a=1&b=2" from an object, skipping empty values */
export function qs(params: Record<string, unknown>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== false) search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}
