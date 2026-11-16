import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  ShieldCheck, GraduationCap, AlertCircle, CheckCircle2, Eye, EyeOff,
  MailCheck, Clock3, RefreshCw, ExternalLink,
} from 'lucide-react';

const UserRegisterPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    student_id_number: '',
    password: '',
    confirm_password: '',
    institution: '',
    institution_name: '',
  });

  const [institutions, setInstitutions] = useState([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(true);
  const [institutionsError, setInstitutionsError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const otpInputRefs = useRef([]);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(60);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!otpStep || !otpExpiresAt) return undefined;
    const updateCountdown = () => {
      setOtpSecondsLeft(Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000)));
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [otpExpiresAt, otpStep]);

  useEffect(() => {
    if (!success) return undefined;
    const timeout = window.setTimeout(() => navigate('/login'), 2200);
    return () => window.clearTimeout(timeout);
  }, [navigate, success]);

  const fetchInstitutions = useCallback(async () => {
    setInstitutionsLoading(true);
    setInstitutionsError('');
    try {
      const res = await api.get('/public/institutions/');
      if (!Array.isArray(res.data)) {
        throw new Error('The college list response was not in the expected format.');
      }
      setInstitutions(res.data);
    } catch (err) {
      console.error(err);
      setInstitutionsError(
        err.response?.data?.detail
          || err.message
          || 'Unable to load colleges. Please try again.'
      );
    } finally {
      setInstitutionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchInstitutions);
  }, [fetchInstitutions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.institution) {
      setError('Please choose a college from the suggestions.');
      return;
    }

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
        last_name: formData.last_name,
        student_id_number: formData.student_id_number,
        institution: formData.institution,
        role: 'STUDENT', // Strictly register as Student / Public User
        password: formData.password,
        confirm_password: formData.confirm_password,
      };

      await api.post('/auth/register/', payload);
      setOtp('');
      setOtpError('');
      setOtpExpiresAt(Date.now() + 60_000);
      setOtpSecondsLeft(60);
      setOtpStep(true);
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        const errorMsg = err.response.data.detail || Object.entries(err.response.data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
          .join(' | ');
        if (errorMsg.includes('pending registration')) {
          setError('');
          setOtp('');
          setOtpError('This email already has a pending registration. Request a new verification code to continue.');
          setOtpExpiresAt(0);
          setOtpSecondsLeft(0);
          setOtpStep(true);
          return;
        }
        setError(errorMsg);
      } else {
        setError('Registration failed. Please check your information.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (event) => {
    event.preventDefault();
    setOtpError('');
    setOtpLoading(true);
    try {
      await api.post('/auth/register/verify-otp/', {
        email: formData.email,
        otp,
      });
      setOtpStep(false);
      setSuccess(true);
    } catch (err) {
      setOtpError(
        err.response?.data?.detail
          || 'We could not verify that code. Please check it and try again.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    const digits = value.replace(/\D/g, '');
    setOtp((currentOTP) => {
      const nextOTP = currentOTP.split('');
      if (digits.length > 1) {
        digits.slice(0, 6 - index).split('').forEach((digit, offset) => {
          nextOTP[index + offset] = digit;
        });
      } else {
        nextOTP[index] = digits;
      }
      return nextOTP.join('').slice(0, 6);
    });

    if (digits.length > 1) {
      otpInputRefs.current[Math.min(index + digits.length, 5)]?.focus();
    } else if (digits && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPPaste = (event) => {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    setOtp(digits);
    otpInputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleOTPKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleResendOTP = async () => {
    setOtpError('');
    setResendLoading(true);
    try {
      await api.post('/auth/register/resend-otp/', { email: formData.email });
      setOtp('');
      setOtpExpiresAt(Date.now() + 60_000);
      setOtpSecondsLeft(60);
    } catch (err) {
      setOtpError(
        err.response?.data?.detail
          || 'We could not resend your code. Please try again.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  const countdownLabel = `00:${String(otpSecondsLeft).padStart(2, '0')}`;

  return (
    <div className="min-h-[90vh] bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        
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
              <GraduationCap className="w-14 h-14 text-cyan-400" />
            </div>
            <h3 className="text-3xl font-black text-white">Student Registration</h3>
            <p className="text-sm font-semibold tracking-wider text-blue-200 uppercase">
              Secure • Verify • Download
            </p>
          </div>

          <div className="text-xs text-blue-200/80 text-center">
            Register your verified student credentials account
          </div>
        </div>

        {/* Right Form Side */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900">Create Student Account</h2>
            <p className="text-xs text-slate-500 mt-1">Register to view, verify, and store your digital certificates</p>
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
              <span>Phone verified and account created successfully! Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="e.g. Sai Priya"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="e.g. M."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="student-registration-email"
                  autoComplete="off"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="saipriya@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Student ID / Roll No
                </label>
                <input
                  type="text"
                  value={formData.student_id_number}
                  onChange={(e) => setFormData({ ...formData, student_id_number: e.target.value })}
                  placeholder="e.g. 21A91A05XX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                College / Institution *
              </label>
              <input
                type="text"
                required
                list="college-options"
                value={formData.institution_name}
                onChange={(e) => {
                  const institutionName = e.target.value;
                  const matchedInstitution = institutions.find(
                    (item) => `${item.name} (${item.code})`.toLowerCase() === institutionName.trim().toLowerCase()
                  );
                  setFormData({
                    ...formData,
                    institution_name: institutionName,
                    institution: matchedInstitution ? String(matchedInstitution.id) : '',
                  });
                }}
                placeholder={institutionsLoading ? 'Loading colleges...' : 'Type to search colleges'}
                disabled={institutionsLoading || institutions.length === 0}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 transition"
              />
              <datalist id="college-options">
                {institutions.map(inst => (
                  <option key={inst.id} value={`${inst.name} (${inst.code})`} />
                ))}
              </datalist>
              {institutionsError && (
                <p className="mt-2 text-xs text-rose-600" role="alert">
                  {institutionsError}{' '}
                  <button type="button" onClick={fetchInstitutions} className="font-bold underline">
                    Retry
                  </button>
                </p>
              )}
              {!institutionsLoading && !institutionsError && institutions.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  No active colleges found. Please ask an administrator to add or activate your college.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="student-registration-password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-10 text-xs text-slate-900 transition focus:border-blue-600 focus:outline-none sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="student-registration-password-confirm"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    placeholder="Re-type password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-10 text-xs text-slate-900 transition focus:border-blue-600 focus:outline-none sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Register as Student</span>
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>

      </div>
      {otpStep && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-otp-title"
            aria-describedby="registration-otp-description"
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-8 ring-blue-50/60">
              <MailCheck className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
                Email verification
              </p>
              <h2 id="registration-otp-title" className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                Check your inbox
              </h2>
              <p id="registration-otp-description" className="mt-2 text-sm leading-6 text-slate-600">
                We sent a 6-digit verification code to
              </p>
              <p className="mt-1 break-all text-sm font-bold text-slate-900">{formData.email}</p>
              {formData.email.toLowerCase().endsWith('@gmail.com') ? (
                <a
                  href={`https://mail.google.com/mail/?authuser=${encodeURIComponent(formData.email)}#inbox`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open this Gmail inbox
                </a>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Open this email account&apos;s inbox to find your code.
                </p>
              )}
            </div>

            {otpError && (
              <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-left text-xs font-semibold leading-5 text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="mt-6 space-y-4">
              <div>
                <label htmlFor="registration-otp-0" className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700">
                  Verification code
                </label>
                <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="6-digit verification code">
                  {Array.from({ length: 6 }, (_, index) => (
                    <input
                      key={index}
                      ref={(element) => { otpInputRefs.current[index] = element; }}
                      id={`registration-otp-${index}`}
                      name={index === 0 ? 'registration-otp' : undefined}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      autoFocus={index === 0}
                      aria-label={`Verification code digit ${index + 1}`}
                      value={otp[index] || ''}
                      onChange={(event) => handleOTPChange(index, event.target.value)}
                      onPaste={handleOTPPaste}
                      onKeyDown={(event) => handleOTPKeyDown(index, event)}
                      className="h-14 min-w-0 flex-1 max-w-12 rounded-xl border border-slate-200 bg-slate-50 text-center font-mono text-2xl font-extrabold text-slate-900 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                <Clock3 className="h-4 w-4" />
                <span>
                  Code expires in{' '}
                  <strong className={otpSecondsLeft === 0 ? 'text-rose-600' : 'text-slate-800'}>
                    {countdownLabel}
                  </strong>
                </span>
              </div>
              <button
                type="submit"
                disabled={otpLoading || otp.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {otpLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Verify email and create account
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 border-t border-slate-100 pt-4 text-center">
              <p className="text-xs text-slate-500">Didn&apos;t receive the email?</p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={otpSecondsLeft > 0 || resendLoading}
                className="mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                {resendLoading ? 'Sending new code...' : otpSecondsLeft > 0 ? `Resend code in ${countdownLabel}` : 'Resend verification code'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default UserRegisterPage;
