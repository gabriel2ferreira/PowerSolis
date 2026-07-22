import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Activity, Settings, User } from 'lucide-react';
import AddMaintenanceNoteModal from './AddMaintenanceNoteModal';

const EquipmentMaintenanceHistory = ({ equipmentId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipment_history')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Error fetching maintenance history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (equipmentId) fetchHistory();
  }, [equipmentId]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" /> Histórico de Manutenção
        </CardTitle>
        <Button onClick={() => setIsNoteModalOpen(true)} size="sm">
          <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Nota
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/20">
            Nenhum registro de manutenção encontrado.
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
            {history.map((record) => (
              <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted text-muted-foreground group-[.is-active]:bg-primary group-[.is-active]:text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <Activity className="w-4 h-4" />
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border bg-card shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-foreground capitalize">
                      {record.field_name}
                    </div>
                    <time className="text-xs font-medium text-muted-foreground">
                      {record.changed_at ? format(new Date(record.changed_at), 'dd/MM/yyyy HH:mm') : ''}
                    </time>
                  </div>
                  
                  {record.change_type === 'maintenance_note' ? (
                    <div className="text-sm text-muted-foreground mt-2 bg-muted/30 p-3 rounded-md italic">
                      "{record.new_value}"
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs font-semibold block mb-1">Anterior</span>
                        <Badge variant="outline">{record.old_value || '-'}</Badge>
                      </div>
                      <div>
                        <span className="text-xs font-semibold block mb-1">Atual</span>
                        <Badge variant="default">{record.new_value || '-'}</Badge>
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <AddMaintenanceNoteModal 
        isOpen={isNoteModalOpen} 
        onClose={() => setIsNoteModalOpen(false)}
        equipmentId={equipmentId}
        onSuccess={fetchHistory}
      />
    </Card>
  );
};

export default EquipmentMaintenanceHistory;