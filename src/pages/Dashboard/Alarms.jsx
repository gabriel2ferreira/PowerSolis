import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertOctagon, CheckCircle2, Clock, Activity, ArrowRight, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Alarms = () => {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchAlarms = async () => {
    try {
      setLoading(true);
      
      // Fetch active alerts and join with equipment data
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          id,
          equipment_id,
          alert_type,
          health_percentage,
          message,
          status,
          created_at,
          equipments (
            name,
            temperature,
            equipment_types (name)
          )
        `)
        .eq('status', 'active')
        .eq('alert_type', 'Equipamento em Nível Crítico')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlarms(data || []);
    } catch (err) {
      console.error("Error fetching alarms:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlarms();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('alerts-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        fetchAlarms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleResolve = async (e, alarmId) => {
    e.stopPropagation(); // Prevent triggering card click
    try {
      const { error } = await supabase.from('alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alarmId);
        
      if (error) throw error;

      toast({
        title: "Alarme resolvido",
        description: "O alarme foi marcado como resolvido e removido da lista ativa.",
      });
      fetchAlarms();
    } catch (error) {
      toast({
        title: "Erro ao resolver",
        description: "Não foi possível resolver o alarme. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleCardClick = (equipmentId) => {
    navigate(`/dashboard/life-expectancy?equipment_id=${equipmentId}`);
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Central de Alarmes - Power Solis</title>
      </Helmet>
      
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <div className="flex items-center gap-3">
          <div className="bg-destructive/10 p-3 rounded-lg">
            <AlertOctagon className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Central de Alarmes</h1>
            <p className="text-muted-foreground mt-1">Monitoramento de equipamentos em estado crítico</p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
            <AlertOctagon className="w-5 h-5" />
            Erro ao carregar alarmes: {error}
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardHeader className="pb-2"><Skeleton className="h-6 w-1/3" /></CardHeader>
                <CardContent><Skeleton className="h-20 w-full" /></CardContent>
              </Card>
            ))
          ) : alarms.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum alarme crítico ativo</h3>
                <p className="text-muted-foreground max-w-md">
                  Todos os equipamentos monitorados estão operando fora da zona de risco (saúde acima de 25%).
                </p>
              </CardContent>
            </Card>
          ) : (
            alarms.map((alarm) => {
              const equipmentType = alarm.equipments?.equipment_types?.name || 'Equipamento';
              const timeAgo = formatDistanceToNow(new Date(alarm.created_at), { addSuffix: true, locale: ptBR });
              
              return (
                <Card 
                  key={alarm.id} 
                  className="border-red-200 dark:border-red-900 shadow-sm overflow-hidden relative cursor-pointer hover:shadow-md hover:border-red-300 dark:hover:border-red-800 transition-all"
                  onClick={() => handleCardClick(alarm.equipment_id)}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-destructive"></div>
                  <CardHeader className="pb-2 pl-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive" className="uppercase text-xs font-bold px-2 py-0.5">
                            CRÍTICO
                          </Badge>
                          <span className="text-sm text-muted-foreground font-medium">{equipmentType}</span>
                        </div>
                        <CardTitle className="text-2xl font-bold hover:text-red-600 transition-colors">{alarm.equipments?.name}</CardTitle>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-1 bg-muted/50 px-3 py-1.5 rounded-md">
                        <Clock className="w-4 h-4" />
                        <span>Detectado {timeAgo}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pl-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
                        <div className="text-sm text-red-800 dark:text-red-300 mb-1 flex items-center gap-2">
                          <Activity className="w-4 h-4" /> Saúde Atual
                        </div>
                        <div className="text-3xl font-black text-red-600 dark:text-red-500">
                          {alarm.health_percentage?.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-100 dark:border-orange-900/50">
                        <div className="text-sm text-orange-800 dark:text-orange-300 mb-1 flex items-center gap-2">
                          Temperatura
                        </div>
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-500">
                          {alarm.equipments?.temperature ? `${parseFloat(alarm.equipments.temperature).toFixed(1)}°C` : 'N/A'}
                        </div>
                      </div>

                      <div className="bg-muted p-4 rounded-lg border flex flex-col justify-center">
                        <span className="text-sm font-semibold mb-1 text-foreground">Detalhes do Evento:</span>
                        <p className="text-sm text-muted-foreground">{alarm.message}</p>
                        <span className="text-xs text-muted-foreground mt-2">
                          Data: {format(new Date(alarm.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pl-6 bg-muted/20 border-t flex flex-wrap gap-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); handleCardClick(alarm.equipment_id); }}
                      className="gap-2"
                    >
                      Ver Detalhes do Equipamento <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={(e) => handleResolve(e, alarm.id)}
                      className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-950/50 border-green-200 dark:border-green-900"
                    >
                      <Check className="w-4 h-4" /> Marcar como Resolvido
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Alarms;