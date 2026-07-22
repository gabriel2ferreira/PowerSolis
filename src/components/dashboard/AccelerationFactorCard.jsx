import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatTo2Decimals, getAccelerationFactorStatus } from '@/utils/lifecycleCalculations';
import { Badge } from '@/components/ui/badge';

const AccelerationFactorCard = ({ fA, previousFA }) => {
  const status = getAccelerationFactorStatus(fA);
  
  let TrendIcon = Minus;
  if (previousFA !== null && previousFA !== undefined) {
    if (fA > previousFA) TrendIcon = TrendingUp;
    else if (fA < previousFA) TrendIcon = TrendingDown;
  }

  return (
    <Card className="overflow-hidden bg-card border-border shadow-sm h-full">
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gauge className={`w-5 h-5 ${status.color}`} />
            <h4 className="text-sm font-medium text-muted-foreground">Fator de Aceleração (fA)</h4>
          </div>
          <Badge variant="outline" className={`${status.bg} ${status.color} border-transparent`}>
            {status.text}
          </Badge>
        </div>
        
        <div className="mt-2 flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${status.color}`}>
              {formatTo2Decimals(fA)}
            </span>
          </div>
          {previousFA !== null && previousFA !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendIcon className={`w-4 h-4 ${fA > previousFA ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--success))]'}`} />
              vs anterior
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccelerationFactorCard;