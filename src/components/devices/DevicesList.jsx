import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Edit, Trash2, Eye, Cpu, RefreshCw, Upload, AlertCircle, 
  ChevronLeft, ChevronRight, Filter, XCircle 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const DevicesList = ({ onViewDetails, equipmentIdFilter = null }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { toast } = useToast();

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('[DevicesList] Fetching devices...');
    
    try {
      let query = supabase
        .from('devices')
        .select('id, name, type, equipment_id, equipment_name, status, created_at')
        .order('created_at', { ascending: false });

      // Only apply WHERE clause if equipmentIdFilter is explicitly provided
      if (equipmentIdFilter) {
        query = query.eq('equipment_id', equipmentIdFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setDevices(data || []);
      console.log(`[DevicesList] Successfully fetched ${data?.length || 0} devices.`);
      if (data && data.length > 0) {
        console.log('[DevicesList] Sample device data:', data[0]);
      }
    } catch (err) {
      console.error('[DevicesList] Error fetching devices:', err);
      setError(err.message || 'Ocorreu um erro ao buscar os dispositivos.');
      toast({
        title: 'Erro de Conexão',
        description: 'Falha ao carregar dispositivos. Verifique sua conexão.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [equipmentIdFilter, toast]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  // Derived data
  const uniqueTypes = useMemo(() => {
    const types = new Set(devices.map(d => d.type).filter(Boolean));
    return Array.from(types).sort();
  }, [devices]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(devices.map(d => d.status || 'Normal'));
    return Array.from(statuses).sort();
  }, [devices]);

  // Apply Client-Side Filters
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (d.name || '').toLowerCase().includes(searchLower) ||
        (d.equipment_name || '').toLowerCase().includes(searchLower);
      
      const matchesType = typeFilter === 'all' || d.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || (d.status || 'Normal') === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [devices, searchTerm, typeFilter, statusFilter]);

  // Pagination Logic
  const totalItems = filteredDevices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Handle edge case where current page might be out of bounds after filtering
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedDevices = filteredDevices.slice(startIndex, endIndex);

  const getStatusBadgeVariant = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'normal' || s === 'ativo' || s === 'active' || s === 'bom') return 'default';
    if (s === 'atenção' || s === 'warning') return 'secondary';
    if (s === 'erro' || s === 'crítico' || s === 'error') return 'destructive';
    return 'outline';
  };

  const handleEdit = (id) => {
    toast({ title: 'Editar Dispositivo', description: '🚧 This feature isn\'t implemented yet—but don\'t worry! You can request it in your next prompt! 🚀' });
  };

  const handleDelete = (id) => {
    toast({ title: 'Excluir Dispositivo', description: '🚧 This feature isn\'t implemented yet—but don\'t worry! You can request it in your next prompt! 🚀' });
  };

  const handleImportReport = (id) => {
    toast({ title: 'Importar Relatório', description: '🚧 This feature isn\'t implemented yet—but don\'t worry! You can request it in your next prompt! 🚀' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" /> Dispositivos
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Total registrado: {devices.length} dispositivo(s)
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchDevices} disabled={loading} title="Atualizar">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters Section */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou equipamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {uniqueTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {uniqueStatuses.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
            <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
              <XCircle className="w-4 h-4 mr-2" /> Limpar
            </Button>
          )}
        </div>

        {/* Content Area */}
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive space-y-4">
            <AlertCircle className="w-8 h-8" />
            <div className="text-center">
              <h3 className="font-bold">Erro ao carregar dispositivos</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button variant="outline" onClick={fetchDevices} className="mt-2">Tentar Novamente</Button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[...Array(itemsPerPage)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20">
            <Cpu className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum dispositivo encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {devices.length === 0 
                ? 'Não há dispositivos registrados no momento.' 
                : 'Nenhum dispositivo corresponde aos filtros aplicados.'}
            </p>
            {devices.length > 0 && (
              <Button variant="link" onClick={clearFilters} className="mt-2">Limpar filtros</Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nome</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Equipamento Vinculado</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Criação</th>
                    <th className="px-4 py-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedDevices.map((device) => (
                    <tr key={device.id} className="bg-card hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {device.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {device.type || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {device.equipment_id ? (
                          <span className="text-primary font-medium hover:underline cursor-pointer">
                            {device.equipment_name || 'ID: ' + device.equipment_id.substring(0, 8)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Não vinculado</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(device.status)}>
                          {device.status || 'Normal'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {device.created_at 
                          ? format(new Date(device.created_at), 'dd/MM/yyyy') 
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => onViewDetails && onViewDetails(device.id)} 
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(device.id)} 
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleImportReport(device.id)} 
                          title="Importar Relatório"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(device.id)} 
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <span>Exibindo {startIndex + 1} a {endIndex} de {totalItems}</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(Number(val))}>
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>por página</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[3rem] text-center">
                    {safeCurrentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DevicesList;