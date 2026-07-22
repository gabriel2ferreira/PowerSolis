import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Download, Calendar as CalendarIcon, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/hooks/use-toast';

const LifeExpectancyControls = ({
  equipmentList,
  selectedId,
  setSelectedId,
  standard,
  setStandard,
  chartType,
  setChartType,
  dateRange,
  setDateRange,
  zoomLevel,
  setZoomLevel,
  onRefresh,
  onExport,
  loading
}) => {
  const { toast } = useToast();
  const selectedEquipment = equipmentList.find(e => e.id === selectedId);
  
  const [editFields, setEditFields] = useState({
    equipment_lifespan: '',
    phase: '',
    observations: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedEquipment) {
      setEditFields({
        equipment_lifespan: selectedEquipment.equipment_lifespan?.toString() || '',
        phase: selectedEquipment.phase || '',
        observations: selectedEquipment.observations || ''
      });
    }
  }, [selectedEquipment]);

  const handleUpdateEquipment = async () => {
    if (!editFields.equipment_lifespan || !editFields.phase) {
      toast({ title: "Validação", description: "Vida útil e Fase são obrigatórios.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('equipments')
        .update({
          equipment_lifespan: parseInt(editFields.equipment_lifespan),
          phase: editFields.phase,
          observations: editFields.observations
        })
        .eq('id', selectedId);
        
      if (error) throw error;
      toast({ title: "Sucesso", description: "Dados atualizados com sucesso." });
      onRefresh();
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
        
        <div className="flex-1 w-full space-y-2">
          <Label htmlFor="equipment-select">Equipamento</Label>
          <Select value={selectedId} onValueChange={setSelectedId} disabled={loading || equipmentList.length === 0}>
            <SelectTrigger id="equipment-select" className="w-full bg-background text-foreground">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {equipmentList.map(eq => (
                <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Padrão de Cálculo</Label>
          <RadioGroup 
            value={standard} 
            onValueChange={setStandard} 
            className="flex gap-4"
            disabled={loading}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="IEEE" id="r1" />
              <Label htmlFor="r1" className="cursor-pointer">IEEE C57.91</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="IEC" id="r2" />
              <Label htmlFor="r2" className="cursor-pointer">IEC 60076-7</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading} title="Atualizar Dados">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => onExport('CSV')} disabled={loading} className="gap-2">
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="outline" onClick={() => onExport('PDF')} disabled={loading} className="gap-2">
            <Download className="w-4 h-4" /> PDF
          </Button>
        </div>
      </div>

      {selectedId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-muted/20 rounded-md border mt-4">
          <div className="space-y-2">
            <Label>Vida Útil Estimada *</Label>
            <Select value={editFields.equipment_lifespan} onValueChange={(val) => setEditFields({...editFields, equipment_lifespan: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 Anos</SelectItem>
                <SelectItem value="30">30 Anos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fase *</Label>
            <Select value={editFields.phase} onValueChange={(val) => setEditFields({...editFields, phase: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fase A">Fase A</SelectItem>
                <SelectItem value="Fase B">Fase B</SelectItem>
                <SelectItem value="Fase ABC">Fase ABC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Input 
              value={editFields.observations} 
              onChange={e => setEditFields({...editFields, observations: e.target.value})}
              placeholder="Opcional"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleUpdateEquipment} disabled={isSaving || loading} className="w-full">
              <Save className="w-4 h-4 mr-2"/>
              Salvar Dados
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center pt-4 border-t mt-4">
        <Tabs value={chartType} onValueChange={setChartType} className="w-full lg:w-auto">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="Health">Saúde</TabsTrigger>
            <TabsTrigger value="LOL">Fator de Aceleração</TabsTrigger>
            <TabsTrigger value="Temp">Temperatura</TabsTrigger>
            <TabsTrigger value="Comparison">Frota</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Button variant={zoomLevel === '1M' ? 'default' : 'outline'} size="sm" onClick={() => setZoomLevel('1M')}>1M</Button>
            <Button variant={zoomLevel === '3M' ? 'default' : 'outline'} size="sm" onClick={() => setZoomLevel('3M')}>3M</Button>
            <Button variant={zoomLevel === '1Y' ? 'default' : 'outline'} size="sm" onClick={() => setZoomLevel('1Y')}>1A</Button>
            <Button variant={zoomLevel === 'ALL' ? 'default' : 'outline'} size="sm" onClick={() => setZoomLevel('ALL')}>Tudo</Button>
          </div>

          <div className="flex items-center gap-2 border-l pl-4">
            <div className="relative">
              <CalendarIcon className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input 
                type="date" 
                className="pl-9 w-[140px] h-9 text-sm bg-background text-foreground"
                value={dateRange.start}
                onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))}
              />
            </div>
            <span className="text-muted-foreground">até</span>
            <div className="relative">
              <CalendarIcon className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input 
                type="date" 
                className="pl-9 w-[140px] h-9 text-sm bg-background text-foreground"
                value={dateRange.end}
                onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeExpectancyControls;