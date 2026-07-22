import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Clock } from 'lucide-react';
import { formatTo2Decimals, calculateHealthPercentage } from '@/utils/equipmentLifecycleUtils';

const EquipmentStatusCard = ({ equipment, lifeLossPercent }) => {
  if (!equipment) return null;

  const health = calculateHealthPercentage(lifeLossPercent);
  
  const getHealthBarClass = (value) => {
    if (value > 50) return 'health-bar-good';
    if (value >= 25) return 'health-bar-warning';
    return 'health-bar-critical';
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{equipment.name}</h3>
            <p className="text-sm text-muted-foreground">{equipment.equipment_types?.name || 'Equipamento'}</p>
          </div>
          <Activity className="w-5 h-5 text-primary" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Saúde Atual</span>
            <span className="font-bold">{formatTo2Decimals(health)}%</span>
          </div>
          
          <div className="w-full bg-secondary h-3 rounded-full overflow-hidden border">
            <div 
              className={`health-bar ${getHealthBarClass(health)}`}
              style={{ width: `${health}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
          <div>
            <span className="text-muted-foreground block text-xs">Perda de Vida</span>
            <span className="font-medium">{formatTo2Decimals(lifeLossPercent)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Fase</span>
            <span className="font-medium">{equipment.phase || 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentStatusCard;