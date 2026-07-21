import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, FileText, BellRing, Activity } from 'lucide-react';

const TABS = [
  { path: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { path: '/dashboard/import-report', label: 'Importar Relatório', icon: UploadCloud },
  { path: '/dashboard/reports', label: 'Relatórios', icon: FileText },
  { path: '/dashboard/alarms', label: 'Alarmes', icon: BellRing },
  { path: '/dashboard/life-expectancy', label: 'Previsão de Vida Útil', icon: Activity }
];

const DashboardNavigation = () => {
  const location = useLocation();

  return (
    <div className="w-full border-b border-border bg-[hsl(var(--dash-nav-bg))] overflow-x-auto shadow-sm">
      <nav className="flex min-w-max px-4">
        {TABS.map((tab) => {
          // Exact match for the root dashboard, or startsWith for subroutes if necessary
          // But since we use explicit paths, exact match is fine
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`dashboard-tab ${isActive ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[hsl(var(--dash-nav-active))]' : 'text-muted-foreground'}`} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default DashboardNavigation;