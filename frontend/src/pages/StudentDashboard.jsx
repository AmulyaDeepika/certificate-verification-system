import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, LayoutDashboard, Award, User, Bell, LogOut, 
  Download, Eye, CheckCircle2, ChevronRight 
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, requestLogout } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [activeTab, setActiveTab] = useState('Dashboard'); // 'Dashboard', 'My Certificates', 'Profile', 'Notifications'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCertificates();
  }, []);

  const fetchMyCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/certificates/');
      if (res.data.length > 0) {
        setCertificates(res.data);
      } else {
        // Fallback demo data matching Mockup
        setCertificates([
          {
            id: 1,
            certificate_id: 'CV001',
            course_name: 'B.Tech Computer Science',
            institution_name: 'Aditya College',
            issue_date: '15-05-2025',
            status: 'ACTIVE'
          },
          {
            id: 2,
            certificate_id: 'CV002',
            course_name: 'Web Development Workshop',
            institution_name: 'CertVerify Institute',
            issue_date: '10-03-2025',
            status: 'ACTIVE'
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      // Demo certificates matching Mockup
      setCertificates([
        {
          id: 1,
          certificate_id: 'CV001',
          course_name: 'B.Tech Computer Science',
          institution_name: 'Aditya College',
          issue_date: '15-05-2025',
          status: 'ACTIVE'
        },
        {
          id: 2,
          certificate_id: 'CV002',
          course_name: 'Web Development Workshop',
          institution_name: 'CertVerify Institute',
          issue_date: '10-03-2025',
          status: 'ACTIVE'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (certId) => {
    window.open(`http://127.0.0.1:8000/api/public/download/${certId}/`, '_blank');
  };

  const displayName = user?.first_name || 'Sai Priya';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar matching Mockup */}
      <header className="bg-white border-b border-slate-200 h-16 px-6 sm:px-8 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl text-blue-950 font-sans">
            CertVerify
          </span>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden sm:flex items-center space-x-8 text-xs font-bold text-slate-600">
          <button 
            onClick={() => setActiveTab('Dashboard')}
            className={`cursor-pointer ${activeTab === 'Dashboard' ? 'text-blue-600' : 'hover:text-blue-600'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('My Certificates')}
            className={`cursor-pointer ${activeTab === 'My Certificates' ? 'text-blue-600' : 'hover:text-blue-600'}`}
          >
            My Certificates
          </button>
          <button 
            onClick={() => setActiveTab('Profile')}
            className={`cursor-pointer ${activeTab === 'Profile' ? 'text-blue-600' : 'hover:text-blue-600'}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('Notifications')}
            className={`cursor-pointer ${activeTab === 'Notifications' ? 'text-blue-600' : 'hover:text-blue-600'}`}
          >
            Notifications
          </button>
        </div>

        {/* User Badge on Right */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 font-bold text-xs shadow-xs">
            👩‍🎓
          </div>
          <span className="text-xs font-bold text-slate-800 hidden sm:inline">{displayName}</span>
          <button
            onClick={requestLogout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body with Left Dark Sidebar + Right Content matching Mockup */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Dark Blue Sidebar matching Mockup */}
        <aside className="w-56 bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-950 text-white flex flex-col justify-between p-4 flex-shrink-0">
          <nav className="space-y-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('Dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'Dashboard' ? 'bg-blue-600 text-white' : 'text-blue-200/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('My Certificates')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'My Certificates' ? 'bg-blue-600 text-white' : 'text-blue-200/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>My Certificates</span>
            </button>

            <button
              onClick={() => setActiveTab('Profile')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'Profile' ? 'bg-blue-600 text-white' : 'text-blue-200/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('Notifications')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'Notifications' ? 'bg-blue-600 text-white' : 'text-blue-200/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>
          </nav>

          <button
            onClick={requestLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-blue-200/80 hover:bg-rose-500/20 hover:text-rose-300 transition text-xs font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </aside>

        {/* Right Main User Dashboard Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
          
          {/* Welcome Banner Card with Avatar and Total Certificates */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shadow-xs">
                👩‍🎓
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>Hello, {displayName}!</span>
                  <span className="text-xl">👋</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Welcome to your dashboard</p>
              </div>
            </div>

            {/* Total Certificates Pill (Blue block matching Mockup) */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-md shadow-blue-600/20 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-blue-100 block uppercase">Total Certificates</span>
                <span className="text-2xl font-black">{certificates.length}</span>
              </div>
            </div>

          </div>

          {/* My Certificates Table Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">My Certificates</h3>
              <button 
                onClick={() => setActiveTab('My Certificates')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6">ID</th>
                    <th className="py-3 px-6">Certificate Name</th>
                    <th className="py-3 px-6">Issued By</th>
                    <th className="py-3 px-6">Issue Date</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">{cert.certificate_id}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">{cert.course_name}</td>
                      <td className="py-4 px-6 text-slate-500">{cert.institution_name}</td>
                      <td className="py-4 px-6 text-slate-500">{cert.issue_date}</td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <a
                          href={`/verify/${cert.certificate_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </a>
                        <button
                          onClick={() => handleDownload(cert.certificate_id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2 Bottom Panels matching Mockup: Recent Activity & Notifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Recent Activity</span>
              </h4>
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Certificate verified successfully</span>
                  <span className="text-[10px] text-slate-400 font-medium">2 days ago</span>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Notifications</span>
              </h4>
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-950 block">Your certificate is ready for download!</span>
                  <span className="text-[10px] text-amber-700 font-medium">2 days ago</span>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>

    </div>
  );
};

export default StudentDashboard;
