
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { mapEquipmentToDisplay, getEquipmentHistory, formatHealthHistory } from '@/utils/equipmentDataMapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, Settings, Info, History, ArrowLeft, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';
import HealthHistoryGraph from '@/components/equipment/HealthHistoryGraph';
import { logger } from '@/lib/debugLogger';

const EquipmentDetails = ({ equipmentId, onBack }) => {
  const [equipment, setEquipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEquipment = useCallback(async () => {
    if (!equipmentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: eqError } = await supabase
        .from('equipments')
        .select(`
          *,
          equipment_types(id, name),
          equipment_api_config(
            horas_operacao, 
            ponto_quente_externo, 
            temperatura_ambiente, 
            vida_util_isolamento_h, 
            estrategia_envelhecimento, 
            tangente_perdas, 
            corrente_primario, 
            temp_ref, 
            vida_ref_anos, 
            p,
            temperatura_hotspot_inferida
          )
        `)
        .eq('id', equipmentId)
        .maybeSingle();

      if (eqError) {
        logger.error('EquipmentDetails', 'Error fetching equipment', eqError);
        throw eqError;
      }
      
      if (!data) {
        logger.warn('EquipmentDetails', `Equipment with ID ${equipmentId} not found`);
        throw new Error('Equipamento não encontrado.');
      }

      if (!data.equipment_api_config || (Array.isArray(data.equipment_api_config) && data.equipment_api_config.length === 0)) {
        logger.warn('EquipmentDetails', `Missing equipment_api_config for ID ${equipmentId}. Using defaults.`);
        data.equipment_api_config = [{
          horas_operacao: 0,
          ponto_quente_externo: 25,
          temperatura_ambiente: 25,
          vida_util_isolamento_h: 219150,
          estrategia_envelhecimento: 'pior_caso',
          tangente_perdas: 0,
          corrente_primario: 0,
          temp_ref: 85,
          vida_ref_anos: 25,
          p: 8,
          temperatura_hotspot_inferida: null
        }];
      } else if (!Array.isArray(data.equipment_api_config)) {
        data.equipment_api_config = [data.equipment_api_config];
      }

      const rawConfig = data.equipment_api_config[0] || {};
      logger.info('EquipmentDetails', 'Raw DB response hotspot values:', {
        temperatura_hotspot_inferida: rawConfig.temperatura_hotspot_inferida,
        ponto_quente_externo: rawConfig.ponto_quente_externo
      });

      const mappedData = mapEquipmentToDisplay(data);
      mappedData.rawPayload = data;
      
      logger.info('EquipmentDetails', 'Mapped equipment hotspot values:', {
        temperaturaHotspotInferida: mappedData.apiConfig?.temperaturaHotspotInferida,
        pontoQuenteExterno: mappedData.apiConfig?.pontoQuenteExterno
      });

      setEquipment(mappedData);

      const historyData = await getEquipmentHistory(equipmentId, 10);
      setHistory(formatHealthHistory(historyData));

    } catch (err) {
      logger.error('EquipmentDetails', 'Error fetching equipment details', err);
      setError(err.message || 'Erro ao carregar detalhes do equipamento.');
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const statusInfo = useMemo(() => {
    if (!equipment) return { status: 'Desconhecido', color: '#94a3b8', percentage: 0 };
    return equipment.health || calculateEquipmentHealth({
      ...equipment.rawPayload,
      api_config: equipment.apiConfig
    });
  }, [equipment]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Carregando equipamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="bg-destructive/10 p-4 rounded-full">
          <Activity className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold">Erro ao carregar equipamento</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={onBack}>Voltar</Button>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="bg-muted p-4 rounded-full">
          <Info className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold">Equipamento não encontrado</h3>
        <p className="text-muted-foreground">Os dados solicitados não estão disponíveis.</p>
        <Button variant="outline" onClick={onBack}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{equipment.name}</h1>
          <p className="text-muted-foreground">{equipment.type} • {equipment.location}</p>
        </div>
      </div>

      {/* Temporarily visible debug section */}
      <div className="bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 p-4 rounded-lg text-sm text-yellow-900 dark:text-yellow-200">
        <h4 className="font-bold mb-3 flex items-center gap-2">
          <Bug className="w-4 h-4"/> 
          Debug: Valores de Hotspot mapeados
        </h4>
        <ul className="space-y-2 font-mono bg-yellow-50 dark:bg-yellow-900/60 p-3 rounded border border-yellow-200 dark:border-yellow-800">
          <li>
            <strong>temperaturaHotspotInferida (ML):</strong>{' '}
            {equipment.apiConfig?.temperaturaHotspotInferida != null 
              ? <span className="text-green-700 dark:text-green-400">{Number(equipment.apiConfig.temperaturaHotspotInferida).toFixed(2)} °C</span> 
              : <span className="text-muted-foreground">null</span>}
          </li>
          <li>
            <strong>pontoQuenteExterno (Manual/Base):</strong>{' '}
            {equipment.apiConfig?.pontoQuenteExterno != null 
              ? <span className="text-blue-700 dark:text-blue-400">{Number(equipment.apiConfig.pontoQuenteExterno).toFixed(2)} °C</span> 
              : <span className="text-muted-foreground">null</span>}
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> 
              Índice de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-6">
              <div className="flex flex-col items-center">
                <span className="text-6xl font-black" style={{ color: statusInfo.color }}>
                  {statusInfo.percentage.toFixed(1)}%
                </span>
                <Badge 
                  variant="outline" 
                  className="mt-2 text-white border-none" 
                  style={{ backgroundColor: statusInfo.color }}
                >
                  {statusInfo.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="bg-secondary/50 p-3 rounded-lg flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Vida Remanescente</span>
                  <span className="text-lg font-bold">{(statusInfo.vidaRemanescenteAnos || 0).toFixed(1)} anos</span>
                </div>
                <div className="bg-secondary/50 p-3 rounded-lg flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Fat. Aceleração</span>
                  <span className={`text-lg font-bold ${(statusInfo.fatorAceleracao || 1) > 1 ? 'text-destructive' : 'text-primary'}`}>
                    {(statusInfo.fatorAceleracao || 1.0).toFixed(2)}x
                  </span>
                </div>
                <div className="bg-secondary/50 p-3 rounded-lg flex flex-col col-span-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Estratégia Usada</span>
                  <span className="text-sm font-bold capitalize">{statusInfo.estrategiaUsada || 'Desconhecido'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> 
              Informações Cadastrais
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Nome</span>
                <span className="text-sm font-semibold">{equipment.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Tipo</span>
                <span className="text-sm font-semibold">{equipment.type}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Status</span>
                <span className="text-sm font-semibold">{statusInfo.status}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Localização</span>
                <span className="text-sm font-semibold">{equipment.location}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Cidade/Estado</span>
                <span className="text-sm font-semibold">
                  {equipment.city !== 'N/A' && equipment.state !== 'N/A' 
                    ? `${equipment.city}/${equipment.state}` 
                    : 'N/A'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Data de Instalação</span>
                <span className="text-sm font-semibold">{equipment.installationDate}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Vida Útil Projetada</span>
                <span className="text-sm font-semibold">{equipment.equipmentLifespan} anos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> 
              Configuração e Parâmetros
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="border border-border/50 bg-card p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">Horas Operação</span>
                <span className="text-base font-bold mt-1">{(equipment.apiConfig?.horasOperacao ?? 0).toLocaleString()}h</span>
              </div>
              <div className="border border-border/50 bg-card p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">Temp. Hotspot Interna</span>
                <span className="text-base font-bold mt-1 text-primary">
                  {equipment.apiConfig?.temperaturaHotspotInferida != null
                    ? `${Number(equipment.apiConfig.temperaturaHotspotInferida).toFixed(1)} °C`
                    : equipment.apiConfig?.pontoQuenteExterno != null
                      ? `${Number(equipment.apiConfig.pontoQuenteExterno).toFixed(1)} °C`
                      : '—'}
                </span>
              </div>
              <div className="border border-border/50 bg-card p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">Temp. Ambiente</span>
                <span className="text-base font-bold mt-1">{(equipment.apiConfig?.temperaturaAmbiente ?? 25).toFixed(1)}°C</span>
              </div>
              <div className="border border-border/50 bg-card p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">Vida Isolamento</span>
                <span className="text-base font-bold mt-1">{(equipment.apiConfig?.vidaUtilIsolamentoH ?? 219150).toLocaleString()}h</span>
              </div>
              <div className="border border-border/50 bg-card p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">Tangente Perdas</span>
                <span className="text-base font-bold mt-1">{equipment.apiConfig?.tangentePerdas ?? 0}</span>
              </div>
              <div className="border border-border/50 bg-card p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">Corrente Primário</span>
                <span className="text-base font-bold mt-1">{equipment.apiConfig?.correntePrimario ?? 0}A</span>
              </div>
              <div className="border border-border/50 bg-card p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">Temp. Ref.</span>
                <span className="text-base font-bold mt-1">{equipment.apiConfig?.tempRef ?? 85}°C</span>
              </div>
              <div className="border border-border/50 bg-card p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">Vida Ref.</span>
                <span className="text-base font-bold mt-1">{equipment.apiConfig?.vidaRefAnos ?? 25} anos</span>
              </div>
              <div className="border border-border/50 bg-card p-3 rounded-lg flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">Constante P</span>
                <span className="text-base font-bold mt-1">{equipment.apiConfig?.p ?? 8}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> 
              Histórico de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <HealthHistoryGraph 
              equipment={{
                ...equipment.rawPayload, 
                health: equipment.health,
                api_config: equipment.apiConfig
              }} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EquipmentDetails;
