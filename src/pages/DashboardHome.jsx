import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useEquipmentStats } from '@/hooks/useEquipmentStats';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import StatusCards from '@/components/dashboard/StatusCards';
import FleetDistributionChart from '@/components/dashboard/FleetDistributionChart';
import EquipmentMap from '@/components/dashboard/EquipmentMap';
import AlertsSection from '@/components/dashboard/AlertsSection';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const DashboardHome = () => {
  const { 
    locations, 
    distribution, 
    alerts,
    loading, 
    error, 
    refetch 
  } = useEquipmentStats(30000);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Dashboard - Power Solis</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <Button onClick={refetch} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </Button>
      </div>

      <DashboardTabs />

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Erro ao carregar dados: {error}</p>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <StatusCards />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 h-[450px]">
            <FleetDistributionChart data={distribution} loading={loading} />
          </div>
          <div className="lg:col-span-7 h-[450px]">
            <EquipmentMap locations={locations} loading={loading} />
          </div>
        </div>

        <AlertsSection alerts={alerts} loading={loading} />
      </motion.div>
    </div>
  );
};

export default DashboardHome;