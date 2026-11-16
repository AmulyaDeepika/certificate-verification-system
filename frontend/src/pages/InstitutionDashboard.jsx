import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Award, Plus, Search, Eye, Download, Ban, CheckCircle, 
  Users, BarChart2, FileText, QrCode, RefreshCw, X, AlertTriangle, FilePlus 
} from 'lucide-react';

const InstitutionDashboard = () => {
  const [stats, setStats] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('certificates'); // 'certificates', 'add_certificate', 'students'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Certificate Form State
  const [issueForm, setIssueForm] = useState({
    student_name: '',
    student_email: '',
    student_roll_no: '',
    title: '',
    course_name: '',
    grade: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    description: '',
  });

  // Revoke Modal State
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, certsRes, studentsRes] = await Promise.all([
        api.get('/dashboard/stats/'),
        api.get('/certificates/'),
        api.get('/users/?role=STUDENT')
      ]);
      setStats(statsRes.data);
      setCertificates(certsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/certificates/', issueForm);
      alert('Certificate issued and cryptographic QR code generated successfully!');
      setIssueForm({
        student_name: '',
        student_email: '',
        student_roll_no: '',
        title: '',
        course_name: '',
        grade: '',
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        description: '',
      });
      setActiveTab('certificates');
      fetchData();
    } catch (err) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to issue certificate');
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    try {
      await api.post(`/certificates/${revokeTarget.id}/status/`, {
        status: 'REVOKED',
        reason: revokeReason || 'Administrative revocation',
      });
      setRevokeTarget(null);
      setRevokeReason('');
      fetchData();
    } catch (err) {
      alert('Error updating certificate status');
    }
  };

  const handleStatusToggle = async (cert, newStatus) => {
    try {
      await api.post(`/certificates/${cert.id}/status/`, {
        status: newStatus,
        reason: newStatus === 'ACTIVE' ? 'Re-activated' : 'Deactivated'
      });
      fetchData();
    } catch (err) {
      alert('Failed to change status');
    }
  };

  const filteredCerts = certificates.filter(c => 
    c.certificate_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.course_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-700/50 text-blue-300 text-xs font-semibold mb-2">
              Institution Admin Portal
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              {stats?.institution_name || 'Academic Credential Registrar'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">Issue, manage, and revoke tamper-proof digital certificates</p>
          </div>

          <button
            onClick={() => setActiveTab('add_certificate')}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Certificate</span>
          </button>
        </div>

        {/* Metric Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <span className="text-slate-400 text-xs uppercase font-bold">Total Issued</span>
              <div className="text-3xl font-black text-white mt-2">{stats.total_certificates}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <span className="text-slate-400 text-xs uppercase font-bold">Valid Certificates</span>
              <div className="text-3xl font-black text-emerald-400 mt-2">{stats.active_certificates}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <span className="text-slate-400 text-xs uppercase font-bold">Revoked / Invalid</span>
              <div className="text-3xl font-black text-rose-400 mt-2">{stats.revoked_certificates}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <span className="text-slate-400 text-xs uppercase font-bold">Verifications Inquired</span>
              <div className="text-3xl font-black text-amber-400 mt-2">{stats.total_verifications}</div>
            </div>
          </div>
        )}

        {/* Tabs Bar: View Certificates, Add Certificate, Revoke History */}
        <div className="flex gap-2 border-b border-slate-800 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === 'certificates' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            View Certificates ({certificates.length})
          </button>
          <button
            onClick={() => setActiveTab('add_certificate')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === 'add_certificate' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Add Certificate
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === 'students' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Enrolled Students ({students.length})
          </button>
        </div>

        {/* TAB 1: View Certificates & Revoke Action */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 max-w-md">
              <Search className="w-4 h-4 text-slate-500 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, Student Name, or Course..."
                className="bg-transparent text-white text-sm w-full focus:outline-none placeholder-slate-600 font-sans"
              />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-6">Certificate ID</th>
                      <th className="py-4 px-6">Student</th>
                      <th className="py-4 px-6">Course / Specialization</th>
                      <th className="py-4 px-6">Issue Date</th>
                      <th className="py-4 px-6">Certificate Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredCerts.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-4 px-6 font-mono text-xs text-blue-400 font-bold">
                          {cert.certificate_id}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-white">{cert.student_name}</div>
                          <div className="text-xs text-slate-500">{cert.student_email}</div>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-200">{cert.course_name}</td>
                        <td className="py-4 px-6 text-xs text-slate-400">{cert.issue_date}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            cert.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {cert.status === 'ACTIVE' ? 'Valid' : 'Revoked'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <a
                            href={`/verify/${cert.certificate_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 inline-flex bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition"
                            title="Verify Result Page"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <a
                            href={`http://127.0.0.1:8000/api/public/download/${cert.certificate_id}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 inline-flex bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          {cert.status === 'ACTIVE' ? (
                            <button
                              onClick={() => setRevokeTarget(cert)}
                              className="px-3 py-1.5 inline-flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition cursor-pointer"
                              title="Revoke Certificate"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Revoke</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusToggle(cert, 'ACTIVE')}
                              className="px-3 py-1.5 inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition cursor-pointer"
                              title="Re-activate Certificate"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Re-activate</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Add Certificate Form */}
        {activeTab === 'add_certificate' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-3xl mx-auto shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Add / Issue New Certificate</h2>
            <p className="text-sm text-slate-400 mb-6">
              Enter student details. A unique Certificate ID, scannable QR Code, and downloadable PDF certificate will be generated and stored in the database.
            </p>

            <form onSubmit={handleIssueCertificate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={issueForm.student_name}
                    onChange={(e) => setIssueForm({ ...issueForm, student_name: e.target.value })}
                    placeholder="e.g. Johnathan Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Student Email Address</label>
                  <input
                    type="email"
                    required
                    value={issueForm.student_email}
                    onChange={(e) => setIssueForm({ ...issueForm, student_email: e.target.value })}
                    placeholder="student@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Student Roll / Registration No</label>
                  <input
                    type="text"
                    value={issueForm.student_roll_no}
                    onChange={(e) => setIssueForm({ ...issueForm, student_roll_no: e.target.value })}
                    placeholder="e.g. CS-2026-88"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Grade / Performance Award</label>
                  <input
                    type="text"
                    value={issueForm.grade}
                    onChange={(e) => setIssueForm({ ...issueForm, grade: e.target.value })}
                    placeholder="e.g. Distinction (A+) or 94%"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Certificate Title</label>
                  <input
                    type="text"
                    required
                    value={issueForm.title}
                    onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                    placeholder="e.g. Professional Diploma in Cloud Computing"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Course / Program</label>
                  <input
                    type="text"
                    required
                    value={issueForm.course_name}
                    onChange={(e) => setIssueForm({ ...issueForm, course_name: e.target.value })}
                    placeholder="e.g. Cloud Architecture & DevOps"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={issueForm.issue_date}
                    onChange={(e) => setIssueForm({ ...issueForm, issue_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={issueForm.expiry_date}
                    onChange={(e) => setIssueForm({ ...issueForm, expiry_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description / Syllabus Covered</label>
                <textarea
                  rows={3}
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                  placeholder="Summary of skills and practical coursework assessed..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  Generate & Add Certificate
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: Students Roster */}
        {activeTab === 'students' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Student ID</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {students.map((stu) => (
                    <tr key={stu.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6 font-bold text-white">
                        {stu.first_name} {stu.last_name}
                      </td>
                      <td className="py-4 px-6 text-xs text-blue-400">{stu.email}</td>
                      <td className="py-4 px-6 font-mono text-xs">{stu.student_id_number || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400">
                          Enrolled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revoke Certificate Modal Dialog */}
        {revokeTarget && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-900/60 rounded-3xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400 mb-4">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">Revoke Certificate Confirmation</h3>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                Are you sure you want to revoke certificate <span className="font-mono text-rose-400 font-bold">{revokeTarget.certificate_id}</span> awarded to <span className="text-white font-bold">{revokeTarget.student_name}</span>?
              </p>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                  Revocation Reason
                </label>
                <textarea
                  rows={3}
                  required
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Academic integrity violation, incorrect student data, or cancelled program..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRevokeTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRevokeConfirm}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Confirm Revoke
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionDashboard;
