import { NavLink } from 'react-router-dom';
import { Bug, Gauge, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/issues', label: 'Issues', icon: Bug },
  { to: '/hotspots', label: 'Security Hotspots', icon: ShieldAlert },
  { to: '/measures', label: 'Measures', icon: Gauge },
];

export function Sidebar() {
  return (
    <aside className="no-print hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        <span className="text-sm font-semibold">SonarQube</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
