import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardDrive, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { getAllEquipmentsBasic } from '@/utils/equipmentDataMapper';
import { countEquipmentByHealth } from '@/utils/healthCalculation';

const EquipmentStatusCards = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ good: 0, attention: 0, critical: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      try {
        const equipments = await getAllEquipmentsBasic(true);
        // Using unified single source of truth calculation
        const calcCounts = countEquipmentByHealth(equipments);
        setCounts(calcCounts);
      } catch (error) {
        console.error('Failed to load equipment status', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleNavigate = (status) => {
    navigate(`/equipment/list?status=${status || 'all'}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-10 rounded-full mb-4" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getPercentage = (val) => counts.total > 0 ? Math.round((val / counts.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Card */}
      <Card 
        className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-card border-l-4 border-l-primary"
        onClick={() => handleNavigate(null)}
      >
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">Total de Ativos</span>
            <HardDrive className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-3xl font-bold">{counts.total}</h3>
            <p className="text-xs text-muted-foreground mt-1">Frota Monitorada</p>
          </div>
        </CardContent>
      </Card>

      {/* Bom Card */}
      <Card 
        className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-card border-l-4 border-l-green-500"
        onClick={() => handleNavigate('Bom')}
      >
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">Status Bom</span>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold">{counts.good}</h3>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">{getPercentage(counts.good)}%</span>
            </div>
            <Progress value={getPercentage(counts.good)} className="h-2 mt-2 [&>div]:bg-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Atenção Card */}
      <Card 
        className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-card border-l-4 border-l-yellow-500"
        onClick={() => handleNavigate('Atenção')}
      >
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">Atenção</span>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold">{counts.attention}</h3>
              <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">{getPercentage(counts.attention)}%</span>
            </div>
            <Progress value={getPercentage(counts.attention)} className="h-2 mt-2 [&>div]:bg-yellow-500" />
          </div>
        </CardContent>
      </Card>

      {/* Crítico Card */}
      <Card 
        className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-card border-l-4 border-l-red-500"
        onClick={() => handleNavigate('Crítico')}
      >
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">Status Crítico</span>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold">{counts.critical}</h3>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">{getPercentage(counts.critical)}%</span>
            </div>
            <Progress value={getPercentage(counts.critical)} className="h-2 mt-2 [&>div]:bg-red-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentStatusCards;