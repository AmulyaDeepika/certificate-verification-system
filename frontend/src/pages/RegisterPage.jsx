import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  ShieldCheck, User, Mail, Lock, Building, GraduationCap, 
  Eye, EyeOff, AlertCircle, CheckCircle2 
} from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    email: '',
    username: '',
    password: '',
    confirm_password: '',
    role: 'STUDENT', // 'STUDENT' (Student), 'INSTITUTION_ADMIN' (Faculty/Admin)
    institution_name_input: '',
    institution: '',
  });

  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const res = await api.get('/public/institutions/');
      setInstitutions(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, institution: res.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        username: formData.username || formData.email.split('@')[0],
        first_name: formData.first_name,
        role: formData.role,
        password: formData.password,
        confirm_password: formData.confirm_password,
      };

      if (formData.role === 'INSTITUTION_ADMIN') {
        payload.institution = formData.institution;
      } else if (formData.institution) {
        payload.institution = formData.institution;
      }

      await api.post('/auth/register/', payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        const errorMsg = Object.entries(err.response.data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
          .join(' | ');
        setError(errorMsg);
      } else {
        setError('Registration failed. Please check your network and fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* 2-Column Split matching Mockup */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
        
        {/* Left Branding Panel */}
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
            Decentralized Credential Management
          </div>
        </div>

        {/* Right Registration Form */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900">Create Your Account</h2>
            <p className="text-sm text-slate-500 mt-1">Join CertVerify to access all features</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Account created successfully! Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name & Email Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email address"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Choose a username"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  placeholder="Confirm password"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Role Radio Group (Student, Faculty, Admin as in Mockup) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Role <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center space-x-6 text-xs sm:text-sm text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="role"
                    value="STUDENT"
                    checked={formData.role === 'STUDENT'}
                    onChange={() => setFormData({ ...formData, role: 'STUDENT' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Student</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="role"
                    value="INSTITUTION_ADMIN"
                    checked={formData.role === 'INSTITUTION_ADMIN'}
                    onChange={() => setFormData({ ...formData, role: 'INSTITUTION_ADMIN' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Faculty / Institution Admin</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="role"
                    value="SUPER_ADMIN"
                    checked={formData.role === 'SUPER_ADMIN'}
                    onChange={() => setFormData({ ...formData, role: 'SUPER_ADMIN' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Admin</span>
                </label>
              </div>
            </div>

            {/* Institution Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Institution Name (Optional)
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                >
                  <option value="">Select affiliated institution...</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name} ({inst.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Register Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
