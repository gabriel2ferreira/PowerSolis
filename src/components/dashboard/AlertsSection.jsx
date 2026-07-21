import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const AlertsSection = ({ alerts, loading }) => {
  return (
    <Card className="mt-6 border-destructive/20 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          Alertas de Ações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground flex flex-col items-center">
            <Clock className="w-8 h-8 mb-2 opacity-50" />
            <p>Nenhum alerta crítico no momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border border-border rounded-md shadow-sm gap-4"
              >
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    {alert.name}
                    <Badge variant="destructive" className="text-[10px] uppercase">{alert.status}</Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vida útil restante: <span className="font-bold text-destructive">{alert.vida_util}%</span>
                  </p>
                </div>
                <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md font-medium shrink-0 text-center">
                  {alert.action}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsSection;