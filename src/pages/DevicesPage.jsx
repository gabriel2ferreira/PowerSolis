import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Cpu, PlusCircle, Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import DevicesList from '@/components/devices/DevicesList';
import DeviceDetails from '@/components/devices/DeviceDetails';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const DevicesPage = () => {
  const navigate = useNavigate();
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  const handleViewDetails = (deviceId) => {
    setSelectedDeviceId(deviceId);
    setViewMode('details');
  };

  const handleBackToList = () => {
    setSelectedDeviceId(null);
    setViewMode('list');
  };

  const handleDeviceDeleted = () => {
    setViewMode('list');
  };

  return (
    <Layout>
      <Helmet>
        <title>Dispositivos - Power Solis</title>
        <meta name="description" content="Gerencie todos os seus dispositivos e equipamentos elétricos em um só lugar" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Home className="w-4 h-4" />
              <ChevronRight className="w-4 h-4" />
              <span>Dispositivos</span>
            </div>
            <h1 className="heading-lg flex items-center gap-3">
              <Cpu className="w-8 h-8 text-primary" />
              Dispositivos
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualize e gerencie todos os seus dispositivos cadastrados
            </p>
          </div>
          
          {viewMode === 'list' && (
            <Button onClick={() => navigate('/equipment?tab=create')} size="lg">
              <PlusCircle className="w-5 h-5 mr-2" />
              Novo Dispositivo
            </Button>
          )}
        </div>

        {viewMode === 'list' ? (
          <DevicesList onViewDetails={handleViewDetails} />
        ) : (
          <DeviceDetails
            deviceId={selectedDeviceId}
            onBack={handleBackToList}
            onDeleted={handleDeviceDeleted}
          />
        )}
      </motion.div>
    </Layout>
  );
};

export default DevicesPage;