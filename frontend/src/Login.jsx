// src/Login.jsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const { i18n } = useTranslation();
  const navigate = useNavigate(); // 👈 2. تفعيل دالة التوجيه داخل المكون
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    return savedUser && savedToken ? JSON.parse(savedUser) : null;
  });

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthToken = params.get('token');
    const oauthEmail = params.get('email');
    const oauthRole = params.get('role') || 'user';

    if (oauthToken && oauthEmail) {
      localStorage.setItem('token', oauthToken);
      localStorage.setItem('user', JSON.stringify({ email: oauthEmail, role: oauthRole }));
      localStorage.setItem('user_role', oauthRole);
      setUser({ email: oauthEmail, role: oauthRole });
      window.history.replaceState({}, document.title, '/login');
      navigate('/surveys', { replace: true });
    }
  }, [location.search, navigate]);

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('fr') ? 'en' : 'fr';
    i18n.changeLanguage(nextLang);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://127.0.0.1:8000/auth/login', {
        email: email,
        password: password
      });
      
      // 👈 3. التعديل الأساسي: تخزين البيانات والدور والتوجيه فوراً
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('user_role', response.data.user.role); // تخزين الـ role (سواء admin أو user)
      
      setUser(response.data.user);
      
      // التوجيه التلقائي إلى صفحة إدارة الاستبيانات
      navigate('/surveys'); 
      
    } catch (err) {
      console.error(err);
      setError(i18n.language.startsWith('fr') ? "Adresse email ou mot de passe incorrect." : "Incorrect email or password.");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError(i18n.language.startsWith('fr') ? "Les mots de passe ne correspondent pas." : "Passwords do not match.");
      return;
    }

    try {
      await axios.post('http://127.0.0.1:8000/auth/signup', {
        email: email,
        password: password
      });

      setSuccess(i18n.language.startsWith('fr') ? "Compte créé avec succès ! Connectez-vous." : "Account created successfully! Please login.");
      setTimeout(() => {
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(i18n.language.startsWith('fr') ? "Une erreur est survenue lors de l'inscription." : "An error occurred during registration.");
      }
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://127.0.0.1:8000/auth/google/login';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role'); // 👈 تنظيف الدور عند تسجيل الخروج
    setUser(null);
    navigate('/login');
  };

  const content = {
    fr: {
      connexion: "Connexion",
      inscription: "S'inscrire",
      subtitle: "Plateforme d'enquêtes de satisfaction",
      google: "Se connecter avec Google",
      or: "OU CONTINUER AVEC",
      email: "Email",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      noAccount: "Pas de compte ?",
      haveAccount: "Déjà un compte ?",
      welcome: "Bienvenue",
      logout: "Se déconnecter"
    },
    en: {
      connexion: "Sign In",
      inscription: "Sign Up",
      subtitle: "Satisfaction Survey Platform",
      google: "Sign in with Google",
      or: "OR CONTINUE WITH",
      email: "Email Address",
      password: "Password",
      confirmPassword: "Confirm Password",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      welcome: "Welcome",
      logout: "Logout"
    }
  };

  const currentLang = i18n.language.startsWith('fr') ? 'fr' : 'en';
  const text = content[currentLang];

  if (user && localStorage.getItem('token')) {
    return <Navigate to="/surveys" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans px-4 relative">
      <button 
        onClick={toggleLanguage}
        className="absolute top-6 right-6 px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 shadow-sm transition-all flex items-center gap-1"
      >
        🌐 {i18n.language.startsWith('fr') ? 'EN' : 'FR'}
      </button>

      <div className="w-full max-w-[440px] bg-white border border-slate-100 p-10 rounded-2xl shadow-sm">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/10">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {isSignUp ? text.inscription : text.connexion}
          </h2>
          <p className="text-sm text-slate-400 font-normal">{text.subtitle}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-500 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl text-center font-medium">
            {success}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl flex items-center justify-center gap-2.5 transition-all mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.71z"/>
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.04.7-2.37 1.12-4.23 1.12-3.22 0-5.89-2.61-6.84-5.67l-3.87 3C3.21 20.27 7.24 23 12 23z"/>
            <path fill="#FBBC05" d="M5.16 14.71c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31l-3.87-3C.47 8.77 0 10.33 0 12s.47 3.23 1.29 4.89l3.87-3.18z"/>
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 15.03 1 12 1 7.24 1 3.21 3.73 1.29 7.71l3.87 3C6.11 7.65 8.78 5.04 12 5.04z"/>
          </svg>
          {text.google}
        </button>

        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-slate-100 w-full"></div>
          <span className="absolute bg-white px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            {text.or}
          </span>
        </div>

        {!isSignUp ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{text.email}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{text.password}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.99] mt-2"
            >
              {text.connexion}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{text.email}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{text.password}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{text.confirmPassword}</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.99] mt-2"
            >
              {text.inscription}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            {isSignUp ? text.haveAccount : text.noAccount}{' '}
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
              className="text-indigo-600 font-bold hover:underline focus:outline-none ml-1"
            >
              {isSignUp ? text.connexion : text.inscription}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}