import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import PDFUploadForm from '@/components/dataImport/PDFUploadForm';
import DataExtractionReview from '@/components/dataImport/DataExtractionReview';
import { useEquipmentImport } from '@/hooks/useEquipmentImport';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const STEPS = {
  UPLOAD: 'UPLOAD',
  REVIEW: 'REVIEW',
  SUCCESS: 'SUCCESS'
};

const DataImportPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { importEquipmentData, importing } = useEquipmentImport();

  const [step, setStep] = useState(STEPS.UPLOAD);
  const [extractedData, setExtractedData] = useState(null);

  const handleDataExtracted = useCallback((data) => {
    setExtractedData(data);
    setStep(STEPS.REVIEW);
  }, []);

  const handleConfirmImport = useCallback(async (finalData) => {
    const result = await importEquipmentData(finalData);
    if (result.success) {
      setStep(STEPS.SUCCESS);
      toast({
        title: t('success'),
        description: t('equipmentImportedSuccessfully')
      });
    }
  }, [importEquipmentData, t, toast]);

  const resetFlow = useCallback(() => {
    setStep(STEPS.UPLOAD);
    setExtractedData(null);
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>{t('dataImport')} - Power Solis</title>
      </Helmet>

      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">{t('importEquipmentData')}</h1>
          <p className="text-muted-foreground">{t('importSubtitle')}</p>
        </div>

        {/* Simple Progress Steps */}
        <div className="flex justify-center mb-8">
           <div className="flex items-center space-x-2 text-sm">
              <span className={step === STEPS.UPLOAD ? "font-bold text-primary" : "text-muted-foreground"}>{t('stepUpload')}</span>
              <span className="text-muted-foreground">→</span>
              <span className={step === STEPS.REVIEW ? "font-bold text-primary" : "text-muted-foreground"}>{t('stepReview')}</span>
              <span className="text-muted-foreground">→</span>
              <span className={step === STEPS.SUCCESS ? "font-bold text-primary" : "text-muted-foreground"}>{t('stepFinish')}</span>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {step === STEPS.UPLOAD && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PDFUploadForm onUploadSuccess={handleDataExtracted} />
            </motion.div>
          )}

          {step === STEPS.REVIEW && extractedData && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DataExtractionReview 
                data={extractedData} 
                onConfirm={handleConfirmImport}
                onBack={resetFlow}
                isProcessing={importing}
              />
            </motion.div>
          )}

          {step === STEPS.SUCCESS && (
             <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto"
            >
              <Card className="border-green-500/30 bg-green-500/5 shadow-lg shadow-green-500/10">
                <CardContent className="flex flex-col items-center py-16 text-center">
                  <div className="w-24 h-24 bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mb-6">
                     <CheckCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{t('importComplete')}</h3>
                  <p className="text-muted-foreground mb-8">
                    {t('importSuccessDescription')}
                  </p>
                  
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={resetFlow}>
                      {t('importAnother')}
                    </Button>
                    <Button onClick={() => navigate('/equipment')}>
                      {t('viewEquipment')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default DataImportPage;