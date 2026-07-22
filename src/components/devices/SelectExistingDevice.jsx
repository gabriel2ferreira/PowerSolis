import React, { useState, useEffect } from 'react';
import { Search, Loader2, Cpu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const SelectExistingDevice = ({ onSelect, onCancel }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('*, equipment_types(name)')
        .order('name');

      if (error) throw error;
      setDevices(data || []);
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = () => {
    if (selectedDevice) {
      onSelect(selectedDevice);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="device-modal-overlay"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="device-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="device-modal-header">
            <div className="flex items-center justify-between">
              <h2 className="heading-md flex items-center gap-2">
                <Cpu className="w-6 h-6 text-primary" />
                Selecionar Dispositivo Existente
              </h2>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Escolha o dispositivo onde os dados do relatório serão adicionados
            </p>
          </div>

          <div className="device-modal-body space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar dispositivo por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="device-empty-state">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Cpu className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {devices.length === 0
                    ? 'Nenhum dispositivo cadastrado.'
                    : 'Nenhum dispositivo encontrado com esse nome.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredDevices.map((device) => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedDevice?.id === device.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{device.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {device.equipment_types?.name && (
                            <span className="text-xs bg-secondary px-2 py-1 rounded">
                              {device.equipment_types.name}
                            </span>
                          )}
                          {device.voltage_level && (
                            <span className="text-xs bg-secondary px-2 py-1 rounded">
                              {device.voltage_level} kV
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedDevice?.id === device.id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="device-modal-footer">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedDevice}>
              Confirmar Seleção
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SelectExistingDevice;