import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertOctagon, ArrowRight, Thermometer, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';
import { getAllEquipmentsBasic } from '@/utils/equipmentDataMapper';
import { getEquipmentStatus } from '@/utils/equipmentStatus';

const CriticalEquipmentList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [criticalEquipments, setCriticalEquipments] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const equipments = await getAllEquipmentsBasic(true);
      const criticals = [];

      equipments.forEach(eq => {
        const healthData = calculateEquipmentHealth(eq);
        const eqWithHealth = { ...eq, health: healthData };
        const { status, healthPercentage, color } = getEquipmentStatus(eqWithHealth);
        
        if (status === 'Crítico') {
          criticals.push({
            ...eq,
            type_name: eq.equipment_types?.name || 'Desconhecido',
            health: healthPercentage,
            color,
            lastUpdate: eq.updated_at || eq.installation_date,
            lastTemperature: healthData.rawData?.ponto_quente_externo || healthData.rawData?.temperatura_ambiente
          });
        }
      });

      setCriticalEquipments(criticals.sort((a, b) => a.health - b.health));
    } catch (error) {
      console.error('Error fetching critical equipments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleCardClick = (id) => {
    navigate(`/equipment/${id}`);
  };

  return (
    <Card className="h-full flex flex-col border-red-200 dark:border-red-900/50 bg-card">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
          <AlertOctagon className="w-5 h-5" />
          Equipamentos Críticos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : criticalEquipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-6 text-center text-muted-foreground">
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full mb-3">
              <AlertOctagon className="w-6 h-6 text-green-600 dark:text-green-500" />
            </div>
            <p>Nenhum equipamento em estado crítico.</p>
          </div>
        ) : (
          <div className="divide-y">
            {criticalEquipments.map((eq) => (
              <div 
                key={eq.id}
                onClick={() => handleCardClick(eq.id)}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors group flex items-center justify-between"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground truncate">{eq.name}</h4>
                    <Badge variant="destructive" style={{ backgroundColor: eq.color }} className="text-[10px] h-4 px-1 py-0 text-white">Crítico</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{eq.type_name}</p>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1" title="Última Temperatura Associada">
                      <Thermometer className="w-3 h-3" />
                      {eq.lastTemperature ? `${parseFloat(eq.lastTemperature).toFixed(1)}°C` : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1" title="Última Atualização">
                      <Clock className="w-3 h-3" />
                      {eq.lastUpdate ? formatDistanceToNow(new Date(eq.lastUpdate), { addSuffix: true, locale: ptBR }) : '-'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-2xl font-black group-hover:scale-105 transition-transform" style={{ color: eq.color }}>
                    {eq.health.toFixed(1)}%
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CriticalEquipmentList;