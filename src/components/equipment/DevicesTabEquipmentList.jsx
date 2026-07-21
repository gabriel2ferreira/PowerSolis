import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Search, Edit, RefreshCw, AlertCircle, HardDrive, 
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import EditEquipmentModal from './EditEquipmentModal';

const DevicesTabEquipmentList = () => {
  const [equipments, setEquipments] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  const fetchEquipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: eqData, error: eqError }, { data: typesData }] = await Promise.all([
        supabase.from('equipments').select('*, equipment_types(name)').order('created_at', { ascending: false }),
        supabase.from('equipment_types').select('*')
      ]);

      if (eqError) throw eqError;
      
      setEquipments(eqData || []);
      if (typesData) setTypes(typesData);
    } catch (err) {
      console.error('Error fetching equipments:', err);
      setError(err.message || 'Erro ao carregar equipamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const getCalculatedStatus = (eq) => {
    let health = eq.last_health_percentage;
    if (health === null && eq.installation_date) {
      const ageYears = (new Date() - new Date(eq.installation_date)) / (1000 * 60 * 60 * 24 * 365.25);
      const lifespan = eq.equipment_lifespan || 25;
      if (ageYears < 0) health = 100;
      else if (ageYears >= lifespan) health = 0;
      else health = Math.max(0, 100 - (ageYears / lifespan) * 100);
    }
    
    if (health === null) return 'Desconhecido';
    if (health >= 50) return 'Bom';
    if (health >= 25) return 'Atenção';
    return 'Crítico';
  };

  const filteredAndSortedEquipments = useMemo(() => {
    // 1. Filter
    let result = equipments.filter(eq => {
      const matchesSearch = eq.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || eq.equipment_type_id === typeFilter;
      const status = getCalculatedStatus(eq);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    // 2. Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'type') {
        aVal = a.equipment_types?.name || '';
        bVal = b.equipment_types?.name || '';
      } else if (sortConfig.key === 'status') {
        aVal = getCalculatedStatus(a);
        bVal = getCalculatedStatus(b);
      }

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal > bVal ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [equipments, searchQuery, typeFilter, statusFilter, sortConfig]);

  // 3. Paginate
  const totalItems = filteredAndSortedEquipments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedEquipments = filteredAndSortedEquipments.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="w-4 h-4 inline-block ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 inline-block ml-1" /> 
      : <ChevronDown className="w-4 h-4 inline-block ml-1" />;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Bom': return <Badge className="bg-green-500 hover:bg-green-600 text-white">Bom</Badge>;
      case 'Atenção': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Atenção</Badge>;
      case 'Crítico': return <Badge className="bg-red-500 hover:bg-red-600 text-white">Crítico</Badge>;
      default: return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" /> Equipamentos (Aba Dispositivos)
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Total registrado: {equipments.length} equipamento(s)
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchEquipments} disabled={loading} title="Atualizar">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do equipamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {types.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Bom">Bom</SelectItem>
              <SelectItem value="Atenção">Atenção</SelectItem>
              <SelectItem value="Crítico">Crítico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content Area */}
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive space-y-4">
            <AlertCircle className="w-8 h-8" />
            <div className="text-center">
              <h3 className="font-bold">Erro ao carregar equipamentos</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button variant="outline" onClick={fetchEquipments} className="mt-2">Tentar Novamente</Button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[...Array(itemsPerPage)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : paginatedEquipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20">
            <HardDrive className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum equipamento encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {equipments.length === 0 
                ? 'Não há equipamentos registrados no momento.' 
                : 'Nenhum equipamento corresponde aos filtros aplicados.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap min-w-[800px]">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-muted/80 select-none" onClick={() => handleSort('name')}>
                      Nome <SortIcon columnKey="name" />
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-muted/80 select-none" onClick={() => handleSort('type')}>
                      Tipo <SortIcon columnKey="type" />
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-muted/80 select-none" onClick={() => handleSort('installation_date')}>
                      Data Instalação <SortIcon columnKey="installation_date" />
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-muted/80 select-none" onClick={() => handleSort('equipment_lifespan')}>
                      Vida Útil (anos) <SortIcon columnKey="equipment_lifespan" />
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-muted/80 select-none" onClick={() => handleSort('last_health_percentage')}>
                      Saúde (%) <SortIcon columnKey="last_health_percentage" />
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-muted/80 select-none" onClick={() => handleSort('status')}>
                      Status <SortIcon columnKey="status" />
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-muted/80 select-none" onClick={() => handleSort('updated_at')}>
                      Última Atualização <SortIcon columnKey="updated_at" />
                    </th>
                    <th className="px-4 py-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedEquipments.map((eq) => {
                    const status = getCalculatedStatus(eq);
                    return (
                      <tr key={eq.id} className="bg-card hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{eq.name || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{eq.equipment_types?.name || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {eq.installation_date ? format(new Date(eq.installation_date), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{eq.equipment_lifespan || '-'}</td>
                        <td className="px-4 py-3">
                          {eq.last_health_percentage !== null ? `${Number(eq.last_health_percentage).toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(status)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {eq.updated_at ? format(new Date(eq.updated_at), 'dd/MM/yyyy HH:mm') : (eq.created_at ? format(new Date(eq.created_at), 'dd/MM/yyyy HH:mm') : '-')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => { setSelectedEquipment(eq); setIsEditModalOpen(true); }}
                          >
                            <Edit className="w-4 h-4 mr-1" /> Editar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <span>Exibindo {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems}</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
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

      <EditEquipmentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        equipment={selectedEquipment} 
        onSuccess={fetchEquipments}
      />
    </Card>
  );
};

export default DevicesTabEquipmentList;