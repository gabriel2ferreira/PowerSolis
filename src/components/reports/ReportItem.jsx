import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Trash2, Eye, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReportStorage } from '@/hooks/useReportStorage';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatFileSize } from '@/utils/reportFormatter';

const ReportItem = ({ report, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { deletePDF, deleteReportMetadata, downloadPDF } = useReportStorage();
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!report.file_url) {
      toast({ title: "Erro", description: "URL de download indisponível.", variant: "destructive" });
      return;
    }
    setIsDownloading(true);
    try {
      await downloadPDF(report.file_url, `${report.report_name}.pdf`);
      toast({ title: "Sucesso", description: "Download concluído." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao baixar o relatório.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = () => {
    if (!report.file_url) {
      toast({ title: "Erro", description: "URL de visualização indisponível.", variant: "destructive" });
      return;
    }
    window.open(report.file_url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.")) return;
    
    setIsDeleting(true);
    try {
      if (report.file_path) {
        await deletePDF(report.file_path);
      }
      await deleteReportMetadata(report.id);
      
      toast({ title: "Sucesso", description: "Relatório excluído com sucesso." });
      if (onDelete) onDelete();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir o relatório.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow gap-4">
      <div className="flex items-start gap-3 w-full sm:w-auto">
        <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1 sm:mt-0">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col overflow-hidden gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{report.report_name}</h3>
            {report.status === 'completed' && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1 hidden sm:flex">
                <CheckCircle2 className="w-3 h-3" /> Concluído
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {report.equipments?.name || 'Equipamento Desconhecido'}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span>{report.created_at ? format(new Date(report.created_at), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR }) : 'Data Indisponível'}</span>
            <span>•</span>
            <span>{formatFileSize(report.file_size)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleView}
          className="text-foreground"
          title="Visualizar PDF"
        >
          <Eye className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Visualizar</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownload}
          disabled={isDownloading}
          className="text-foreground"
          title="Baixar PDF"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> : <Download className="h-4 w-4 sm:mr-2" />}
          <span className="hidden sm:inline">Baixar</span>
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDelete}
          disabled={isDeleting}
          title="Excluir Relatório"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default ReportItem;