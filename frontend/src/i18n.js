import i18n from 'i18next'; // 👈 التعديل هنا: i18next بدلاً من i18n
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  fr: {
    translation: {
      login_title: "Connexion à SurveyPro",
      email_label: "Adresse Email",
      password_label: "Mot de passe",
      btn_login: "Se connecter",
      btn_google: "Se connecter avec Google",
      error_auth: "Email ou mot de passe incorrect.",
      welcome: "Bienvenue"
    }
  },
  en: {
    translation: {
      login_title: "Sign in to SurveyPro",
      email_label: "Email Address",
      password_label: "Password",
      btn_login: "Sign In",
      btn_google: "Sign in with Google",
      error_auth: "Invalid email or password.",
      welcome: "Welcome"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;