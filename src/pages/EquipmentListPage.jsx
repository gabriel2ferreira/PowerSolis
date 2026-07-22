
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Search, HardDrive, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/customSupabaseClient';
import Layout from '@/components/Layout';
import { format } from 'date-fns';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';

const EquipmentListPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filterParam = searchParams.get('status') || searchParams.get('filter') || 'all';

  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select(`
          *, 
          equipment_types(name),
          equipment_api_config(horas_operacao, tangente_perdas, corrente_primario, temperatura_ambiente, ponto_quente_externo, vida_ref_anos)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedData = (data || []).map(eq => {
        const config = Array.isArray(eq.equipment_api_config) ? eq.equipment_api_config[0] : eq.equipment_api_config;
        const item = { ...eq, api_config: config };
        item.health = calculateEquipmentHealth(item);
        return item;
      });

      setEquipments(mappedData);
    } catch (err) {
      console.error('Error fetching equipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const filteredEquipments = useMemo(() => {
    return equipments.filter(eq => {
      const matchesSearch = eq.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const status = eq.health.status;
      
      let matchesFilter = true;
      if (filterParam === 'attention' || filterParam === 'Atenção') matchesFilter = status === 'Atenção';
      else if (filterParam === 'critical' || filterParam === 'Crítico') matchesFilter = status === 'Crítico';
      else if (filterParam === 'good' || filterParam === 'Bom') matchesFilter = status === 'Bom';
      
      return matchesSearch && matchesFilter;
    });
  }, [equipments, searchQuery, filterParam]);

  const filterTitle = (filterParam === 'attention' || filterParam === 'Atenção') ? 'Em Atenção' 
    : (filterParam === 'critical' || filterParam === 'Crítico') ? 'Críticos' 
    : (filterParam === 'good' || filterParam === 'Bom') ? 'Status Bom'
    : 'Todos';

  return (
    <Layout>
      <Helmet>
        <title>Lista de Equipamentos - Power Solis</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Equipamentos: {filterTitle}</h1>
              <p className="text-muted-foreground mt-1">Gerencie os ativos da sua frota.</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar equipamento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={fetchEquipments} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : filteredEquipments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
                <HardDrive className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Nenhum equipamento encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Não há equipamentos que correspondam aos critérios atuais.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap min-w-[800px]">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nome</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Instalação</th>
                      <th className="px-4 py-3 font-semibold">Saúde (%)</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Última Atualização</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredEquipments.map((eq) => {
                      const { status, color, percentage: healthPercentage } = eq.health;
                      
                      return (
                        <tr 
                          key={eq.id} 
                          className="bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/equipment/${eq.id}`)}
                        >
                          <td className="px-4 py-3 font-medium text-primary group-hover:underline">
                            {eq.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{eq.equipment_types?.name || '-'}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {eq.installation_date ? format(new Date(eq.installation_date), 'dd/MM/yyyy') : '-'}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {`${Number(healthPercentage).toFixed(1)}%`}
                          </td>
                          <td className="px-4 py-3">
                            <Badge style={{ backgroundColor: color, color: 'white' }} className="hover:opacity-90">
                              {status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {eq.updated_at ? format(new Date(eq.updated_at), 'dd/MM/yyyy HH:mm') : (eq.created_at ? format(new Date(eq.created_at), 'dd/MM/yyyy HH:mm') : '-')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EquipmentListPage;
