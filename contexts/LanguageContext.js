'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import translations from '@/lib/i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('uz');

  useEffect(() => {
    const saved = localStorage.getItem('anjir-lang');
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('anjir-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => {
    setLang(prev => prev === 'uz' ? 'ru' : 'uz');
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['uz']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
