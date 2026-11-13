export type Localized = { en: string; ar: string }

export type Category = 'special' | 'exclusive' | 'sequential' | 'repeated' | 'regular'

export type Governorate =
  | 'amman' | 'irbid' | 'zarqa' | 'aqaba' | 'balqa' | 'karak'
  | 'madaba' | 'mafraq' | 'jerash' | 'ajloun' | 'tafilah' | 'maan'

export type ListingStatus = 'pending' | 'active' | 'rejected' | 'suspended' | 'sold' | 'removed'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type Role = 'buyer' | 'seller' | 'admin'

export interface User {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: Role
  verificationStatus: VerificationStatus
  createdAt: string
}

export interface UserStats {
  sales: number
  listings: number
  favorites: number
  unreadNotifications: number
}

/** A listing card, as returned by GET /api/plates */
export interface Plate {
  id: string
  code: string
  price: number
  marketValue: number | null
  category: Category
  governorate: Governorate
  /** the seller is ID-verified */
  verified: boolean
  /** featured by an admin */
  premium: boolean
  views: number
  interested: number
  weeklyChange: number
  sold: boolean
  status: ListingStatus
  sellerId: string
  sellerName: string
  publishedAt: string | null
  createdAt: string
  // only on /me/listings
  rejectionReason?: string | null
  pendingRequests?: number
}

export interface SellerSummary {
  id: string
  name: string
  verified: boolean
  since: string
  sales: number
}

export interface PlateDetailsData {
  plate: Plate
  seller: SellerSummary
  priceHistory: { oldPrice: number; newPrice: number; changedAt: string }[]
  similar: Plate[]
  isFavorite: boolean
  conversationId: string | null
  pendingRequestId: string | null
  isOwner: boolean
}

export type SortKey = 'latest' | 'priceHigh' | 'priceLow'

export interface PlateQuery {
  q?: string
  category?: Category
  verifiedOnly?: boolean
  maxPrice?: number
  sort?: SortKey
  limit?: number
}

export type NotificationType =
  | 'message' | 'favorite' | 'price_change' | 'purchase_request' | 'purchase_update'
  | 'listing_approved' | 'listing_rejected' | 'listing_suspended'
  | 'verification_approved' | 'verification_rejected' | 'report_update' | 'account_banned'

export interface NotificationItem {
  id: number
  type: NotificationType
  data: Record<string, string | number | null>
  unread: boolean
  createdAt: string
}

export interface Conversation {
  id: string
  plateId: string
  plateCode: string
  platePrice: number
  plateStatus: ListingStatus
  myRole: 'buyer' | 'seller'
  otherId: string
  otherName: string
  otherVerified: boolean
  lastMessage: string | null
  lastMessageAt: string | null
  createdAt: string
  unread: number
}

export interface ChatMessage {
  id: number
  senderId: string
  mine: boolean
  body: string
  createdAt: string
}

export interface EstimateInput {
  code: string
  category: Category
  governorate: Governorate
  sequential: boolean
  repeated: boolean
  short: boolean
  specialLetters: boolean
}

export interface EstimateFactor {
  key: 'sequential' | 'repeated' | 'short' | 'specialLetters' | 'category' | 'base'
  amount: number
}

export interface EstimateResult {
  input: EstimateInput
  low: number
  high: number
  suggested: number
  confidence: number
  demand: number
  factors: EstimateFactor[]
}

export interface SellerAnalytics {
  days: number
  views: number
  viewsPrevious: number
  interested: number
  requests: number
  sold: number
  series: { day: string; views: number }[]
  listings: { id: string; code: string; price: number; status: ListingStatus; views: number; interested: number; requests: number }[]
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export interface AdminActivity {
  id: number
  action: string
  targetType: string
  targetId: string
  details: Record<string, string | null>
  createdAt: string
  adminName: string | null
}

export interface AdminDashboardData {
  users: number
  newUsersThisWeek: number
  pendingVerifications: number
  activeListings: number
  pendingListings: number
  soldListings: number
  openReports: number
  newReports: number
  recentActivity: AdminActivity[]
}

export interface VerificationRequest {
  id: number
  userId: string
  fullName: string
  phone: string | null
  email: string
  registeredAt: string
  submittedAt: string
  idFrontUrl: string | null
  idBackUrl: string | null
  selfieUrl: string | null
}

export interface AdminListing {
  id: string
  code: string
  category: Category
  governorate: Governorate
  price: number
  estimatedValue: number | null
  status: ListingStatus
  createdAt: string
  sellerId: string
  sellerName: string
  sellerVerified: boolean
  ownerName: string
  ownerNationalId: string
  riskScore: number
  riskFlags: string[]
  openReports: number
  ownershipDocUrl: string | null
}

export type ReportStatus = 'new' | 'review' | 'closed'
export type ReportReason = 'suspicious_price' | 'fake_listing' | 'unverified_seller' | 'duplicate' | 'incorrect_details' | 'scam' | 'other'

export interface Report {
  id: number
  reason: ReportReason
  details: string | null
  status: ReportStatus
  adminNote: string | null
  createdAt: string
  plateId: string | null
  plateCode: string | null
  reporterName: string | null
  reportedUserId: string | null
  reportedUserName: string | null
}
