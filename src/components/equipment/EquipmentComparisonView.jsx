import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EquipmentComparisonView = ({ onViewDetails }) => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const { data, error } = await supabase
          .from('equipments')
          .select(`id, name, status, equipment_types(name)`);
        
        if (error) throw error;
        
        // Simulate health calculation for table
        const enriched = data.map(eq => {
          const simulatedHealth = Math.random() * 100;
          return {
            ...eq,
            health: simulatedHealth,
            lol: 100 - simulatedHealth,
            typeName: eq.equipment_types?.name || 'Desconhecido',
            statusCategory: simulatedHealth < 25 ? 'Crítico' : simulatedHealth < 50 ? 'Atenção' : 'Normal'
          };
        }).sort((a, b) => a.health - b.health);

        setEquipments(enriched);
      } catch (err) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao carregar frota' });
      } finally {
        setLoading(false);
      }
    };
    fetchEquipments();
  }, [toast]);

  if (loading) return <div className="p-4">Carregando comparativo...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparativo da Frota (Classificado por Saúde)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Saúde (%)</TableHead>
                <TableHead>LOL (%)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipments.map(eq => (
                <TableRow key={eq.id}>
                  <TableCell className="font-medium">{eq.name}</TableCell>
                  <TableCell>{eq.typeName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-secondary h-2 rounded-full max-w-[100px]">
                        <div 
                          className={`h-full rounded-full ${eq.health < 25 ? 'bg-red-500' : eq.health < 50 ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${eq.health}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold">{eq.health.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{eq.lol.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge variant={eq.statusCategory === 'Crítico' ? 'destructive' : eq.statusCategory === 'Atenção' ? 'secondary' : 'default'}>
                      {eq.statusCategory}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(eq.id)}>
                      <Eye className="w-4 h-4 mr-2" /> Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentComparisonView;