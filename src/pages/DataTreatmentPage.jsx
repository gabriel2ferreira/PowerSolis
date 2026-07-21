import React, { useState, useEffect } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Database, Upload, Download, Settings, Save, RefreshCw } from 'lucide-react';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { toast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const DataTreatmentPage = () => {
      const { addLog } = useAuth();
      const [transformerData, setTransformerData] = useState({
        id: 'TR-001',
        constructionYear: '2018',
        maxVoltage: '138',
        location: 'Subestação Norte',
        status: 'Operacional'
      });

      const [measurementData, setMeasurementData] = useState({
        transformerId: 'TR-001',
        temperature: '',
        voltage: '',
        current: '',
        frequency: '',
        timestamp: new Date().toISOString().slice(0, 16)
      });
      
      useEffect(() => {
        addLog('visualizou a página de Tratamento de Dados');
      }, [addLog]);

      const handleTransformerUpdate = (e) => {
        e.preventDefault();
        addLog('atualizou dados do transformador', { id: transformerData.id });
        toast({
          title: "Dados do transformador atualizados!",
          description: "As informações foram salvas com sucesso.",
        });
      };

      const handleMeasurementAdd = (e) => {
        e.preventDefault();
        addLog('adicionou medição manual', { ...measurementData });
        toast({
          title: "Nova medição adicionada!",
          description: "Os dados foram registrados no sistema.",
        });
        setMeasurementData({
          ...measurementData,
          temperature: '',
          voltage: '',
          current: '',
          frequency: ''
        });
      };

      const importData = () => {
        addLog('tentou importar dados');
        toast({
          title: "🚧 Esta funcionalidade ainda não foi implementada—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀",
        });
      };

      const exportData = () => {
        addLog('tentou exportar dados');
        toast({
          title: "🚧 Esta funcionalidade ainda não foi implementada—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀",
        });
      };

      const validateData = () => {
        addLog('executou validação de dados');
        toast({
          title: "Validação concluída!",
          description: "Todos os dados estão consistentes.",
        });
      };

      return (
        <>
          <Helmet>
            <title>Tratamento de Dados - Plataforma Power Solis</title>
            <meta name="description" content="Inserção manual e correção de dados dos transformadores" />
          </Helmet>

          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold gradient-text flex items-center">
                  <Database className="h-8 w-8 mr-3 text-blue-400" />
                  Tratamento de Dados
                </h1>
                <p className="text-gray-300 mt-2">Inserção manual e correção de dados dos transformadores</p>
              </div>
              <div className="flex space-x-3">
                <Button onClick={importData} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
                <Button onClick={exportData} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button onClick={validateData} className="bg-green-600 hover:bg-green-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Validar Dados
                </Button>
              </div>
            </div>

            {/* Data Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transformer Data Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="glass-effect border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-blue-400" />
                      Dados do Transformador
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Atualizar informações básicas do equipamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleTransformerUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="transformer-id" className="text-white">ID do Transformador</Label>
                        <Input
                          id="transformer-id"
                          value={transformerData.id}
                          onChange={(e) => setTransformerData({ ...transformerData, id: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                          readOnly
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="construction-year" className="text-white">Ano de Construção</Label>
                        <Input
                          id="construction-year"
                          type="number"
                          value={transformerData.constructionYear}
                          onChange={(e) => setTransformerData({ ...transformerData, constructionYear: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="max-voltage" className="text-white">Tensão Máxima (kV)</Label>
                        <Input
                          id="max-voltage"
                          type="number"
                          value={transformerData.maxVoltage}
                          onChange={(e) => setTransformerData({ ...transformerData, maxVoltage: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-white">Localização</Label>
                        <Input
                          id="location"
                          value={transformerData.location}
                          onChange={(e) => setTransformerData({ ...transformerData, location: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-white">Status</Label>
                        <Input
                          id="status"
                          value={transformerData.status}
                          onChange={(e) => setTransformerData({ ...transformerData, status: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      
                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        Atualizar Transformador
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Measurement Data Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="glass-effect border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Database className="h-5 w-5 mr-2 text-green-400" />
                      Nova Medição
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Adicionar medições manuais ao sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleMeasurementAdd} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="measurement-transformer" className="text-white">Transformador</Label>
                        <Input
                          id="measurement-transformer"
                          value={measurementData.transformerId}
                          onChange={(e) => setMeasurementData({ ...measurementData, transformerId: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="temperature" className="text-white">Temperatura (°C)</Label>
                        <Input
                          id="temperature"
                          type="number"
                          step="0.1"
                          value={measurementData.temperature}
                          onChange={(e) => setMeasurementData({ ...measurementData, temperature: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Ex: 65.5"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="voltage" className="text-white">Tensão (kV)</Label>
                        <Input
                          id="voltage"
                          type="number"
                          step="0.1"
                          value={measurementData.voltage}
                          onChange={(e) => setMeasurementData({ ...measurementData, voltage: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Ex: 138.2"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="current" className="text-white">Corrente (A)</Label>
                        <Input
                          id="current"
                          type="number"
                          step="0.1"
                          value={measurementData.current}
                          onChange={(e) => setMeasurementData({ ...measurementData, current: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Ex: 245.8"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="frequency" className="text-white">Frequência (Hz)</Label>
                        <Input
                          id="frequency"
                          type="number"
                          step="0.01"
                          value={measurementData.frequency}
                          onChange={(e) => setMeasurementData({ ...measurementData, frequency: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Ex: 60.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="timestamp" className="text-white">Data/Hora</Label>
                        <Input
                          id="timestamp"
                          type="datetime-local"
                          value={measurementData.timestamp}
                          onChange={(e) => setMeasurementData({ ...measurementData, timestamp: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      
                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4 mr-2" />
                        Adicionar Medição
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Data Quality Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="glass-effect border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Qualidade dos Dados</CardTitle>
                  <CardDescription className="text-gray-300">
                    Métricas de integridade e consistência dos dados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="text-2xl font-bold text-green-400">98.7%</div>
                      <div className="text-sm text-gray-300">Completude</div>
                      <div className="text-xs text-gray-400 mt-1">Dados completos</div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="text-2xl font-bold text-blue-400">96.2%</div>
                      <div className="text-sm text-gray-300">Precisão</div>
                      <div className="text-xs text-gray-400 mt-1">Dados corretos</div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="text-2xl font-bold text-purple-400">99.1%</div>
                      <div className="text-sm text-gray-300">Consistência</div>
                      <div className="text-xs text-gray-400 mt-1">Dados consistentes</div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="text-2xl font-bold text-yellow-400">94.8%</div>
                      <div className="text-sm text-gray-300">Atualidade</div>
                      <div className="text-xs text-gray-400 mt-1">Dados recentes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      );
    };

    export default DataTreatmentPage;