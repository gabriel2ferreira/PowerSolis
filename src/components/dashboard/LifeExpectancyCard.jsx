
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Calendar, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';

const LifeExpectancyCard = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.equipment) return null;

  const {
    equipment,
    installation_date,
    is_future_install,
    lifespan_years
  } = data;

  const healthData = calculateEquipmentHealth(equipment);
  const health = healthData.percentage;
  const remainingYears = healthData.vidaRemanescenteAnos;
  const accelFactor = healthData.fatorAceleracao;

  const getHealthColorClass = (val) => {
    if (val >= 80) return 'text-green-500';
    if (val >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBarClass = (val) => {
    if (val >= 80) return 'bg-green-500';
    if (val >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const fAStatus = {
    color: accelFactor > 1.0 ? 'red' : 'green',
    status: accelFactor > 1.0 ? 'Crítico' : 'Normal'
  };

  return (
    <Card className="h-full border-border">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{equipment.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{equipment.typeName || 'Equipamento'}</p>
          </div>
          <Badge className="text-sm px-3 py-1" style={{ backgroundColor: healthData.color, color: 'white' }}>
            {healthData.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Instalação
            </p>
            <p className="font-medium">
              {!installation_date ? 'Data não informada' : is_future_install ? 'Não instalado' : new Date(installation_date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Vida Remanescente
            </p>
            <p className="font-medium">{remainingYears.toFixed(1)} anos</p>
          </div>
        </div>

        {installation_date && !is_future_install && (
          <>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Saúde Atual</span>
                <span className={`text-xl font-bold ${getHealthColorClass(health)}`}>
                  {health.toFixed(1)}%
                </span>
              </div>
              
              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${getHealthBarClass(health)}`}
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>

            {/* Acceleration Factor Card */}
            <div className={`p-4 rounded-lg border flex flex-col gap-2 ${
              fAStatus.color === 'green' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
              fAStatus.color === 'yellow' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
              'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Fator de Aceleração (fA)
                </span>
                {accelFactor > 1.0 ? <TrendingUp className="w-4 h-4 text-red-500" /> : <TrendingDown className="w-4 h-4 text-green-500" />}
              </div>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-bold">{accelFactor.toFixed(2)}</span>
                <Badge variant="outline" className={`font-semibold ${
                  fAStatus.color === 'green' ? 'text-green-700 border-green-300 dark:text-green-400 dark:border-green-800' :
                  fAStatus.color === 'yellow' ? 'text-yellow-700 border-yellow-300 dark:text-yellow-400 dark:border-yellow-800' :
                  'text-red-700 border-red-300 dark:text-red-400 dark:border-red-800'
                }`}>
                  {fAStatus.status}
                </Badge>
              </div>
            </div>
          </>
        )}

        {!installation_date && (
          <div className="text-center p-6 bg-muted/30 rounded-lg text-sm text-muted-foreground border border-dashed">
            Configure a data de instalação deste equipamento para acompanhar a saúde e degradação.
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default LifeExpectancyCard;
