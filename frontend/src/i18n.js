import i18n from 'i18next'; // 👈 التعديل هنا: i18next بدلاً من i18n
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  fr: {
    translation: {
      connexion: "Connexion",
      inscription: "S'inscrire",
      subtitle: "Plateforme d'enquêtes de satisfaction",
      btn_google: "Se connecter avec Google",
      or: "OU CONTINUER AVEC",
      email: "Adresse Email",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      noAccount: "Pas de compte ?",
      haveAccount: "Déjà un compte ?",
      welcome: "Bienvenue",
      logout: "Se déconnecter",
      error_auth: "Email ou mot de passe incorrect.",
      error_password_mismatch: "Les mots de passe ne correspondent pas.",
      success_account_created: "Compte créé avec succès ! Connectez-vous.",
      error_generic_signup: "Une erreur est survenue lors de l'inscription."
    }
  },
  en: {
    translation: {
      connexion: "Sign In",
      inscription: "Sign Up",
      subtitle: "Satisfaction Survey Platform",
      btn_google: "Sign in with Google",
      or: "OR CONTINUE WITH",
      email: "Email Address",
      password: "Password",
      confirmPassword: "Confirm Password",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      welcome: "Welcome",
      logout: "Logout",
      error_auth: "Invalid email or password.",
      error_password_mismatch: "Passwords do not match.",
      success_account_created: "Account created successfully! Please login.",
      error_generic_signup: "An error occurred during registration."
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