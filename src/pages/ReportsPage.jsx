import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ReportsList from '@/components/reports/ReportsList';
import CreateReportModal from '@/components/reports/CreateReportModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, FileBarChart2 } from 'lucide-react';

const ReportsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReportCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Relatórios - Power Solis</title>
        <meta name="description" content="Geração e gerenciamento de relatórios de equipamentos" />
      </Helmet>
      
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground tracking-tight">
              <FileText className="w-8 h-8 text-primary" />
              Relatórios
            </h1>
            <p className="text-muted-foreground text-base mt-2">
              Crie e gerencie relatórios detalhados dos equipamentos
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Action / Info */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileBarChart2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Geração de Relatórios</CardTitle>
                <CardDescription className="text-sm mt-2 leading-relaxed">
                  Gere documentos PDF consolidados com todas as informações técnicas, análises de vida útil, e histórico de métricas dos seus equipamentos para fácil compartilhamento e auditoria.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setIsModalOpen(true)} 
                  className="w-full py-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Novo Relatório
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: List */}
          <div className="w-full lg:w-2/3">
            <Card className="border-border shadow-sm h-full flex flex-col">
              <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                <CardTitle className="text-lg text-card-foreground">Relatórios Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow pt-6">
                <ReportsList refreshTrigger={refreshTrigger} />
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>

      <CreateReportModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSuccess={handleReportCreated} 
      />
    </DashboardLayout>
  );
};

export default ReportsPage;