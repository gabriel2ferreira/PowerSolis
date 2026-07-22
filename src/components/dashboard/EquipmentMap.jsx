import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';

// Fix for default marker icons in Leaflet when using Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom component to handle auto-centering the map bounds
const MapBounds = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (locations && locations.length > 0) {
      const validLocations = locations.filter(
        loc => loc.latitude && loc.longitude && !isNaN(loc.latitude) && !isNaN(loc.longitude)
      );

      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(
          validLocations.map(loc => [parseFloat(loc.latitude), parseFloat(loc.longitude)])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [locations, map]);

  return null;
};

// Custom HTML icon based on status
const createStatusIcon = (status) => {
  let bgColor = 'bg-blue-500'; // default
  
  if (status?.toLowerCase() === 'bom') bgColor = 'bg-green-500';
  else if (status?.toLowerCase() === 'atenção' || status?.toLowerCase() === 'atencao') bgColor = 'bg-yellow-500';
  else if (status?.toLowerCase() === 'crítico' || status?.toLowerCase() === 'critico') bgColor = 'bg-red-500';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div class="w-5 h-5 rounded-full border-2 border-white shadow-md ${bgColor} flex items-center justify-center"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

const EquipmentMap = ({ locations = [], loading = false, error = null }) => {
  const [selectedStatus, setSelectedStatus] = useState('all');

  const statuses = useMemo(() => {
    const uniqueStatuses = new Set(locations.map(loc => loc.status || 'Desconhecido'));
    return ['all', ...Array.from(uniqueStatuses)];
  }, [locations]);

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const hasCoords = loc.latitude !== null && loc.longitude !== null && !isNaN(loc.latitude) && !isNaN(loc.longitude);
      const matchesStatus = selectedStatus === 'all' || (loc.status || 'Desconhecido') === selectedStatus;
      return hasCoords && matchesStatus;
    });
  }, [locations, selectedStatus]);

  const missingCoordinatesCount = locations.length - filteredLocations.length;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>Falha ao carregar o mapa: {error}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="h-full min-h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const defaultCenter = [-14.2350, -51.9253]; // Center of Brazil

  return (
    <Card className="w-full h-full flex flex-col border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 dark:bg-slate-900/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-primary" />
          Mapa de Equipamentos
        </CardTitle>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>
                {status === 'all' ? 'Todos os Status' : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent className="flex-1 relative p-0 overflow-hidden min-h-[400px]">
        {missingCoordinatesCount > 0 && (
          <div className="absolute top-2 right-2 z-[1000] bg-yellow-100 dark:bg-yellow-900/80 text-yellow-800 dark:text-yellow-200 text-xs px-3 py-2 rounded-md shadow-md flex items-center gap-2 border border-yellow-200 dark:border-yellow-800 backdrop-blur-sm">
            <AlertCircle className="w-4 h-4" />
            {missingCoordinatesCount} equipamento(s) sem coordenadas válidas
          </div>
        )}

        <MapContainer 
          center={defaultCenter} 
          zoom={4} 
          style={{ width: '100%', height: '100%', minHeight: '400px', zIndex: 10 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBounds locations={filteredLocations} />

          {filteredLocations.map((loc) => {
            const position = [parseFloat(loc.latitude), parseFloat(loc.longitude)];
            const icon = createStatusIcon(loc.status);
            
            // Format health for display
            let healthDisplay = 'N/A';
            let healthColor = 'text-slate-500';
            
            // Prefer healthWorstCase or nested percentage from unified logic
            const healthVal = loc.healthWorstCase ?? loc.health?.percentage ?? loc.health_percentage ?? loc.vida_util;
            if (healthVal !== undefined && healthVal !== null) {
              healthDisplay = `${Number(healthVal).toFixed(1)}%`;
              if (healthVal <= 30) healthColor = 'text-red-500';
              else if (healthVal <= 70) healthColor = 'text-yellow-500';
              else healthColor = 'text-green-500';
            }

            return (
              <Marker 
                key={loc.id} 
                position={position} 
                icon={icon}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[220px]">
                    <h3 className="font-bold text-base border-b pb-2 mb-2 text-slate-900 dark:text-slate-900">
                      {loc.name}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Status:</span>
                        <Badge variant="outline" className={`${
                          loc.status?.toLowerCase() === 'bom' ? 'border-green-500 text-green-700 bg-green-50' : 
                          loc.status?.toLowerCase() === 'atenção' || loc.status?.toLowerCase() === 'atencao' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : 
                          loc.status?.toLowerCase() === 'crítico' || loc.status?.toLowerCase() === 'critico' ? 'border-red-500 text-red-700 bg-red-50' : ''
                        }`}>
                          {loc.status || 'Desconhecido'}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Saúde (Pior Caso):</span>
                        <span className={`font-bold ${healthColor}`}>{healthDisplay}</span>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <p><span className="font-semibold">Local:</span> {loc.cidade || loc.city || '-'}, {loc.estado || loc.state || '-'}</p>
                        <p><span className="font-semibold">Subestação:</span> {loc.subestacao || loc.substation_id || '-'}</p>
                      </div>

                      <div className="pt-1 border-t border-slate-100 text-xs text-slate-500">
                        <span className="font-semibold">Coord:</span> {position[0].toFixed(4)}, {position[1].toFixed(4)}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </CardContent>
    </Card>
  );
};

export default EquipmentMap;