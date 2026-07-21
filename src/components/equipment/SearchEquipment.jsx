import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Edit2, Filter, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import EditEquipmentModal from './EditEquipmentModal';
import { getAllEquipmentsBasic } from '@/utils/equipmentDataMapper';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';
import { supabase } from '@/lib/customSupabaseClient';
import { getEquipmentStatus } from '@/utils/equipmentStatus';
import { logger } from '@/lib/debugLogger';

const SearchEquipment = ({ onViewDetails }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [results, setResults] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEquipmentForEdit, setSelectedEquipmentForEdit] = useState(null);

  const fetchTypes = useCallback(async () => {
    const { data, error } = await supabase.from('equipment_types').select('id, name');
    if (error) logger.error('SearchEquipment', 'Error fetching types', error);
    setTypes(data || []);
  }, []);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && statusParam !== statusFilter) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTypes();
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTypes, typeFilter, statusFilter]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllEquipmentsBasic(true);
      let filteredData = data.map(item => {
        if (!item.api_config) {
          logger.warn('SearchEquipment', `Missing api_config for ID ${item.id}. Proceeding with defaults.`);
        }
        const healthData = calculateEquipmentHealth(item);
        const itemWithHealth = { ...item, health: healthData };
        const statusObj = getEquipmentStatus(itemWithHealth);
        
        return {
          ...itemWithHealth,
          healthData,
          statusObj
        };
      });

      if (query) {
        const q = query.toLowerCase();
        filteredData = filteredData.filter(d => d.name.toLowerCase().includes(q));
      }
      
      if (typeFilter !== 'all') {
        if (typeFilter === 'tc_only') {
          const tcType = types.find(t => t.name === 'TC');
          if (tcType) filteredData = filteredData.filter(d => d.equipment_type_id === tcType.id);
        } else {
          filteredData = filteredData.filter(d => d.equipment_type_id === typeFilter);
        }
      }

      if (statusFilter !== 'all') {
        filteredData = filteredData.filter(item => {
          const status = item.statusObj.status;
          if (statusFilter === 'Bom') return status === 'Bom';
          if (statusFilter === 'Atenção') return status === 'Atenção';
          if (statusFilter === 'Crítico') return status === 'Crítico';
          return true;
        });
      }

      setResults(filteredData || []);
    } catch (error) {
      logger.error('SearchEquipment', 'Search error:', error);
      toast({ title: "Erro na busca", description: "Não foi possível carregar os equipamentos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [query, typeFilter, types, statusFilter, toast]);

  const clearFilters = () => {
    setQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    searchParams.delete('status');
    setSearchParams(searchParams);
  };

  const updateStatusFilter = (val) => {
    setStatusFilter(val);
    if (val === 'all') searchParams.delete('status');
    else searchParams.set('status', val);
    setSearchParams(searchParams);
  };

  const handleEditClick = (equipment) => {
    setSelectedEquipmentForEdit(equipment);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedEquipmentForEdit(null);
    handleSearch();
  };

  const renderHealthCell = (item) => {
    const { status, color, healthPercentage } = item.statusObj;
    
    return (
      <TableCell>
        <div className="flex flex-col gap-1 w-[120px]">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold">{Number(healthPercentage).toFixed(1)}%</span>
            <span style={{color}}>{status}</span>
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${healthPercentage}%`, backgroundColor: color }} />
          </div>
        </div>
      </TableCell>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('searchByName') || 'Buscar equipamento...'} 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10" 
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder={t('filterByType') || 'Tipo'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTypes') || 'Todos os Tipos'}</SelectItem>
            <SelectItem value="tc_only">Apenas TCs</SelectItem>
            {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={updateStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Bom">Bom (≥80%)</SelectItem>
            <SelectItem value="Atenção">Atenção (50-79%)</SelectItem>
            <SelectItem value="Crítico">Crítico (&lt;50%)</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleSearch}>{t('search') || 'Buscar'}</Button>
        
        {(query || typeFilter !== 'all' || statusFilter !== 'all') && (
          <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground"><XCircle className="w-4 h-4 mr-2" /> Limpar</Button>
        )}
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('nameTag') || 'Nome'}</TableHead>
              <TableHead>{t('equipmentType') || 'Tipo'}</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Instalação</TableHead>
              <TableHead>Saúde</TableHead>
              <TableHead className="text-right">{t('actions') || 'Ações'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('loading') || 'Carregando...'}</TableCell></TableRow>
            ) : results.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('noEquipmentFound') || 'Nenhum equipamento encontrado'}</TableCell></TableRow>
            ) : (
              results.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell><Badge variant="secondary">{item.equipment_types?.name}</Badge></TableCell>
                  <TableCell>{item.city ? `${item.city}/${item.state}` : item.location_name || '-'}</TableCell>
                  <TableCell>{item.installation_date ? format(new Date(item.installation_date), 'dd/MM/yyyy') : '-'}</TableCell>
                  {renderHealthCell(item)}
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)} className="hover:text-blue-500">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Editar</p></TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => onViewDetails(item.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Visualizar</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isEditModalOpen && (
        <EditEquipmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEquipmentForEdit(null);
          }}
          equipment={selectedEquipmentForEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default SearchEquipment;