import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { HardDrive, PlusCircle, Search, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import EquipmentDashboard from '@/components/equipment/EquipmentDashboard';
import CreateEquipment from '@/components/equipment/CreateEquipment';
import SearchEquipment from '@/components/equipment/SearchEquipment';
import EquipmentDetails from '@/components/equipment/EquipmentDetails';

const EquipmentManagement = () => {
  const [equipmentTab, setEquipmentTab] = useState(() => {
  return localStorage.getItem('equipment_management_tab') || 'dashboard';
  })
  const handleTabChange = (value) => {
  setEquipmentTab(value);
  localStorage.setItem('equipment_management_tab', value);
  };

  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);

  return (
    <Layout>
      <Helmet>
        <title>Gestão de Ativos - Power Solis</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Ativos</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus equipamentos.</p>
        </div>

        <Tabs value={equipmentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="search"><Search className="w-4 h-4 mr-2" /> Buscar</TabsTrigger>
            <TabsTrigger value="create"><PlusCircle className="w-4 h-4 mr-2" /> Criar</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedEquipmentId} className={!selectedEquipmentId ? "opacity-50 cursor-not-allowed" : ""}>
              <Settings className="w-4 h-4 mr-2" /> Detalhes
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="dashboard"><EquipmentDashboard /></TabsContent>
            <TabsContent value="search">
              <SearchEquipment onViewDetails={(id) => { setSelectedEquipmentId(id); setEquipmentTab("details"); }} />
            </TabsContent>
            <TabsContent value="create"><CreateEquipment onComplete={() => setEquipmentTab("search")} /></TabsContent>
            <TabsContent value="details">
              {selectedEquipmentId && <EquipmentDetails equipmentId={selectedEquipmentId} onBack={() => setEquipmentTab("search")} />}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EquipmentManagement;