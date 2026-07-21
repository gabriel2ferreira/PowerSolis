import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const EquipmentTypeMatchValidator = ({ isOpen, extractedType, selectedType, onConfirm, onCancel }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <AlertTriangle className="w-6 h-6" />
            <DialogTitle>Aviso de Incompatibilidade</DialogTitle>
          </div>
          <DialogDescription className="text-base text-foreground">
            O tipo de equipamento extraído do relatório não parece corresponder ao equipamento selecionado no sistema.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-md space-y-2 my-2 text-sm">
          <p><strong>Tipo Extraído:</strong> {extractedType || 'Desconhecido'}</p>
          <p><strong>Tipo Selecionado:</strong> {selectedType || 'Desconhecido'}</p>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Tem certeza de que deseja adicionar estes dados a este equipamento?
        </p>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onConfirm} className="bg-amber-500 hover:bg-amber-600 text-white">
            Sim, Continuar Mesmo Assim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentTypeMatchValidator;