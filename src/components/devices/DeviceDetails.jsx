import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Cpu, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const DeviceDetails = ({ deviceId, onBack }) => {
  const { toast } = useToast();
  const [device, setDevice] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchDevice();
    fetchEquipments();
  }, [deviceId]);

  const fetchDevice = async () => {
    setLoading(true);
    const { data } = await supabase.from('devices').select('*, equipments(name, status)').eq('id', deviceId).single();
    setDevice(data);
    if (data) {
      setEditForm({
        name: data.name || '',
        type: data.type || '',
        status: data.status || 'Normal',
        equipment_id: data.equipment_id || 'none'
      });
    }
    setLoading(false);
  };

  const fetchEquipments = async () => {
    const { data } = await supabase.from('equipments').select('id, name').order('name');
    setEquipments(data || []);
  };

  const handleSave = async () => {
    try {
      const selectedEquipment = equipments.find(eq => eq.id === editForm.equipment_id);
      
      const payload = {
        name: editForm.name,
        type: editForm.type,
        status: editForm.status,
        equipment_id: editForm.equipment_id !== 'none' ? editForm.equipment_id : null,
        equipment_name: selectedEquipment ? selectedEquipment.name : null
      };

      await supabase.from('devices').update(payload).eq('id', deviceId);
      toast({ title: 'Atualizado com sucesso' });
      setEditDialogOpen(false);
      fetchDevice();
    } catch (err) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    await supabase.from('devices').delete().eq('id', deviceId);
    toast({ title: 'Excluído com sucesso' });
    onBack();
  };

  if (loading || !device) return <div className="p-8">Carregando dispositivo...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><Cpu className="w-6 h-6"/> {device.name}</h2>
            <p className="text-muted-foreground">{device.type}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}><Edit2 className="w-4 h-4 mr-2" /> Editar</Button>
          <Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" /> Excluir</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Status do Dispositivo</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{device.status || 'Normal'}</p></CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><LinkIcon className="w-4 h-4"/> Equipamento Vinculado</CardTitle></CardHeader>
          <CardContent>
            {device.equipment_id ? (
              <div>
                <p className="text-lg font-bold text-primary">{device.equipments?.name || device.equipment_name}</p>
                <p className="text-xs text-muted-foreground mt-1">Status: {device.equipments?.status || 'N/A'}</p>
              </div>
            ) : (
              <p className="text-muted-foreground italic">Nenhum equipamento vinculado</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Dispositivo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Tipo</Label><Input value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} /></div>
            <div className="space-y-2"><Label>Status</Label><Input value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>Equipamento Vinculado</Label>
              <Select value={editForm.equipment_id} onValueChange={v => setEditForm({...editForm, equipment_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione um equipamento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum / Não vinculado</SelectItem>
                  {equipments.map(eq => <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeviceDetails;