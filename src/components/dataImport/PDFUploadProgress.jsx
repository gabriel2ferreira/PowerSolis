import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, CheckCircle2, AlertCircle, Upload, Binary, BrainCircuit, FileSearch, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const PDFUploadProgress = ({ 
  fileName, 
  status, // 'validating', 'encoding', 'uploading', 'processing', 'success', 'error'
  progress, // 0-100 base progress from parent
  errorMessage,
  retryCount,
  onCancel,
  onRetry,
  onManualEntry,
  fileSize
}) => {
  const { t, language } = useLanguage();
  const [timeRemaining, setTimeRemaining] = useState(240); // 4 minutes in seconds
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (status === 'processing' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
        
        // Slightly advance progress bar to show activity if we are stuck at the parent's generic progress mark
        setSimulatedProgress(prev => {
          const current = prev === 0 ? progress : prev;
          // slowly creep up to 98%
          return current < 98 ? current + (98 - current) * 0.02 : current;
        });
        
      }, 1000);
    } else if (status !== 'processing') {
      setTimeRemaining(240);
      setSimulatedProgress(0);
    }
    
    return () => clearInterval(interval);
  }, [status, timeRemaining, progress]);

  const getStatusInfo = () => {
    switch (status) {
      case 'validating': 
        return { 
          text: language === 'pt-BR' ? 'Validando PDF...' : 'Validating PDF...',
          icon: <FileSearch className="w-6 h-6 animate-pulse text-blue-500" />
        };
      case 'encoding': 
        return { 
          text: language === 'pt-BR' ? 'Codificando arquivo...' : 'Encoding file...',
          icon: <Binary className="w-6 h-6 animate-pulse text-blue-500" />
        };
      case 'uploading': 
        return { 
          text: language === 'pt-BR' ? 'Enviando para Gemini...' : 'Sending to Gemini...',
          icon: <Upload className="w-6 h-6 animate-bounce text-purple-500" />
        };
      case 'processing': 
        return { 
          text: language === 'pt-BR' 
            ? 'Processando PDF com IA... Por favor aguarde (até 4 minutos)' 
            : 'Extracting data with AI... Please wait (up to 4 minutes)',
          icon: <BrainCircuit className="w-6 h-6 animate-spin text-purple-600" />
        };
      case 'success': 
        return { 
          text: language === 'pt-BR' ? 'Concluído!' : 'Complete!',
          icon: <CheckCircle2 className="w-6 h-6 text-green-600" />
        };
      case 'error': 
        return { 
          text: language === 'pt-BR' ? 'Erro no processo' : 'Process Error',
          icon: <AlertCircle className="w-6 h-6 text-destructive" />
        };
      default: 
        return { 
          text: language === 'pt-BR' ? 'Aguardando...' : 'Waiting...',
          icon: <FileText className="w-6 h-6 text-muted-foreground" />
        };
    }
  };

  const { text, icon } = getStatusInfo();
  
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const currentProgress = status === 'processing' && simulatedProgress > progress 
    ? simulatedProgress 
    : progress;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto mt-6"
    >
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-full bg-muted ${status === 'error' ? 'bg-destructive/10' : ''}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate" title={fileName}>{fileName}</h4>
            <div className="flex flex-col mt-1">
              <p className={`text-sm ${status === 'error' ? 'text-destructive' : 'text-primary'}`}>
                {text}
              </p>
              {retryCount > 0 && status !== 'success' && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full w-max mt-1">
                  Retry #{retryCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {(status !== 'error' && status !== 'success') && (
          <div className="space-y-2 mt-4">
             <Progress value={currentProgress} className="h-2 transition-all duration-500 ease-out" />
             <div className="flex justify-between text-xs text-muted-foreground">
               <span>{Math.round(currentProgress)}%</span>
               {status === 'processing' && (
                 <span className="flex items-center gap-1">
                   <Timer className="w-3 h-3" />
                   {formatTime(timeRemaining)} remaining
                 </span>
               )}
             </div>
          </div>
        )}

        {status === 'error' && (
           <div className="mt-4 text-sm text-destructive bg-destructive/5 p-3 rounded border border-destructive/20 break-words">
             {errorMessage}
           </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          {status === 'error' ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onManualEntry}>
                {language === 'pt-BR' ? 'Entrada Manual' : 'Manual Entry'}
              </Button>
              <Button variant="outline" size="sm" onClick={onRetry}>
                {language === 'pt-BR' ? 'Tentar Novamente' : 'Retry'}
              </Button>
            </div>
          ) : (status !== 'success') ? (
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
              {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
            </Button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

export default PDFUploadProgress;