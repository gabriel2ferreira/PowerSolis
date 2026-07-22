
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Info, Settings, Wrench, Activity, FileText, CheckCircle, Calculator, Gauge, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getEquipmentWithAllData } from '@/utils/equipmentDataMapper';
import { saveEquipmentHealthHistory } from '@/services/equipmentHealthSync';
import { checkAndCreateAlert } from '@/services/equipmentAlertService';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';
import { logMaintenanceHistory, getCurrentUser } from '@/utils/maintenanceLogger';
import { inferirTemperaturaHotspot } from '@/services/hotspotInferenceService';
import { logger } from '@/lib/debugLogger';
import { saveHotspotHistory } from '@/services/hotspotHistoryService';
import { saveAccelerationFactorHistory } from '@/services/accelerationFactorHistoryService';

const CUSTOM_FIELDS_KEYS = [
  'sapid', 'voltage', 'current', 'power', 'frequency', 
  'temperature_limits', 'cooling_type', 'current_limits', 'voltage_limits', 
  'efficiency', 'power_factor', 'description'
];

const EditEquipmentModal = ({ isOpen, onClose, equipment, onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [types, setTypes] = useState([]);
  const [originalData, setOriginalData] = useState(null);
  const [initialFormData, setInitialFormData] = useState(null);
  
  const scrollContainerRef = useRef(null);
  const scrollPosRef = useRef(0);

  const [previewData, setPreviewData] = useState(null);
  const [hotspotInferido, setHotspotInferido] = useState(null);
  const [hotspotLoading, setHotspotLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', equipment_type_id: '', model: '', serial_number: '', sapid: '',
    voltage_level: '', phase: '', location_name: '', city: '', state: '',
    latitude: '', longitude: '', substation_id: '', installation_date: '', temperature: '',
    voltage: '', current: '', power: '', frequency: '', status: '',
    lifespan_years: '', equipment_lifespan: '', temperature_limits: '',
    cooling_type: '', current_limits: '', voltage_limits: '', efficiency: '',
    power_factor: '', observations: '', description: '', manufacturer: '',
    tangente_perdas: '', corrente_primario: '', temperatura_ambiente: '',
    horas_operacao: '', temp_ref: '', vida_ref_anos: '', p: '',
    ponto_quente_externo: '', estrategia_envelhecimento: 'pior_caso', vida_util_isolamento_h: '',
    temperatura_hotspot_inferida: ''
  });

  useEffect(() => {
    const fetchTypes = async () => {
      const { data, error } = await supabase.from('equipment_types').select('id, name');
      if (error) logger.error('EditEquipmentModal', 'Error fetching types', error);
      if (data) setTypes(data);
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!equipment || !isOpen) return;
      setInitialLoading(true);
      try {
        const fullData = await getEquipmentWithAllData(equipment.id);
        setOriginalData(fullData);

        const cfMap = fullData.custom_fields || {};
        let apiConf = fullData.api_config;
        
        if (!apiConf) {
          logger.warn('EditEquipmentModal', `Missing API Config for ID ${equipment.id}. Using defaults.`);
          apiConf = {};
        }

        const loadedFormData = {
          name: fullData.name || '',
          equipment_type_id: fullData.equipment_type_id || '',
          model: cfMap.model || '',
          serial_number: cfMap.serial_number || '',
          sapid: cfMap.sapid || '',
          voltage_level: fullData.voltage_level || '',
          phase: fullData.phase || '',
          location_name: fullData.location_name || '',
          city: fullData.city || '',
          state: fullData.state || '',
          latitude: fullData.latitude || '',
          longitude: fullData.longitude || '',
          substation_id: fullData.substation_id || '',
          installation_date: fullData.installation_date ? fullData.installation_date.split('T')[0] : '',
          temperature: fullData.temperature || '',
          voltage: cfMap.voltage || '',
          current: cfMap.current || '',
          power: cfMap.power || '',
          frequency: cfMap.frequency || '',
          status: fullData.status || '',
          lifespan_years: fullData.lifespan_years || '',
          equipment_lifespan: fullData.equipment_lifespan || '',
          temperature_limits: cfMap.temperature_limits || '',
          cooling_type: cfMap.cooling_type || '',
          current_limits: cfMap.current_limits || '',
          voltage_limits: cfMap.voltage_limits || '',
          efficiency: cfMap.efficiency || '',
          power_factor: cfMap.power_factor || '',
          observations: fullData.observations || '',
          description: cfMap.description || '',
          manufacturer: cfMap.manufacturer || '',
          tangente_perdas: apiConf.tangente_perdas || '0',
          corrente_primario: apiConf.corrente_primario || '0',
          temperatura_ambiente: apiConf.temperatura_ambiente || '25',
          horas_operacao: apiConf.horas_operacao !== undefined ? apiConf.horas_operacao : '0',
          temp_ref: apiConf.temp_ref || '85',
          vida_ref_anos: apiConf.vida_ref_anos || '25',
          p: apiConf.p || '8',
          ponto_quente_externo: apiConf.ponto_quente_externo || '25',
          estrategia_envelhecimento: apiConf.estrategia_envelhecimento || 'pior_caso',
          vida_util_isolamento_h: apiConf.vida_util_isolamento_h || (25 * 365.25 * 24),
          temperatura_hotspot_inferida: apiConf.temperatura_hotspot_inferida || ''
        };

        if (apiConf.temperatura_hotspot_inferida != null) {
          setHotspotInferido(apiConf.temperatura_hotspot_inferida);
        }

        setFormData(loadedFormData);
        setInitialFormData(loadedFormData);
      } catch (err) {
        logger.error('EditEquipmentModal', 'Error loading equipment data', err);
        toast({ title: 'Erro', description: 'Erro ao carregar dados do equipamento.', variant: 'destructive' });
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, [equipment, isOpen, toast]);

  useEffect(() => {
  const fetchHours = async () => {
    if (!equipment?.id || !isOpen) return;
    try {
      const { data: eq } = await supabase
        .from('equipments')
        .select('installation_date')
        .eq('id', equipment.id)
        .maybeSingle();

      if (eq?.installation_date) {
        const dataInstalacao = new Date(eq.installation_date);
        const agora = new Date();

        const anoInstalacao = dataInstalacao.getFullYear();
        if (anoInstalacao < 2000 || dataInstalacao > agora) {
          logger.warn('EditEquipmentModal', 'installation_date inválida, ignorando cálculo de horas', {
            installation_date: eq.installation_date,
            anoInstalacao
          });
          return;
        }

        const diffMs = agora.getTime() - dataInstalacao.getTime();
        const horasCalculadas = Math.floor(diffMs / (1000 * 60 * 60));

        await supabase
          .from('equipment_api_config')
          .update({ horas_operacao: horasCalculadas })
          .eq('equipment_id', equipment.id);

        setFormData(prev => ({ ...prev, horas_operacao: horasCalculadas.toString() }));
        return;
      }

      const { data: apiConfig, error } = await supabase
        .from('equipment_api_config')
        .select('horas_operacao')
        .eq('equipment_id', equipment.id)
        .maybeSingle();

      if (error) {
        logger.error('EditEquipmentModal', 'Error loading operating hours', error);
        return;
      }
      if (apiConfig && apiConfig.horas_operacao !== undefined && apiConfig.horas_operacao !== null) {
        setFormData(prev => ({ ...prev, horas_operacao: apiConfig.horas_operacao.toString() }));
      }
    } catch (err) {
      logger.error('EditEquipmentModal', 'Failed to fetch operating hours', err);
    }
  };

  if (isOpen) {
    fetchHours();
  }
}, [equipment?.id, isOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const tp = parseFloat(formData.tangente_perdas);
      const cp = parseFloat(formData.corrente_primario);
      const ta = parseFloat(formData.temperatura_ambiente);
      const pqe = parseFloat(formData.ponto_quente_externo);

      let finalHotspot = null;

      if (tp > 0 && cp > 0 && !isNaN(ta) && ta !== null && !isNaN(pqe) && pqe !== null) {
        setHotspotLoading(true);
        logger.info('EditEquipmentModal', 'Calling inferirTemperaturaHotspot with valid params');
        
        try {
          const inferred = await inferirTemperaturaHotspot({
            tangente_perdas: tp,
            corrente_primario: cp,
            temperatura_ambiente: ta,
            ponto_quente_externo: pqe
          });
          
          if (inferred !== null && !isNaN(inferred)) {
            setHotspotInferido(inferred);
            finalHotspot = inferred;
            logger.info('EditEquipmentModal', 'Hotspot inferred successfully', { inferred });
          } else {
            logger.warn('EditEquipmentModal', 'Inferred hotspot is null or NaN');
            setHotspotInferido(null);
          }
        } catch (err) {
          logger.error('EditEquipmentModal', 'Error during hotspot inference', err);
          setHotspotInferido(null);
        } finally {
          setHotspotLoading(false);
        }
      } else {
        logger.warn('EditEquipmentModal', 'Incomplete parameters for hotspot inference');
        setHotspotInferido(null);
      }

      const tempEq = { 
        api_config: {
          ...formData,
          temperatura_hotspot_inferida: finalHotspot != null ? finalHotspot : formData.ponto_quente_externo
        }
      };
      
      const result = calculateEquipmentHealth(tempEq);
      setPreviewData(result);
    }, 500);

    return () => clearTimeout(timer);
  }, [
    formData.horas_operacao, formData.ponto_quente_externo, formData.estrategia_envelhecimento,
    formData.vida_util_isolamento_h, formData.tangente_perdas, formData.corrente_primario,
    formData.temperatura_ambiente, formData.temp_ref, formData.vida_ref_anos, formData.p
  ]);

  useLayoutEffect(() => {
    if (scrollContainerRef.current && !initialLoading) {
      scrollContainerRef.current.scrollTop = scrollPosRef.current;
    }
  }, [formData, initialLoading, previewData]);

  const handleChange = (field, value) => {
    if (scrollContainerRef.current) scrollPosRef.current = scrollContainerRef.current.scrollTop;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.equipment_type_id || !formData.status) {
      toast({ title: 'Campos Obrigatórios', description: 'Preencha Nome, Tipo e Status.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const updatePayload = {
        name: formData.name,
        equipment_type_id: formData.equipment_type_id,
        phase: formData.phase,
        location_name: formData.location_name,
        city: formData.city,
        state: formData.state,
        substation_id: formData.substation_id,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        installation_date: formData.installation_date ? new Date(formData.installation_date).toISOString() : null,
        voltage_level: formData.voltage_level,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        equipment_lifespan: formData.equipment_lifespan ? parseInt(formData.equipment_lifespan, 10) : null,
        status: formData.status,
        lifespan_years: formData.lifespan_years ? parseFloat(formData.lifespan_years) : null,
        observations: formData.observations,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('equipments').update(updatePayload).eq('id', equipment.id);
      if (error) throw error;

      const allCustomKeys = [...CUSTOM_FIELDS_KEYS, 'model', 'serial_number', 'manufacturer'];
      for (const key of allCustomKeys) {
        if (formData[key] !== undefined) {
          const oldVal = originalData?.custom_fields?.[key] || '';
          if (formData[key] !== oldVal) {
            const { data: existingField, error: fieldFetchErr } = await supabase.from('custom_fields')
              .select('id').eq('equipment_id', equipment.id).eq('field_name', key).maybeSingle();

            if (fieldFetchErr) {
              logger.error('EditEquipmentModal', `Error fetching custom field ${key}`, fieldFetchErr);
              throw fieldFetchErr;
            }

            if (existingField) {
              const { error: upErr } = await supabase.from('custom_fields').update({ observations: formData[key] }).eq('id', existingField.id);
              if (upErr) throw upErr;
            } else if (formData[key]) {
              const { error: inErr } = await supabase.from('custom_fields').insert({
                equipment_id: equipment.id, field_name: key, field_type: 'text', observations: formData[key]
              });
              if (inErr) throw inErr;
            }
          }
        }
      }

      const apiPayload = {
        tangente_perdas: formData.tangente_perdas ? parseFloat(formData.tangente_perdas) : 0,
        corrente_primario: formData.corrente_primario ? parseFloat(formData.corrente_primario) : 0,
        temperatura_ambiente: formData.temperatura_ambiente ? parseFloat(formData.temperatura_ambiente) : 25,
        horas_operacao: formData.horas_operacao ? parseFloat(formData.horas_operacao) : 0,
        temp_ref: formData.temp_ref ? parseFloat(formData.temp_ref) : 85,
        vida_ref_anos: formData.vida_ref_anos ? parseFloat(formData.vida_ref_anos) : 25,
        p: formData.p ? parseFloat(formData.p) : 8,
        ponto_quente_externo: formData.ponto_quente_externo ? parseFloat(formData.ponto_quente_externo) : 25,
        estrategia_envelhecimento: formData.estrategia_envelhecimento || 'pior_caso',
        vida_util_isolamento_h: formData.vida_util_isolamento_h ? parseFloat(formData.vida_util_isolamento_h) : (25 * 365.25 * 24),
        temperatura_hotspot_inferida: hotspotInferido != null ? parseFloat(hotspotInferido) : null
      };

      logger.info('EditEquipmentModal', 'Saving equipment API config with hotspot', { temperatura_hotspot_inferida: apiPayload.temperatura_hotspot_inferida });

      const { data: existingApi, error: apiFetchErr } = await supabase.from('equipment_api_config')
        .select('id').eq('equipment_id', equipment.id).maybeSingle();

      if (apiFetchErr) {
        logger.error('EditEquipmentModal', 'Error fetching api config', apiFetchErr);
        throw apiFetchErr;
      }

      if (existingApi) {
        const { error: apiUpErr } = await supabase.from('equipment_api_config').update(apiPayload).eq('equipment_id', equipment.id);
        if (apiUpErr) throw apiUpErr;
      } else {
        const { error: apiInErr } = await supabase.from('equipment_api_config').insert({ equipment_id: equipment.id, ...apiPayload });
        if (apiInErr) throw apiInErr;
      }

      const updatedEquipmentFull = { ...updatePayload, api_config: apiPayload };
      await saveEquipmentHealthHistory(equipment.id, updatedEquipmentFull, apiPayload);

      const healthCalc = calculateEquipmentHealth(updatedEquipmentFull);
      await checkAndCreateAlert(equipment.id, healthCalc.status);

      // Save history for Hotspot and Acceleration Factor
      try {
        if (apiPayload.temperatura_hotspot_inferida != null && !isNaN(apiPayload.temperatura_hotspot_inferida)) {
          await saveHotspotHistory(equipment.id, apiPayload.temperatura_hotspot_inferida);
        }
        if (healthCalc && healthCalc.fatorAceleracao != null && !isNaN(healthCalc.fatorAceleracao)) {
          await saveAccelerationFactorHistory(equipment.id, healthCalc.fatorAceleracao);
        }
      } catch (histErr) {
        logger.warn('EditEquipmentModal', 'Failed to save history metrics', histErr);
      }

      // Log de histórico de manutenção
      const changedFields = [];
      const observacoesLinhas = [];

      if (initialFormData) {
        const keysToIgnore = ['temperatura_hotspot_inferida'];
        for (const key in formData) {
          if (keysToIgnore.includes(key)) continue;
          const valorNovo = String(formData[key] ?? '').trim();
          const valorAntigo = String(initialFormData[key] ?? '').trim();
          if (valorNovo !== valorAntigo) {
            changedFields.push(key);
            observacoesLinhas.push(`- ${key}: "${valorAntigo}" → "${valorNovo}"`);
          }
        }
      }

      if (changedFields.length > 0) {
        try {
          const currentUserInfo = await getCurrentUser();
          const logResult = await logMaintenanceHistory({
            equipment_id: equipment.id,
            tipo_manutencao: 'Modificação de Dados',
            descricao: `Campos atualizados: ${changedFields.join(', ')}`,
            tecnico_responsavel: currentUserInfo,
            observacoes: observacoesLinhas.join('\n')
          });
          if (!logResult) {
            logger.warn('EditEquipmentModal', 'Maintenance log returned false — may not have been saved');
          }
        } catch (logErr) {
          logger.error('EditEquipmentModal', 'Error logging to maintenance history', logErr);
        }
      } else {
        logger.info('EditEquipmentModal', 'No changes detected — maintenance log skipped');
      }

      toast({ title: 'Sucesso', description: 'Equipamento atualizado com sucesso.' });
      onSuccess();
      onClose();

    } catch (error) {
      logger.error('EditEquipmentModal', 'Failed to update equipment', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar o equipamento.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }; 

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-muted/20">
        <DialogHeader className="p-6 border-b bg-background shadow-sm z-10 shrink-0 flex flex-row items-start justify-between">
          <div>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              {formData.name || 'Editar Equipamento'}
              {!initialLoading && previewData && (
                <Badge style={{ backgroundColor: previewData.color }} className="text-white">
                  {previewData.status || 'Status'}
                </Badge>
              )}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Edite as informações cadastrais e parâmetros operacionais do equipamento.</p>
          </div>
        </DialogHeader>
        
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {initialLoading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6 pb-6">
              <Card className="shadow-sm border-amber-200">
                <CardHeader className="bg-amber-50/50 dark:bg-amber-900/10 pb-4 border-b flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg text-amber-600 dark:text-amber-400"><Calculator className="w-5 h-5" /> Prévia de Saúde em Tempo Real (pior caso)</CardTitle>
                    <CardDescription className="mt-1 text-amber-700/80 dark:text-amber-300/80">O cálculo é atualizado conforme você altera os dados abaixo.</CardDescription>
                  </div>
                  <div className="w-full sm:w-64">
                    <Select value={formData.estrategia_envelhecimento} onValueChange={v => handleChange('estrategia_envelhecimento', v)}>
                      <SelectTrigger className="border-amber-300 focus:ring-amber-500"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tempo">Tempo (Convencional)</SelectItem>
                        <SelectItem value="faa">FAA (Térmico)</SelectItem>
                        <SelectItem value="pior_caso">Pior Caso (Conservador)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {previewData ? (() => {
                    const vidaRefAnos = parseFloat(formData.vida_ref_anos) || 25;
                    const percentageVisual = Math.max(
                      0,
                      Math.min((previewData.vidaRemanescenteAnos / vidaRefAnos) * 100, 100)
                    );
                    return (
                      <div className="rounded-lg bg-card border p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Saúde Final</p>
                            <p className="text-2xl font-bold" style={{ color: previewData.color }}>
                              {percentageVisual.toFixed(1)}%
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Anos Restantes</p>
                            <p className="text-xl font-medium">
                              {previewData.vidaRemanescenteAnos.toFixed(1)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Estratégia</p>
                            <p className="text-sm font-medium capitalize mt-1 px-2 py-1 bg-muted rounded-md inline-block">
                              {previewData.estrategiaUsada}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Fator Aceleração</p>
                            <p className={`text-xl font-medium ${previewData.fatorAceleracao > 1 ? 'text-red-500' : 'text-green-500'}`}>
                              {previewData.fatorAceleracao.toFixed(2)}x
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="flex items-center justify-center p-4 text-muted-foreground animate-pulse">
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculando prévia de saúde...
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="bg-muted/40 pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg text-primary"><Info className="w-5 h-5" /> Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-2"><Label>Nome <span className="text-red-500">*</span></Label><Input value={formData.name} onChange={e => handleChange('name', e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Tipo <span className="text-red-500">*</span></Label>
                    <Select value={formData.equipment_type_id} onValueChange={v => handleChange('equipment_type_id', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status Manual</Label>
                    <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bom">Bom</SelectItem>
                        <SelectItem value="Atenção">Atenção</SelectItem>
                        <SelectItem value="Crítico">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Local de Instalação</Label><Input value={formData.location_name} onChange={e => handleChange('location_name', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Data de Instalação</Label><Input type="date" value={formData.installation_date} onChange={e => handleChange('installation_date', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Vida Útil Projetada (Anos)</Label><Input type="number" value={formData.equipment_lifespan} onChange={e => handleChange('equipment_lifespan', e.target.value)} /></div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-blue-200">
                <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-600 dark:text-blue-400"><Gauge className="w-5 h-5" /> Dados Operacionais</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label>Horas de Operação</Label>
                    <Input type="number" step="any" placeholder="0" value={formData.horas_operacao || ''} onChange={e => handleChange('horas_operacao', e.target.value)} />
                  </div>
                  <div className="space-y-2"><Label>Temp. Ambiente (°C)</Label><Input type="number" step="any" value={formData.temperatura_ambiente} onChange={e => handleChange('temperatura_ambiente', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Vida Isolamento (H)</Label><Input type="number" step="any" value={formData.vida_util_isolamento_h} onChange={e => handleChange('vida_util_isolamento_h', e.target.value)} /></div>
                    <div className="space-y-2"><Label>Temp. Máx. Externa (°C)</Label><Input type="number" step="any" value={formData.ponto_quente_externo} onChange={e => handleChange('ponto_quente_externo', e.target.value)} /></div>
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="flex items-center gap-2">
                      Temp. Hotspot Interna (°C)
                      <span className="text-xs text-muted-foreground font-normal">(calculado pelo modelo ML)</span>
                    </Label>
                    <div className="relative">
                      <div className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background cursor-default items-center">
                        {hotspotLoading ? (
                          <div className="flex items-center text-muted-foreground">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Calculando...
                          </div>
                        ) : hotspotInferido != null && !isNaN(hotspotInferido) ? (
                          <span className="text-primary font-medium">{Number(hotspotInferido).toFixed(2)} °C</span>
                        ) : (
                          <span className="text-muted-foreground">Preencha Tangente, Corrente e Temp. Ambiente</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="bg-muted/40 pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg text-primary"><Settings className="w-5 h-5" /> Configurações de API & Parâmetros Adicionais</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2"><Label>Tangente Perdas</Label><Input type="number" step="any" value={formData.tangente_perdas} onChange={e => handleChange('tangente_perdas', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Corrente Primário (A)</Label><Input type="number" step="any" value={formData.corrente_primario} onChange={e => handleChange('corrente_primario', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Temperatura Referência</Label><Input type="number" step="any" value={formData.temp_ref} onChange={e => handleChange('temp_ref', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Vida Referência (Anos)</Label><Input type="number" step="any" value={formData.vida_ref_anos} onChange={e => handleChange('vida_ref_anos', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Constante P</Label><Input type="number" step="any" value={formData.p} onChange={e => handleChange('p', e.target.value)} /></div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="bg-muted/40 pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg text-primary"><Wrench className="w-5 h-5" /> Especificações Técnicas e Campos Customizados</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                  {CUSTOM_FIELDS_KEYS.map(key => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                      {key === 'description' ? (
                        <Textarea rows={2} value={formData[key] || ''} onChange={e => handleChange(key, e.target.value)} />
                      ) : (
                        <Input value={formData[key] || ''} onChange={e => handleChange(key, e.target.value)} />
                      )}
                    </div>
                  ))}
                  <div className="space-y-2 md:col-span-3">
                    <Label>Observações Gerais</Label>
                    <Textarea rows={3} value={formData.observations} onChange={e => handleChange('observations', e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-blue-200">
                <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-600 dark:text-blue-400">
                    <MapPin className="w-5 h-5" /> Informações de Localização
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label>Latitude</Label>
                      <Input type="number" step="any" value={formData.latitude} onChange={e => handleChange('latitude', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitude</Label>
                      <Input type="number" step="any" value={formData.longitude} onChange={e => handleChange('longitude', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input value={formData.city} onChange={e => handleChange('city', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input value={formData.state} onChange={e => handleChange('state', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Subestação</Label>
                    <Input value={formData.substation_id} onChange={e => handleChange('substation_id', e.target.value)} />
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-background shadow-md shrink-0 flex flex-row items-center justify-between gap-3">
           <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
             <Info className="w-3 h-3" /> As alterações afetam históricos e alertas.
           </div>
           <div className="flex gap-3">
             <Button variant="outline" onClick={onClose} disabled={loading || initialLoading}>Cancelar</Button>
             <Button onClick={handleSave} disabled={loading || initialLoading}>
               {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} Salvar Alterações
             </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditEquipmentModal;
