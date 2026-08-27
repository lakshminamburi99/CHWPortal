import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  en: {
    translation: {
      "app_name": "CHW Care",
      "sign_in": "Sign in",
      "demo_accounts": "Use a demo account to explore the full platform.",
    }
  },
  es: {
    translation: {
      "app_name": "CHW Care",
      "sign_in": "Iniciar sesión",
      "demo_accounts": "Use una cuenta de demostración para explorar la plataforma completa.",
    }
  },
  ar: {
    translation: {
      "app_name": "CHW Care",
      "sign_in": "تسجيل الدخول",
      "demo_accounts": "استخدم حسابًا تجريبيًا لاستكشاف المنصة الكاملة.",
    }
  },
  hi: {
    translation: {
      "app_name": "CHW Care",
      "sign_in": "साइन इन करें",
      "demo_accounts": "पूर्ण मंच का पता लगाने के लिए एक डेमो खाते का उपयोग करें।",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
