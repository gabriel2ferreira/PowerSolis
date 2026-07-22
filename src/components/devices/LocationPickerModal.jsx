import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const mapContainerStyle = { width: '100%', height: '400px' };
const defaultCenter = { lat: -23.5505, lng: -46.6333 }; // São Paulo

const LocationPickerModal = ({ isOpen, onClose, onSelect, initialLocation, isLoaded }) => {
  const [selectedLoc, setSelectedLoc] = useState(defaultCenter);

  useEffect(() => {
    if (isOpen) {
      if (initialLocation && initialLocation.lat && initialLocation.lng) {
        setSelectedLoc({
          lat: Number(initialLocation.lat),
          lng: Number(initialLocation.lng)
        });
      } else {
        setSelectedLoc(defaultCenter);
      }
    }
  }, [isOpen, initialLocation]);

  const onMapClick = useCallback((e) => {
    setSelectedLoc({
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    });
  }, []);

  const handleConfirm = () => {
    onSelect(selectedLoc);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Selecione a Localização</DialogTitle>
          <DialogDescription>
            Clique no mapa para definir a localização do dispositivo.
          </DialogDescription>
        </DialogHeader>
        <div className="p-2 border rounded-md overflow-hidden bg-muted">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={selectedLoc}
              zoom={10}
              onClick={onMapClick}
              options={{ streetViewControl: false, mapTypeControl: false }}
            >
              <Marker position={selectedLoc} />
            </GoogleMap>
          ) : (
            <div className="h-[400px] flex items-center justify-center">
              Carregando mapa...
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar Localização</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPickerModal;