
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useEquipmentStats } from '@/hooks/useEquipmentStats';
import { useEquipmentHealthMonitoring } from '@/hooks/useEquipmentHealthMonitoring';
import FleetDistributionChart from '@/components/dashboard/FleetDistributionChart';
import EquipmentMap from '@/components/dashboard/EquipmentMap';
import EquipmentStatusCards from '@/components/dashboard/EquipmentStatusCards';
import CriticalEquipmentList from '@/components/dashboard/CriticalEquipmentList';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { AlertTriangle } from 'lucide-react';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';

const Home = () => {
  // Start background monitoring for health and alerts
  useEquipmentHealthMonitoring(45000);

  const { 
    locations, 
    distribution, 
    loading: statsLoading, 
    error: statsError 
  } = useEquipmentStats(30000);

  // Enhance locations with explicit health and status for the map component
  const enhancedLocations = React.useMemo(() => {
    if (!locations) return [];
    return locations.map(loc => {
      // If the location doesn't already have explicit health/status, calculate it
      const healthData = loc.health || calculateEquipmentHealth(loc);
      
      return {
        ...loc,
        health: healthData,
        status: healthData.status,
      };
    });
  }, [locations]);

  return (
    <DashboardLayout>
      <Helmet>
        <title>Visão Geral - Power Solis Dashboard</title>
      </Helmet>

      <div className="space-y-6">
        {statsError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md flex items-center gap-3 shadow-sm mb-4">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Erro ao carregar dados do mapa/distribuição: {statsError}</p>
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Top Section: unified Equipment Status Cards */}
          <EquipmentStatusCards />

          {/* Middle Section: Two Columns (Chart & Critical List) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="h-[350px]">
              <FleetDistributionChart data={distribution} loading={statsLoading} />
            </div>
            
            <div className="h-[350px]">
              <CriticalEquipmentList />
            </div>
          </div>

          {/* Bottom Section: Map */}
          <div className="h-[450px] mt-8">
            <EquipmentMap locations={enhancedLocations} loading={statsLoading} />
          </div>

        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
