import React, { useState, useEffect } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Map, MapPin, Zap, AlertTriangle, CheckCircle, XCircle, Filter } from 'lucide-react';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const MapsPage = () => {
      const [selectedTransformer, setSelectedTransformer] = useState(null);
      const [filterStatus, setFilterStatus] = useState('all');
      const { addLog } = useAuth();

      useEffect(() => {
        addLog('visualizou a página de Mapas');
      }, [addLog]);

      const transformers = [
        { id: 'TR-001', name: 'Subestação Norte', lat: -23.5505, lng: -46.6333, status: 'normal', location: 'São Paulo - SP' },
        { id: 'TR-002', name: 'Subestação Sul', lat: -23.5605, lng: -46.6433, status: 'warning', location: 'São Paulo - SP' },
        { id: 'TR-003', name: 'Subestação Leste', lat: -23.5405, lng: -46.6233, status: 'critical', location: 'São Paulo - SP' },
        { id: 'TR-004', name: 'Subestação Oeste', lat: -23.5705, lng: -46.6533, status: 'normal', location: 'São Paulo - SP' },
        { id: 'TR-005', name: 'Subestação Centro', lat: -23.5455, lng: -46.6383, status: 'warning', location: 'São Paulo - SP' },
      ];

      const getStatusColor = (status) => {
        switch (status) {
          case 'normal': return 'text-green-400 bg-green-500/20 border-green-500/30';
          case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
          case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
          default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
        }
      };

      const getStatusIcon = (status) => {
        switch (status) {
          case 'normal': return CheckCircle;
          case 'warning': return AlertTriangle;
          case 'critical': return XCircle;
          default: return MapPin;
        }
      };

      const getStatusText = (status) => {
        switch (status) {
          case 'normal': return 'Normal';
          case 'warning': return 'Atenção';
          case 'critical': return 'Crítico';
          default: return 'Desconhecido';
        }
      };

      const handleFilter = (status) => {
        addLog('filtrou mapa por status', { status });
        setFilterStatus(status);
      };

      const filteredTransformers = filterStatus === 'all' 
        ? transformers 
        : transformers.filter(t => t.status === filterStatus);

      const openFullMap = () => {
        addLog('clicou em Mapa Completo');
        toast({
          title: "🚧 Esta funcionalidade ainda não foi implementada—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀",
        });
      };
      
      const handleSelectTransformer = (transformer) => {
          addLog('selecionou transformador no mapa', { id: transformer.id });
          setSelectedTransformer(transformer);
      }

      return (
        <>
          <Helmet>
            <title>Mapas de Localização - Plataforma Power Solis</title>
            <meta name="description" content="Localização e status dos transformadores em mapa interativo" />
          </Helmet>

          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold gradient-text flex items-center">
                  <Map className="h-8 w-8 mr-3 text-blue-400" />
                  Mapas de Localização
                </h1>
                <p className="text-gray-300 mt-2">Visualização geográfica dos transformadores e seus status</p>
              </div>
              <div className="flex space-x-3">
                <Button onClick={openFullMap} className="bg-blue-600 hover:bg-blue-700">
                  <Map className="h-4 w-4 mr-2" />
                  Mapa Completo
                </Button>
              </div>
            </div>

            {/* Status Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="glass-effect border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Filter className="h-5 w-5 mr-2 text-purple-400" />
                    Filtros de Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleFilter('all')}
                      variant={filterStatus === 'all' ? 'default' : 'outline'}
                      className={filterStatus === 'all' ? 'bg-blue-600' : 'border-white/20 text-white hover:bg-white/10'}
                    >
                      Todos ({transformers.length})
                    </Button>
                    <Button
                      onClick={() => handleFilter('normal')}
                      variant={filterStatus === 'normal' ? 'default' : 'outline'}
                      className={filterStatus === 'normal' ? 'bg-green-600' : 'border-white/20 text-white hover:bg-white/10'}
                    >
                      Normal ({transformers.filter(t => t.status === 'normal').length})
                    </Button>
                    <Button
                      onClick={() => handleFilter('warning')}
                      variant={filterStatus === 'warning' ? 'default' : 'outline'}
                      className={filterStatus === 'warning' ? 'bg-yellow-600' : 'border-white/20 text-white hover:bg-white/10'}
                    >
                      Atenção ({transformers.filter(t => t.status === 'warning').length})
                    </Button>
                    <Button
                      onClick={() => handleFilter('critical')}
                      variant={filterStatus === 'critical' ? 'default' : 'outline'}
                      className={filterStatus === 'critical' ? 'bg-red-600' : 'border-white/20 text-white hover:bg-white/10'}
                    >
                      Crítico ({transformers.filter(t => t.status === 'critical').length})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Map and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Interactive Map */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-2"
              >
                <Card className="glass-effect border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Mapa Interativo</CardTitle>
                    <CardDescription className="text-gray-300">
                      Clique nos marcadores para ver detalhes dos transformadores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-lg border border-white/10 relative overflow-hidden">
                      {/* Map Background */}
                      <div className="absolute inset-0 opacity-20">
                        <img 
                          className="w-full h-full object-cover" 
                          alt="Satellite map view of electrical grid infrastructure"
                         src="https://images.unsplash.com/photo-1508687234598-f154cef02480" />
                      </div>
                      
                      {/* Transformer Markers */}
                      <div className="relative w-full h-full">
                        {filteredTransformers.map((transformer, index) => {
                          const StatusIcon = getStatusIcon(transformer.status);
                          return (
                            <motion.div
                              key={transformer.id}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${getStatusColor(transformer.status)} p-2 rounded-full border-2 hover:scale-110 transition-transform`}
                              style={{
                                left: `${20 + (index * 15)}%`,
                                top: `${30 + (index * 10)}%`
                              }}
                              onClick={() => handleSelectTransformer(transformer)}
                            >
                              <StatusIcon className="h-6 w-6" />
                            </motion.div>
                          );
                        })}
                      </div>
                      
                      {/* Map Legend */}
                      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <h4 className="text-white text-sm font-semibold mb-2">Legenda</h4>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-xs text-gray-300">Normal</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-400" />
                            <span className="text-xs text-gray-300">Atenção</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <XCircle className="h-4 w-4 text-red-400" />
                            <span className="text-xs text-gray-300">Crítico</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Transformer Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="glass-effect border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">
                      {selectedTransformer ? 'Detalhes do Transformador' : 'Selecione um Transformador'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedTransformer ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Zap className="h-6 w-6 text-blue-400" />
                          <div>
                            <h3 className="text-lg font-semibold text-white">{selectedTransformer.id}</h3>
                            <p className="text-sm text-gray-300">{selectedTransformer.name}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTransformer.status)}`}>
                              {getStatusText(selectedTransformer.status)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Localização:</span>
                            <span className="text-white text-sm">{selectedTransformer.location}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Coordenadas:</span>
                            <span className="text-white text-sm">
                              {selectedTransformer.lat.toFixed(4)}, {selectedTransformer.lng.toFixed(4)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-white/20">
                          <h4 className="text-white font-semibold mb-3">Medições Recentes</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-300 text-sm">Temperatura:</span>
                              <span className="text-white text-sm">65.2°C</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300 text-sm">Tensão:</span>
                              <span className="text-white text-sm">138.5 kV</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300 text-sm">Corrente:</span>
                              <span className="text-white text-sm">245.8 A</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300 text-sm">Última atualização:</span>
                              <span className="text-white text-sm">10:30</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => addLog('clicou em Ver Histórico Completo', {transformerId: selectedTransformer.id})}>
                          Ver Histórico Completo
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-300">Clique em um marcador no mapa para ver os detalhes do transformador</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Transformers List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="glass-effect border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Lista de Transformadores</CardTitle>
                  <CardDescription className="text-gray-300">
                    Todos os transformadores monitorados ({filteredTransformers.length} de {transformers.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTransformers.map((transformer) => {
                      const StatusIcon = getStatusIcon(transformer.status);
                      return (
                        <div
                          key={transformer.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                            selectedTransformer?.id === transformer.id 
                              ? 'border-blue-500/50 bg-blue-500/10' 
                              : `${getStatusColor(transformer.status)} border-opacity-50`
                          }`}
                          onClick={() => handleSelectTransformer(transformer)}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <StatusIcon className={`h-5 w-5 ${transformer.status === 'normal' ? 'text-green-400' : transformer.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`} />
                            <div>
                              <h3 className="text-white font-semibold">{transformer.id}</h3>
                              <p className="text-sm text-gray-300">{transformer.name}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">{transformer.location}</p>
                          <div className="mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transformer.status)}`}>
                              {getStatusText(transformer.status)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      );
    };

    export default MapsPage;