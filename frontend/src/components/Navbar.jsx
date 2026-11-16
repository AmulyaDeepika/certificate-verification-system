import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, LayoutDashboard, House, LogIn } from 'lucide-react';

const Navbar = () => {
  const { user, requestLogout } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isLoginPage = ['/login', '/admin-login'].includes(location.pathname);
  const isStudentDashboard = ['/user', '/student'].includes(location.pathname);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'SUPER_ADMIN' || user.role === 'INSTITUTION_ADMIN') return '/admin';
    return '/user';
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Home"
            title="Home"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <House className="h-5 w-5" />
          </Link>
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-blue-950 font-sans">
              CertVerify
            </span>
          </Link>
          </div>

          {/* Center Links */}
          {!isLoginPage && !isStudentDashboard && (
            <div className="hidden md:flex items-center space-x-8 text-xs sm:text-sm font-semibold text-slate-700">
            <Link
              to="/"
              className={`transition hover:text-blue-600 ${
                location.pathname === '/' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`transition hover:text-blue-600 ${
                location.pathname === '/about' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              About
            </Link>
            <Link
              to={user ? getDashboardPath() : '/dashboard'}
              className={`transition hover:text-blue-600 ${
                location.pathname === '/dashboard' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              Dashboard
            </Link>
            </div>
          )}

          {/* Right Action */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isLandingPage && !user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/verify"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition border border-slate-200"
                >
                  Verify
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to={getDashboardPath()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{user.role === 'STUDENT' ? 'User Dashboard' : 'Admin Console'}</span>
                </Link>
                <button
                  onClick={requestLogout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/dashboard"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
