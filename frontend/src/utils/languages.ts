export type LanguageCode = 'en' | 'ar' | 'es' | 'hi';
export type Direction = 'ltr' | 'rtl';

export interface SupportedLanguage {
  code: LanguageCode;
  name: string;
  nativeName: string;
  direction: Direction;
  locale: string;
  flag: string;
}

export const supportedLanguages: SupportedLanguage[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    locale: 'en-US',
    flag: '🇺🇸',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    locale: 'ar-SA',
    flag: '🇸🇦',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    locale: 'es-ES',
    flag: '🇪🇸',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
    locale: 'hi-IN',
    flag: '🇮🇳',
  },
];

export const STORAGE_KEY_LANG = 'care_compass_lang';

export const getLanguageDirection = (code: string): Direction => {
  const found = supportedLanguages.find((l) => l.code === code);
  return found ? found.direction : 'ltr';
};

export const getLanguageLocale = (code: string): string => {
  const found = supportedLanguages.find((l) => l.code === code);
  return found ? found.locale : 'en-US';
};

export const applyDocumentDirection = (code: string) => {
  const dir = getLanguageDirection(code);
  document.documentElement.dir = dir;
  document.documentElement.lang = code;
  if (document.body) {
    document.body.dir = dir;
  }
};
