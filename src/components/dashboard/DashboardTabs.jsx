import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/', label: 'Visão Geral' },
  { path: '/report-import', label: 'Importar Relatório' },
  { path: '/reports', label: 'Relatórios' },
  { path: '/alarms', label: 'Alarmes' },
  { path: '/predictions', label: 'Previsão de Vida Útil' }
];

const DashboardTabs = () => {
  const location = useLocation();

  return (
    <div className="w-full border-b border-border mb-6 overflow-x-auto">
      <nav className="flex space-x-6 min-w-max px-2">
        {TABS.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`pb-4 pt-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default DashboardTabs;