import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EquipmentSelectorReport from './EquipmentSelectorReport';
import { useReportGeneration } from '@/hooks/useReportGeneration';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileDown } from 'lucide-react';

const CreateReportModal = ({ isOpen, onClose, onReportCreated }) => {
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const { generateReport, isGenerating } = useReportGeneration();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!selectedEquipment) return;
    
    console.log('[MODAL] Starting generation for equipment:', selectedEquipment);
    const savedReport = await generateReport(selectedEquipment);
    
    if (savedReport) {
      console.log('[MODAL] Report generation marked as success. Closing modal.');
      toast({ title: 'Sucesso', description: `Relatório gerado e salvo com sucesso!` });
      if (onReportCreated) onReportCreated(savedReport);
      setSelectedEquipment('');
      onClose();
    } else {
      console.log('[MODAL] Report generation failed.');
    }
  };

  const handleOpenChange = (open) => {
    if (!open && !isGenerating) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Criar Novo Relatório
          </DialogTitle>
          <DialogDescription>
            Selecione o equipamento para gerar um relatório PDF detalhado contendo análises de expectativa de vida, histórico e recomendações.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <EquipmentSelectorReport value={selectedEquipment} onChange={setSelectedEquipment} />
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={!selectedEquipment || isGenerating} 
            className="bg-primary text-primary-foreground min-w-[180px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              'Gerar Relatório em PDF'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReportModal;