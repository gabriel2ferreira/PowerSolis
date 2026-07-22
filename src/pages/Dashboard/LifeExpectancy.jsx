import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import {
  Activity, Thermometer, PlusCircle, Settings, Server
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, ReferenceLine, Legend
} from 'recharts';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useLifeExpectancySync } from '@/hooks/useLifeExpectancySync';
import LifeExpectancyDegradationChart from '@/components/dashboard/LifeExpectancyDegradationChart';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';
import { getAllEquipmentsBasic } from '@/utils/equipmentDataMapper';

import { getHotspotHistory } from '@/services/hotspotHistoryService';
import { getAccelerationFactorHistory } from '@/services/accelerationFactorHistoryService';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const toValidNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const getUltimaTemperaturaOperacional = (raw) => {
  const thermal30d = raw?.thermalData30d || [];
  const thermalAll = raw?.thermalDataAll || [];
  const historyData = raw?.historyData || [];

  const lastThermal30d = thermal30d.length > 0 ? thermal30d[thermal30d.length - 1] : null;
  const lastThermalAll = thermalAll.length > 0 ? thermalAll[thermalAll.length - 1] : null;
  const lastHistory = historyData.length > 0 ? historyData[historyData.length - 1] : null;

  const thermalSource = lastThermal30d || lastThermalAll;

  if (thermalSource) {
    const hotspot = toValidNumber(thermalSource.hot_spot_temperature);
    const ambient = toValidNumber(thermalSource.ambient_temperature);
    if (hotspot !== null) return hotspot;
    if (ambient !== null) return ambient;
  }

  if (lastHistory) {
    const histTemp = toValidNumber(lastHistory.temperature);
    if (histTemp !== null) return histTemp;
  }

  return null;
};

const LifeExpectancy = () => {
  const [equipments, setEquipments] = useState([]);
  const [selectedId, setSelectedId] = useState('all');
  const [loadingList, setLoadingList] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [hotspotChartData, setHotspotChartData] = useState([]);
  const [faChartData, setFaChartData] = useState([]);

  useEffect(() => {
    const fetchEquipments = async () => {
      setLoadingList(true);
      setFetchError(null);
      try {
        const data = await getAllEquipmentsBasic(true);

        const equipmentsWithHealth = data.map(eq => {
          const healthData = calculateEquipmentHealth(eq);
          return {
            ...eq,
            health: healthData,
            statusObj: {
              status: healthData.status,
              color: healthData.color,
              healthPercentage: healthData.percentage
            }
          };
        });

        setEquipments(equipmentsWithHealth);
      } catch (error) {
        console.error('Error fetching equipments:', error);
        setFetchError(error.message || 'Erro ao carregar dados dos equipamentos.');
      } finally {
        setLoadingList(false);
      }
    };
    fetchEquipments();
  }, []);

  const {
    loading: loadingData,
    error: syncError,
    stats,
    raw
  } = useLifeExpectancySync(selectedId === 'all' ? null : selectedId);

  useEffect(() => {
    let isMounted = true;
    const fetchHistories = async () => {
      if (selectedId && selectedId !== 'all') {
        const [hsData, fData] = await Promise.all([
          getHotspotHistory(selectedId, 30),
          getAccelerationFactorHistory(selectedId, 30)
        ]);

        if (isMounted) {
          setHotspotChartData(hsData.map(d => ({
            date: format(new Date(d.timestamp), 'dd/MM/yyyy HH:mm'),
            Temperatura: Number(d.temperatura_hotspot)
          })));

          setFaChartData(fData.map(d => ({
            date: format(new Date(d.timestamp), 'dd/MM/yyyy HH:mm'),
            fA: Number(d.fator_aceleracao)
          })));
        }
      } else {
        if (isMounted) {
          setHotspotChartData([]);
          setFaChartData([]);
        }
      }
    };
    fetchHistories();
    return () => { isMounted = false; };
  }, [selectedId]);

  const selectedEquipment = equipments.find(eq => eq.id === selectedId);
  const currentHealth = selectedEquipment?.health || {
    percentage: 0,
    status: 'N/A',
    color: '#94a3b8',
    vidaRemanescenteAnos: 0,
    fatorAceleracao: 1.0
  };

  const temperaturaAtual = getUltimaTemperaturaOperacional(raw);

  return (
    <DashboardLayout>
      <Helmet>
        <title>Previsão de Vida Útil - Power Solis</title>
      </Helmet>

      <div className="space-y-6 max-w-7xl mx-auto pb-10 text-slate-100">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Previsão de Vida Útil</h1>
            <p className="text-slate-400 mt-1">Acompanhe a degradação e vida remanescente da sua frota.</p>
          </div>

          <div className="w-full md:w-auto shrink-0">
            {loadingList ? (
              <Skeleton className="h-10 w-full md:w-[280px] bg-slate-800" />
            ) : (
              <Select value={selectedId} onValueChange={setSelectedId} disabled={loadingData && selectedId !== 'all'}>
                <SelectTrigger className="w-full md:w-[280px] bg-slate-900 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                  <SelectItem value="all" className="focus:bg-slate-800 focus:text-white font-bold border-b border-slate-800 mb-1">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-400" />
                      Todos os Equipamentos
                    </div>
                  </SelectItem>
                  {equipments.map(eq => (
                    <SelectItem key={eq.id} value={eq.id} className="focus:bg-slate-800 focus:text-white">
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {fetchError ? (
          <div className="text-center p-12 bg-red-900/20 rounded-lg border border-red-800 text-red-400">
            Erro ao carregar dados: {fetchError}
          </div>
        ) : loadingList ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-[104px] w-full bg-slate-800 rounded-lg" />
            ))}
          </div>
        ) : equipments.length === 0 ? (
          <div className="text-center p-12 bg-slate-900 rounded-lg border border-slate-800 text-slate-400">
            Nenhum equipamento encontrado na base de dados.
          </div>
        ) : selectedId === 'all' ? (
          <div className="space-y-4">
            {equipments.map((eq) => (
              <Card
                key={eq.id}
                className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
                onClick={() => setSelectedId(eq.id)}
              >
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 w-full sm:w-1/2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors truncate">{eq.name}</h3>
                      <Badge style={{ backgroundColor: eq.health.color, color: 'white' }} className="border-none whitespace-nowrap">
                        {eq.health.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 truncate">
                      {eq.location_name || 'Sem localização'} • {eq.equipment_types?.name || 'Desconhecido'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Instalação: {eq.installation_date ? format(new Date(eq.installation_date), 'dd/MM/yyyy') : '-'}
                    </p>
                  </div>

                  <div className="w-full sm:w-1/3 flex flex-col gap-2 shrink-0">
                    <div className="flex justify-between text-xs font-medium text-slate-400">
                      <span>Vida Remanescente: {eq.health?.vidaRemanescenteAnos?.toFixed(1) || '0.0'} anos</span>
                      <span className="text-white font-bold">{Number(eq.health.percentage).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="h-full transition-all duration-500" style={{ width: `${eq.health.percentage}%`, backgroundColor: eq.health.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : loadingData || !stats ? (
          <div className="grid gap-6">
            <Skeleton className="h-[200px] w-full bg-slate-800" />
            <Skeleton className="h-[120px] w-full bg-slate-800" />
            <Skeleton className="h-[400px] w-full bg-slate-800" />
          </div>
        ) : syncError ? (
          <div className="text-center p-12 bg-red-900/20 rounded-lg border border-red-800 text-red-400">
            Erro ao processar dados do equipamento: {syncError}
          </div>
        ) : (
          <div className="space-y-6">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <Card className="lg:col-span-2 bg-slate-900 border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Activity className="w-32 h-32 text-blue-500" />
                </div>
                <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <p className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Saúde do Equipamento</p>
                    <div className="flex items-baseline gap-4 mb-2">
                      <h2 className="text-6xl font-bold tracking-tighter" style={{ color: currentHealth.color }}>
                        {currentHealth.percentage.toFixed(1)}%
                      </h2>
                      <Badge
                        className="text-sm px-3 py-1 uppercase tracking-wider font-bold text-white border-none"
                        style={{ backgroundColor: currentHealth.color }}
                      >
                        {currentHealth.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 w-full md:w-auto">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <p className="text-slate-400 text-xs uppercase mb-1">Perda de Vida (LOL)</p>
                      <p className="text-xl font-semibold text-white">{(100 - currentHealth.percentage).toFixed(2)}%</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <p className="text-slate-400 text-xs uppercase mb-1">Última Leitura</p>
                      <p className="text-sm font-semibold text-white mt-1">
                        {stats.lastReadingDate ? format(stats.lastReadingDate, 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-1 bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                    Estatísticas (30 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
                    <span className="text-slate-400 flex items-center gap-2"><Thermometer className="w-4 h-4 text-red-500" /> Pico</span>
                    <span className="text-xl font-bold text-red-400">{stats.peakTemp > 0 ? stats.peakTemp.toFixed(1) : '0.0'}°C</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
                    <span className="text-slate-400 flex items-center gap-2"><Thermometer className="w-4 h-4 text-yellow-500" /> Média</span>
                    <span className="text-xl font-bold text-blue-400">{stats.averageTemp > 0 ? stats.averageTemp.toFixed(1) : '0.0'}°C</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
                    <span className="text-slate-400 flex items-center gap-2"><Thermometer className="w-4 h-4 text-blue-500" /> Mínima</span>
                    <span className="text-slate-300 font-bold text-xl">{stats.minTemp > 0 ? stats.minTemp.toFixed(1) : '0.0'}°C</span>
                  </div>
                </CardContent>
              </Card>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

              <Card
                className="bg-slate-900 border-t-4 border-l-0 border-r-0 border-b-0 border-slate-800 shadow-sm"
                style={{ borderTopColor: currentHealth.color }}
              >
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Saúde Atual</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold" style={{ color: currentHealth.color }}>
                      {currentHealth.percentage.toFixed(1)}%
                    </span>
                    <Badge
                      className="text-[10px] text-white border-none"
                      style={{ backgroundColor: currentHealth.color }}
                    >
                      {currentHealth.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-t-4 border-l-0 border-r-0 border-b-0 border-slate-800 border-t-blue-500/50 shadow-sm">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Instalação</p>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-white">{stats.instDateStr}</span>
                    <span className={`text-xs font-medium mt-1 ${stats.isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                      ● {stats.isExpired ? 'Expirado' : 'Ativo'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-t-4 border-l-0 border-r-0 border-b-0 border-slate-800 border-t-orange-500/50 shadow-sm">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Temp. Hotspot Interna (°C)</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">
                      {temperaturaAtual !== null ? `${temperaturaAtual.toFixed(1)}°C` : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className={`bg-slate-900 border-t-4 border-l-0 border-r-0 border-b-0 border-slate-800 shadow-sm ${currentHealth.fatorAceleracao > 1 ? 'border-t-red-500/50' : 'border-t-green-500/50'}`}>
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Fator de Acel. (fA)</p>
                  <div className="flex flex-col items-start gap-1">
                    <span className={`text-2xl font-bold ${currentHealth.fatorAceleracao > 1 ? 'text-red-500' : 'text-green-500'}`}>{currentHealth.fatorAceleracao.toFixed(2)}x</span>
                    <Badge className={`${currentHealth.fatorAceleracao > 1 ? 'bg-red-500' : 'bg-green-500'} text-[10px] text-white border-none`}>
                      {currentHealth.fatorAceleracao > 1 ? 'Crítico' : 'Normal'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-t-4 border-l-0 border-r-0 border-b-0 border-slate-800 border-t-purple-500/50 shadow-sm">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Fim de Vida Previsto</p>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-white">{stats.expectedEndOfLifeStr}</span>
                    <span className="text-xs text-slate-500 mt-1">
                      {currentHealth.vidaRemanescenteAnos.toFixed(1)} anos restantes
                    </span>
                  </div>
                </CardContent>
              </Card>

            </div>

            <Tabs defaultValue="lifespan" className="w-full">
              <TabsList className="bg-slate-900 border-b border-slate-800 w-full justify-start rounded-none h-auto p-0 flex-wrap">
                <TabsTrigger
                  value="lifespan"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-slate-400 px-6 py-3"
                >
                  Degradação e Gráficos
                </TabsTrigger>
                <TabsTrigger
                  value="historico"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-slate-400 px-6 py-3"
                >
                  Histórico de Manutenção
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lifespan" className="mt-6 space-y-6 outline-none">

                <LifeExpectancyDegradationChart
                  equipment={raw.equipment}
                  historyData={raw.historyData}
                  expectedEndOfLifeDate={stats.expectedEndOfLifeDate}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
                        <Thermometer className="w-5 h-5 text-orange-500" />
                        Histórico de Temperatura
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hotspotChartData.length === 0 ? (
                        <div className="h-[250px] flex items-center justify-center text-slate-500">
                          Nenhum dado térmico disponível.
                        </div>
                      ) : (
                        <div className="h-[250px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={hotspotChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}°`} domain={['auto', 'auto']} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                itemStyle={{ color: '#ef4444' }}
                                formatter={(value) => [`${value}°C`, 'Temp. Hotspot (°C)']}
                              />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="Temperatura"
                                name="Temp. Hotspot (°C)"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6, fill: '#ef4444' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-slate-200 text-lg">Evolução do Fator de Aceleração (fA)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {faChartData.length === 0 ? (
                        <div className="h-[250px] flex items-center justify-center text-slate-500">
                          Sem dados de Fator de Aceleração para exibir.
                        </div>
                      ) : (
                        <div className="h-[250px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={faChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                itemStyle={{ color: '#3b82f6' }}
                                formatter={(value) => [value.toFixed(2), 'Fator de Aceleração (fA)']}
                              />
                              <Legend />
                              <ReferenceArea y1={0} y2={1.0} fill="#22c55e" fillOpacity={0.05} />
                              <ReferenceArea y1={1.0} y2={1.5} fill="#eab308" fillOpacity={0.05} />
                              <ReferenceArea y1={1.5} y2={10} fill="#ef4444" fillOpacity={0.05} />
                              <ReferenceLine y={1.0} stroke="#eab308" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Atenção (> 1.0)', fill: '#64748b', fontSize: 11 }} />
                              <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Crítico (> 1.5)', fill: '#64748b', fontSize: 11 }} />
                              <Line
                                type="monotone"
                                dataKey="fA"
                                name="Fator de Aceleração (fA)"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6, fill: '#3b82f6' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="historico" className="mt-6 space-y-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-slate-200">
                      <Settings className="w-5 h-5 text-blue-500" /> Histórico de Manutenção
                    </CardTitle>
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white shadow hover:bg-blue-700 h-9 px-4 py-2">
                      <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Nota
                    </button>
                  </CardHeader>
                  <CardContent>
                    {raw.maintenanceData.length === 0 ? (
                      <div className="text-center p-8 text-slate-500 border border-slate-800 rounded-lg bg-slate-800/30">
                        Nenhum registro de manutenção encontrado.
                      </div>
                    ) : (
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                        {raw.maintenanceData.map((record) => (
                          <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 text-slate-400 group-[.is-active]:bg-blue-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                              <Activity className="w-4 h-4" />
                            </div>

                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-slate-700 bg-slate-800/50 shadow-sm">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-bold text-slate-200 capitalize">
                                  {record.field_name || 'Manutenção'}
                                </div>
                                <time className="text-xs font-medium text-slate-400">
                                  {record.changed_at ? format(new Date(record.changed_at), 'dd/MM/yyyy HH:mm') : ''}
                                </time>
                              </div>

                              {record.change_type === 'maintenance_note' ? (
                                <div className="text-sm text-slate-300 mt-2 bg-slate-900/50 p-3 rounded-md italic">
                                  "{record.new_value}"
                                </div>
                              ) : (
                                <div className="text-sm text-slate-400 mt-2 grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-xs font-semibold block mb-1 text-slate-500">Anterior</span>
                                    <Badge variant="outline" className="border-slate-600 text-slate-300">{record.old_value || '-'}</Badge>
                                  </div>
                                  <div>
                                    <span className="text-xs font-semibold block mb-1 text-slate-500">Atual</span>
                                    <Badge className="bg-slate-700 text-slate-200 hover:bg-slate-600">{record.new_value || '-'}</Badge>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default LifeExpectancy;