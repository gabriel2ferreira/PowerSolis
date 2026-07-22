import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

const AlarmsPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Alarmes - Power Solis</title>
      </Helmet>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <DashboardTabs />
        <div className="p-8 text-center bg-card border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Central de Alarmes</h2>
          <p className="text-muted-foreground">Esta página está em desenvolvimento. Em breve você poderá gerenciar todos os alarmes aqui.</p>
        </div>
      </div>
    </Layout>
  );
};

export default AlarmsPage;