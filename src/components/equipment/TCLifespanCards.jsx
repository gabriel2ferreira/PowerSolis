import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Clock, Thermometer, TrendingUp, AlertTriangle } from 'lucide-react';
import { useTCLifespanCalculations } from '@/hooks/useTCLifespanCalculations';
import { 
  formatPercentage, formatTemperature, formatDuration,
  getHealthStatus, getAccelerationFactorStatus 
} from '@/utils/tcLifespanCalculations';
import { format } from 'date-fns';

const TCLifespanCards = ({ equipmentId, installationDate }) => {
  const { loading, error, data, temperatureHistory } = useTCLifespanCalculations(equipmentId, installationDate);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive">
        <CardContent className="p-6 text-destructive flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Erro ao carregar dados de vida útil: {error}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const currentTemp = temperatureHistory.length > 0 ? temperatureHistory[0].temperature : null;
  const healthInfo = getHealthStatus(data.remainingPercentage);
  const faInfo = getAccelerationFactorStatus(data.accelerationFactor);
  const daysRemaining = (data.closestEndDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      
      {/* Card 1: Current Health */}
      <Card className={`border-l-4`} style={{ borderLeftColor: healthInfo.color }}>
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Activity className="w-4 h-4" /> Saúde Atual
            </span>
            <Badge variant="outline" style={{ color: healthInfo.color, borderColor: healthInfo.color }}>
              {healthInfo.status}
            </Badge>
          </div>
          <div className="text-3xl font-bold mt-2">{formatPercentage(data.remainingPercentage)}</div>
          <div className="w-full bg-secondary h-2 rounded-full mt-3 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${data.remainingPercentage}%`, backgroundColor: healthInfo.color }} />
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Lifespan Info */}
      <Card>
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-start mb-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" /> Tempo Restante
            </span>
          </div>
          <div className="text-lg font-semibold mt-1">{formatDuration(daysRemaining)}</div>
          <div className="text-xs text-muted-foreground mt-2">
            Instalado: {installationDate ? format(new Date(installationDate), 'dd/MM/yyyy') : 'N/A'}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Temperature Status */}
      <Card>
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-start mb-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Thermometer className="w-4 h-4" /> Temperatura Atual
            </span>
          </div>
          <div className="text-3xl font-bold mt-2">
            {currentTemp !== null ? formatTemperature(currentTemp) : 'S/ Dados'}
          </div>
          {currentTemp === null && <span className="text-xs text-amber-500 mt-2">Sem histórico térmico</span>}
        </CardContent>
      </Card>

      {/* Card 4: Acceleration Factor */}
      <Card className={`border-l-4`} style={{ borderLeftColor: faInfo.color === 'darkred' ? 'red' : faInfo.color }}>
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> Fator de Acel. (fA)
            </span>
            <Badge variant="outline" style={{ color: faInfo.color === 'darkred' ? 'red' : faInfo.color, borderColor: faInfo.color === 'darkred' ? 'red' : faInfo.color }}>
              {faInfo.status}
            </Badge>
          </div>
          <div className="text-3xl font-bold mt-2">{data.accelerationFactor.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-2">
            Envelhecendo {data.accelerationFactor.toFixed(2)}x mais rápido
          </div>
        </CardContent>
      </Card>

      {/* Card 5: Predictions */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-start mb-2">
            <span className="text-sm font-medium text-primary flex items-center gap-1">
              <Activity className="w-4 h-4" /> Fim de Vida Previsto
            </span>
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            {format(data.closestEndDate, 'dd/MM/yyyy')}
          </div>
          <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
            <span className="flex justify-between">Baseado no tempo: <span>{format(data.timeBasedEndDate, 'dd/MM/yyyy')}</span></span>
            <span className="flex justify-between">Baseado na temp.: <span>{format(data.temperatureBasedEndDate, 'dd/MM/yyyy')}</span></span>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default TCLifespanCards;