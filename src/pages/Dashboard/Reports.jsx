import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { format, parseISO } from 'date-fns';
import { 
  FileText, Plus, Search, Filter, Download, 
  MoreHorizontal, Eye, Edit, Trash2, RefreshCw, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Reports = () => {
  const { toast } = useToast();
  
  // Data State
  const [reports, setReports] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Selection State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    report_name: '',
    equipment_id: '',
    report_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    status: 'completed'
  });

  // Fetch Data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch Equipments for dropdowns and types
      const { data: eqData, error: eqError } = await supabase
        .from('equipments')
        .select(`
          id, 
          name, 
          equipment_types (id, name)
        `);
      
      if (eqError) throw eqError;
      setEquipments(eqData || []);

      // Extract unique types for filters
      const types = new Set();
      eqData?.forEach(eq => {
        if (eq.equipment_types?.name) types.add(eq.equipment_types.name);
      });
      setEquipmentTypes(Array.from(types));

      // Fetch Reports
      const { data: repData, error: repError } = await supabase
        .from('reports')
        .select(`
          *,
          equipments (
            id,
            name,
            equipment_types (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (repError) throw repError;
      setReports(repData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load reports. Please try again.');
      toast({
        title: 'Error fetching data',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // 1. Search filter
      const matchesSearch = report.report_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            report.equipments?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Type filter
      const matchesType = filterType === 'all' || 
                          report.equipments?.equipment_types?.name === filterType;
      
      // 3. Status filter (Reading from report_data.status, defaulting to completed)
      const reportStatus = report.report_data?.status || 'completed';
      const matchesStatus = filterStatus === 'all' || reportStatus === filterStatus;
      
      // 4. Date range filter
      const repDate = new Date(report.report_date || report.created_at);
      const matchesDateFrom = !dateFrom || repDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || repDate <= new Date(dateTo);

      return matchesSearch && matchesType && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [reports, searchQuery, filterType, filterStatus, dateFrom, dateTo]);

  // Handlers
  const handleOpenCreate = () => {
    setFormData({
      report_name: '',
      equipment_id: '',
      report_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
      status: 'completed'
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenDetails = (report, editMode = false) => {
    setSelectedReport(report);
    setFormData({
      report_name: report.report_name || '',
      equipment_id: report.equipment_id || '',
      report_date: report.report_date ? format(new Date(report.report_date), 'yyyy-MM-dd') : '',
      notes: report.notes || '',
      status: report.report_data?.status || 'completed'
    });
    setIsEditing(editMode);
    setIsDetailsModalOpen(true);
  };

  const handleOpenDelete = (report) => {
    setSelectedReport(report);
    setIsDeleteModalOpen(true);
  };

  const handleSaveReport = async () => {
    if (!formData.report_name || !formData.equipment_id || !formData.report_date) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        report_name: formData.report_name,
        equipment_id: formData.equipment_id,
        report_date: new Date(formData.report_date).toISOString(),
        notes: formData.notes,
        report_data: { status: formData.status }
      };

      if (isEditing && selectedReport) {
        // Update
        const { error } = await supabase
          .from('reports')
          .update(payload)
          .eq('id', selectedReport.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Report updated successfully.' });
      } else {
        // Create
        const { error } = await supabase
          .from('reports')
          .insert([{ ...payload, created_by: (await supabase.auth.getUser()).data.user?.id }]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Report created successfully.' });
      }

      setIsCreateModalOpen(false);
      setIsDetailsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving report:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedReport) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', selectedReport.id);
      
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Report has been removed.' });
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error deleting report:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredReports.length === 0) {
      toast({ title: 'Notice', description: 'No reports to export.', variant: 'default' });
      return;
    }

    const headers = ['Name', 'Equipment', 'Type', 'Date', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredReports.map(r => {
        const name = `"${(r.report_name || '').replace(/"/g, '""')}"`;
        const eqName = `"${(r.equipments?.name || '').replace(/"/g, '""')}"`;
        const eqType = `"${(r.equipments?.equipment_types?.name || '').replace(/"/g, '""')}"`;
        const date = r.report_date ? format(new Date(r.report_date), 'yyyy-MM-dd') : '';
        const status = r.report_data?.status || 'completed';
        const notes = `"${(r.notes || '').replace(/"/g, '""')}"`;
        
        return [name, eqName, eqType, date, status, notes].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reports_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'Reports exported successfully.' });
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Pending</Badge>;
      case 'archived': return <Badge variant="secondary" className="bg-gray-500/10 text-gray-500 hover:bg-gray-500/20">Archived</Badge>;
      case 'completed': default: return <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Completed</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Reports - Power Solis</title>
        <meta name="description" content="View and manage equipment reports" />
      </Helmet>

      <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground tracking-tight">
              <FileText className="w-8 h-8 text-primary" />
              Reports Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage, filter, and export equipment reports.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={handleExportCSV} className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleOpenCreate} className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              Create Report
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute -top-2 left-2 bg-card px-1 text-[10px] text-muted-foreground uppercase tracking-wider">From</span>
                <Input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="relative flex-1">
                <span className="absolute -top-2 left-2 bg-card px-1 text-[10px] text-muted-foreground uppercase tracking-wider">To</span>
                <Input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {equipmentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" onClick={() => {
              setSearchQuery(''); setFilterType('all'); setFilterStatus('all'); setDateFrom(''); setDateTo('');
            }} className="w-full lg:w-auto flex items-center justify-center">
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </CardContent>
        </Card>

        {/* Data Table Section */}
        <Card className="overflow-hidden">
          {error ? (
            <div className="p-12 text-center flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load reports</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <FileText className="w-12 h-12 mb-4 opacity-20" />
                          <p className="text-lg font-medium">No reports found</p>
                          <p className="text-sm mt-1 mb-4">Try adjusting your filters or create a new report.</p>
                          <Button variant="outline" onClick={handleOpenCreate}>Create First Report</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
                      <TableRow key={report.id} className="hover:bg-muted/50 cursor-pointer group" onClick={() => handleOpenDetails(report, false)}>
                        <TableCell className="font-medium">{report.report_name || 'Unnamed Report'}</TableCell>
                        <TableCell>{report.equipments?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {report.equipments?.equipment_types?.name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {report.report_date ? format(new Date(report.report_date), 'PP') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(report.report_data?.status)}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDetails(report, false)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDetails(report, true)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDelete(report)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

      </div>

      {/* CREATE / EDIT MODAL */}
      <Dialog open={isCreateModalOpen || (isDetailsModalOpen && isEditing)} onOpenChange={(open) => {
        if (!open) { setIsCreateModalOpen(false); setIsDetailsModalOpen(false); }
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Report' : 'Create New Report'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the details for this report.' : 'Fill in the information to generate a new report record.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Report Name <span className="text-destructive">*</span></label>
              <Input 
                placeholder="e.g., Q1 Transformer Inspection" 
                value={formData.report_name}
                onChange={(e) => setFormData({...formData, report_name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Equipment <span className="text-destructive">*</span></label>
                <Select value={formData.equipment_id} onValueChange={(val) => setFormData({...formData, equipment_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipments.map(eq => (
                      <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Report Date <span className="text-destructive">*</span></label>
                <Input 
                  type="date" 
                  value={formData.report_date}
                  onChange={(e) => setFormData({...formData, report_date: e.target.value})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Add any additional observations here..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); setIsDetailsModalOpen(false); }} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveReport} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW DETAILS MODAL */}
      <Dialog open={isDetailsModalOpen && !isEditing} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Report Details</DialogTitle>
            <DialogDescription>
              Detailed view of the selected report.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="py-4 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{selectedReport.report_name || 'Unnamed Report'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created on {format(new Date(selectedReport.created_at), 'PPP')}
                  </p>
                </div>
                {getStatusBadge(selectedReport.report_data?.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Equipment</span>
                  <span className="font-medium">{selectedReport.equipments?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Equipment Type</span>
                  <span className="font-medium">{selectedReport.equipments?.equipment_types?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Report Date</span>
                  <span className="font-medium">{selectedReport.report_date ? format(new Date(selectedReport.report_date), 'PPP') : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Report ID</span>
                  <span className="font-mono text-sm">{selectedReport.id.substring(0, 8)}...</span>
                </div>
              </div>

              <div>
                <span className="text-sm font-semibold block mb-2">Notes & Observations</span>
                <div className="bg-card border border-border rounded-lg p-4 text-sm min-h-[100px] whitespace-pre-wrap">
                  {selectedReport.notes || <span className="text-muted-foreground italic">No notes provided for this report.</span>}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
            <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setIsDetailsModalOpen(false); handleOpenDelete(selectedReport); }}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" /> Edit Details
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete the report <strong>"{selectedReport?.report_name}"</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteReport} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Yes, Delete Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default Reports;