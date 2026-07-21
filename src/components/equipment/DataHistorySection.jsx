import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { getTimeSeriesData } from '@/utils/timeSeriesHandler';

const DataHistorySection = ({ equipmentId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getTimeSeriesData(equipmentId, null, 200);
      
      let filteredData = data;
      if (startDate) {
        filteredData = filteredData.filter(d => new Date(d.report_date) >= new Date(startDate));
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filteredData = filteredData.filter(d => new Date(d.report_date) <= end);
      }

      setHistory(filteredData);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [equipmentId, startDate, endDate]);

  const exportToCSV = () => {
    if (!history.length) return;
    const headers = ['Data do Relatório', 'Saúde (%)', 'Temperatura (°C)', 'Umidade (%)', 'Vibração (mm/s)', 'Condição do Óleo', 'Métricas Extras', 'Criado em'];
    const rows = history.map(item => [
      item.report_date ? format(new Date(item.report_date), 'dd/MM/yyyy') : 'N/A',
      item.health_percentage ?? 'N/A',
      item.temperature ?? 'N/A',
      item.humidity ?? 'N/A',
      item.vibration ?? 'N/A',
      item.oil_condition || 'N/A',
      item.other_metrics ? JSON.stringify(item.other_metrics) : 'N/A',
      item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => `"${e.join('","')}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historico_dados_${equipmentId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-full sm:w-auto bg-background text-foreground"
            />
          </div>
          <span className="text-muted-foreground text-sm">até</span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="w-full sm:w-auto bg-background text-foreground"
            />
          </div>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto gap-2" disabled={history.length === 0}>
          <Download className="w-4 h-4" /> Exportar CSV
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>Nenhum dado histórico disponível para este equipamento.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data do Relatório</TableHead>
                <TableHead>Temperatura</TableHead>
                <TableHead>Métricas Extras</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.report_date ? format(new Date(record.report_date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>{record.temperature !== null ? `${record.temperature}°C` : '-'}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate" title={JSON.stringify(record.other_metrics)}>
                    {record.other_metrics ? JSON.stringify(record.other_metrics) : '-'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{record.source || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {record.created_at ? format(new Date(record.created_at), 'dd/MM/yyyy HH:mm') : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default DataHistorySection;