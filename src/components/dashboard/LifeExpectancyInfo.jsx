import React, { useState, useEffect } from 'react';
import { Activity, Clock, CalendarRange, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import AccelerationFactorCard from './AccelerationFactorCard';
import ComparisonModesCard from './ComparisonModesCard';
import { formatTo2Decimals, getClosestEndOfLifeDate } from '@/utils/lifecycleCalculations';
import { getEquipmentStatus } from '@/utils/equipmentStatus';

const InfoCard = ({ title, value, subtitle, icon: Icon, colorClass, highlight = false, customColor }) => (
  <div className={`p-4 rounded-xl border flex flex-col gap-2 ${highlight ? 'bg-muted/30 shadow-sm' : 'bg-card'}`} style={highlight && customColor ? { borderColor: `${customColor}33` } : {}}>
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <Icon className="w-4 h-4" style={{ color: customColor }} />
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-bold" style={{ color: customColor }}>{value}</span>
      {subtitle && <span className="text-xs text-muted-foreground mt-1">{subtitle}</span>}
    </div>
  </div>
);

const LifeExpectancyInfo = ({ equipment, curveData }) => {
  const [fA, setFA] = useState(null);
  
  useEffect(() => {
    if (equipment?.id) {
      supabase.from('equipment_data_history')
        .select('acceleration_factor')
        .eq('equipment_id', equipment.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) setFA(data.acceleration_factor);
        });
    }
  }, [equipment]);

  if (!equipment) return null;

  const installDate = equipment.installation_date ? new Date(equipment.installation_date) : null;
  const lifespanYears = equipment.equipment_lifespan || equipment.lifespan_years || 25;
  const hoursBasedDate = installDate ? new Date(installDate.getTime() + lifespanYears * 365.25 * 24 * 60 * 60 * 1000) : null;
  const healthBasedDate = curveData?.find(d => d.health <= 0)?.date || null;
  const closestEol = getClosestEndOfLifeDate(healthBasedDate, hoursBasedDate);

  const { status, color, healthPercentage } = getEquipmentStatus(equipment);

  return (
    <div className="space-y-4">
      {status !== 'Bom' && (
        <div className="p-4 rounded-lg flex items-center gap-3 font-medium bg-muted" style={{ borderLeft: `4px solid ${color}` }}>
          <AlertTriangle className="w-5 h-5" style={{ color }} />
          <p>O equipamento está operando em nível de <strong style={{ color }}>{status}</strong>. Planeje ações de manutenção.</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard 
          title="Saúde Atual" 
          value={`${formatTo2Decimals(healthPercentage)}%`} 
          subtitle={`Status: ${status}`}
          icon={Activity} 
          customColor={color}
          highlight
        />
        
        <AccelerationFactorCard fA={fA !== null ? fA : 1.0} />
        
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          <InfoCard 
            title="Previsão de Fim de Vida Útil" 
            value={closestEol.date ? format(new Date(closestEol.date), 'dd/MM/yyyy') : 'N/A'} 
            subtitle={`Baseado em [${closestEol.reason}]`}
            icon={CalendarRange} 
            customColor="var(--primary)"
            highlight
          />
        </div>
      </div>
      
      <div className="mt-4">
        <ComparisonModesCard equipmentId={equipment.id} />
      </div>
    </div>
  );
};

export default LifeExpectancyInfo;