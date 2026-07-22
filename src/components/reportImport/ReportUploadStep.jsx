import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2, AlertCircle, RefreshCw, Clock, ChevronDown, ChevronUp, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { importPDFReport } from '@/lib/reportImportService';
import { pdfImportDebugger } from '@/lib/pdfImportDebugger';

const ReportUploadStep = ({ onSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ step: '', message: '' });
  const [error, setError] = useState(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(240); // 4 minutes
  
  const fileInputRef = useRef(null);
  const timeoutWarningTimerRef = useRef(null);
  const timeRemainingIntervalRef = useRef(null);
  const analysisStartTimeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutWarningTimerRef.current) {
        clearTimeout(timeoutWarningTimerRef.current);
      }
      if (timeRemainingIntervalRef.current) {
        clearInterval(timeRemainingIntervalRef.current);
      }
    };
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    setError(null);
    setShowTimeoutWarning(false);
    setShowTechnicalDetails(false);
    
    if (file && file.type === 'application/pdf') {
      pdfImportDebugger.logProgress('File selection', `File selected: ${file.name}`);
      pdfImportDebugger.logFileInfo(file);
      setSelectedFile(file);
    } else {
      const errorMsg = 'Por favor, selecione um arquivo PDF válido.';
      pdfImportDebugger.logError('FILE_SELECTION', new Error(errorMsg), {
        fileType: file?.type,
        fileName: file?.name
      });
      setError({
        type: 'validation',
        title: 'Arquivo Inválido',
        message: errorMsg,
        canRetry: false
      });
    }
  };

  const categorizeError = (error) => {
    const message = error?.message || error || 'Erro desconhecido';
    pdfImportDebugger.logError('ERROR_CATEGORIZATION', error);

    // Timeout específico
    if (message.includes('Analysis took too long') || message.includes('timeout') || message.includes('4 minutos')) {
      return {
        type: 'timeout',
        title: 'Tempo Esgotado',
        message: 'A análise demorou mais de 4 minutos e foi interrompida.',
        suggestion: 'Tente novamente. Se o problema persistir, tente com um PDF menor ou entre em contato com o suporte.',
        canRetry: true,
        technicalDetails: message
      };
    }

    // Erro de rede
    if (message.includes('fetch') || message.includes('network') || message.includes('NetworkError')) {
      return {
        type: 'network',
        title: 'Erro de Conexão',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
        suggestion: 'Verifique sua conexão e tente novamente.',
        canRetry: true,
        technicalDetails: message
      };
    }

    // Erro de API
    if (message.includes('API') || message.includes('api') || message.includes('key') || message.includes('GEMINI')) {
      return {
        type: 'api',
        title: 'Erro de Configuração',
        message: 'Erro na configuração da API.',
        suggestion: 'Entre em contato com o suporte técnico.',
        canRetry: false,
        technicalDetails: message
      };
    }

    // Erro de validação de PDF
    if (message.includes('PDF') || message.includes('base64') || message.includes('inválido') || message.includes('corrompido')) {
      return {
        type: 'validation',
        title: 'PDF Inválido',
        message: 'O arquivo PDF não pôde ser processado.',
        suggestion: 'Verifique se o arquivo não está corrompido ou protegido por senha.',
        canRetry: false,
        technicalDetails: message
      };
    }

    // Erro de leitura de arquivo
    if (message.includes('ler arquivo') || message.includes('FileReader') || message.includes('codificar')) {
      return {
        type: 'file_reading',
        title: 'Erro ao Ler Arquivo',
        message: 'Não foi possível ler o arquivo PDF.',
        suggestion: 'Tente abrir o arquivo em outro programa para verificar se não está corrompido.',
        canRetry: true,
        technicalDetails: message
      };
    }

    // Erro de extração de dados
    if (message.includes('extraí') || message.includes('dados') || message.includes('informações') || message.includes('vazio')) {
      return {
        type: 'extraction',
        title: 'Falha na Extração',
        message: 'Não foi possível extrair dados do PDF.',
        suggestion: 'Verifique se o documento contém informações legíveis ou tente outro arquivo.',
        canRetry: true,
        technicalDetails: message
      };
    }

    // Erro genérico
    return {
      type: 'generic',
      title: 'Erro na Análise',
      message: message,
      suggestion: 'Tente novamente ou entre em contato com o suporte se o problema persistir.',
      canRetry: true,
      technicalDetails: message
    };
  };

  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `~${mins} min ${secs}s` : `~${secs}s`;
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    pdfImportDebugger.logSectionStart('REPORT ANALYSIS (ReportUploadStep)');
    pdfImportDebugger.logFileInfo(selectedFile);

    setIsAnalyzing(true);
    setError(null);
    setShowTimeoutWarning(false);
    setShowTechnicalDetails(false);
    setEstimatedTimeRemaining(240);
    analysisStartTimeRef.current = Date.now();
    setProgress({ step: 'start', message: 'Processando PDF com IA... Por favor aguarde (até 4 minutos)' });

    // Iniciar timer para aviso de que está demorando (mostra após 60 segundos agora para não ser prematuro)
    timeoutWarningTimerRef.current = setTimeout(() => {
      pdfImportDebugger.logProgress('Timeout warning', 'Analysis taking longer than expected');
      setShowTimeoutWarning(true);
    }, 60000);

    // Contador de tempo restante
    timeRemainingIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - analysisStartTimeRef.current) / 1000);
      const remaining = Math.max(0, 240 - elapsed);
      setEstimatedTimeRemaining(remaining);
      
      if (remaining === 0) {
        clearInterval(timeRemainingIntervalRef.current);
      }
    }, 1000);

    try {
      // Criar promise de timeout (240 segundos = 4 minutos)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Analysis took too long (more than 4 minutes). Please try again.'));
        }, 240000);
      });

      // Executar análise com timeout
      const result = await Promise.race([
        importPDFReport(selectedFile, setProgress),
        timeoutPromise
      ]);
      
      // Limpar timers
      if (timeoutWarningTimerRef.current) {
        clearTimeout(timeoutWarningTimerRef.current);
      }
      if (timeRemainingIntervalRef.current) {
        clearInterval(timeRemainingIntervalRef.current);
      }

      if (result.success) {
        pdfImportDebugger.logProgress('Analysis complete', 'Success', 100);
        pdfImportDebugger.logSectionEnd('REPORT ANALYSIS (ReportUploadStep)', true);
        
        console.log('Analysis successful - extracted data:', {
          fields: Object.keys(result.data),
          metadata: result.metadata
        });

        onSuccess(result.data, selectedFile.name);
      } else {
        throw new Error('Análise falhou sem retornar dados');
      }
    } catch (err) {
      // Limpar timers
      if (timeoutWarningTimerRef.current) {
        clearTimeout(timeoutWarningTimerRef.current);
      }
      if (timeRemainingIntervalRef.current) {
        clearInterval(timeRemainingIntervalRef.current);
      }

      pdfImportDebugger.logError('ANALYSIS_FAILED', err, {
        fileName: selectedFile.name,
        fileSize: selectedFile.size
      });
      pdfImportDebugger.logSectionEnd('REPORT ANALYSIS (ReportUploadStep)', false);

      const categorizedError = categorizeError(err);
      setError(categorizedError);
    } finally {
      setIsAnalyzing(false);
      setShowTimeoutWarning(false);
    }
  };

  const handleRetry = () => {
    pdfImportDebugger.logProgress('User action', 'Retry button clicked');
    setError(null);
    setShowTimeoutWarning(false);
    setShowTechnicalDetails(false);
    handleAnalyze();
  };

  const handleReset = () => {
    pdfImportDebugger.logProgress('User action', 'Reset button clicked');
    setSelectedFile(null);
    setError(null);
    setProgress({ step: '', message: '' });
    setShowTimeoutWarning(false);
    setShowTechnicalDetails(false);
    setEstimatedTimeRemaining(240);
    if (timeoutWarningTimerRef.current) {
      clearTimeout(timeoutWarningTimerRef.current);
    }
    if (timeRemainingIntervalRef.current) {
      clearInterval(timeRemainingIntervalRef.current);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Passo 1 de 3: Upload do Relatório</h2>
        <p className="text-muted-foreground">
          Faça upload do relatório PDF para análise automática
        </p>
      </div>

      {!selectedFile ? (
        <Card
          className={`border-2 border-dashed transition-all duration-300 ${
            dragActive ? 'border-primary bg-primary/5 scale-105' : 'border-border'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CardContent 
            className="flex flex-col items-center justify-center p-12 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            />

            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: dragActive ? 1.1 : 1 }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
            >
              <Upload className="w-10 h-10 text-primary" />
            </motion.div>

            <h3 className="text-xl font-semibold mb-2">
              Arraste e solte o PDF aqui
            </h3>
            <p className="text-muted-foreground mb-6 text-center">
              ou clique para selecionar o arquivo
            </p>

            <Button variant="outline" size="lg">
              Selecionar Arquivo PDF
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              Tamanho máximo: 20MB
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {isAnalyzing && (
                    <div className="mt-4 space-y-3">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                              Analisando seu arquivo PDF...
                            </p>
                            <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
                              O processo utiliza IA e pode levar até 4 minutos. Por favor, aguarde.
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{progress.message}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Processando...</span>
                          <div className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            <span>{formatTimeRemaining(estimatedTimeRemaining)} restantes</span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${((240 - estimatedTimeRemaining) / 240) * 100}%`
                            }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>

                      {showTimeoutWarning && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                        >
                          <div className="flex items-start gap-2">
                            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                A operação está em andamento
                              </p>
                              <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
                                O arquivo está sendo processado. Isso é normal para PDFs densos ou imagens.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-destructive">
                              {error.title}
                            </p>
                            <p className="text-sm text-destructive/80 mt-1">
                              {error.message}
                            </p>
                          </div>

                          {error.suggestion && (
                            <div className="p-3 bg-muted rounded-md">
                              <p className="text-xs font-medium mb-1">💡 O que fazer:</p>
                              <p className="text-xs text-muted-foreground">
                                {error.suggestion}
                              </p>
                            </div>
                          )}

                          {error.type === 'validation' && (
                            <div className="p-3 bg-muted rounded-md">
                              <p className="text-xs font-medium mb-2">Dicas para resolver:</p>
                              <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                                <li>Verifique se o PDF não está protegido por senha</li>
                                <li>Certifique-se de que o arquivo não está corrompido</li>
                                <li>Tente abrir o PDF em outro programa para validar</li>
                              </ul>
                            </div>
                          )}

                          {error.type === 'extraction' && (
                            <div className="p-3 bg-muted rounded-md">
                              <p className="text-xs font-medium mb-2">Possíveis causas:</p>
                              <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                                <li>O PDF contém apenas imagens sem texto</li>
                                <li>O texto está em formato não reconhecível</li>
                                <li>O documento não contém dados estruturados</li>
                              </ul>
                            </div>
                          )}

                          {error.type === 'timeout' && (
                            <div className="p-3 bg-muted rounded-md">
                              <p className="text-xs font-medium mb-2">Por que isso aconteceu:</p>
                              <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                                <li>O arquivo pode ser muito grande ou complexo</li>
                                <li>A conexão pode estar lenta</li>
                                <li>O servidor pode estar sobrecarregado no momento</li>
                              </ul>
                            </div>
                          )}

                          {error.technicalDetails && (
                            <div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                                className="text-xs h-auto p-2"
                              >
                                {showTechnicalDetails ? (
                                  <>
                                    <ChevronUp className="w-3 h-3 mr-1" />
                                    Ocultar detalhes técnicos
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3 mr-1" />
                                    Mostrar detalhes técnicos
                                  </>
                                )}
                              </Button>

                              <AnimatePresence>
                                {showTechnicalDetails && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-2 p-3 bg-muted rounded-md overflow-hidden"
                                  >
                                    <p className="text-xs font-mono text-muted-foreground break-all">
                                      {error.technicalDetails}
                                    </p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={isAnalyzing}
            >
              Escolher Outro Arquivo
            </Button>

            <div className="flex gap-2">
              {error?.canRetry && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isAnalyzing}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !!error}
                size="lg"
                className="min-w-[200px]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  'Analisar Relatório'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ReportUploadStep;