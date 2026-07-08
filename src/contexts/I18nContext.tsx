"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { en, Dictionary } from '../locales/en';
import { tr } from '../locales/tr';

type Language = 'en' | 'tr';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Dictionary) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Try to load language preference from localStorage on mount
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang === 'en' || savedLang === 'tr') {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof Dictionary): string => {
    const dictionary = language === 'tr' ? tr : en;
    return dictionary[key] || en[key] || key; // fallback to en then key
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
