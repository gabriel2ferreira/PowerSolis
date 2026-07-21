import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Settings, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AddEquipmentInfo from './AddEquipmentInfo';
import { logHistory } from '@/lib/equipmentUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateAndSaveMetrics } from '@/lib/powerSolisService';
import { saveEquipmentHealthHistory } from '@/services/equipmentHealthSync';
import { checkAndCreateAlert } from '@/services/equipmentAlertService';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';
import { logger } from '@/lib/debugLogger';

const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const CreateEquipment = ({ onComplete }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [createdId, setCreatedId] = useState(null);
  const [types, setTypes] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    equipment_type_id: '',
    voltage_level: '',
    temperature: '',
    substation_id: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    equipment_lifespan: '',
    installation_date: '',
    phase: '',
    observations: '',
    city: '',
    state: '',
    location_name: '',
    latitude: '',
    longitude: '',
    tangente_perdas: '',
    corrente_primario: '',
    temperatura_ambiente: '',
    horas_operacao: '',
    api_base_url: '',
    temp_ref: '110',
    vida_ref_anos: '25',
    p: '0',
    vida_util_isolamento_h: '219150', // 25 * 365.25 * 24
    ponto_quente_externo: '25',
    estrategia_envelhecimento: 'pior_caso'
  });

  const fetchTypes = useCallback(async () => {
    const { data, error } = await supabase.from('equipment_types').select('*');
    if (error) {
      logger.error('CreateEquipment', 'Error fetching types', error);
    }
    if (!error) setTypes(data);
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const selectedTypeObj = types.find(t => t.id === formData.equipment_type_id);
  const isTC = selectedTypeObj?.name === 'TC';

  useEffect(() => {
    if (isTC) {
      setFormData(prev => ({ ...prev, equipment_lifespan: '25' }));
    }
  }, [isTC]);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.equipment_type_id || !formData.city || !formData.state) {
      toast({ title: t('validationError'), description: 'Nome, tipo, cidade e estado são obrigatórios', variant: "destructive" });
      return;
    }

    if (isTC && !formData.installation_date) {
      toast({ title: 'Erro de Validação', description: 'Data de Instalação é obrigatória para TC.', variant: "destructive" });
      return;
    }

    if (!isTC && !formData.equipment_lifespan) {
      toast({ title: 'Erro de Validação', description: 'Vida Útil Estimada é obrigatória.', variant: "destructive" });
      return;
    }

    if (!formData.phase) {
      toast({ title: 'Erro de Validação', description: 'Fase é obrigatória', variant: "destructive" });
      return;
    }

    setIsCalculating(true);

    try {
      // 1. Insert Equipment
      const equipmentData = {
        name: formData.name,
        equipment_type_id: formData.equipment_type_id,
        equipment_lifespan: isTC ? 25 : parseInt(formData.equipment_lifespan),
        installation_date: formData.installation_date ? new Date(formData.installation_date).toISOString() : null,
        phase: formData.phase,
        observations: formData.observations || null,
        voltage_level: formData.voltage_level || null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        substation_id: formData.substation_id || null,
        city: formData.city,
        state: formData.state,
        location_name: formData.location_name || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        created_by: user.id
      };

      const { data, error } = await supabase.from('equipments').insert(equipmentData).select().maybeSingle();
      if (error) {
        logger.error('CreateEquipment', 'Error inserting equipment', error);
        throw error;
      }

      // 2. Insert Custom Fields
      const customFieldsData = [];
      if (formData.manufacturer) customFieldsData.push({ equipment_id: data.id, field_name: 'manufacturer', field_type: 'text', observations: formData.manufacturer });
      if (formData.model) customFieldsData.push({ equipment_id: data.id, field_name: 'model', field_type: 'text', observations: formData.model });
      if (formData.serial_number) customFieldsData.push({ equipment_id: data.id, field_name: 'serial_number', field_type: 'text', observations: formData.serial_number });

      if (customFieldsData.length > 0) {
        await supabase.from('custom_fields').insert(customFieldsData);
      }

      // 3. Insert Default Equipment API Config
      const apiConfig = {
        equipment_id: data.id,
        horas_operacao: parseFloat(formData.horas_operacao) || 0,
        ponto_quente_externo: parseFloat(formData.ponto_quente_externo) || 25,
        temperatura_ambiente: parseFloat(formData.temperatura_ambiente) || 25,
        vida_util_isolamento_h: parseFloat(formData.vida_util_isolamento_h) || (25 * 365.25 * 24),
        estrategia_envelhecimento: formData.estrategia_envelhecimento || 'pior_caso',
        corrente_primario: parseFloat(formData.corrente_primario) || 0,
        tangente_perdas: parseFloat(formData.tangente_perdas) || 0,
        temp_ref: parseFloat(formData.temp_ref) || 110,
        vida_ref_anos: parseFloat(formData.vida_ref_anos) || 25,
        p: parseFloat(formData.p) || 0,
        api_base_url: formData.api_base_url || null
      };

      const { error: configError } = await supabase.from('equipment_api_config').insert(apiConfig);
      if (configError) {
        logger.error('CreateEquipment', 'Error inserting api config', configError);
        throw configError;
      }

      // Execute metrics if API URL provided
      if (apiConfig.api_base_url && apiConfig.tangente_perdas && apiConfig.corrente_primario) {
        await calculateAndSaveMetrics(data.id, apiConfig, supabase);
      }

      // 4. Save Initial History & Alerts
      const fullSyncData = { ...equipmentData, id: data.id, api_config: apiConfig };
      const healthCalc = calculateEquipmentHealth(fullSyncData);
      
      await saveEquipmentHealthHistory(data.id, fullSyncData, apiConfig);
      await checkAndCreateAlert(data.id, healthCalc.status);
      await logHistory(data.id, 'created', 'equipment', null, 'Initial creation', user.id);
      
      toast({ title: 'Sucesso!', description: `Equipamento criado com sucesso!` });
      setCreatedId(data.id);
      setStep(2);

    } catch (error) {
      logger.error('CreateEquipment', 'General error creating equipment', error);
      toast({ title: t('error'), description: error.message, variant: "destructive" });
    } finally {
      setIsCalculating(false);
    }
  };

  if (step === 2) return <AddEquipmentInfo equipmentId={createdId} onFinish={() => onComplete()} />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" /> {t('createNewEquipment')}
          </CardTitle>
          <CardDescription>{t('basicInfo')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('nameTag')} *</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., TR-005" required />
                </div>
                <div className="space-y-2">
                  <Label>{t('equipmentType')} *</Label>
                  <Select value={formData.equipment_type_id} onValueChange={(val) => setFormData({...formData, equipment_type_id: val})}>
                    <SelectTrigger><SelectValue placeholder={t('selectType')} /></SelectTrigger>
                    <SelectContent>
                      {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  {isTC ? (
                    <>
                      <Label>Vida Útil Estimada</Label>
                      <Input value="25 Anos (Fixo para TC)" disabled className="bg-muted text-muted-foreground" />
                    </>
                  ) : (
                    <>
                      <Label>Vida Útil Estimada *</Label>
                      <Select value={formData.equipment_lifespan} onValueChange={(val) => setFormData({...formData, equipment_lifespan: val})}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 Anos</SelectItem>
                          <SelectItem value="30">30 Anos</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Fase *</Label>
                  <Select value={formData.phase} onValueChange={(val) => setFormData({...formData, phase: val})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fase A">Fase A</SelectItem>
                      <SelectItem value="Fase B">Fase B</SelectItem>
                      <SelectItem value="Fase ABC">Fase ABC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Instalação {isTC && '*'}</Label>
                  <Input 
                    type="date" 
                    value={formData.installation_date} 
                    onChange={e => setFormData({...formData, installation_date: e.target.value})} 
                    required={isTC}
                  />
                  {isTC && !formData.installation_date && <p className="text-xs text-red-500">Obrigatório para TC</p>}
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} placeholder="Informações adicionais" />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary"/> Localização</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade *</Label>
                  <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Estado *</Label>
                  <Select onValueChange={(val) => setFormData({...formData, state: val})} value={formData.state}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={isCalculating || !formData.phase || (!isTC && !formData.equipment_lifespan)}>
              {isCalculating ? 'Criando e calculando...' : t('proceedCustomFields')} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEquipment;