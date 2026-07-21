import React, { useState } from 'react';
import { PackagePlus, Link, SkipForward } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ReportNewEquipmentForm from './ReportNewEquipmentForm';
import ReportExistingEquipmentSelector from './ReportExistingEquipmentSelector';
import DataImportPreviewModal from './DataImportPreviewModal';

const ReportReviewStep = ({ extractedData, fileName, onBack, onComplete }) => {
  // Ensure we handle arrays of records
  const records = Array.isArray(extractedData) ? extractedData : [extractedData];
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentRecord = records[currentIndex];

  const [activeTab, setActiveTab] = useState('new');
  
  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState('new'); // 'new' | 'update'
  const [previewCurrentData, setPreviewCurrentData] = useState(null);
  const [previewNewData, setPreviewNewData] = useState(null);
  const [processedResults, setProcessedResults] = useState([]);

  const handleNextRecord = (resultObj) => {
    const newResults = [...processedResults, resultObj];
    if (currentIndex < records.length - 1) {
      setProcessedResults(newResults);
      setCurrentIndex(prev => prev + 1);
      setPreviewModalOpen(false);
    } else {
      onComplete({ results: newResults, fileName });
    }
  };

  const handleSkipRecord = () => {
    handleNextRecord({ action: 'skipped', equipment: null, fileName });
  };

  // Called by ReportNewEquipmentForm
  const handlePreviewNew = (mergedData) => {
    setPreviewMode('new');
    setPreviewCurrentData(null);
    setPreviewNewData(mergedData);
    setPreviewModalOpen(true);
  };

  // Called by ReportExistingEquipmentSelector
  const handlePreviewUpdate = (currentEquipment, newExtractedData) => {
    setPreviewMode('update');
    setPreviewCurrentData(currentEquipment);
    setPreviewNewData(newExtractedData);
    setPreviewModalOpen(true);
  };

  const handleModalSuccess = (savedEquipment) => {
    handleNextRecord({ 
      action: previewMode === 'new' ? 'created' : 'updated', 
      equipment: savedEquipment, 
      fileName 
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Passo 2 de 3: Vinculação de Dados</h2>
        {records.length > 1 && (
          <p className="text-muted-foreground font-medium">
            Registro {currentIndex + 1} de {records.length}
          </p>
        )}
      </div>

      {records.length > 1 && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={handleSkipRecord}>
            Ignorar Registro Atual <SkipForward className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4" /> Criar Novo
            </TabsTrigger>
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <Link className="w-4 h-4" /> Adicionar a Existente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <ReportNewEquipmentForm 
              extractedData={currentRecord} 
              fileName={fileName} 
              onBack={onBack} 
              onPreview={handlePreviewNew} 
            />
          </TabsContent>

          <TabsContent value="existing">
             <ReportExistingEquipmentSelector 
                extractedData={currentRecord} 
                fileName={fileName} 
                onBack={onBack} 
                onPreview={handlePreviewUpdate} 
             />
          </TabsContent>
        </Tabs>
      </motion.div>

      {previewModalOpen && (
        <DataImportPreviewModal
          isOpen={previewModalOpen}
          mode={previewMode}
          currentData={previewCurrentData}
          newData={previewNewData}
          fileName={fileName}
          onClose={() => setPreviewModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default ReportReviewStep;