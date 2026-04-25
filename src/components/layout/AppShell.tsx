import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/log", label: "Log" },
  { to: "/add", label: "Add Food" },
  { to: "/goals", label: "Goals" }
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Nutrient Tracker</p>
          <h1 className="text-2xl font-bold text-slate-900">Food and Nutrition Journal</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  isActive ? "bg-brand-600 text-white" : "bg-white text-slate-700 hover:bg-brand-50"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}