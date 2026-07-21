import React, { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { convertPDFToBase64 } from '@/lib/reportImportService';
import { DataExtractor } from '@/lib/DataExtractor';
import { getDetailedErrorMessage } from '@/lib/geminiErrorHandler';
import { useGeminiRetry } from '@/hooks/useGeminiRetry';
import { pdfImportDebugger } from '@/lib/pdfImportDebugger';
import PDFUploadProgress from './PDFUploadProgress';
import { calculateAccelerationFactor, calculateTCRemainingLifespan } from '@/utils/tcLifespanCalculations';

const PDFUploadForm = ({ onUploadSuccess }) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [status, setStatus] = useState('idle'); 
  const [progress, setProgress] = useState(0);
  const [errorDetails, setErrorDetails] = useState(null);
  
  const { retry, canRetry, retryCount, reset: resetRetry } = useGeminiRetry();

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const validateFile = (file) => {
    pdfImportDebugger.logSectionStart('FILE VALIDATION (PDFUploadForm)');
    if (file.type !== 'application/pdf') {
      const error = `Arquivo não é um PDF válido. Tipo recebido: ${file.type}`;
      pdfImportDebugger.logSectionEnd('FILE VALIDATION (PDFUploadForm)', false);
      return { valid: false, error };
    }
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      const error = `Arquivo muito grande (máx 20MB). Tamanho atual: ${sizeMB}MB`;
      pdfImportDebugger.logSectionEnd('FILE VALIDATION (PDFUploadForm)', false);
      return { valid: false, error };
    }
    pdfImportDebugger.logSectionEnd('FILE VALIDATION (PDFUploadForm)', true);
    return { valid: true };
  };

  const handleFileSelect = (file) => {
    resetState();
    if (!file) return;
    const validation = validateFile(file);
    if (!validation.valid) {
      toast({ variant: 'destructive', title: 'Arquivo Inválido', description: validation.error });
      return;
    }
    setCurrentFile(file);
    processFile(file);
  };

  const resetState = () => {
    setErrorDetails(null);
    setStatus('idle');
    setProgress(0);
    resetRetry();
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };

  const performUploadSequence = async (fileToProcess) => {
    abortControllerRef.current = new AbortController();
    try {
      setStatus('validating'); setProgress(10);
      setStatus('encoding'); setProgress(30);
      
      const processed = await convertPDFToBase64(fileToProcess);
      
      setStatus('uploading'); setProgress(50);
      setStatus('processing'); setProgress(70);

      const result = await DataExtractor.extractPDFData(
         processed.base64, 
         processed.fileName, 
         abortControllerRef.current.signal
      );
      
      if (!result.success) throw new Error(result.error || 'Erro desconhecido na extração');

      // Inject TC Lifespan Calculations logic if equipment is assumed TC based on data
      const extracted = result.data;
      if (extracted?.equipmentType === 'TC' || String(extracted?.equipmentName).includes('TC')) {
        const temp = extracted?.technicalData?.temperature || extracted?.temperature;
        if (temp) {
          extracted.accelerationFactor = calculateAccelerationFactor(temp);
          // If we had an installation date we could run the full calculateTCRemainingLifespan
          // For now, attach fA to payload so parent or ReportCompletionStep handles it.
        } else {
          toast({ variant: 'warning', title: 'Aviso (TC)', description: 'Dados de temperatura não encontrados no relatório. Fator de aceleração não calculado.'});
        }
      }

      setProgress(100);
      return { success: true, data: extracted };

    } catch (err) {
      throw err;
    }
  };

  const processFile = async (file) => {
    try {
      const result = await retry(async () => await performUploadSequence(file));
      
      if (result && result.success) {
        setStatus('success');
        toast({ title: 'Sucesso!', description: 'PDF analisado com sucesso.' });
        setTimeout(() => onUploadSuccess(result.data), 1000);
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.message === 'Aborted') {
        setStatus('cancelled');
        return;
      }
      setStatus('error');
      const detailed = getDetailedErrorMessage(err, language);
      setErrorDetails(detailed);
      toast({ variant: 'destructive', title: detailed.title, description: detailed.message });
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    resetState();
    setCurrentFile(null);
  };

  const handleRetryClick = () => { if (currentFile) { setStatus('idle'); processFile(currentFile); } };
  const handleManualEntry = () => { onUploadSuccess({}); };

  const onDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
  const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  if (currentFile && status !== 'idle') {
    return (
      <PDFUploadProgress 
        fileName={currentFile.name} fileSize={currentFile.size} status={status}
        progress={progress} errorMessage={errorDetails?.message} retryCount={retryCount}
        onCancel={handleCancel} onRetry={handleRetryClick} onManualEntry={handleManualEntry}
      />
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <Card className={`border-2 border-dashed transition-colors duration-300 ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}`}>
        <CardContent 
          className="flex flex-col items-center justify-center p-10 cursor-pointer min-h-[300px]"
          onDragEnter={onDragEnter} onDragOver={onDragEnter} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} />
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Upload className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-center">{t('dragDropPDF')}</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-xs">{t('pdfUploadDescription')}</p>
          <Button variant="outline">{t('selectFile')}</Button>
          <p className="text-xs text-muted-foreground mt-4">Tamanho máximo: 20MB</p>
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-center">
        <Button variant="link" onClick={handleManualEntry} className="text-sm text-muted-foreground">{t('tryManualEntry')}</Button>
      </div>
    </div>
  );
};

export default PDFUploadForm;