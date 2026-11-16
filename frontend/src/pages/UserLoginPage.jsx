import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle, CheckCircle2, Eye, EyeOff, GraduationCap, Lock, Mail, ShieldCheck,
} from 'lucide-react';

const UserLoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const successMessage = location.state?.message || '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password, ['STUDENT']);
      navigate('/user');
    } catch (loginError) {
      console.error(loginError);
      setError(
        loginError.response?.data?.detail
          || loginError.message
          || 'Invalid email or password. Please verify your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
        <div className="md:col-span-5 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.3)_0%,transparent_70%)] pointer-events-none" />
          <div>
            <div className="flex items-center space-x-2.5 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white font-sans">CertVerify</span>
            </div>
          </div>

          <div className="my-auto text-center space-y-4 py-8">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <GraduationCap className="w-14 h-14 text-cyan-400" />
            </div>
            <h3 className="text-3xl font-black text-white">Student Portal</h3>
            <p className="text-sm font-semibold tracking-wider text-blue-200 uppercase">Secure • Verify • Trust</p>
          </div>

          <div className="text-xs text-blue-200/80 text-center">
            Sign in with your registered student account
          </div>
        </div>

        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <span>Student &amp; Public User Sign In</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900">Welcome Back!</h2>
            <p className="text-xs text-slate-500 mt-1">Sign in with your registered email and password.</p>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
            <div>
              <label htmlFor="student-login-email" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="student-login-email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="student-login-password" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="student-login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your CertVerify password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Remember Me</span>
              </label>
              <span className="text-slate-400 text-[11px]">Email verification is required at registration</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 flex justify-between items-center">
            <span>
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:underline">Register Here</Link>
            </span>
            <Link to="/admin-login" className="font-bold text-slate-700 hover:text-blue-600 hover:underline">
              Admin Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLoginPage;
