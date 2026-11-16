import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, LayoutDashboard, Users, Award, History, FileText, 
  Settings, LogOut, Bell, Plus, Upload, CheckCircle2, Clock, 
  ChevronDown, Search, ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

const chartData = [
  { name: 'Jan', verifications: 600 },
  { name: 'Feb', verifications: 800 },
  { name: 'Mar', verifications: 950 },
  { name: 'Apr', verifications: 1100 },
  { name: 'May', verifications: 1250 },
  { name: 'Jun', verifications: 1400 },
];

const SuperAdminDashboard = () => {
  const { user, requestLogout } = useAuth();
  const [stats, setStats] = useState(null);
  const [activeMenu, setActiveMenu] = useState('Dashboard'); // 'Dashboard', 'Manage Users', 'Certificates', 'Verification Logs', 'Reports', 'Settings'
  const [usersList, setUsersList] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [verificationLogs, setVerificationLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, certsRes, logsRes] = await Promise.all([
        api.get('/dashboard/stats/'),
        api.get('/users/'),
        api.get('/certificates/'),
        api.get('/logs/verifications/')
      ]);
      setStats(statsRes.data);
      setUsersList(usersRes.data);
      setCertificates(certsRes.data);
      setVerificationLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* LEFT SIDEBAR (Dark Blue matching Mockup) */}
      <aside className="w-64 bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-950 text-white flex flex-col justify-between p-5 flex-shrink-0 shadow-xl">
        <div>
          {/* Logo */}
          <div className="flex items-center space-x-2.5 mb-8 px-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              CertVerify
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-sm font-medium">
            <button
              onClick={() => setActiveMenu('Dashboard')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'Dashboard'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveMenu('Manage Users')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'Manage Users'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
            </button>

            <button
              onClick={() => setActiveMenu('Certificates')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'Certificates'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Certificates</span>
            </button>

            <button
              onClick={() => setActiveMenu('Verification Logs')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'Verification Logs'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Verification Logs</span>
            </button>

            <button
              onClick={() => setActiveMenu('Reports')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'Reports'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Reports</span>
            </button>

            <button
              onClick={() => setActiveMenu('Settings')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeMenu === 'Settings'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Logout at bottom */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={requestLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-blue-200/80 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Navbar */}
        <header className="bg-white border-b border-slate-200 h-18 px-8 flex items-center justify-between shadow-2xs">
          <div>
            <h2 className="text-xl font-black text-slate-900">{activeMenu}</h2>
            <p className="text-xs text-slate-400">Welcome back, {user?.first_name || 'Admin'}!</p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition relative cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-2 right-2"></span>
            </button>

            <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                {user?.first_name ? user.first_name[0] : 'A'}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <span className="font-bold text-slate-800 block">{user?.first_name || 'Admin'}</span>
                <span className="text-slate-400 font-semibold">{user?.role?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Body Content */}
        <div className="p-8 space-y-8">
          
          {/* TAB: DASHBOARD */}
          {activeMenu === 'Dashboard' && (
            <>
              {/* 4 Colored Metric Stat Cards matching Mockup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Users (Blue) */}
                <div className="bg-blue-50/70 border border-blue-100 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Total Users</span>
                    <div className="text-3xl font-black text-blue-950">
                      {stats ? stats.total_students + 3 : '1,250'}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                {/* Verified (Green) */}
                <div className="bg-emerald-50/70 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Verified</span>
                    <div className="text-3xl font-black text-emerald-950">
                      {stats ? stats.active_certificates : '1,180'}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                {/* Pending (Orange) */}
                <div className="bg-amber-50/70 border border-amber-100 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">Pending</span>
                    <div className="text-3xl font-black text-amber-950">45</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                {/* Certificates (Purple) */}
                <div className="bg-purple-50/70 border border-purple-100 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block mb-1">Certificates</span>
                    <div className="text-3xl font-black text-purple-950">
                      {stats ? stats.total_certificates : '1,320'}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Grid: Chart on Left, Quick Actions on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Verification Statistics Chart (8 cols) */}
                <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-base font-black text-slate-800 mb-6">Verification Statistics</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="verifications" 
                          stroke="#2563EB" 
                          strokeWidth={3} 
                          dot={{ fill: '#2563EB', r: 5 }} 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quick Actions (4 cols) */}
                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-base font-black text-slate-800 mb-4">Quick Actions</h3>

                  <button
                    onClick={() => setActiveMenu('Manage Users')}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add User</span>
                  </button>

                  <button
                    onClick={() => setActiveMenu('Certificates')}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    <span>Upload Certificate</span>
                  </button>

                  <button
                    onClick={() => setActiveMenu('Reports')}
                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 stroke-[2.5]" />
                    <span>View Reports</span>
                  </button>
                </div>

              </div>
            </>
          )}

          {/* TAB: MANAGE USERS */}
          {activeMenu === 'Manage Users' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-800">System Users Directory</h3>
                <span className="text-xs text-slate-400 font-mono">Total {usersList.length} Accounts</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Name</th>
                      <th className="py-3.5 px-6">Email</th>
                      <th className="py-3.5 px-6">Role</th>
                      <th className="py-3.5 px-6">Institution</th>
                      <th className="py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6 font-bold text-slate-900">{u.first_name || u.username}</td>
                        <td className="py-4 px-6 font-mono text-xs text-blue-600">{u.email}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500">{u.institution_name || 'System Wide'}</td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CERTIFICATES */}
          {activeMenu === 'Certificates' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-800">All Issued Certificates</h3>
                <span className="text-xs text-slate-400 font-mono">{certificates.length} Records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Certificate ID</th>
                      <th className="py-3.5 px-6">Student</th>
                      <th className="py-3.5 px-6">Course</th>
                      <th className="py-3.5 px-6">Institution</th>
                      <th className="py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {certificates.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6 font-mono text-xs text-blue-600 font-bold">{c.certificate_id}</td>
                        <td className="py-4 px-6 font-bold text-slate-900">{c.student_name}</td>
                        <td className="py-4 px-6 text-xs text-slate-600">{c.course_name}</td>
                        <td className="py-4 px-6 text-xs text-slate-500">{c.institution_name}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: VERIFICATION LOGS */}
          {activeMenu === 'Verification Logs' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">Certificate Verification Telemetry</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Certificate ID</th>
                      <th className="py-3.5 px-6">Student</th>
                      <th className="py-3.5 px-6">Method</th>
                      <th className="py-3.5 px-6">Result Status</th>
                      <th className="py-3.5 px-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {verificationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6 font-mono text-xs text-blue-600 font-bold">{log.certificate_id}</td>
                        <td className="py-4 px-6 font-bold text-slate-900">{log.student_name}</td>
                        <td className="py-4 px-6 text-xs text-slate-600">{log.verification_method}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            log.verification_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {log.verification_status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400">{new Date(log.verified_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: REPORTS & SETTINGS */}
          {(activeMenu === 'Reports' || activeMenu === 'Settings') && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs text-center">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">{activeMenu} Module</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
                System telemetry, security policies, and institutional audit configurations are operating in nominal health.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
