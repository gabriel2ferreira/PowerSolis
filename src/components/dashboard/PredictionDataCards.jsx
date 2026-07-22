import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTo2Decimals } from '@/utils/lifecycleCalculations';

const PredictionDataCards = ({ remainingYears, failureProbability, loading }) => {
  
  const getProbabilityColor = (prob) => {
    if (prob >= 35) return 'text-[hsl(var(--destructive))]';
    if (prob >= 15) return 'text-[hsl(var(--warning))]';
    return 'text-[hsl(var(--success))]';
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-muted-foreground">Vida Útil Restante</h4>
            <div className="p-2 bg-muted/50 rounded-md">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-10 w-24" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={remainingYears}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-3xl font-bold text-[hsl(var(--success))]">
                  {remainingYears !== null ? `${formatTo2Decimals(remainingYears)} Anos` : '--'}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Estimativa baseada no modelo de Montsinger
                </p>
              </motion.div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-muted-foreground">Probabilidade de Falha</h4>
            <div className="p-2 bg-muted/50 rounded-md">
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-10 w-20" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={failureProbability}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2">
                  <div className={`text-3xl font-bold ${getProbabilityColor(failureProbability)}`}>
                    {failureProbability !== null ? `${formatTo2Decimals(failureProbability)}%` : '--'}
                  </div>
                  {failureProbability >= 35 ? (
                    <AlertTriangle className={`w-6 h-6 ${getProbabilityColor(failureProbability)}`} />
                  ) : failureProbability !== null ? (
                    <ShieldCheck className={`w-6 h-6 ${getProbabilityColor(failureProbability)}`} />
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Risco calculado para o período atual
                </p>
              </motion.div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionDataCards;