import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 🔄 قراءة البيانات تلقائياً للحفاظ على الجلسة دون تنبيهات ESLint
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    return savedUser && savedToken ? JSON.parse(savedUser) : null;
  });

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
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
    } catch (err) {
      console.error(err);
      setError(t('error_auth'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // شاشة الترحيب الرسمية البسيطة (عند نجاح الاتصال)
  if (user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-sm">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">{t('welcome')} !</h1>
          <p className="text-slate-500 text-sm mb-6">{user.email}</p>
          <div className="mb-6">
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold uppercase tracking-wider">
              Rôle: {user.role}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-xl transition-all"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // 🎨 التطابق التام مع تصميم دفتر التحملات (Pure White & Purple Layout)
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans px-4 relative">
      {/* زر تغيير اللغة مدمج بشكل خفيف */}
      <button 
        onClick={toggleLanguage}
        className="absolute top-6 right-6 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-all"
      >
        {i18n.language.startsWith('fr') ? '🌐 EN' : '🌐 FR'}
      </button>

      <div className="w-full max-w-[440px] bg-white border border-slate-100 p-10 rounded-2xl shadow-sm">
        
        {/* الأيقونة البنفسجية في الأعلى */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/10">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* العناوين */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Connexion</h2>
          <p className="text-sm text-slate-400 font-normal">Plateforme d'enquêtes de satisfaction</p>
        </div>

        {/* رسائل الخطأ إن وجدت */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-500 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {/* زر Google العلوي كما في الصورة */}
        <button
          type="button"
          className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl flex items-center justify-center gap-2.5 transition-all mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.71z"/>
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.04.7-2.37 1.12-4.23 1.12-3.22 0-5.89-2.61-6.84-5.67l-3.87 3C3.21 20.27 7.24 23 12 23z"/>
            <path fill="#FBBC05" d="M5.16 14.71c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31l-3.87-3C.47 8.77 0 10.33 0 12s.47 3.23 1.29 4.89l3.87-3.18z"/>
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 15.03 1 12 1 7.24 1 3.21 3.73 1.29 7.71l3.87 3C6.11 7.65 8.78 5.04 12 5.04z"/>
          </svg>
          Se connecter avec Google
        </button>

        {/* خط الفصل (OU CONTINUER AVEC) */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-slate-100 w-full"></div>
          <span className="absolute bg-white px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            OU CONTINUER AVEC
          </span>
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* زر التوصيل البنفسجي المشرق */}
          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/10 transition-all active:scale-[0.99] mt-2"
          >
            Se connecter
          </button>
        </form>

        {/* رابط إنشاء حساب السفلي */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Pas de compte ?{' '}
            <a href="#signup" className="text-indigo-600 font-semibold hover:underline">
              S'inscrire
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}