import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AlertHistory = ({ equipmentId }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const { toast } = useToast();

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('alerts')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('created_at', { ascending: false });
        
      if (filterType !== 'All') query = query.eq('alert_type', filterType);
      if (filterStatus !== 'All') query = query.eq('status', filterStatus.toLowerCase());

      const { data, error } = await query;
      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (equipmentId) fetchAlerts();
  }, [equipmentId, filterType, filterStatus]);

  const handleResolve = async (alertId) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', alertId);
        
      if (error) throw error;
      toast({ title: "Alerta resolvido com sucesso" });
      fetchAlerts();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao resolver alerta", description: error.message });
    }
  };

  const getAlertBadge = (type) => {
    if (type === 'Crítico') return <Badge variant="destructive">Crítico</Badge>;
    if (type === 'Atenção') return <Badge className="bg-orange-500 hover:bg-orange-600">Atenção</Badge>;
    return <Badge variant="outline">{type}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/30 p-3 rounded-md">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" /> Filtros:
        </div>
        <div className="flex gap-2 flex-wrap">
          <select 
            className="text-sm border rounded-md p-1 bg-background"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="All">Todos os Tipos</option>
            <option value="Atenção">Atenção</option>
            <option value="Crítico">Crítico</option>
          </select>
          <select 
            className="text-sm border rounded-md p-1 bg-background"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="All">Todos os Status</option>
            <option value="Active">Ativos</option>
            <option value="Resolved">Resolvidos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground animate-pulse">Carregando alertas...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-20" />
          Nenhum alerta encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-muted-foreground bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Data/Hora</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Saúde</th>
                <th className="px-4 py-3 font-medium">Mensagem</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => (
                <tr key={alert.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">{getAlertBadge(alert.alert_type)}</td>
                  <td className="px-4 py-3 font-medium">{alert.health_percentage?.toFixed(1)}%</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={alert.message}>{alert.message}</td>
                  <td className="px-4 py-3">
                    {alert.status === 'resolved' ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Resolvido
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" /> Ativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {alert.status === 'active' && (
                      <Button variant="outline" size="sm" onClick={() => handleResolve(alert.id)}>
                        Resolver
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AlertHistory;