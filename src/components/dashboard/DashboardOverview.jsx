import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Map, AlertTriangle, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllEquipmentsBasic } from '@/utils/equipmentDataMapper';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';
import { getEquipmentStatus } from '@/utils/equipmentStatus';
import { supabase } from '@/lib/customSupabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const DashboardOverview = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ bom: 0, atencao: 0, critico: 0, total: 0 });
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const equipments = await getAllEquipmentsBasic(true);
        let bom = 0, atencao = 0, critico = 0;

        equipments.forEach(eq => {
          const healthData = calculateEquipmentHealth(eq);
          const eqWithHealth = { ...eq, health: healthData };
          const { status } = getEquipmentStatus(eqWithHealth);
          
          if (status === 'Bom') bom++;
          else if (status === 'Atenção') atencao++;
          else if (status === 'Crítico') critico++;
        });

        setStats({ bom, atencao, critico, total: equipments.length });

        const { data: alerts } = await supabase
          .from('equipment_alerts_log')
          .select('id, alert_type, status, last_triggered_at, equipments(name)')
          .eq('status', 'active')
          .order('last_triggered_at', { ascending: false })
          .limit(5);

        if (alerts) setRecentAlerts(alerts);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpis = [
    { label: 'Total', value: stats.total, color: 'text-blue-500' },
    { label: 'Bom', value: stats.bom, color: 'text-green-500' },
    { label: 'Atenção', value: stats.atencao, color: 'text-yellow-500' },
    { label: 'Crítico', value: stats.critico, color: 'text-red-500' },
  ];

  const StatCard = ({ label, value, color }) => (
    <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={`text-lg font-medium ${color}`}>{label}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-10 w-20" /> : <div className="text-4xl font-bold">{value}</div>}
          <p className="text-xs text-muted-foreground mt-1">Equipamentos</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">{t('overview')}</h1>
        <p className="text-muted-foreground mt-2">{t('overviewSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
            <StatCard {...kpi} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center"><PieChart className="h-5 w-5 mr-2 text-blue-500" /> Distribuição de Saúde</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex flex-col items-center justify-center bg-muted/30 rounded-lg border p-4 space-y-4">
                {loading ? <Skeleton className="h-32 w-32 rounded-full" /> : (
                  <>
                    <div className="flex w-full items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Bom</span>
                      <span className="font-bold">{stats.bom}</span>
                    </div>
                    <div className="flex w-full items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#eab308]"></div> Atenção</span>
                      <span className="font-bold">{stats.atencao}</span>
                    </div>
                    <div className="flex w-full items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Crítico</span>
                      <span className="font-bold">{stats.critico}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center"><Map className="h-5 w-5 mr-2 text-green-500" /> {t('summaryMap')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Map className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Mapa Geográfico Indisponível</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" /> Alertas Recentes</CardTitle>
            <CardDescription>Acompanhe os equipamentos que exigem atenção imediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                [1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)
              ) : recentAlerts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-md">Nenhum alerta ativo no momento.</div>
              ) : (
                recentAlerts.map((alarm) => (
                  <div key={alarm.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {alarm.alert_type === 'critico' ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <Activity className="h-5 w-5 text-yellow-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{alarm.equipments?.name || 'Equipamento Removido'}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={alarm.alert_type === 'critico' ? 'destructive' : 'secondary'} className="text-[10px] h-4">
                            {alarm.alert_type === 'critico' ? 'Crítico' : 'Atenção'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {formatDistanceToNow(new Date(alarm.last_triggered_at), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;