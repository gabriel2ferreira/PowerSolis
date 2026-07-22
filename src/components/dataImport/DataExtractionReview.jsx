import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, RefreshCw, Check, Edit2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const DataExtractionReview = ({ data, onConfirm, onBack, isProcessing }) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  // Mode: 'extracted' (viewing AI data) or 'manual' (editing/entering manually)
  const [mode, setMode] = useState(data && Object.keys(data).length > 0 ? 'extracted' : 'manual');
  
  const [formData, setFormData] = useState({
    // Transformers-specific
    sapid: '',
    sap_location: '',
    transformer_operation_code: '',
    max_voltage: '',
    construction_year: '',
    // Equipments comprehensive mapping
    name: '',
    temperature: '',
    voltage_level: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    phase: '',
    status: '',
    observations: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // If we have AI data, populate form
    if (data) {
      setFormData(prev => ({
        ...prev,
        ...data,
        max_voltage: data.max_voltage ? String(data.max_voltage) : '',
        construction_year: data.construction_year ? String(data.construction_year) : '',
        name: data.equipment_name || data.name || '',
        temperature: data.temperature || data.technicalData?.temperature || '',
        voltage_level: data.voltage_level || data.max_voltage || '',
        city: data.city || data.location?.city || '',
        state: data.state || data.location?.state || '',
        latitude: data.latitude || data.location?.latitude || '',
        longitude: data.longitude || data.location?.longitude || '',
        phase: data.phase || '',
        status: data.status || 'Bom',
        observations: data.observations || ''
      }));
    }
  }, [data]);

  const validate = () => {
    const newErrors = {};
    if (!formData.sapid && !formData.name) {
      newErrors.name = t('required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onConfirm(formData);
    } else {
      toast({
        variant: 'destructive',
        title: t('validationError'),
        description: t('pleaseFixErrors')
      });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const isFallback = !data || Object.keys(data).length === 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
           <h2 className="text-2xl font-bold">{t('extractionReview')}</h2>
           <p className="text-muted-foreground">
             {isFallback ? t('manualEntryDescription') : t('reviewAndEditExtractedData')}
           </p>
        </div>
        
        {!isFallback && (
          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border">
            <span className={`text-sm ${mode === 'extracted' ? 'font-bold' : 'text-muted-foreground'}`}>
              {t('useGeminiData')}
            </span>
            <Switch 
              checked={mode === 'manual'}
              onCheckedChange={(checked) => setMode(checked ? 'manual' : 'extracted')}
            />
            <span className={`text-sm ${mode === 'manual' ? 'font-bold' : 'text-muted-foreground'}`}>
               {t('edit')} / {t('fillManually')}
            </span>
          </div>
        )}
      </div>

      {mode === 'manual' && !isFallback && (
         <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded text-sm border border-amber-200">
           <Edit2 className="w-4 h-4" />
           {t('tryManualEntry')} - {t('overridingAI')}
         </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mapeamento de Dados do Equipamento</CardTitle>
          <CardDescription>
             Verifique e edite os dados extraídos antes da importação
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          
          <div className="space-y-2 md:col-span-2">
            <Label className={errors.name ? "text-destructive" : ""}>
              Nome do Equipamento / SAP ID *
            </Label>
            <Input 
              value={formData.name || formData.sapid} 
              onChange={(e) => {
                handleChange('name', e.target.value);
                handleChange('sapid', e.target.value);
              }}
              disabled={mode === 'extracted'}
              className={errors.name ? "border-destructive bg-destructive/5" : ""}
            />
            {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
          </div>

          <div className="space-y-2">
            <Label>Nível de Tensão (V)</Label>
            <Input 
              value={formData.voltage_level} 
              onChange={(e) => handleChange('voltage_level', e.target.value)}
              disabled={mode === 'extracted'}
            />
          </div>

          <div className="space-y-2">
            <Label>Temperatura Extraída (°C)</Label>
            <Input 
              type="number"
              step="any"
              value={formData.temperature} 
              onChange={(e) => handleChange('temperature', e.target.value)}
              disabled={mode === 'extracted'}
            />
          </div>

          <div className="space-y-2">
            <Label>Fase</Label>
            <Input 
              value={formData.phase} 
              onChange={(e) => handleChange('phase', e.target.value)}
              disabled={mode === 'extracted'}
            />
          </div>

          <div className="space-y-2">
            <Label>Ano de Construção</Label>
            <Input 
              type="number"
              value={formData.construction_year} 
              onChange={(e) => handleChange('construction_year', e.target.value)}
              disabled={mode === 'extracted'}
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label>Localização (Cidade, Estado)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input 
                placeholder="Cidade"
                value={formData.city} 
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={mode === 'extracted'}
              />
              <Input 
                placeholder="Estado"
                value={formData.state} 
                onChange={(e) => handleChange('state', e.target.value)}
                disabled={mode === 'extracted'}
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Coordenadas (Lat, Lng)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input 
                placeholder="Latitude"
                type="number" step="any"
                value={formData.latitude} 
                onChange={(e) => handleChange('latitude', e.target.value)}
                disabled={mode === 'extracted'}
              />
              <Input 
                placeholder="Longitude"
                type="number" step="any"
                value={formData.longitude} 
                onChange={(e) => handleChange('longitude', e.target.value)}
                disabled={mode === 'extracted'}
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Observações / Dados Adicionais</Label>
            <Textarea 
              rows={3}
              value={formData.observations} 
              onChange={(e) => handleChange('observations', e.target.value)}
              disabled={mode === 'extracted'}
            />
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-between pt-6 border-t mt-4">
        <Button variant="ghost" onClick={onBack} disabled={isProcessing}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>
        
        <Button 
          onClick={handleSave} 
          disabled={isProcessing}
          className="min-w-[140px] bg-green-600 hover:bg-green-700 text-white"
        >
          {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {t('saving')}
              </>
          ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t('confirmAndImport')}
              </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default DataExtractionReview;