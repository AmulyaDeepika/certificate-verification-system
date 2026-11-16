import { useCallback, useEffect, useState } from 'react';
import {
  Award, Bell, BookOpen, Building2, CheckCircle2, Clock3, Download,
  Eye, EyeOff, FilePlus2, FileText, KeyRound, LayoutDashboard, LockKeyhole,
  Save, UserRound, XCircle, ShieldCheck, Search, QrCode, ExternalLink
} from 'lucide-react';
import api, { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { id: 'verify', label: 'Verify Certificate', icon: ShieldCheck },
  { id: 'certificates', label: 'My Certificates', icon: FileText },
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'available', label: 'Available Certificates', icon: Award },
  { id: 'institutions', label: 'Institutions Directory', icon: Building2 },
  { id: 'apply', label: 'Apply for Certificate', icon: FilePlus2 },
  { id: 'applications', label: 'My Applications', icon: Clock3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'My Profile', icon: UserRound },
  { id: 'password', label: 'Change Password', icon: KeyRound },
];

const emptyProfile = {
  first_name: '',
  last_name: '',
  phone: '',
  student_id_number: '',
};

const getErrorMessage = (error, fallback) => {
  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  const firstError = data && Object.values(data).flat().find((value) => typeof value === 'string');
  return firstError || fallback;
};

function EmptyState({ children }) {
  return <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">{children}</p>;
}

function UserDashboard() {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState('verify'); // Default to verification as requested
  const [certificates, setCertificates] = useState([]);
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [applicationForm, setApplicationForm] = useState({ certificate_type: '', institution: '', purpose: '' });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Verification tool states
  const [verifyId, setVerifyId] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [certificateRes, typesRes, institutionsRes, applicationRes, notificationRes, profileRes] = await Promise.all([
        api.get('/certificates/'),
        api.get('/public/certificate-types/'),
        api.get('/public/institutions/'),
        api.get('/certificate-applications/'),
        api.get('/notifications/'),
        api.get('/auth/profile/'),
      ]);
      setCertificates(certificateRes.data);
      setCertificateTypes(typesRes.data);
      setInstitutions(institutionsRes.data);
      setApplications(applicationRes.data);
      setNotifications(notificationRes.data);
      setProfile({
        first_name: profileRes.data.first_name || '',
        last_name: profileRes.data.last_name || '',
        phone: profileRes.data.phone || '',
        student_id_number: profileRes.data.student_id_number || '',
      });
      updateUser(profileRes.data);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load dashboard data. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    Promise.resolve().then(loadDashboard);
  }, [loadDashboard]);

  // Handle certificate verification (logged to admin with student email)
  const handleVerify = async (e, customId = null) => {
    if (e) e.preventDefault();
    const targetId = (customId || verifyId).trim();
    if (!targetId) return;

    setVerifyLoading(true);
    setVerifyError('');
    setVerifyResult(null);

    try {
      const res = await api.get(`/public/verify/${encodeURIComponent(targetId)}/?method=MANUAL_ID`);
      setVerifyResult(res.data);
    } catch (err) {
      setVerifyError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Certificate not found. The entered Certificate ID does not match any accredited certificate.'
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    setFormMessage({ type: '', text: '' });
    try {
      const response = await api.post('/certificate-applications/', {
        ...applicationForm,
        institution: Number(applicationForm.institution),
      });
      setApplications((current) => [response.data, ...current]);
      setApplicationForm({ certificate_type: '', institution: '', purpose: '' });
      setFormMessage({ type: 'success', text: 'Your certificate application has been submitted.' });
    } catch (error) {
      setFormMessage({ type: 'error', text: getErrorMessage(error, 'Unable to submit your application.') });
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setFormMessage({ type: '', text: '' });
    try {
      const response = await api.put('/auth/profile/', profile);
      setProfile({
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        phone: response.data.phone || '',
        student_id_number: response.data.student_id_number || '',
      });
      updateUser(response.data);
      setFormMessage({ type: 'success', text: 'Your profile has been updated.' });
    } catch (error) {
      setFormMessage({ type: 'error', text: getErrorMessage(error, 'Unable to update your profile.') });
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setFormMessage({ type: '', text: '' });
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setFormMessage({ type: 'error', text: 'The new passwords do not match.' });
      return;
    }
    try {
      await api.post('/auth/change-password/', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setFormMessage({ type: 'success', text: 'Your password has been changed.' });
    } catch (error) {
      setFormMessage({ type: 'error', text: getErrorMessage(error, 'Unable to change your password.') });
    }
  };

  const markNotificationRead = async (notification) => {
    if (notification.is_read) return;
    try {
      const response = await api.post(`/notifications/${notification.id}/read/`);
      setNotifications((current) => current.map((item) => item.id === notification.id ? response.data : item));
    } catch (error) {
      setFormMessage({ type: 'error', text: getErrorMessage(error, 'Unable to update this notification.') });
    }
  };

  const togglePasswordVisibility = (key) => {
    setVisiblePasswords((current) => ({ ...current, [key]: !current[key] }));
  };

  const activeMenuItem = menuItems.find((item) => item.id === activeSection);
  const title = activeMenuItem?.label || 'User Dashboard';
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Student';
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const validCertificates = certificates.filter((cert) => cert.is_valid).length;
  const pendingApplications = applications.filter((app) => app.status === 'PENDING').length;
  const approvedApplications = applications.filter((app) => app.status === 'APPROVED').length;

  // Verification Component (Reusable)
  const renderVerificationWidget = () => (
    <div className="space-y-6">
      {/* Search Input Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Instant Accredited Verification</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Verify Any Certificate</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter the unique Certificate ID below. Your verification check is authenticated and logged to the institution audit registry under <strong>{user?.email}</strong>.
          </p>

          <form onSubmit={handleVerify} className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value)}
                placeholder="e.g. CERT-JNTU-2025-XXXX or CERT-..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              disabled={verifyLoading || !verifyId.trim()}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {verifyLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Now</span>
                </>
              )}
            </button>
          </form>

          {/* Quick sample chips */}
          {certificates.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Quick fill from your certificates:</span>
              {certificates.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setVerifyId(c.certificate_id); handleVerify(null, c.certificate_id); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-700 font-mono text-[11px] font-bold transition cursor-pointer"
                >
                  {c.certificate_id}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Verification Error Result */}
      {verifyError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-900">Certificate Verification Failed</h3>
            <p className="text-xs text-rose-700 mt-1">{verifyError}</p>
          </div>
        </div>
      )}

      {/* Verification Success Result (Matches bottom-left screenshot) */}
      {verifyResult && verifyResult.valid && (
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <span>Authentic Certificate &bull; Valid</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mt-1">Certificate is Valid!</h3>
              </div>
            </div>

            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
              {verifyResult.certificate?.certificate_id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Student Name</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">{verifyResult.certificate?.student_name}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Course / Degree</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">{verifyResult.certificate?.course_name || verifyResult.certificate?.title}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accredited Institution</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">{verifyResult.certificate?.institution_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Issue Date</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{verifyResult.certificate?.issue_date}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Grade / CGPA</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{verifyResult.certificate?.grade || 'First Class with Distinction'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Verified by: <strong className="text-slate-900">{displayName}</strong> (<span className="text-blue-700 font-mono">{user?.email}</span>)
              <span className="block text-[10px] text-slate-400 mt-0.5">Recorded into Administrator Audit Trail</span>
            </div>

            <a
              href={`${API_BASE_URL}/public/download/${verifyResult.certificate?.certificate_id}/`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );

  const renderCertificates = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">My Certificates</h2>
          <p className="text-xs text-slate-500 mt-1">All accredited credentials issued to your registered account</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold font-mono">
          {certificates.length} Total
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-5 py-4">Certificate ID</th>
              <th className="px-5 py-4">Certificate Name</th>
              <th className="px-5 py-4">Issued By</th>
              <th className="px-5 py-4">Issue Date</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {certificates.map((certificate) => (
              <tr key={certificate.id} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-4 font-mono font-bold text-blue-700">{certificate.certificate_id}</td>
                <td className="px-5 py-4 font-bold text-slate-900">{certificate.title || certificate.course_name}</td>
                <td className="px-5 py-4 text-slate-600">{certificate.institution_name}</td>
                <td className="px-5 py-4 text-slate-600 font-mono text-xs">{certificate.issue_date}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${certificate.is_valid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {certificate.is_valid ? 'Valid' : certificate.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyId(certificate.certificate_id);
                      setActiveSection('verify');
                      handleVerify(null, certificate.certificate_id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <a
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition"
                    href={`${API_BASE_URL}/public/download/${certificate.certificate_id}/`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!certificates.length && (
          <div className="p-8">
            <EmptyState>No certificates have been issued to your account yet. Use the Apply tab to request one.</EmptyState>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) return <EmptyState>Loading your dashboard...</EmptyState>;
    if (loadError) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          <p>{loadError}</p>
          <button onClick={loadDashboard} className="mt-3 font-bold underline">Try again</button>
        </div>
      );
    }

    switch (activeSection) {
      case 'verify':
        return renderVerificationWidget();
      case 'certificates':
        return renderCertificates();
      case 'available':
        return certificateTypes.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {certificateTypes.map((type) => (
              <article key={`${type.institution_id}-${type.course_name}-${type.title}`} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 inline-flex rounded-xl bg-blue-50 p-3 text-blue-700"><Award className="h-5 w-5" /></div>
                <h3 className="font-bold text-slate-900">{type.title || type.course_name}</h3>
                {type.title && <p className="mt-1 text-sm text-slate-600">{type.course_name}</p>}
                <p className="mt-3 text-xs font-semibold text-slate-500">{type.institution_name}</p>
                <button onClick={() => { setApplicationForm((current) => ({ ...current, certificate_type: type.title || type.course_name, institution: String(type.institution_id) })); setActiveSection('apply'); }} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">Apply for this certificate</button>
              </article>
            ))}
          </div>
        ) : <EmptyState>No certificate types are currently listed.</EmptyState>;
      case 'institutions':
        return institutions.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {institutions.map((institution) => (
              <article key={institution.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Building2 className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">{institution.name}</h3>
                    <p className="text-xs text-slate-500">{institution.code}</p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-sm text-slate-600">
                  <div><dt className="inline font-semibold">Location: </dt><dd className="inline">{[institution.city, institution.state].filter(Boolean).join(', ') || institution.address || 'Not provided'}</dd></div>
                  <div><dt className="inline font-semibold">Email: </dt><dd className="inline">{institution.email}</dd></div>
                  {institution.phone && <div><dt className="inline font-semibold">Phone: </dt><dd className="inline">{institution.phone}</dd></div>}
                  {institution.website && <div><a className="font-semibold text-blue-700 hover:underline" href={institution.website} target="_blank" rel="noreferrer">Visit website</a></div>}
                </dl>
              </article>
            ))}
          </div>
        ) : <EmptyState>No registered institutions are available.</EmptyState>;
      case 'apply':
        return (
          <form onSubmit={submitApplication} className="max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
            <label className="block text-sm font-semibold text-slate-700">Certificate type
              <input required list="certificate-type-options" value={applicationForm.certificate_type} onChange={(event) => setApplicationForm({ ...applicationForm, certificate_type: event.target.value })} placeholder="e.g. Degree certificate" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500" />
              <datalist id="certificate-type-options">{certificateTypes.map((type) => <option key={`${type.institution_id}-${type.course_name}-${type.title}`} value={type.title || type.course_name}>{type.institution_name}</option>)}</datalist>
            </label>
            <label className="block text-sm font-semibold text-slate-700">Institution
              <select required value={applicationForm.institution} onChange={(event) => setApplicationForm({ ...applicationForm, institution: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-blue-500">
                <option value="">Select an institution</option>
                {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">Additional details (optional)
              <textarea rows="4" value={applicationForm.purpose} onChange={(event) => setApplicationForm({ ...applicationForm, purpose: event.target.value })} placeholder="Add any details the institution should know" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500" />
            </label>
            {formMessage.text && <p role="status" className={`text-sm font-semibold ${formMessage.type === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{formMessage.text}</p>}
            <button type="submit" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">Submit application</button>
          </form>
        );
      case 'applications':
        return applications.length ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr><th className="px-5 py-4">Certificate</th><th className="px-5 py-4">Institution</th><th className="px-5 py-4">Applied on</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Update</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td className="px-5 py-4 font-semibold text-slate-800">{application.certificate_type}</td>
                    <td className="px-5 py-4 text-slate-600">{application.institution_name}</td>
                    <td className="px-5 py-4 text-slate-600">{new Date(application.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${application.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : application.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{application.status}</span></td>
                    <td className="px-5 py-4 text-slate-600">{application.admin_note || 'No update yet'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState>You have not submitted any certificate applications yet.</EmptyState>;
      case 'notifications':
        return notifications.length ? (
          <div className="space-y-3">{notifications.map((notification) => (
            <article key={notification.id} className={`flex items-start justify-between gap-4 rounded-2xl border p-5 ${notification.is_read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50/60'}`}>
              <div><h3 className="font-bold text-slate-900">{notification.title}</h3><p className="mt-1 text-sm text-slate-600">{notification.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(notification.created_at).toLocaleString()}</p></div>
              {!notification.is_read && <button onClick={() => markNotificationRead(notification)} className="shrink-0 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-white">Mark read</button>}
            </article>
          ))}</div>
        ) : <EmptyState>You have no notifications.</EmptyState>;
      case 'profile':
        return (
          <form onSubmit={saveProfile} className="max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
            <label className="block text-sm font-semibold text-slate-700">First name<input value={profile.first_name} onChange={(event) => setProfile({ ...profile, first_name: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
            <label className="block text-sm font-semibold text-slate-700">Last name<input value={profile.last_name} onChange={(event) => setProfile({ ...profile, last_name: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
            <label className="block text-sm font-semibold text-slate-700">Email<input value={user?.email || ''} disabled className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-normal text-slate-500" /></label>
            <label className="block text-sm font-semibold text-slate-700">Phone<input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
            <label className="block text-sm font-semibold text-slate-700">Student ID<input value={profile.student_id_number} disabled className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-normal text-slate-500" /></label>
            {formMessage.text && <p role="status" className={`text-sm font-semibold ${formMessage.type === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{formMessage.text}</p>}
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"><Save className="h-4 w-4" />Save profile</button>
          </form>
        );
      case 'password':
        return (
          <form onSubmit={changePassword} className="max-w-xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
            {[
              { key: 'old_password', label: 'Current password', minLength: 1 },
              { key: 'new_password', label: 'New password', minLength: 6 },
              { key: 'confirm_password', label: 'Confirm new password', minLength: 6 },
            ].map(({ key, label, minLength }) => (
              <label key={key} className="block text-sm font-semibold text-slate-700">
                {label}
                <span className="relative mt-2 block">
                  <input
                    type={visiblePasswords[key] ? 'text' : 'password'}
                    required
                    minLength={minLength}
                    value={passwordForm[key]}
                    onChange={(event) => setPasswordForm({ ...passwordForm, [key]: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(key)}
                    aria-label={`${visiblePasswords[key] ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {visiblePasswords[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>
            ))}
            {formMessage.text && <p role="status" className={`text-sm font-semibold ${formMessage.type === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{formMessage.text}</p>}
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"><LockKeyhole className="h-4 w-4" />Change password</button>
          </form>
        );
      default:
        return (
          <>
            {/* Header Hero banner */}
            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-6 text-white shadow-lg sm:p-8">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/60 text-blue-200 text-xs font-bold mb-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Authenticated User Dashboard</span>
                  </div>
                  <h2 className="text-2xl font-black sm:text-3xl">Hello, {displayName}! 👋</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                    Welcome to your personal dashboard. Verify certificates instantly and access your accredited credentials.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <button onClick={() => setActiveSection('verify')} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-500 transition">
                    <ShieldCheck className="h-4 w-4" /> Verify Certificate
                  </button>
                  <button onClick={() => setActiveSection('certificates')} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/20">
                    My Certificates ({certificates.length})
                  </button>
                </div>
              </div>
            </section>

            {/* Prominent Verification Tool */}
            {renderVerificationWidget()}

            {/* Quick Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Certificates issued', value: certificates.length, detail: `${validCertificates} valid`, icon: Award, section: 'certificates', iconClass: 'bg-blue-50 text-blue-700' },
                { label: 'Applications in review', value: pendingApplications, detail: `${applications.length} total`, icon: Clock3, section: 'applications', iconClass: 'bg-amber-50 text-amber-700' },
                { label: 'Applications approved', value: approvedApplications, detail: 'Ready to download', icon: CheckCircle2, section: 'applications', iconClass: 'bg-emerald-50 text-emerald-700' },
                { label: 'Notifications', value: unreadCount, detail: `${notifications.length} alerts`, icon: Bell, section: 'notifications', iconClass: 'bg-indigo-50 text-indigo-700' },
              ].map(({ label, value, detail, icon: Icon, section, iconClass }) => (
                <button key={label} onClick={() => setActiveSection(section)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md cursor-pointer">
                  <span className={`inline-flex rounded-xl p-3 ${iconClass}`}><Icon className="h-5 w-5" /></span>
                  <span className="mt-4 block text-3xl font-black text-slate-900">{value}</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-700">{label}</span>
                  <span className="mt-1 block text-xs text-slate-500">{detail}</span>
                </button>
              ))}
            </div>

            {/* My Certificates Section on Dashboard */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">My Certificates</h3>
                  <p className="mt-1 text-xs text-slate-500">Credentials awarded to your student account</p>
                </div>
                <button onClick={() => setActiveSection('certificates')} className="shrink-0 text-sm font-bold text-blue-700 hover:underline">View all</button>
              </div>
              {certificates.length ? (
                <div className="space-y-3">
                  {certificates.slice(0, 3).map((certificate) => (
                    <div key={certificate.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 hover:bg-slate-50/80 transition">
                      <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700 shrink-0"><FileText className="h-5 w-5" /></span>
                        <div>
                          <p className="font-bold text-slate-900">{certificate.title || certificate.course_name}</p>
                          <p className="text-xs text-slate-500">{certificate.institution_name} &bull; <span className="font-mono text-blue-600">{certificate.certificate_id}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyId(certificate.certificate_id);
                            setActiveSection('verify');
                            handleVerify(null, certificate.certificate_id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition cursor-pointer"
                        >
                          View
                        </button>
                        <a
                          href={`${API_BASE_URL}/public/download/${certificate.certificate_id}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState>No certificates have been issued to your account yet.</EmptyState>
              )}
            </section>
          </>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-slate-100">
      <div className="flex min-h-[calc(100vh-4.5rem)] flex-col md:flex-row">
        {/* Left Sidebar */}
        <aside className="w-full shrink-0 bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-950 p-4 text-white md:w-64 md:p-5">
          <div className="mb-5 flex items-center gap-3 border-b border-white/10 px-2 pb-5">
            <div className="rounded-xl bg-blue-600 p-2.5"><BookOpen className="h-5 w-5" /></div>
            <div>
              <p className="font-extrabold text-base">CertVerify</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">User Dashboard</p>
            </div>
          </div>
          <nav aria-label="Student dashboard" className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:block md:space-y-1">
            {menuItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveSection(id); setFormMessage({ type: '', text: '' }); }}
                aria-current={activeSection === id ? 'page' : undefined}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-xs font-bold transition md:gap-3 md:px-3 cursor-pointer ${
                  activeSection === id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                    : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {id === 'notifications' && unreadCount > 0 && (
                  <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white font-bold">{unreadCount}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-8 hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-blue-100 md:block">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-cyan-300 font-semibold">Verified Student</p>
              </div>
            </div>
            <p className="text-[11px] text-blue-200/80 break-all font-mono">{user?.email}</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Student Portal</p>
                <h1 className="mt-1 text-2xl font-black text-slate-900">{title}</h1>
              </div>
            </header>

            {formMessage.text && activeSection !== 'apply' && activeSection !== 'profile' && activeSection !== 'password' && (
              <div role="status" className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${formMessage.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {formMessage.type === 'error' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{formMessage.text}
              </div>
            )}

            <div className="space-y-6">{renderContent()}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default UserDashboard;
