import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Shield, Zap, Building, Award, LogIn, Users, QrCode,
  FileText, Clock3, Bell, ChartColumn, UserRound, CircleCheck,
  CircleX, ClipboardList, KeyRound, Search, Download
} from 'lucide-react';

const platformFeatures = [
  {
    icon: FileText,
    title: 'Digital certificate issuance',
    description: 'Authorized administrators can issue certificates with student details, course information, grades, and dates.',
    tone: 'bg-blue-50 text-blue-700',
  },
  {
    icon: QrCode,
    title: 'QR-enabled verification',
    description: 'Each certificate receives a unique ID and QR code that opens its live registry verification result.',
    tone: 'bg-cyan-50 text-cyan-700',
  },
  {
    icon: CircleCheck,
    title: 'Clear validity status',
    description: 'Check whether a certificate is active and within its validity period, expired, inactive, or revoked.',
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: Users,
    title: 'Student-owned records',
    description: 'Students see certificates associated with their registered email after signing in to their own account.',
    tone: 'bg-indigo-50 text-indigo-700',
  },
  {
    icon: ClipboardList,
    title: 'Verification and audit history',
    description: 'Authorized administrators can review certificate changes and verification activity.',
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    icon: ChartColumn,
    title: 'Analytics and reports',
    description: 'Administrative summaries show certificate totals, active and revoked counts, and verification activity.',
    tone: 'bg-violet-50 text-violet-700',
  },
  {
    icon: FileText,
    title: 'PDF certificate access',
    description: 'Certificate documents can be uploaded and downloaded through the certificate record.',
    tone: 'bg-rose-50 text-rose-700',
  },
  {
    icon: Search,
    title: 'Certificate search and filters',
    description: 'Administrators can find certificate records and narrow the list by status.',
    tone: 'bg-orange-50 text-orange-700',
  },
  {
    icon: CircleX,
    title: 'Certificate lifecycle controls',
    description: 'Authorized administrators can update certificate details or change certificate status.',
    tone: 'bg-red-50 text-red-700',
  },
  {
    icon: Building,
    title: 'Institution administration',
    description: 'System administrators can manage institution records, while institution admins work within their assigned institution.',
    tone: 'bg-teal-50 text-teal-700',
  },
  {
    icon: Download,
    title: 'Print-ready summaries',
    description: 'Administrative summary views can be printed for institutional review and record keeping.',
    tone: 'bg-lime-50 text-lime-700',
  },
  {
    icon: Bell,
    title: 'Administrative notifications',
    description: 'The application provides notifications for relevant certificate and system activity.',
    tone: 'bg-sky-50 text-sky-700',
  },
];

const accessRoles = [
  {
    icon: UserRound,
    title: 'Students',
    description: 'Sign in to see your own certificates, check their status, and access available certificate PDFs.',
  },
  {
    icon: Building,
    title: 'Institution administrators',
    description: 'Manage certificates and student-related records for the institution assigned to your account.',
  },
  {
    icon: KeyRound,
    title: 'System administrators',
    description: 'Oversee institutions and review system-wide certificate and verification activity.',
  },
];

const LandingPage = () => {
  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans">
      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100vh-4.5rem)] items-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 py-16 text-white sm:py-20 lg:py-24">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(59,130,246,0.3)_0%,transparent_60%)]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-10">
            
            {/* Left Content */}
            <div className="space-y-7 lg:col-span-7">
              <h1 className="text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                Certificate Verification <br />
                and <span className="text-cyan-400">Validation</span> System
              </h1>

              <div className="text-2xl font-bold tracking-wide text-blue-200 sm:text-3xl">
                Verify. Validate. Trust.
              </div>

              <p className="max-w-2xl text-lg leading-relaxed text-blue-100/90 sm:text-xl">
                A secure and reliable platform to verify the authenticity of certificates issued by educational institutions.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/verify"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  Verify Certificate
                </Link>

                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/20 cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </div>

            </div>

            {/* Right Graphic Mockup */}
            <div className="relative flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-lg">
                {/* 3D Certificate Visual Card */}
                <div className="relative transform rounded-3xl border-4 border-blue-300/40 bg-gradient-to-b from-white to-blue-50 p-8 text-slate-800 shadow-2xl transition duration-300 hover:scale-[1.02] sm:p-10">
                  <div className="mb-7 flex items-center justify-between border-b border-slate-200 pb-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-8 w-8 text-blue-600" />
                      <span className="text-lg font-extrabold text-blue-950">SAMPLE CERTIFICATE</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-800">
                      Sample
                    </span>
                  </div>

                  <div className="space-y-3 py-6 text-center">
                    <div className="text-sm font-bold uppercase tracking-wider text-slate-400">This Certifies That</div>
                    <div className="text-3xl font-black text-blue-900 sm:text-4xl">Sample Student</div>
                    <div className="text-sm text-slate-600">has successfully completed the curriculum in</div>
                    <div className="inline-block rounded-lg bg-blue-50 px-4 py-2 text-base font-bold text-blue-700">
                      B.Tech Computer Science & Engineering
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
                    <div className="text-left">
                      <span className="mb-1 block text-xs font-semibold uppercase text-slate-400">Certificate ID</span>
                        <span className="font-mono text-sm font-bold text-slate-800">SAMPLE-CERTIFICATE-ID</span>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                      <Award className="h-7 w-7" />
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -bottom-7 -left-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:-left-8">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                    <Zap className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-800">Instant QR Validation</span>
                    <span className="text-xs font-semibold text-slate-400">Check the certificate registry</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-11 max-w-3xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">One connected platform</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              From certificate issue to trusted verification
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              CertVerify connects certificate issuers, students, and people checking a certificate through a shared registry.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {platformFeatures.map(({ icon: Icon, title, description, tone }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-base font-extrabold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">How the process works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                A clear path for every certificate
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                Certificate records stay linked to their issuer and student, while verification checks the current registry status.
              </p>
            </div>

            <ol className="space-y-4">
              {[
                ['01', 'Issue', 'An authorized administrator records the student, institution, course, and certificate details.'],
                ['02', 'Connect', 'The certificate is associated with the student account using the registered email address.'],
                ['03', 'Verify', 'A verifier opens the QR link or checks the certificate ID against the registry.'],
                ['04', 'Review', 'The current validity result and available record details are shown; administrative actions are tracked.'],
              ].map(([number, title, description]) => (
                <li key={number} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-sm font-black text-white">
                    {number}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-blue-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">Role-based access</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              The right tools for each role
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-blue-100 sm:text-base">
              Separate sign-in and permissions help keep student records and administrative tools in their intended context.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {accessRoles.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-white/15 bg-white/5 p-6 sm:p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/15 text-cyan-300">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/80">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: Shield, title: 'Role-protected access', text: 'Separate student and administrator sign-in.' },
            { icon: Clock3, title: 'Validity-aware results', text: 'Status and expiry dates are considered during verification.' },
            { icon: CircleX, title: 'Status changes recorded', text: 'Inactive or revoked certificates are distinguishable from valid ones.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-lg font-extrabold text-white">
              <ShieldCheck className="h-6 w-6 text-blue-400" />
              CertVerify
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              A secure platform for managing and verifying institution-issued certificates.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">Explore</h2>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm">
              <Link to="/" className="transition hover:text-white">Home</Link>
              <Link to="/about" className="transition hover:text-white">About</Link>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">Portals</h2>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm">
              <Link to="/dashboard" className="transition hover:text-white">Login</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
            © {new Date().getFullYear()} CertVerify. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
