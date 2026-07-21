import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import ReportUploadStep from '@/components/reportImport/ReportUploadStep';
import ReportReviewStep from '@/components/reportImport/ReportReviewStep';
import ReportCompletionStep from '@/components/reportImport/ReportCompletionStep';

const ReportImportPage = () => {
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
    <Layout>
      <Helmet>
        <title>Importar Relatório - Power Solis</title>
        <meta name="description" content="Importe relatórios PDF de equipamentos usando IA" />
      </Helmet>

      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Importar Relatório de Equipamento</h1>
          <p className="text-xl text-muted-foreground">
            Análise automática de relatórios PDF usando Inteligência Artificial
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep === step
                        ? 'bg-primary text-primary-foreground scale-110'
                        : currentStep > step
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-all ${
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
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
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
    </Layout>
  );
};

export default ReportImportPage;