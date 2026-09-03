import { getLanguageLocale } from './languages';

export const formatDate = (
  date: string | Date | number | undefined | null,
  lang: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);

  const locale = getLanguageLocale(lang);
  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch {
    return d.toLocaleDateString();
  }
};

export const formatTime = (
  date: string | Date | number | undefined | null,
  lang: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const locale = getLanguageLocale(lang);
  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    hour: '2-digit',
    minute: '2-digit',
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
};

export const formatNumber = (
  num: number | undefined | null,
  lang: string = 'en',
  options?: Intl.NumberFormatOptions
): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  const locale = getLanguageLocale(lang);
  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch {
    return String(num);
  }
};
