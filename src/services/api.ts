// Every screen gets its data from here. Each function is one call to the Numrati API (Capstone2-server).
import type {
  AdminDashboardData,
  AdminListing,
  ChatMessage,
  Conversation,
  EstimateInput,
  EstimateResult,
  NotificationItem,
  Plate,
  PlateDetailsData,
  PlateQuery,
  Report,
  ReportReason,
  ReportStatus,
  SellerAnalytics,
  SellerSummary,
  User,
  UserStats,
  VerificationRequest,
} from '../types'
import { http, qs } from './http'
import type { Session } from './http'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export type SignedIn = { session: Session; user: User }

export const login = (email: string, password: string) => http.post<SignedIn>('/auth/login', { email, password })

export const register = (input: { fullName: string; email: string; password: string; phone?: string; role: 'buyer' | 'seller' }) =>
  http.post<SignedIn | { needsEmailConfirmation: true; email: string }>('/auth/register', input)

export const verifyEmail = (email: string, code: string) => http.post<SignedIn>('/auth/verify-email', { email, code })
export const resendCode = (email: string) => http.post('/auth/resend-code', { email })
export const forgotPassword = (email: string) => http.post('/auth/forgot-password', { email })
export const logout = () => http.post('/auth/logout')
export const getMe = () => http.get<{ user: User; stats: UserStats }>('/auth/me')

// ---------------------------------------------------------------------------
// Plates
// ---------------------------------------------------------------------------
export async function getPlates(query: PlateQuery = {}) {
  const res = await http.get<{ items: Plate[] }>(`/plates${qs({ limit: 50, ...query })}`)
  return res.items
}

/** One page of search results, with how many plates match in total */
export const searchPlates = (query: PlateQuery, page = 1, limit = 20) =>
  http.get<{ items: Plate[]; total: number; hasMore: boolean; page: number }>(`/plates${qs({ ...query, page, limit })}`)

/** Plate details, or null when it does not exist / is not public */
export async function getPlate(id: string) {
  try {
    return await http.get<PlateDetailsData>(`/plates/${id}`)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}

export const getSeller = (id: string) => http.get<{ seller: SellerSummary; listings: Plate[] }>(`/users/${id}`)

export const addFavorite = (id: string) => http.post(`/plates/${id}/favorite`)
export const removeFavorite = (id: string) => http.delete(`/plates/${id}/favorite`)

export const startConversation = (plateId: string) => http.post<{ conversationId: string }>(`/plates/${plateId}/conversation`)

export const requestPurchase = (plateId: string, offeredPrice?: number, message?: string) =>
  http.post<{ requestId: string; conversationId: string; code: string; offeredPrice: number }>(`/plates/${plateId}/purchase-requests`, { offeredPrice, message })

// ---------------------------------------------------------------------------
// Seller
// ---------------------------------------------------------------------------
export const getMyListings = async () => (await http.get<{ items: Plate[] }>('/me/listings')).items
export const getMyFavorites = async () => (await http.get<{ items: Plate[] }>('/me/favorites')).items
export const getAnalytics = (days: number) => http.get<SellerAnalytics>(`/me/analytics?days=${days}`)

/** Sends the new listing (with the optional ownership document) for admin review */
export function createListing(input: {
  code: string
  category: string
  governorate: string
  price: number
  ownerName: string
  ownerNationalId: string
  estimatedValue?: number
  ownershipDoc?: File | null
}) {
  const form = new FormData()
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue
    form.append(key, value instanceof File ? value : String(value))
  }
  return http.post<{ plate: { id: string; code: string; status: string } }>('/plates', form)
}

export const updateListing = (id: string, changes: { price?: number }) => http.patch<{ status: string }>(`/plates/${id}`, changes)
export const markSold = (id: string) => http.post(`/plates/${id}/sold`)
export const removeListing = (id: string) => http.delete(`/plates/${id}`)

// ---------------------------------------------------------------------------
// Notifications and chat
// ---------------------------------------------------------------------------
export const getNotifications = () => http.get<{ items: NotificationItem[]; unreadCount: number }>('/notifications')
export const markNotificationsRead = (ids?: number[]) => http.post('/notifications/read', { ids })

export const getConversations = async () => (await http.get<{ items: Conversation[] }>('/conversations')).items
export const getMessages = async (conversationId: string, after?: number) =>
  (await http.get<{ items: ChatMessage[] }>(`/conversations/${conversationId}/messages${qs({ after })}`)).items
export const sendMessage = async (conversationId: string, body: string) =>
  (await http.post<{ message: ChatMessage }>(`/conversations/${conversationId}/messages`, { body })).message
export const markConversationRead = (conversationId: string) => http.post(`/conversations/${conversationId}/read`)

// ---------------------------------------------------------------------------
// ID verification and reports
// ---------------------------------------------------------------------------
export function submitVerification(files: { idFront: File; idBack: File; selfie: File }) {
  const form = new FormData()
  for (const [key, file] of Object.entries(files)) form.append(key, file)
  return http.post('/verification', form)
}

export const reportPlate = (plateId: string, reason: ReportReason, details?: string) => http.post('/reports', { plateId, reason, details })

// ---------------------------------------------------------------------------
// Price estimates
// ---------------------------------------------------------------------------
/** Instant, local check of the number's pattern while the user types (same rules as the server) */
export function detectTraits(code: string) {
  const digits = code.replace(/\D/g, '')
  const number = code.split('-')[1]?.replace(/\D/g, '') ?? digits
  const ascending = number.length > 2 && [...number].every((d, i) => i === 0 || +d === +number[i - 1] + 1)
  return {
    sequential: ascending,
    repeated: number.length > 1 && new Set(number).size <= 2,
    short: number.length > 0 && number.length <= 3,
  }
}

export const estimatePrice = (input: EstimateInput) => http.post<EstimateResult>('/estimates', { ...input })
export const saveEstimate = (input: EstimateInput) => http.post('/estimates/saved', { ...input })

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export const admin = {
  dashboard: () => http.get<AdminDashboardData>('/admin/dashboard'),
  verifications: async () => (await http.get<{ items: VerificationRequest[] }>('/admin/verifications')).items,
  reviewVerification: (id: number, approve: boolean, note?: string) =>
    http.post(`/admin/verifications/${id}/${approve ? 'approve' : 'reject'}`, { note: note || undefined }),
  listings: async () => (await http.get<{ items: AdminListing[] }>('/admin/listings?status=pending')).items,
  reviewListing: (id: string, action: 'approve' | 'reject' | 'suspend', reason?: string) =>
    http.post(`/admin/listings/${id}/${action}`, { reason: reason || undefined }),
  reports: async (status: 'open' | 'closed' | 'all'): Promise<Report[]> => {
    if (status !== 'all') return (await http.get<{ items: Report[] }>(`/admin/reports?status=${status}`)).items
    const [open, closed] = await Promise.all([admin.reports('open'), admin.reports('closed')])
    return [...open, ...closed].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  updateReport: (id: number, status: ReportStatus, note?: string) => http.patch(`/admin/reports/${id}`, { status, note }),
  banUser: (id: string, reason?: string) => http.post(`/admin/users/${id}/ban`, { reason }),
}
