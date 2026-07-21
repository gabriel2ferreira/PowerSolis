import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Loader2 } from 'lucide-react';

const EquipmentExportModal = ({ isOpen, onClose, equipment }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('pdf');
  const [fields, setFields] = useState({
    name: true,
    type: true,
    status: true,
    health: true,
    location: true,
    installation_date: true
  });

  const handleExport = async () => {
    setLoading(true);
    try {
      if (format === 'pdf') {
        exportToPDF();
      } else {
        exportToCSV();
      }
      toast({
        title: 'Exportação Concluída',
        description: `Arquivo exportado com sucesso no formato ${format.toUpperCase()}.`,
      });
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erro na Exportação',
        description: 'Ocorreu um erro ao exportar os dados.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Relatório de Equipamento', 14, 22);
    
    doc.setFontSize(12);
    const body = [];
    
    if (fields.name) body.push(['Nome do Equipamento', equipment.name || 'N/A']);
    if (fields.type) body.push(['Tipo', equipment.equipment_types?.name || 'N/A']);
    if (fields.status) body.push(['Status', equipment.status || 'N/A']);
    if (fields.health) body.push(['Saúde (%)', equipment.last_health_percentage ? `${equipment.last_health_percentage}%` : 'N/A']);
    if (fields.location) body.push(['Localização', equipment.location_name || 'N/A']);
    if (fields.installation_date) body.push(['Data Instalação', equipment.installation_date ? new Date(equipment.installation_date).toLocaleDateString() : 'N/A']);

    doc.autoTable({
      startY: 30,
      head: [['Campo', 'Valor']],
      body: body,
      theme: 'striped',
    });

    doc.save(`Equipamento_${equipment.name || 'Export'}.pdf`);
  };

  const exportToCSV = () => {
    const rows = [];
    if (fields.name) rows.push(`Nome,${equipment.name || 'N/A'}`);
    if (fields.type) rows.push(`Tipo,${equipment.equipment_types?.name || 'N/A'}`);
    if (fields.status) rows.push(`Status,${equipment.status || 'N/A'}`);
    if (fields.health) rows.push(`Saúde,${equipment.last_health_percentage || 'N/A'}`);
    if (fields.location) rows.push(`Localização,${equipment.location_name || 'N/A'}`);
    if (fields.installation_date) rows.push(`Data Instalação,${equipment.installation_date || 'N/A'}`);

    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Equipamento_${equipment.name || 'Export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFieldChange = (field) => {
    setFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar Dados</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex gap-4 mb-4 border-b pb-4">
            <Button 
              variant={format === 'pdf' ? 'default' : 'outline'} 
              onClick={() => setFormat('pdf')}
              className="flex-1"
            >
              PDF
            </Button>
            <Button 
              variant={format === 'csv' ? 'default' : 'outline'} 
              onClick={() => setFormat('csv')}
              className="flex-1"
            >
              CSV
            </Button>
          </div>
          <h4 className="font-medium text-sm mb-2">Campos a incluir:</h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries({
              name: 'Nome',
              type: 'Tipo',
              status: 'Status',
              health: 'Saúde',
              location: 'Localização',
              installation_date: 'Data de Instalação'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox 
                  id={`field-${key}`} 
                  checked={fields[key]} 
                  onCheckedChange={() => handleFieldChange(key)}
                />
                <Label htmlFor={`field-${key}`}>{label}</Label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentExportModal;