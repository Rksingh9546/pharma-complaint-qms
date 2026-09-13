import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/complaints/new", label: "Complaint Intake", end: true },
  { to: "/complaints", label: "Complaints", end: true },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-6 px-4 lg:px-8">
        <NavLink to="/complaints/new" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 className="h-4 w-4" aria-hidden="true">
              <path d="M9 12l2 2 4-4" />
              <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-slate-900">PharmaQMS</span>
            <span className="block text-[11px] font-medium text-slate-500">
              Complaint Management
            </span>
          </span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto text-xs font-medium text-slate-400">AI-Powered QMS</div>
      </div>
    </header>
  );
}