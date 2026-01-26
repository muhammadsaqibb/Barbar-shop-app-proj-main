
'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import en from '@/locales/en.json';
import ur from '@/locales/ur.json';

// Define the shape of your translations
type Translations = typeof en;

interface LanguageContextType {
  locale: 'en' | 'ur';
  setLocale: (locale: 'en' | 'ur') => void;
  t: (key: keyof Translations, replacements?: Record<string, string>) => string;
}

const translations = { en, ur };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<'en' | 'ur'>('en');

  useEffect(() => {
    const storedLocale = localStorage.getItem('locale') as 'en' | 'ur' | null;
    if (storedLocale) {
      setLocaleState(storedLocale);
    }
  }, []);

  useEffect(() => {
    if (locale === 'ur') {
      document.documentElement.lang = 'ur';
      document.documentElement.dir = 'rtl';
      document.documentElement.classList.add('lang-ur');
      document.documentElement.classList.remove('lang-en');
    } else {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
      document.documentElement.classList.add('lang-en');
      document.documentElement.classList.remove('lang-ur');
    }
    localStorage.setItem('locale', locale);
  }, [locale]);

  const setLocale = (newLocale: 'en' | 'ur') => {
    setLocaleState(newLocale);
  };

  const t = useCallback((key: keyof Translations, replacements?: Record<string, string>): string => {
    let translation = translations[locale][key] || translations['en'][key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        translation = translation.replace(`{{${rKey}}}`, replacements[rKey]);
      });
    }
    return translation;
  }, [locale]);

  const value = { locale, setLocale, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
