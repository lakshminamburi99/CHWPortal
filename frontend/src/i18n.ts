import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/common.json';
import arTranslation from './locales/ar/common.json';
import esTranslation from './locales/es/common.json';
import hiTranslation from './locales/hi/common.json';

import {
  STORAGE_KEY_LANG,
  applyDocumentDirection,
  supportedLanguages,
  type LanguageCode,
} from './utils/languages';

const resources = {
  en: { translation: enTranslation },
  ar: { translation: arTranslation },
  es: { translation: esTranslation },
  hi: { translation: hiTranslation },
};

// Determine initial language:
// 1. Explicitly saved user choice in localStorage
// 2. Browser language if matched with our 4 supported languages
// 3. Fallback to English
const getInitialLanguage = (): LanguageCode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    if (saved && ['en', 'ar', 'es', 'hi'].includes(saved)) {
      return saved as LanguageCode;
    }

    const browserLang = navigator.language.split('-')[0];
    const match = supportedLanguages.find((l) => l.code === browserLang);
    if (match) {
      return match.code;
    }
  } catch {}
  return 'en';
};

const initialLang = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    react: {
      useSuspense: false,
    },
  });

// Apply document direction and language on startup
applyDocumentDirection(initialLang);

// Listen to language change events and keep documentElement in sync
i18n.on('languageChanged', (lng: string) => {
  try {
    localStorage.setItem(STORAGE_KEY_LANG, lng);
  } catch {}
  applyDocumentDirection(lng);
});

export default i18n;
