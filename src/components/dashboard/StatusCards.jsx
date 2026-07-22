import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getAllEquipmentsBasic } from '@/utils/equipmentDataMapper';
import { countEquipmentByHealth } from '@/utils/healthCalculation';

const StatusCards = () => {
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

  const getPercentage = (val) => counts.total > 0 ? Math.round((val / counts.total) * 100) : 0;

  const cards = [
    {
      title: 'Status Bom',
      value: counts.good,
      percentage: getPercentage(counts.good),
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      borderClass: 'border-l-green-500',
      progressClass: '[&>div]:bg-green-500'
    },
    {
      title: 'Em Atenção',
      value: counts.attention,
      percentage: getPercentage(counts.attention),
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      borderClass: 'border-l-yellow-500',
      progressClass: '[&>div]:bg-yellow-500'
    },
    {
      title: 'Crítico',
      value: counts.critical,
      percentage: getPercentage(counts.critical),
      icon: <AlertOctagon className="w-5 h-5 text-red-500" />,
      borderClass: 'border-l-red-500',
      progressClass: '[&>div]:bg-red-500'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-l-4">
            <CardContent className="p-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {cards.map((card, idx) => (
        <Card key={idx} className={`border-l-4 ${card.borderClass} shadow-sm bg-card`}>
          <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              {card.icon}
            </div>
            <div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-foreground">{card.value}</span>
                <span className="text-sm font-semibold mb-1">{card.percentage}%</span>
              </div>
              <Progress value={card.percentage} className={`h-2 mt-2 ${card.progressClass}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatusCards;