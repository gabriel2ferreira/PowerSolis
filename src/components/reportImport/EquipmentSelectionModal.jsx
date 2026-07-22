import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PackagePlus, Link } from 'lucide-react';
import { Label } from '@/components/ui/label';

const EquipmentSelectionModal = ({ isOpen, onOpenChange, onSelectOption, extractedType }) => {
  const [mode, setMode] = useState(null); // 'new' | 'existing' | null
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState('');
  const [selectedEqDetails, setSelectedEqDetails] = useState(null);

  useEffect(() => {
    if (mode === 'existing') {
      fetchEquipments();
    }
  }, [mode]);

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('id, name, status, equipment_types(name)');
      if (!error && data) {
        setEquipments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEquipment = (id) => {
    setSelectedEqId(id);
    const eq = equipments.find(e => e.id === id);
    setSelectedEqDetails(eq);
  };

  const handleConfirm = () => {
    if (mode === 'new') {
      onSelectOption({ type: 'new' });
    } else if (mode === 'existing') {
      if (!selectedEqId) return;
      onSelectOption({ 
        type: 'existing', 
        equipmentId: selectedEqId, 
        equipmentData: selectedEqDetails 
      });
    }
    setMode(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular Dados Extraídos</DialogTitle>
          <DialogDescription>
            Escolha se deseja criar um novo equipamento ou adicionar os dados a um equipamento existente.
          </DialogDescription>
        </DialogHeader>

        {!mode ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button 
              variant="outline" 
              className="h-32 flex flex-col gap-2" 
              onClick={() => setMode('new')}
            >
              <PackagePlus className="w-8 h-8 text-primary" />
              <span>Criar Novo Equipamento</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-32 flex flex-col gap-2" 
              onClick={() => setMode('existing')}
            >
              <Link className="w-8 h-8 text-primary" />
              <span>Adicionar a Existente</span>
            </Button>
          </div>
        ) : mode === 'existing' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecione o Equipamento</Label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : (
                <Select value={selectedEqId} onValueChange={handleSelectEquipment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Busque e selecione um equipamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipments.map(eq => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} ({eq.equipment_types?.name || 'Sem tipo'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedEqDetails && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                <p><strong>Nome:</strong> {selectedEqDetails.name}</p>
                <p><strong>Tipo:</strong> {selectedEqDetails.equipment_types?.name || 'N/A'}</p>
                <p><strong>Status Atual:</strong> {selectedEqDetails.status || 'N/A'}</p>
              </div>
            )}
            
            <div className="flex justify-between mt-4">
              <Button variant="ghost" onClick={() => setMode(null)}>Voltar</Button>
              <Button onClick={handleConfirm} disabled={!selectedEqId}>Confirmar</Button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4 text-center">
            <p>Você escolheu criar um novo equipamento.</p>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setMode(null)}>Voltar</Button>
              <Button onClick={handleConfirm}>Continuar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentSelectionModal;