import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';

const portals = [
  {
    title: 'User / Student Registration',
    description: 'Create a student account and verify your email to access your certificates.',
    to: '/register',
    label: 'Register as User',
    icon: GraduationCap,
    styles: 'bg-blue-50 text-blue-700',
    button: 'bg-blue-700 hover:bg-blue-800',
  },
  {
    title: 'Administrator',
    description: 'Administrator accounts require approval and are created by the system administrator.',
    to: '/admin-login',
    label: 'Admin Login',
    icon: ShieldCheck,
    styles: 'bg-slate-100 text-slate-800',
    button: 'bg-slate-900 hover:bg-slate-800',
  },
];

const PortalSelectionPage = () => (
  <main className="min-h-[75vh] bg-slate-50 px-4 py-14 sm:py-20">
    <div className="mx-auto max-w-4xl">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">CertVerify portals</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Choose your login portal
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          Choose student registration or administrator login.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {portals.map(({ title, description, to, label, icon: Icon, styles, button }) => (
          <section key={title} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${styles}`}>
              <Icon className="h-7 w-7" />
            </span>
            <h2 className="mt-6 text-xl font-extrabold text-slate-900">{title}</h2>
            <p className="mt-2 min-h-12 text-sm leading-relaxed text-slate-600">{description}</p>
            <Link
              to={to}
              className={`mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition ${button}`}
            >
              {label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ))}
      </div>
    </div>
  </main>
);

export default PortalSelectionPage;
