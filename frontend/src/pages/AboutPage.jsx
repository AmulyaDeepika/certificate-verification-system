import { ShieldCheck, Lock, FileCheck2, Building } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="bg-slate-950 text-white min-h-[90vh] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-semibold mb-4 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            About CertVerify
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6">
            Digital Certificate Verification & Validation Platform
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            CertVerify provides universities, training academies, employers, and government organizations with an end-to-end cryptographic infrastructure to issue, authenticate, and manage tamper-proof educational credentials.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Tamper-Proof Integrity</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every certificate generates a unique cryptographic ID and high-density QR code connected directly to the issuing institution's database.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center mb-6">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Instant Public Verification</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Employers can verify credentials in milliseconds using either the unique Certificate ID or live device camera QR scanning with zero app downloads.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-400 flex items-center justify-center mb-6">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Multi-Tier Governance</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Super Admins oversee nationwide institutions, College Admins manage certificate issuance and revocations, and Students download certified PDFs.
            </p>
          </div>
        </div>

        {/* Workflow */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-12 mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">How the Validation Cycle Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-3">1</div>
              <h4 className="font-semibold text-white text-sm mb-1">Issue Credential</h4>
              <p className="text-xs text-slate-400">Institution uploads student and course details into the ledger.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-3">2</div>
              <h4 className="font-semibold text-white text-sm mb-1">Generate QR & ID</h4>
              <p className="text-xs text-slate-400">System produces a unique ID and high-res vector certificate PDF.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-3">3</div>
              <h4 className="font-semibold text-white text-sm mb-1">Student Portfolio</h4>
              <p className="text-xs text-slate-400">Student accesses their authenticated portfolio and downloads PDF.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-3">4</div>
              <h4 className="font-semibold text-white text-sm mb-1">Instant Verification</h4>
              <p className="text-xs text-slate-400">Public verifier scans QR to authenticate integrity in real-time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
