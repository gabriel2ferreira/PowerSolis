import { useState, useRef, useCallback } from 'react';
import { GEMINI_CONFIG } from '@/lib/geminiConfig';
import { geminiLogger } from '@/lib/geminiLogger';

export const useGeminiRetry = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [history, setHistory] = useState([]);
  const [lastError, setLastError] = useState(null);
  
  const timeoutRef = useRef(null);
  const maxAttempts = GEMINI_CONFIG.MAX_RETRIES;

  const canRetry = retryCount < maxAttempts;

  const getNextDelay = useCallback(() => {
    const delays = GEMINI_CONFIG.RETRY_DELAYS;
    return delays[Math.min(retryCount, delays.length - 1)] || 1000;
  }, [retryCount]);

  const retry = async (fn, fallbackFn = null) => {
    if (!canRetry) {
      geminiLogger.log('Max retries reached, aborting.');
      return null;
    }

    const attemptNumber = retryCount + 1;
    const delay = getNextDelay();
    
    setIsRetrying(true);
    
    // Log intent
    geminiLogger.logRetryAttempt(attemptNumber, lastError?.message || 'Previous failure', delay);
    
    setHistory(prev => [...prev, { 
      attempt: attemptNumber, 
      timestamp: new Date(), 
      status: 'pending',
      delay 
    }]);

    return new Promise((resolve, reject) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          setRetryCount(prev => prev + 1);
          
          // Use fallback function on last attempt if provided
          const isLastAttempt = attemptNumber === maxAttempts;
          const functionToCall = (isLastAttempt && fallbackFn) ? fallbackFn : fn;
          
          if (isLastAttempt && fallbackFn) {
             geminiLogger.log('Using fallback prompt/method for final attempt');
          }

          // Race against timeout
          const result = await Promise.race([
            functionToCall(),
            new Promise((_, rejectTimeout) => 
              setTimeout(() => rejectTimeout(new Error('Operation timed out')), GEMINI_CONFIG.REQUEST_TIMEOUT)
            )
          ]);
          
          setHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1].status = 'success';
            return newHistory;
          });
          
          setIsRetrying(false);
          setLastError(null);
          resolve(result);

        } catch (error) {
          geminiLogger.logError(error, `Retry attempt ${attemptNumber}`);
          
          setHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1].status = 'failure';
            newHistory[newHistory.length - 1].error = error;
            return newHistory;
          });
          
          setLastError(error);
          setIsRetrying(false);
          reject(error);
        }
      }, delay);
    });
  };

  const reset = useCallback(() => {
    setRetryCount(0);
    setHistory([]);
    setIsRetrying(false);
    setLastError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    retry,
    canRetry,
    retryCount,
    maxAttempts,
    history,
    isRetrying,
    lastError,
    reset
  };
};