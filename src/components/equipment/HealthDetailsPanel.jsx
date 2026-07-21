import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, ShieldAlert, Thermometer, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HealthDetailsPanel = ({ data, isLoading }) => {
  if (isLoading) return <div className="p-8 text-center animate-pulse">Carregando detalhes...</div>;

  const { currentHealth, currentLOL, averageTemp, peakTemp, minTemp, lastReadingDate, standard } = data;

  const getStatus = (health) => {
    if (health <= 0) return { label: 'Fim de Vida', variant: 'destructive', color: 'text-red-500' };
    if (health < 25) return { label: 'Crítico', variant: 'destructive', color: 'text-red-500' };
    if (health < 50) return { label: 'Atenção', variant: 'secondary', color: 'text-orange-500' };
    return { label: 'Normal', variant: 'default', color: 'text-green-500' };
  };

  const status = getStatus(currentHealth);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Saúde Atual do Ativo
          </CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </CardHeader>
        <CardContent>
          <div className="mt-4 flex flex-col items-center justify-center py-6 border-b border-border">
            <span className={`text-6xl font-extrabold ${status.color}`}>
              {currentHealth.toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground mt-2">Perda de Vida (LOL): {currentLOL.toFixed(2)}%</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
            <div>
              <p className="text-muted-foreground">Padrão Utilizado</p>
              <p className="font-semibold">{standard === 'IEEE' ? 'IEEE C57.91-2011' : 'IEC 60076-7'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Última Leitura</p>
              <p className="font-semibold">{lastReadingDate ? format(lastReadingDate, 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-500" />
            Estatísticas de Temperatura (30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 mt-4">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium flex items-center gap-2"><Thermometer className="w-4 h-4 text-red-500"/> Pico (Hot-Spot)</span>
              <span className="text-xl font-bold">{peakTemp.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium flex items-center gap-2"><Thermometer className="w-4 h-4 text-yellow-500"/> Média</span>
              <span className="text-xl font-bold">{averageTemp.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium flex items-center gap-2"><Thermometer className="w-4 h-4 text-blue-500"/> Mínima</span>
              <span className="text-xl font-bold">{minTemp.toFixed(1)}°C</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthDetailsPanel;