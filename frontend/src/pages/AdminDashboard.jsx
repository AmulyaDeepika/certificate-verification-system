import { useState, useEffect, useCallback } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, LayoutDashboard, Award, Plus, FileText, 
  History, Building, KeyRound, LogOut, Search, 
  Edit, Trash2, Download, Ban, CheckCircle2, X, AlertTriangle, 
  Check, QrCode, FileBarChart, Bell, Users
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

const AdminDashboard = () => {
  const { user, requestLogout } = useAuth();
  
  // Navigation Menus
  const [activeMenu, setActiveMenu] = useState('dashboard');
  // options: 'dashboard', 'certificates', 'new_certificate', 'verification_history', 'reports', 'institution_profile', 'audit_trail', 'change_password'

  // Data States
  const [stats, setStats] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [studentUsers, setStudentUsers] = useState([]);
  const [certificateCount, setCertificateCount] = useState(0);
  const [certificatePages, setCertificatePages] = useState(1);
  const [certificatePage, setCertificatePage] = useState(1);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [verificationLogs, setVerificationLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateFileError, setCertificateFileError] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Certificate Modal View / Edit
  const [selectedCert, setSelectedCert] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // New Certificate Form
  const [newCert, setNewCert] = useState({
    student_name: '',
    student_email: '',
    student_initial_password: '',
    student_roll_no: '',
    title: '',
    course_name: '',
    institution: '',
    grade: 'Grade A',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    description: '',
  });

  // Revoke Dialog
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Password Change State
  const [passForm, setPassForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  // Institution Profile State
  const [instForm, setInstForm] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
  });
  const [instMsg, setInstMsg] = useState('');
  const [newInstitution, setNewInstitution] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
  });
  const [newInstitutionMsg, setNewInstitutionMsg] = useState({ type: '', text: '' });

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [statsRes, verifyRes, auditRes, notificationsRes, usersRes] = await Promise.all([
        api.get('/dashboard/stats/'),
        api.get('/logs/verifications/'),
        api.get('/logs/audit/'),
        api.get('/notifications/'),
        api.get('/users/', { params: { role: 'STUDENT' } }),
      ]);
      setStats(statsRes.data);
      setVerificationLogs(verifyRes.data);
      setAuditLogs(auditRes.data);
      setNotifications(notificationsRes.data);
      setStudentUsers(usersRes.data);

      if (user?.institution) {
        const instRes = await api.get(`/institutions/${user.institution}/`);
        setInstitution(instRes.data);
        setInstForm(instRes.data);
      } else if (user?.role === 'SUPER_ADMIN') {
        const institutionRes = await api.get('/institutions/');
        setInstitutions(institutionRes.data);
        setNewCert((current) => ({
          ...current,
          institution: current.institution || String(institutionRes.data[0]?.id || ''),
        }));
      }
    } catch (err) {
      console.error(err);
      setLoadError('Unable to load dashboard data. Check the backend connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchCertificates = useCallback(async () => {
    setCertificatesLoading(true);
    try {
      const params = { page: certificatePage, page_size: 10 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const response = await api.get('/certificates/', { params });
      setCertificates(response.data.results);
      setCertificateCount(response.data.count);
      setCertificatePages(Math.max(1, Math.ceil(response.data.count / 10)));
    } catch (err) {
      console.error(err);
      setLoadError('Unable to load certificate records. Please try again.');
    } finally {
      setCertificatesLoading(false);
    }
  }, [certificatePage, searchQuery, statusFilter]);

  useEffect(() => {
    Promise.resolve().then(fetchAllData);
  }, [fetchAllData]);

  useEffect(() => {
    const timer = setTimeout(fetchCertificates, 250);
    return () => clearTimeout(timer);
  }, [fetchCertificates]);

  const userActivityLogs = auditLogs.filter((log) => (
    (log.action === 'USER_LOGIN' && log.user_role === 'STUDENT')
    || log.action === 'USER_REGISTER'
    || log.details?.startsWith('New user registered:')
  ));

  // Certificate Issuance
  const handleCreateCertificate = async (e) => {
    e.preventDefault();
    if (certificateFileError) return;
    try {
      const payload = new FormData();
      Object.entries(newCert).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          payload.append(key, value);
        }
      });
      if (certificateFile) payload.append('pdf_file', certificateFile);
      await api.post('/certificates/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Certificate generated, signed, and QR Code created successfully!');
      setNewCert({
        student_name: '',
        student_email: '',
        student_initial_password: '',
        student_roll_no: '',
        title: '',
        course_name: '',
        institution: '',
        grade: 'Grade A',
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        description: '',
      });
      setCertificateFile(null);
      setCertificateFileError('');
      setActiveMenu('certificates');
      fetchAllData();
      fetchCertificates();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to issue certificate');
    }
  };

  // Certificate Edit Save
  const handleSaveEditCert = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/certificates/${selectedCert.id}/`, editFormData);
      alert('Certificate updated successfully!');
      setIsEditing(false);
      setSelectedCert(null);
      fetchAllData();
      fetchCertificates();
    } catch {
      alert('Failed to save certificate edits');
    }
  };

  // Certificate Delete
  const handleDeleteCert = async (certId) => {
    if (window.confirm('Are you sure you want to permanently delete this certificate record?')) {
      try {
        await api.delete(`/certificates/${certId}/`);
        fetchAllData();
        fetchCertificates();
        setSelectedCert(null);
      } catch {
        alert('Failed to delete certificate');
      }
    }
  };

  // Certificate Revocation
  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await api.post(`/certificates/${revokeTarget.id}/status/`, {
        status: 'REVOKED',
        reason: revokeReason || 'Administrative revocation by registrar',
      });
      setRevokeTarget(null);
      setRevokeReason('');
      fetchAllData();
      fetchCertificates();
    } catch {
      alert('Failed to revoke certificate');
    }
  };

  // Certificate Re-activate
  const handleReactivateCert = async (cert) => {
    try {
      await api.post(`/certificates/${cert.id}/status/`, {
        status: 'ACTIVE',
        reason: 'Restored to good standing',
      });
      fetchAllData();
      fetchCertificates();
    } catch {
      alert('Failed to re-activate certificate');
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });
    if (passForm.new_password !== passForm.confirm_password) {
      setPassMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    try {
      await api.post('/auth/change-password/', {
        old_password: passForm.old_password,
        new_password: passForm.new_password,
      });
      setPassMsg({ type: 'success', text: 'Password successfully updated!' });
      setPassForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update password' });
    }
  };

  // Update Institution Profile
  const handleSaveInstitutionProfile = async (e) => {
    e.preventDefault();
    setInstMsg('');
    try {
      if (institution?.id) {
        await api.patch(`/institutions/${institution.id}/`, instForm);
      }
      setInstMsg('Institution profile updated successfully!');
    } catch (err) {
      setInstMsg(`Error: ${err.response?.data?.detail || 'Could not save institution profile. Please try again.'}`);
    }
  };

  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    setNewInstitutionMsg({ type: '', text: '' });
    try {
      const response = await api.post('/institutions/', {
        ...newInstitution,
        is_active: true,
      });
      setInstitutions((current) => [...current, response.data]);
      setNewCert((current) => ({
        ...current,
        institution: current.institution || String(response.data.id),
      }));
      setNewInstitution({
        name: '',
        code: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
      });
      setNewInstitutionMsg({
        type: 'success',
        text: `${response.data.name} added. It will now appear in student registration.`,
      });
    } catch (err) {
      const details = err.response?.data;
      const message = details && typeof details === 'object'
        ? Object.entries(details)
          .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(' ') : value}`)
          .join(' | ')
        : 'Could not add the college. Please check the details and try again.';
      setNewInstitutionMsg({ type: 'error', text: message });
    }
  };

  // Download PDF
  const handleDownloadPDF = (certId) => {
    window.open(`${API_BASE_URL}/public/download/${encodeURIComponent(certId)}/`, '_blank', 'noopener,noreferrer');
  };

  const handleNotificationRead = async (notification) => {
    try {
      await api.post(`/notifications/${notification.id}/read/`);
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, is_read: true } : item
      )));
    } catch (err) {
      console.error(err);
      setLoadError('Unable to update notification status.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-64 bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-950 text-white flex flex-col justify-between p-5 flex-shrink-0 shadow-2xl">
        <div>
          {/* Logo & Portal Branding */}
          <div className="flex items-center space-x-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block">CertVerify</span>
              <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Administration</span>
            </div>
          </div>

          {/* Complete Navigation Menus requested by User */}
          <nav className="space-y-1.5 text-xs font-bold">
            
            <button
              onClick={() => setActiveMenu('dashboard')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>

            <button
              onClick={() => setActiveMenu('certificates')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'certificates' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Certificates Directory</span>
            </button>

            <button
              onClick={() => setActiveMenu('users')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Student Accounts & Activity</span>
            </button>

            <button
              onClick={() => setActiveMenu('new_certificate')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'new_certificate' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Issue New Certificate</span>
            </button>

            <button
              onClick={() => setActiveMenu('verification_history')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'verification_history' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Verification History</span>
            </button>

            <button
              onClick={() => setActiveMenu('reports')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'reports' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileBarChart className="w-4 h-4" />
              <span>Analytics & Reports</span>
            </button>

            <button
              onClick={() => setActiveMenu('institution_profile')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'institution_profile' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Institution Profile</span>
            </button>

            {user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => setActiveMenu('manage_colleges')}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                  activeMenu === 'manage_colleges' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Manage Colleges</span>
              </button>
            )}

            <button
              onClick={() => setActiveMenu('audit_trail')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'audit_trail' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Audit Trail (Desktop)</span>
            </button>

            <button
              onClick={() => setActiveMenu('notifications')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'notifications' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3"><Bell className="w-4 h-4" />Notifications</span>
              {notifications.some((item) => !item.is_read) && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">
                  {notifications.filter((item) => !item.is_read).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveMenu('change_password')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'change_password' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Change Password</span>
            </button>

          </nav>
        </div>

        {/* User Badge & Logout */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-black text-xs text-white">
              {user?.first_name ? user.first_name[0] : 'A'}
            </div>
            <div className="text-left text-[11px] truncate">
              <span className="font-bold text-white block truncate">{user?.email}</span>
              <span className="text-blue-300 font-semibold uppercase text-[9px]">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>

          <button
            onClick={requestLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-blue-200/80 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= RIGHT MAIN AREA ================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-18 px-8 flex items-center justify-between shadow-2xs">
          <div>
            <h1 className="text-xl font-black text-slate-900 capitalize">
              {activeMenu.replace('_', ' ')}
            </h1>
            <p className="text-xs text-slate-400">
              Institution: <strong className="text-blue-600 font-semibold">
                {user?.institution_name || (user?.role === 'SUPER_ADMIN' ? 'All institutions' : 'Not linked')}
              </strong>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveMenu('new_certificate')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Certificate</span>
            </button>
          </div>
        </header>

        {loadError && (
          <div className="mx-8 mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <span>{loadError}</span>
            <button onClick={fetchAllData} className="ml-3 font-bold underline">Retry</button>
          </div>
        )}
        {loading && <p className="px-8 pt-4 text-sm text-slate-500">Loading dashboard data...</p>}

        {/* Dynamic Section Rendering */}
        <div className="p-8 space-y-8">
          
          {/* ================= 1. ADMIN DASHBOARD ================= */}
          {activeMenu === 'dashboard' && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-5">
                <div className="bg-blue-50/80 border border-blue-100 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase block mb-1">Total Issued</span>
                    <div className="text-3xl font-black text-blue-950">{stats?.total_certificates ?? 0}</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase block mb-1">Valid Active</span>
                    <div className="text-3xl font-black text-emerald-950">{stats?.active_certificates ?? 0}</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-rose-50/80 border border-rose-100 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-600 uppercase block mb-1">Revoked</span>
                    <div className="text-3xl font-black text-rose-950">{stats?.revoked_certificates ?? 0}</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                    <Ban className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-purple-50/80 border border-purple-100 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-600 uppercase block mb-1">Verification Requests</span>
                    <div className="text-3xl font-black text-purple-950">{stats?.total_verifications ?? 0}</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                    <History className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-amber-50/80 border border-amber-100 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-700 uppercase block mb-1">Inactive</span>
                    <div className="text-3xl font-black text-amber-950">{stats?.inactive_certificates ?? 0}</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-cyan-50/80 border border-cyan-100 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-cyan-700 uppercase block mb-1">Verifications · 7 days</span>
                    <div className="text-3xl font-black text-cyan-950">{stats?.verifications_last_7_days ?? 0}</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md">
                    <History className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Chart & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-base font-black text-slate-900 mb-4">Verification Velocity Telemetry</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.verification_activity || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="verifications" fill="#2563EB" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-base font-black text-slate-900 mb-4">Certificate Activity · 7 days</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.certificate_activity || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="certificates" fill="#0891B2" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-base font-black text-slate-900 mb-3">Registrar Shortcuts</h3>
                  <button
                    onClick={() => setActiveMenu('new_certificate')}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Certificate</span>
                  </button>
                  <button
                    onClick={() => setActiveMenu('verification_history')}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                    <span>View Verification Inquiries</span>
                  </button>
                  <button
                    onClick={() => setActiveMenu('reports')}
                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileBarChart className="w-4 h-4" />
                    <span>Export Institutional Reports</span>
                  </button>
                </div>
              </div>

              <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Recent Student Login & Registration Activity</h3>
                    <p className="text-xs text-slate-400">Latest student account events</p>
                  </div>
                  <button
                    onClick={() => setActiveMenu('users')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    View all
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {userActivityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{log.user_email || 'Student'}</span>
                        <span className="ml-3 text-slate-500">
                          {log.action === 'USER_REGISTER' || log.details?.startsWith('New user registered:')
                            ? 'Registered'
                            : 'Logged in'}
                        </span>
                      </div>
                      <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                  {userActivityLogs.length === 0 && (
                    <p className="px-6 py-8 text-center text-xs text-slate-400">No student login or registration activity found.</p>
                  )}
                </div>
              </section>
            </>
          )}

          {/* ================= 2. STUDENT ACCOUNTS & ACTIVITY ================= */}
          {activeMenu === 'users' && (
            <div className="space-y-6">
              <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Registered Student Accounts</h3>
                    <p className="text-xs text-slate-400">Accounts are limited to your institution unless you are a super admin.</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">{studentUsers.length} Students</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-6">Student</th>
                        <th className="py-3.5 px-6">Email</th>
                        <th className="py-3.5 px-6">Student ID</th>
                        <th className="py-3.5 px-6">Institution</th>
                        <th className="py-3.5 px-6">Registered</th>
                        <th className="py-3.5 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentUsers.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-6 font-bold text-slate-900">
                            {[student.first_name, student.last_name].filter(Boolean).join(' ') || student.username}
                          </td>
                          <td className="py-4 px-6">{student.email}</td>
                          <td className="py-4 px-6">{student.student_id_number || '—'}</td>
                          <td className="py-4 px-6">{student.institution_name || 'Not linked'}</td>
                          <td className="py-4 px-6">{new Date(student.date_joined).toLocaleDateString()}</td>
                          <td className="py-4 px-6">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              student.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {student.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {studentUsers.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-10 text-center text-slate-400">No registered student accounts found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900">Recent Login & Registration Activity</h3>
                  <p className="text-xs text-slate-400">Latest student sign-ins and new account registrations</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-6">Activity</th>
                        <th className="py-3.5 px-6">Student</th>
                        <th className="py-3.5 px-6">Details</th>
                        <th className="py-3.5 px-6">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userActivityLogs
                        .slice(0, 20)
                        .map((log) => {
                          const isRegistration = log.action === 'USER_REGISTER'
                            || log.details?.startsWith('New user registered:');
                          return (
                            <tr key={log.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-4 px-6 font-bold">{isRegistration ? 'Registered' : 'Logged in'}</td>
                              <td className="py-4 px-6 font-bold text-slate-900">{log.user_email || 'Student'}</td>
                              <td className="py-4 px-6 text-slate-500">{log.details}</td>
                              <td className="py-4 px-6 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      {userActivityLogs.length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-10 text-center text-slate-400">No student login or registration activity found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ================= 3. CERTIFICATES DIRECTORY (Edit, View QR, Download, Revoke) ================= */}
          {activeMenu === 'certificates' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCertificatePage(1);
                    }}
                    placeholder="Search by ID, Name or Course..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500">Filter Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCertificatePage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Valid Only</option>
                    <option value="INACTIVE">Inactive Only</option>
                    <option value="REVOKED">Revoked Only</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Certificate ID</th>
                      <th className="py-3.5 px-6">Student Recipient</th>
                      <th className="py-3.5 px-6">Course / Degree</th>
                      <th className="py-3.5 px-6">Issue Date</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {certificatesLoading ? (
                      <tr><td colSpan="6" className="py-8 text-center text-slate-500">Loading certificates...</td></tr>
                    ) : certificates.length === 0 ? (
                      <tr><td colSpan="6" className="py-8 text-center text-slate-500">No certificates match these filters.</td></tr>
                    ) : certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-6 font-mono font-bold text-blue-600">{cert.certificate_id}</td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-900 block">{cert.student_name}</span>
                          <span className="text-[10px] text-slate-400">{cert.student_email}</span>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-800">{cert.course_name}</td>
                        <td className="py-4 px-6 text-slate-500">{cert.issue_date}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            cert.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {cert.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                          {/* View Details & QR */}
                          <button
                            onClick={() => { setSelectedCert(cert); setIsEditing(false); }}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                            title="Certificate Details & QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Edit Certificate */}
                          <button
                            onClick={() => {
                              setSelectedCert(cert);
                              setIsEditing(true);
                              setEditFormData(cert);
                            }}
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition"
                            title="Edit Certificate"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownloadPDF(cert.certificate_id)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition"
                            title="Download Certificate PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Revoke or Reactivate */}
                          {cert.status === 'ACTIVE' ? (
                            <button
                              onClick={() => setRevokeTarget(cert)}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                              title="Revoke Certificate"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateCert(cert)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition"
                              title="Re-activate"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Certificate */}
                          <button
                            onClick={() => handleDeleteCert(cert.id)}
                            className="p-1.5 bg-slate-100 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <span className="text-xs text-slate-500">
                  {certificateCount} records · page {certificatePage} of {certificatePages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={certificatePage <= 1 || certificatesLoading}
                    onClick={() => setCertificatePage((page) => page - 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={certificatePage >= certificatePages || certificatesLoading}
                    onClick={() => setCertificatePage((page) => page + 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. ISSUE NEW CERTIFICATE ================= */}
          {activeMenu === 'new_certificate' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-3xl mx-auto shadow-xs">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900">Issue New Digital Certificate</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Automatic cryptographic ID assignment, dynamic QR code rendering, and vector PDF certificate synthesis.
                </p>
              </div>

              <form onSubmit={handleCreateCertificate} className="space-y-4 text-xs font-bold text-slate-700">
                {user?.role === 'SUPER_ADMIN' && (
                  <div>
                    <label className="block uppercase mb-1">Issuing Institution *</label>
                    <select
                      required
                      value={newCert.institution}
                      onChange={(e) => setNewCert({ ...newCert, institution: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    >
                      <option value="">Select an institution</option>
                      {institutions.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newCert.student_name}
                      onChange={(e) => setNewCert({ ...newCert, student_name: e.target.value })}
                      placeholder="e.g. M. Sai Priya"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block uppercase mb-1">Student Email Address *</label>
                    <input
                      type="email"
                      required
                      value={newCert.student_email}
                      onChange={(e) => setNewCert({ ...newCert, student_email: e.target.value })}
                      placeholder="saipriya@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase mb-1">Initial CertVerify Password</label>
                  <input
                    type="password"
                    minLength={6}
                    autoComplete="new-password"
                    value={newCert.student_initial_password}
                    onChange={(e) => setNewCert({ ...newCert, student_initial_password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-slate-500">
                    Required for a new student account. This is a CertVerify password, not their Gmail password. For an existing student account, leave it blank; their current password will not change.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase mb-1">Registration / Roll No</label>
                    <input
                      type="text"
                      value={newCert.student_roll_no}
                      onChange={(e) => setNewCert({ ...newCert, student_roll_no: e.target.value })}
                      placeholder="e.g. CS-2026-90"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block uppercase mb-1">Grade / Award Distinction</label>
                    <input
                      type="text"
                      value={newCert.grade}
                      onChange={(e) => setNewCert({ ...newCert, grade: e.target.value })}
                      placeholder="e.g. Grade A+ / Distinction"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase mb-1">Certificate Title *</label>
                    <input
                      type="text"
                      required
                      value={newCert.title}
                      onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                      placeholder="e.g. Degree of Bachelor of Technology"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block uppercase mb-1">Course / Discipline *</label>
                    <input
                      type="text"
                      required
                      value={newCert.course_name}
                      onChange={(e) => setNewCert({ ...newCert, course_name: e.target.value })}
                      placeholder="e.g. Computer Science and Engineering"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase mb-1">Issue Date *</label>
                    <input
                      type="date"
                      required
                      value={newCert.issue_date}
                      onChange={(e) => setNewCert({ ...newCert, issue_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block uppercase mb-1">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={newCert.expiry_date}
                      onChange={(e) => setNewCert({ ...newCert, expiry_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase mb-1">Curriculum & Competencies Summary</label>
                  <textarea
                    rows={3}
                    value={newCert.description}
                    onChange={(e) => setNewCert({ ...newCert, description: e.target.value })}
                    placeholder="Demonstrated comprehensive proficiency in curriculum, projects, and assessments..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-sans"
                  />
                </div>

                <div>
                  <label className="block uppercase mb-1">Certificate PDF (Optional, max 10 MB)</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setCertificateFileError('');
                      if (file && !file.name.toLowerCase().endsWith('.pdf')) {
                        setCertificateFileError('Choose a PDF file.');
                        setCertificateFile(null);
                      } else if (file && file.size > 10 * 1024 * 1024) {
                        setCertificateFileError('The PDF must not exceed 10 MB.');
                        setCertificateFile(null);
                      } else {
                        setCertificateFile(file);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700"
                  />
                  {certificateFileError && <p role="alert" className="mt-1 text-rose-700">{certificateFileError}</p>}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/30 transition cursor-pointer"
                  >
                    Generate & Issue Certificate
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= 4. VERIFICATION HISTORY ================= */}
          {activeMenu === 'verification_history' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black text-slate-900">Live Verification Inquiry Logs</h3>
                  <p className="text-xs text-slate-400">Timestamped public requests and IP geolocation metadata</p>
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">{verificationLogs.length} Records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Certificate ID</th>
                      <th className="py-3.5 px-6">Student</th>
                      <th className="py-3.5 px-6">Verified By</th>
                      <th className="py-3.5 px-6">Method</th>
                      <th className="py-3.5 px-6">Result Status</th>
                      <th className="py-3.5 px-6">Client IP</th>
                      <th className="py-3.5 px-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {verificationLogs.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-6 font-mono font-bold text-blue-600">{v.certificate_id}</td>
                        <td className="py-4 px-6 font-bold text-slate-900">{v.student_name}</td>
                        <td className="py-4 px-6">
                          {v.verified_by_user_email ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {v.verified_by_user_name || 'Verified Student'}
                              </span>
                              <span className="font-mono text-[11px] text-blue-600 font-semibold">{v.verified_by_user_email}</span>
                            </div>
                          ) : v.verified_by_email ? (
                            <div className="flex flex-col">
                              <span className="font-mono text-xs text-blue-700 font-bold">{v.verified_by_email}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                              Public / Unauthenticated
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold font-mono">
                            {v.verification_method}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            v.verification_status === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {v.verification_status}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-500">{v.ip_address || '127.0.0.1'}</td>
                        <td className="py-4 px-6 text-slate-400">{new Date(v.verified_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 5. REPORTS & ANALYTICS ================= */}
          {activeMenu === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-base font-black text-slate-900 mb-6">Institutional Compliance & Issuance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Total Credentials Active</span>
                    <span className="text-2xl font-black text-slate-900">{stats?.active_certificates ?? 0}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Revocation Rate</span>
                    <span className="text-2xl font-black text-rose-600">
                      {stats?.total_certificates
                        ? `${((stats.revoked_certificates / stats.total_certificates) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Public Scan Rate</span>
                    <span className="text-2xl font-black text-blue-600">{stats?.total_verifications ?? 0} scans</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-base font-black text-slate-900 mb-4">Export Official Records</h3>
                <p className="text-xs text-slate-500 mb-4">Export institutional records in PDF or CSV for audit compliance.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 cursor-pointer"
                  >
                    Print Report (Desktop)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 6. MANAGE COLLEGES ================= */}
          {activeMenu === 'manage_colleges' && user?.role === 'SUPER_ADMIN' && (
            <div className="space-y-6">
              <section className="bg-white rounded-3xl border border-slate-200 p-8 max-w-3xl mx-auto shadow-xs">
                <h2 className="text-xl font-black text-slate-900 mb-2">Add a College / Institution</h2>
                <p className="text-xs text-slate-500 mb-6">
                  New active colleges will appear in the student registration list.
                </p>

                {newInstitutionMsg.text && (
                  <div
                    role="status"
                    className={`mb-4 p-3 rounded-xl text-xs font-bold border ${
                      newInstitutionMsg.type === 'error'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {newInstitutionMsg.text}
                  </div>
                )}

                <form onSubmit={handleCreateInstitution} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  {[
                    ['name', 'College Name', 'text'],
                    ['code', 'College Code', 'text'],
                    ['email', 'Official Email', 'email'],
                    ['phone', 'Phone', 'tel'],
                    ['website', 'Website', 'url'],
                    ['city', 'City', 'text'],
                    ['state', 'State', 'text'],
                  ].map(([field, label, type]) => (
                    <label key={field} className="block">
                      <span className="block uppercase mb-1">{label}{['name', 'code', 'email'].includes(field) ? ' *' : ''}</span>
                      <input
                        type={type}
                        required={['name', 'code', 'email'].includes(field)}
                        value={newInstitution[field]}
                        onChange={(e) => setNewInstitution({ ...newInstitution, [field]: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </label>
                  ))}
                  <label className="block sm:col-span-2">
                    <span className="block uppercase mb-1">Address</span>
                    <textarea
                      rows="2"
                      value={newInstitution.address}
                      onChange={(e) => setNewInstitution({ ...newInstitution, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      Add College
                    </button>
                  </div>
                </form>
              </section>

              <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900">Available Colleges</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {institutions.map((item) => (
                    <div key={item.id} className="px-6 py-4 flex flex-wrap justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <span className="text-slate-500">{item.code} · {item.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  ))}
                  {institutions.length === 0 && (
                    <p className="px-6 py-6 text-xs text-slate-400">No colleges have been added.</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ================= 7. INSTITUTION PROFILE ================= */}
          {activeMenu === 'institution_profile' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-2xl mx-auto shadow-xs">
              <h2 className="text-xl font-black text-slate-900 mb-2">Institution Official Profile</h2>
              <p className="text-xs text-slate-500 mb-6">Manage accredited university metadata and contact information.</p>

              {instMsg && (
                <div className={`mb-4 p-3 rounded-xl text-xs font-bold border ${
                  instMsg.startsWith('Error:')
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {instMsg}
                </div>
              )}

              <form onSubmit={handleSaveInstitutionProfile} className="space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="block uppercase mb-1">Institution Name</label>
                  <input
                    type="text"
                    required
                    value={instForm.name}
                    onChange={(e) => setInstForm({ ...instForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase mb-1">Code / Prefix</label>
                    <input
                      type="text"
                      readOnly
                      value={instForm.code}
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block uppercase mb-1">Official Email</label>
                    <input
                      type="email"
                      required
                      value={instForm.email}
                      onChange={(e) => setInstForm({ ...instForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      value={instForm.phone || ''}
                      onChange={(e) => setInstForm({ ...instForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block uppercase mb-1">Website URL</label>
                    <input
                      type="url"
                      value={instForm.website || ''}
                      onChange={(e) => setInstForm({ ...instForm, website: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase mb-1">City</label>
                    <input
                      type="text"
                      value={instForm.city || ''}
                      onChange={(e) => setInstForm({ ...instForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block uppercase mb-1">State / Region</label>
                    <input
                      type="text"
                      value={instForm.state || ''}
                      onChange={(e) => setInstForm({ ...instForm, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase mb-1">Official Address</label>
                  <textarea
                    rows={2}
                    value={instForm.address || ''}
                    onChange={(e) => setInstForm({ ...instForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= 7. AUDIT TRAIL (DESKTOP) ================= */}
          {activeMenu === 'notifications' && (
            <section className="mx-auto max-w-4xl space-y-3">
              <h2 className="text-xl font-black text-slate-900">System Notifications</h2>
              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                  You are all caught up. New certificate and verification activity will appear here.
                </div>
              ) : notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-2xl border p-5 ${
                    notification.is_read
                      ? 'border-slate-200 bg-white'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{notification.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                      <time className="mt-2 block text-xs text-slate-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </time>
                    </div>
                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={() => handleNotificationRead(notification)}
                        className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}

          {/* ================= 7. AUDIT TRAIL (DESKTOP) ================= */}
          {activeMenu === 'audit_trail' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black text-slate-900">Desktop Security Audit Trail</h3>
                  <p className="text-xs text-slate-400">Tamper-evident log of administrative mutations and authentication events</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">{auditLogs.length} Events</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Action</th>
                      <th className="py-3.5 px-6">User / Issuer</th>
                      <th className="py-3.5 px-6">Event Details</th>
                      <th className="py-3.5 px-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-6 font-mono font-bold text-indigo-600">{log.action}</td>
                        <td className="py-4 px-6 font-bold text-slate-900">{log.user_email || 'System'}</td>
                        <td className="py-4 px-6 text-slate-500 max-w-md">{log.details}</td>
                        <td className="py-4 px-6 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 8. CHANGE PASSWORD ================= */}
          {activeMenu === 'change_password' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Change Account Password</h3>
                  <p className="text-xs text-slate-400">Update your administrative credentials</p>
                </div>
              </div>

              {passMsg.text && (
                <div className={`mb-4 p-3 rounded-xl text-xs font-bold border ${
                  passMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {passMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="block uppercase mb-1">Old Password *</label>
                  <input
                    type="password"
                    required
                    value={passForm.old_password}
                    onChange={(e) => setPassForm({ ...passForm, old_password: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block uppercase mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passForm.new_password}
                    onChange={(e) => setPassForm({ ...passForm, new_password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block uppercase mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passForm.confirm_password}
                    onChange={(e) => setPassForm({ ...passForm, confirm_password: e.target.value })}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* ================= MODAL: CERTIFICATE DETAILS & QR / EDIT ================= */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-8 shadow-2xl relative">
            
            <button
              onClick={() => { setSelectedCert(null); setIsEditing(false); }}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {isEditing ? (
              /* Edit Form */
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-4">Edit Certificate Details</h3>
                <form onSubmit={handleSaveEditCert} className="space-y-4 text-xs font-bold text-slate-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block uppercase mb-1">Student Name</label>
                      <input
                        type="text"
                        required
                        value={editFormData.student_name || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, student_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block uppercase mb-1">Course Name</label>
                      <input
                        type="text"
                        required
                        value={editFormData.course_name || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, course_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block uppercase mb-1">Grade</label>
                      <input
                        type="text"
                        value={editFormData.grade || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block uppercase mb-1">Certificate Title</label>
                      <input
                        type="text"
                        value={editFormData.title || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-slate-100 rounded-xl text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* View Details & QR */
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{selectedCert.institution_name}</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">{selectedCert.title}</h3>
                    <p className="text-xs text-slate-500">ID: <strong className="font-mono text-slate-800">{selectedCert.certificate_id}</strong></p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    selectedCert.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedCert.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-bold uppercase">Awarded To</span>
                      <strong className="text-base text-slate-900">{selectedCert.student_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold uppercase">Discipline / Course</span>
                      <strong className="text-sm text-slate-800">{selectedCert.course_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold uppercase">Grade</span>
                      <strong className="text-sm text-blue-600">{selectedCert.grade || 'Successful Completion'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold uppercase">Issue Date</span>
                      <span className="text-slate-700 font-semibold">{selectedCert.issue_date}</span>
                    </div>
                  </div>

                  {/* QR Code Preview */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    {selectedCert.qr_code ? (
                      <img
                        src={`http://127.0.0.1:8000${selectedCert.qr_code}`}
                        alt="Certificate QR"
                        className="w-32 h-32 object-contain bg-white p-2 rounded-xl border border-slate-200 shadow-xs mb-2"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-blue-900 rounded-xl flex items-center justify-center text-cyan-400 mb-2">
                        <QrCode className="w-16 h-16" />
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-slate-700">Cryptographic QR Code</span>
                    <a
                      href={`/verify/${selectedCert.certificate_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-blue-600 hover:underline font-bold mt-0.5"
                    >
                      Open Public Verification
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    onClick={() => { setIsEditing(true); setEditFormData(selectedCert); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Edit Certificate
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(selectedCert.certificate_id)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= MODAL: REVOKE CONFIRMATION ================= */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-rose-200 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-black text-slate-900">Revoke Certificate</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to revoke certificate <strong className="font-mono text-rose-600">{revokeTarget.certificate_id}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Reason for Revocation *</label>
              <textarea
                rows={3}
                required
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Academic integrity policy violation, wrong student grade, or program cancellation..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500 font-sans"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
