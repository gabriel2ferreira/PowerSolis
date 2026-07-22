import React, { useState, useEffect, useCallback } from 'react';
import ReportItem from './ReportItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useReportStorage } from '@/hooks/useReportStorage';
import { useToast } from '@/components/ui/use-toast';

const ReportsList = ({ refreshTrigger }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { getReportsList } = useReportStorage();
  const { toast } = useToast();

  const fetchReports = useCallback(async () => {
    console.log('[REPORT_LIST] Fetching reports triggered');
    setLoading(true);
    setErrorState(false);
    try {
      const data = await getReportsList();
      console.log('[REPORT_LIST] Data fetched successfully:', data?.length);
      setReports(data || []);
    } catch (error) {
      console.error('[REPORT_LIST] Error fetching reports:', error);
      setErrorState(true);
      toast({ title: "Erro de Conexão", description: "Falha ao carregar lista de relatórios. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [getReportsList, toast]);

  // Refetch when refreshTrigger changes
  useEffect(() => {
    fetchReports();
  }, [fetchReports, refreshTrigger]);

  const filteredReports = reports.filter(r => {
    const term = searchTerm.toLowerCase();
    return r.report_name?.toLowerCase().includes(term) || 
           r.equipments?.name?.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const currentReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (errorState && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 border border-dashed border-destructive/50 rounded-lg bg-destructive/5 space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-foreground font-medium text-center">Ocorreu um erro ao carregar os relatórios.</p>
        <Button onClick={fetchReports} variant="outline" className="gap-2 text-foreground">
          <RefreshCw className="h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar relatórios por nome ou equipamento..." 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-9 bg-background text-foreground border-input"
        />
      </div>

      <div className="space-y-3 mt-6 min-h-[400px]">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))
        ) : currentReports.length > 0 ? (
          currentReports.map((report) => (
            <ReportItem key={report.id} report={report} onDelete={fetchReports} />
          ))
        ) : (
          <div className="text-center p-12 border border-dashed border-border rounded-lg bg-muted/20">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Nenhum relatório encontrado</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {searchTerm ? "Sua busca não retornou resultados. Tente outros termos." : "Ainda não há relatórios gerados. Crie um novo relatório para começar."}
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredReports.length)} de {filteredReports.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-foreground"
            >
              Próxima <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsList;