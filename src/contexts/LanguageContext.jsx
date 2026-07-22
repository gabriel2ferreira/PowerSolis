import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
    import ptBR from '@/locales/pt-BR.json';
    import en from '@/locales/en.json';

    const translations = {
      'pt-BR': ptBR,
      en: en,
    };

    const LanguageContext = createContext();

    export const LanguageProvider = ({ children }) => {
      const [language, setLanguage] = useState('pt-BR');

      const t = useCallback((key) => {
        return translations[language][key] || key;
      }, [language]);

      const value = useMemo(() => ({
        language,
        setLanguage,
        t,
      }), [language, t]);

      return (
        <LanguageContext.Provider value={value}>
          {children}
        </LanguageContext.Provider>
      );
    };

    export const useLanguage = () => {
      const context = useContext(LanguageContext);
      if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
      }
      return context;
    };