import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ReportUploadStep from '@/components/reportImport/ReportUploadStep';
import ReportReviewStep from '@/components/reportImport/ReportReviewStep';
import ReportCompletionStep from '@/components/reportImport/ReportCompletionStep';

const ImportReport = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [completionResult, setCompletionResult] = useState(null);

  const handleUploadSuccess = (data, file) => {
    setExtractedData(data);
    setFileName(file);
    setCurrentStep(2);
  };

  const handleBackToUpload = () => {
    setCurrentStep(1);
    setExtractedData(null);
    setFileName('');
  };

  const handleComplete = (result) => {
    setCompletionResult(result);
    setCurrentStep(3);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setExtractedData(null);
    setFileName('');
    setCompletionResult(null);
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Importar Relatório - Power Solis</title>
        <meta name="description" content="Importe relatórios PDF de equipamentos usando IA" />
      </Helmet>

      <div className="max-w-5xl mx-auto py-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Processamento de Relatórios PDF</h2>
          <p className="text-muted-foreground">
            Extraia dados técnicos de relatórios de manutenção usando IA e integre-os diretamente ao sistema.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all text-sm ${
                      currentStep === step
                        ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                        : currentStep > step
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-12 h-1 mx-2 transition-all rounded-full ${
                        currentStep > step ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border shadow-sm rounded-xl p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && (
                <ReportUploadStep onSuccess={handleUploadSuccess} />
              )}

              {currentStep === 2 && extractedData && (
                <ReportReviewStep
                  extractedData={extractedData}
                  fileName={fileName}
                  onBack={handleBackToUpload}
                  onComplete={handleComplete}
                />
              )}

              {currentStep === 3 && completionResult && (
                <ReportCompletionStep
                  result={completionResult}
                  onReset={handleReset}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ImportReport;