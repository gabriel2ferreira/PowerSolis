import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Edit, Download, AlertCircle, Calendar, MapPin, Tag, Activity, Settings, FileText, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import Layout from '@/components/Layout';
import { format } from 'date-fns';
import HealthHistoryChart from '@/components/equipment/HealthHistoryChart';
import EquipmentMaintenanceHistory from '@/components/equipment/EquipmentMaintenanceHistory';
import EditEquipmentModal from '@/components/equipment/EditEquipmentModal';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';
import { exportEquipmentReportPDF, exportEquipmentReportCSV } from '@/utils/exportEquipmentReport';

const EquipmentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [equipment, setEquipment] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEquipmentForEdit, setSelectedEquipmentForEdit] = useState(null);

  const fetchEquipmentData = async () => {
    setLoading(true);
    try {
      // Fetch Equipment details
      const { data, error } = await supabase
        .from('equipments')
        .select(`
          *,
          equipment_types(name),
          api_config:equipment_api_config(*),
          custom_fields:custom_fields(field_name, observations)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Ensure api_config is a flat object
      const processedData = {
        ...data,
        api_config: Array.isArray(data.api_config) ? data.api_config[0] : (data.api_config || {})
      };

      // Map custom fields to an object for easy access
      const customFieldsMap = {};
      if (Array.isArray(data.custom_fields)) {
        data.custom_fields.forEach(cf => {
          customFieldsMap[cf.field_name] = cf.observations;
        });
      }
      processedData.custom_fields = customFieldsMap;

      const healthCalc = calculateEquipmentHealth(processedData);
      
      // Augment equipment with map/export ready fields requested in Task 6
      processedData.healthFinal = healthCalc.percentage;
      processedData.healthWorstCase = healthCalc.percentage;
      processedData.status = healthCalc.status;
      processedData.remainingYears = healthCalc.vidaRemanescenteAnos;
      processedData.accelerationFactor = healthCalc.fatorAceleracao;

      setEquipment(processedData);
      setHealthData(healthCalc);

      // Fetch Histories for Exports
      const { data: hHistory } = await supabase
        .from('equipment_health_history')
        .select('*')
        .eq('equipment_id', id)
        .order('timestamp', { ascending: false });
      
      if (hHistory) setHealthHistory(hHistory);

      const { data: mHistory } = await supabase
        .from('equipment_history')
        .select('*')
        .eq('equipment_id', id)
        .order('changed_at', { ascending: false });

      if (mHistory) setMaintenanceHistory(mHistory);

    } catch (err) {
      console.error('Error fetching equipment details:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do equipamento.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipmentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEditClick = () => {
    setSelectedEquipmentForEdit(equipment);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    fetchEquipmentData();
  };

  const handleExportPDF = () => {
    if (!equipment) return;
    exportEquipmentReportPDF(equipment, healthData, healthHistory, maintenanceHistory);
    toast({ title: 'Sucesso', description: 'Relatório PDF gerado.' });
  };

  const handleExportCSV = () => {
    if (!equipment) return;
    exportEquipmentReportCSV(equipment, healthData, healthHistory, maintenanceHistory);
    toast({ title: 'Sucesso', description: 'Relatório CSV gerado.' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-[300px]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[250px] md:col-span-1" />
            <Skeleton className="h-[250px] md:col-span-2" />
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </Layout>
    );
  }

  if (!equipment || !healthData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <AlertCircle className="w-16 h-16 text-destructive" />
          <h2 className="text-2xl font-bold">Equipamento não encontrado</h2>
          <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{equipment.name || 'Detalhes do Equipamento'} - Power Solis</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{equipment.name}</h1>
                <Badge style={{ backgroundColor: healthData.color }} className="text-white hover:opacity-90">{healthData.status}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Tag className="w-4 h-4" /> {equipment.equipment_types?.name || 'Tipo não definido'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleEditClick}>
              <Edit className="w-4 h-4 mr-2" /> Editar
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
              <FileText className="w-4 h-4 mr-2" /> Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
              <TableProperties className="w-4 h-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/40 pb-4 border-b">
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Saúde e Desempenho</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Saúde (Pior Caso)</span>
                  <span className="text-3xl font-bold" style={{ color: healthData.color }}>{healthData.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${healthData.percentage}%`, backgroundColor: healthData.color }} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Vida Remanescente</p>
                  <p className="text-xl font-semibold">{healthData.vidaRemanescenteAnos.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">anos</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Fator de Aceleração</p>
                  <p className={`text-xl font-semibold ${healthData.fatorAceleracao > 1 ? 'text-red-500' : 'text-green-500'}`}>{healthData.fatorAceleracao.toFixed(2)}x</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="bg-muted/40 pb-4 border-b">
              <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> Parâmetros de Cálculo</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Estratégia Usada</p>
                <Badge variant="outline" className="capitalize">{healthData.estrategiaUsada}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Horas de Operação</p>
                <p className="text-sm font-medium">{healthData.rawData.horas_operacao.toLocaleString()}h</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Temp. Hotspot</p>
                <p className="text-sm font-medium">{healthData.rawData.ponto_quente_externo}°C</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Temp. Ambiente</p>
                <p className="text-sm font-medium">{healthData.rawData.temperatura_ambiente}°C</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tangente Perdas</p>
                <p className="text-sm font-medium">{healthData.rawData.tangente_perdas}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Corrente Primário</p>
                <p className="text-sm font-medium">{healthData.rawData.corrente_primario}A</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="bg-muted/40 pb-4 border-b">
              <CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-primary" /> Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Instalação</p>
                  <p className="text-sm text-muted-foreground">
                    {equipment.installation_date ? format(new Date(equipment.installation_date), 'dd/MM/yyyy') : 'Não informada'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Vida Útil Estimada</p>
                  <p className="text-sm text-muted-foreground">{equipment.equipment_lifespan || 25} anos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Localização</p>
                  <p className="text-sm text-muted-foreground">{equipment.location_name || equipment.substation_id || `${equipment.city || ''} - ${equipment.state || ''}`}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <HealthHistoryChart equipmentId={equipment.id} />
        </div>

        <EquipmentMaintenanceHistory equipmentId={equipment.id} />
      </div>

      {isEditModalOpen && (
        <EditEquipmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEquipmentForEdit(null);
          }}
          equipment={selectedEquipmentForEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </Layout>
  );
};

export default EquipmentDetailsPage;