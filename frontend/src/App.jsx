import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { CheckCircle2, LogOut } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import PortalSelectionPage from './pages/PortalSelectionPage';

// Separate Logins & Registrations
import UserLoginPage from './pages/UserLoginPage';
import UserRegisterPage from './pages/UserRegisterPage';
import VerifyOTP from './VerifyOTP';
import AdminLoginPage from './pages/AdminLoginPage';

// Verification Portal
import VerifyPage from './pages/VerifyPage';

// Dashboards
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

function AuthNotice() {
  const { notice, clearNotice } = useAuth();
  const isLogoutNotice = notice.startsWith('Logout successful.');

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(clearNotice, 5000);
    return () => window.clearTimeout(timeout);
  }, [notice, clearNotice]);

  if (!notice) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="logout-notice-enter fixed left-1/2 top-20 z-[60] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-emerald-800 shadow-xl shadow-emerald-950/10"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-6 w-6" />
      </span>
      <span className="min-w-0 pt-0.5">
        {isLogoutNotice ? (
          <>
            <span className="block text-sm font-extrabold">Logout successful</span>
            <span className="mt-1 block text-xs leading-5 text-slate-600">
              You have been securely signed out of CertVerify.
            </span>
          </>
        ) : (
          <span className="block text-sm font-bold leading-5">{notice}</span>
        )}
      </span>
    </div>
  );
}

function LogoutConfirmation() {
  const { logoutConfirmationOpen, cancelLogout, logout } = useAuth();

  useEffect(() => {
    if (!logoutConfirmationOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') cancelLogout();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelLogout, logoutConfirmationOpen]);

  if (!logoutConfirmationOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) cancelLogout();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="signout-title"
        aria-describedby="signout-description"
        className="logout-dialog-enter w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/60">
          <LogOut className="h-6 w-6" />
        </div>
        <h2 id="signout-title" className="text-center text-xl font-black tracking-tight text-slate-900">
          Are you sure you want to log out?
        </h2>
        <p id="signout-description" className="mt-2 text-center text-sm leading-6 text-slate-600">
          You will be securely signed out of CertVerify. You can sign in again whenever you need.
        </p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={cancelLogout}
            autoFocus
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            Keep me signed in
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <LogOut className="h-4 w-4" />
            Yes, log out
          </button>
        </div>
      </section>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
          <Navbar />
          <AuthNotice />
          <LogoutConfirmation />
          <main className="flex-1">
            <Routes>
              {/* 1. Landing Page */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/dashboard" element={<PortalSelectionPage />} />

              {/* 2. Separate User / Student Login & Registration */}
              <Route path="/login" element={<UserLoginPage />} />
              <Route path="/register" element={<UserRegisterPage />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />

              {/* 3. Separate Dedicated Admin Login */}
              <Route path="/admin-login" element={<AdminLoginPage />} />

              {/* 4. Public Certificate Verification Portal */}
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/verify/:certId" element={<VerifyPage />} />

              {/* 5. Separate Admin Dashboard (Only accessible by Admins) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INSTITUTION_ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 6. Dedicated User Dashboard (Only for Users to verify & view) */}
              <Route
                path="/user"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;