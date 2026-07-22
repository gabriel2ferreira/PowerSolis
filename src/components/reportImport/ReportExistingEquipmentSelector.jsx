import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';

const ReportExistingEquipmentSelector = ({ extractedData, fileName, onBack, onPreview }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [equipments, setEquipments] = useState([]);
  const [filteredEquipments, setFilteredEquipments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  useEffect(() => {
    loadEquipments();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = equipments.filter(eq =>
        eq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.substation_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEquipments(filtered);
    } else {
      setFilteredEquipments(equipments);
    }
  }, [searchTerm, equipments]);

  useEffect(() => {
    if (selectedEquipmentId) {
      const equipment = equipments.find(eq => eq.id === selectedEquipmentId);
      loadFullEquipmentDetails(equipment);
    } else {
      setSelectedEquipment(null);
    }
  }, [selectedEquipmentId, equipments]);

  const loadEquipments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('equipments')
      .select('id, name, substation_id, equipment_types(name)')
      .order('name');

    if (!error && data) {
      setEquipments(data);
      setFilteredEquipments(data);
    }
    setIsLoading(false);
  };

  const loadFullEquipmentDetails = async (baseEquipment) => {
    // Fetch base fields + custom fields to get full current picture
    const { data: eqData } = await supabase.from('equipments').select('*').eq('id', baseEquipment.id).single();
    const { data: cfData } = await supabase.from('custom_fields').select('*').eq('equipment_id', baseEquipment.id);
    
    let fullEq = { ...eqData };
    if (cfData) {
      cfData.forEach(cf => {
        fullEq[cf.field_name] = cf.observations;
      });
    }
    setSelectedEquipment(fullEq);
  };

  const handleContinue = () => {
    if (selectedEquipment) {
      onPreview(selectedEquipment, extractedData);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Buscar Equipamento Existente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pesquisar por Nome ou Subestação</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite para buscar..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Selecionar Equipamento</Label>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEquipments.map(eq => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} {eq.equipment_types?.name ? `(${eq.equipment_types.name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>

          <Button onClick={handleContinue} disabled={!selectedEquipmentId || !selectedEquipment}>
            Continuar para Revisão <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportExistingEquipmentSelector;