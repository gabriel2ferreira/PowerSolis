import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Server, Filter, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';
import { getAllEquipmentsBasic } from '@/utils/equipmentDataMapper';
import { saveEquipmentHealthHistory } from '@/services/equipmentHealthSync';
import { checkAndCreateAlert } from '@/services/equipmentAlertService';
import { getEquipmentStatus } from '@/utils/equipmentStatus';
import { logger } from '@/lib/debugLogger';

const EquipmentDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, byType: [], critical: 0, withAlerts: 0 });
  const [equipmentsList, setEquipmentsList] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [eqData, alertsRes] = await Promise.all([
        getAllEquipmentsBasic(true),
        supabase.from('equipment_alerts_log').select('id, equipment_id, status').eq('status', 'active')
      ]);
      
      const alertsData = alertsRes.data || [];
      const typeCounts = {};
      let criticalCount = 0;
      let withAlertsCount = 0;

      const processedData = [];
      for (const item of eqData) {
        if (!item.api_config) {
          logger.warn('EquipmentDashboard', `Missing API config for ID ${item.id}`);
        }

        const typeName = item.equipment_types?.name || 'Unknown';
        typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
        
        const healthData = calculateEquipmentHealth(item);
        item.health = healthData; // Inject health context for calculations
        
        const { status: effectiveStatus, healthPercentage: latestHealth, color: healthColor } = getEquipmentStatus(item);
        
        // Sync history asynchronously in background
        saveEquipmentHealthHistory(item.id, item, item.api_config);
        // Sync alerts asynchronously
        checkAndCreateAlert(item.id, effectiveStatus);

        const activeAlerts = alertsData.filter(a => a.equipment_id === item.id).length;
        if (activeAlerts > 0) withAlertsCount++;

        if (effectiveStatus === 'Crítico') {
          criticalCount++;
        }

        processedData.push({ 
          ...item, 
          type_name: typeName, 
          activeAlerts, 
          latestHealth, 
          effectiveStatus,
          healthColor
        });
      }

      setStats({
        total: eqData.length,
        byType: Object.entries(typeCounts).map(([name, value]) => ({ name, value })),
        critical: criticalCount,
        withAlerts: withAlertsCount
      });
      setEquipmentsList(processedData);

    } catch (error) {
      logger.error('EquipmentDashboard', "Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredEquipments = equipmentsList.filter(eq => {
    if (filter === 'Alerts') return eq.activeAlerts > 0;
    if (filter === 'Critical') return eq.effectiveStatus === 'Crítico';
    return true;
  });

  if (loading) return <div className="p-8 text-center animate-pulse">{t('loading') || 'Carregando...'}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalEquipment') || 'Total de Equipamentos'}</CardTitle>
              <Server className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Equipamentos Críticos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.critical}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Com Alertas Ativos</CardTitle>
              <Activity className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withAlerts}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Status da Frota</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select className="text-sm border rounded-md p-2 bg-background focus:outline-none" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="All">Todos os Equipamentos</option>
              <option value="Alerts">Com Alertas Ativos</option>
              <option value="Critical">Apenas Críticos</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEquipments.map((eq) => (
              <div key={eq.id} onClick={() => navigate(`/equipment/${eq.id}`)} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:shadow-md cursor-pointer bg-card">
                <div className="flex flex-col gap-1 mb-3 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">{eq.name}</h3>
                    <Badge style={{ backgroundColor: eq.healthColor, color: 'white' }}>{eq.effectiveStatus}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{eq.location_name} • {eq.type_name}</p>
                </div>
                <div className="w-full sm:w-1/3 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Saúde Atual</span><span>{Number(eq.latestHealth).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                    <div className="h-full" style={{ width: `${eq.latestHealth}%`, backgroundColor: eq.healthColor }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default EquipmentDashboard;