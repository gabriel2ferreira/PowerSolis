import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GitCompare, Users } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const ComparisonModesCard = ({ equipmentId }) => {
  const [data, setData] = useState({ state: null, cluster: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!equipmentId) return;
      setLoading(true);
      try {
        const { data: history, error } = await supabase
          .from('equipment_data_history')
          .select('state, cluster')
          .eq('equipment_id', equipmentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!error && history) {
          setData(history);
        }
      } catch (err) {
        console.error("Error fetching comparison data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [equipmentId]);

  const getBadgeColor = (val) => {
    const lower = val?.toLowerCase();
    if (lower === 'bom') return 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]';
    if (lower === 'atenção' || lower === 'atencao') return 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]';
    if (lower === 'crítico' || lower === 'critico') return 'bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Modos de Comparação</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="individual" className="text-xs"><GitCompare className="w-3 h-3 mr-2" /> Individual</TabsTrigger>
            <TabsTrigger value="peers" className="text-xs"><Users className="w-3 h-3 mr-2" /> Pares</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual" className="mt-0">
            <div className="p-4 bg-muted/30 rounded-lg flex flex-col items-center justify-center min-h-[80px]">
              <span className="text-xs text-muted-foreground mb-2">Evolução do Equipamento</span>
              {loading ? (
                <span className="text-sm">Carregando...</span>
              ) : (
                <Badge variant="outline" className={`text-sm py-1 px-3 ${getBadgeColor(data.state)}`}>
                  {data.state || 'Sem Dados'}
                </Badge>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="peers" className="mt-0">
            <div className="p-4 bg-muted/30 rounded-lg flex flex-col items-center justify-center min-h-[80px]">
              <span className="text-xs text-muted-foreground mb-2">Classificação na Frota</span>
              {loading ? (
                <span className="text-sm">Carregando...</span>
              ) : (
                <Badge variant="outline" className={`text-sm py-1 px-3 ${getBadgeColor(data.cluster)}`}>
                  {data.cluster || 'Sem Dados'}
                </Badge>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ComparisonModesCard;