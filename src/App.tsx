import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { Assistant } from './pages/Assistant'
import { Chats, ChatConversation, Favorites, Notifications, Profile } from './pages/Account'
import { AdminDashboard, AdminDvld, AdminListings, AdminLogin, AdminReports, AdminUsers } from './pages/Admin'
import { Login, Onboarding, Otp, Register, Splash, VerifyId } from './pages/Auth'
import { Home, Search } from './pages/Browse'
import { ErrorPage } from './pages/ErrorPage'
import { EstimateInputPage, EstimateResultPage, SimilarPlates } from './pages/Estimate'
import { PlateDetails, Success } from './pages/PlateDetails'
import { AddListing, SellerAnalytics, SellerDashboard } from './pages/Seller'
import { RequireAuth, useAuth } from './store/auth'

export default function App() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  // ID verification can't be skipped: a signed-in user who hasn't sent their ID photos yet
  // (new account, or photos rejected by an admin) is sent back to the ID page from every other page.
  // They can still log out there. Admins are never affected.
  const mustSendId = user && user.role !== 'admin' && (user.verificationStatus === 'unverified' || user.verificationStatus === 'rejected')
  if (mustSendId && pathname !== '/verify-id') return <Navigate to="/verify-id" replace />

  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/otp" element={<Otp />} />
      <Route path="/verify-id" element={<RequireAuth><VerifyId /></RequireAuth>} />
      <Route path="/success" element={<Success />} />
      <Route path="/error" element={<ErrorPage />} />

      <Route element={<AppLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/plates/:id" element={<PlateDetails />} />
        <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="/chats" element={<RequireAuth><Chats /></RequireAuth>} />
        <Route path="/chats/:id" element={<RequireAuth><ChatConversation /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/seller" element={<RequireAuth><SellerDashboard /></RequireAuth>} />
        <Route path="/seller/new" element={<RequireAuth><AddListing /></RequireAuth>} />
        <Route path="/seller/analytics" element={<RequireAuth><SellerAnalytics /></RequireAuth>} />
        <Route path="/estimate" element={<EstimateInputPage />} />
        <Route path="/estimate/result" element={<EstimateResultPage />} />
        <Route path="/estimate/similar" element={<SimilarPlates />} />
        <Route path="/assistant" element={<Assistant />} />
      </Route>

      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<RequireAuth admin><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/users" element={<RequireAuth admin><AdminUsers /></RequireAuth>} />
      <Route path="/admin/listings" element={<RequireAuth admin><AdminListings /></RequireAuth>} />
      <Route path="/admin/reports" element={<RequireAuth admin><AdminReports /></RequireAuth>} />
      <Route path="/admin/dvld" element={<RequireAuth admin><AdminDvld /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
