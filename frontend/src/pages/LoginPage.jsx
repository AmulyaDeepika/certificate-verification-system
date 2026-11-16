import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, GraduationCap, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'SUPER_ADMIN') {
        navigate('/superadmin');
      } else if (user.role === 'INSTITUTION_ADMIN') {
        navigate('/institution');
      } else {
        navigate('/student');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (quickEmail, quickPass) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="min-h-[90vh] bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* 2-Column Split Card matching Mockup */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        
        {/* Left Branding Side (Blue gradient with shield icon & graduation cap) */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.3)_0%,transparent_70%)] pointer-events-none"></div>

          <div>
            <div className="flex items-center space-x-2.5 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white font-sans">
                CertVerify
              </span>
            </div>
          </div>

          <div className="my-auto text-center space-y-4 py-8">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-14 h-14 text-cyan-400" />
            </div>
            <h3 className="text-3xl font-black text-white">CertVerify</h3>
            <p className="text-sm font-semibold tracking-wider text-blue-200 uppercase">
              Secure • Verify • Trust
            </p>
            <div className="pt-4 flex justify-center opacity-80">
              <GraduationCap className="w-16 h-16 text-blue-300/60" />
            </div>
          </div>

          <div className="text-xs text-blue-200/80 text-center">
            Cryptographic Academic Credentials Engine
          </div>
        </div>

        {/* Right Form Side */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900">Welcome Back!</h2>
            <p className="text-sm text-slate-500 mt-1">Login to your account</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  autoComplete="off"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Remember Me</span>
              </label>
              <a href="#" className="font-semibold text-blue-600 hover:underline">
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Quick Demo Student Autofill */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Quick Student Demo Login
            </span>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fillQuickAccount('alex.morgan@gmail.com', 'student123')}
                className="py-1.5 px-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs font-bold rounded-lg border border-cyan-200 transition"
              >
                User / Student
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:underline">
              Register
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
