import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

const PredictionsPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Previsão de Vida Útil - Power Solis</title>
      </Helmet>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <DashboardTabs />
        <div className="p-8 text-center bg-card border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Previsões e Modelos AI</h2>
          <p className="text-muted-foreground">Análises preditivas avançadas de vida útil estarão disponíveis em breve.</p>
        </div>
      </div>
    </Layout>
  );
};

export default PredictionsPage;