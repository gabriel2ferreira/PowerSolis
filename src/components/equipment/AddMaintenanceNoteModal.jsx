import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AddMaintenanceNoteModal = ({ isOpen, onClose, equipmentId, onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async () => {
    if (!noteText.trim()) {
      toast({
        title: 'Campo Obrigatório',
        description: 'A nota não pode estar vazia.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('equipment_history').insert([{
        equipment_id: equipmentId,
        field_name: 'Maintenance Note',
        new_value: noteText,
        change_type: 'maintenance', // Using verified valid value
        changed_by: user?.id,
        changed_at: new Date(date).toISOString()
      }]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Nota de manutenção adicionada com sucesso.',
      });
      setNoteText('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar nota de manutenção.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nota de Manutenção</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Observação / Nota</Label>
            <Textarea
              id="note"
              placeholder="Descreva a manutenção realizada..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar Nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMaintenanceNoteModal;