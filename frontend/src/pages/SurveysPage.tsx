// frontend/src/pages/SurveysPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SurveyCard } from '../components/surveys/SurveyCard';
import { SurveyModal } from '../components/surveys/SurveyModal';

interface Survey {
  id: string | number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  sections_count: number;
  questions_count: number;
}

export const SurveysPage: React.FC = () => {
  const [enquetes, setEnquetes] = useState<Survey[]>([]);
  const [termeRecherche, setTermeRecherche] = useState('');
  const [chargement, setChargement] = useState(true);
  const [estModalOuvert, setEstModalOuvert] = useState(false);

  const navigate = useNavigate();
  const URL_API = 'http://localhost:8000/api/surveys';

  // 🔄 دالة جلب الاستبيانات من السيرفر (GET)
  const chargerEnquetes = async (recherche: string = '') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setChargement(true);
      const reponse = await fetch(`${URL_API}?search=${encodeURIComponent(recherche)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!reponse.ok) throw new Error('Erreur lors du chargement des enquêtes');
      const donnees = await reponse.json();
      setEnquetes(donnees);
    } catch (erreur) {
      console.error('Erreur:', erreur);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    const delaiDebounce = setTimeout(() => chargerEnquetes(termeRecherche), 300);
    return () => clearTimeout(delaiDebounce);
  }, [termeRecherche]);

  // ✨ الدالة المحدثة: تستقبل الـ ID الحقيقي مباشرة وتوجه المستخدم فوراً إلى صفحة التعديل
  const handleSuiteCreation = (newSurveyId: number | string) => {
    setEstModalOuvert(false); // إغلاق الـ Modal
    navigate(`/surveys/${newSurveyId}/edit`); // 🚀 التوجيه الصحيح بالـ ID الحقيقي بدون undefined!
  };

  // 👥 دالة نسخ استبيان قائم
  const handleDupliquerEnquete = async (id: string | number) => {
    const token = localStorage.getItem('token');
    try {
      const reponse = await fetch(`${URL_API}/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (reponse.ok) chargerEnquetes(termeRecherche);
    } catch (erreur) {
      console.error("Erreur:", erreur);
    }
  };

  // 🗑️ دالة حذف استبيان
  const handleSupprimerEnquete = async (id: string | number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette enquête ?")) return;
    const token = localStorage.getItem('token');
    try {
      const reponse = await fetch(`${URL_API}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (reponse.ok) chargerEnquetes(termeRecherche);
    } catch (erreur) {
      console.error("Erreur:", erreur);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Enquêtes</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos enquêtes de satisfaction</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setEstModalOuvert(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 shadow-sm transition-all"
          >
            + Créer une enquête
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('user_role');
              navigate('/login');
            }}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-all"
          >
            Se déconnecter
          </button>
        </div>
      </div>
      
      <input
        type="text"
        placeholder="Rechercher..."
        value={termeRecherche}
        onChange={(e) => setTermeRecherche(e.target.value)}
        className="border border-gray-200 p-2.5 rounded-lg w-full max-w-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
      />

      {chargement ? (
        <div className="text-gray-400 text-sm animate-pulse">Chargement des données...</div>
      ) : (
        <div className="grid gap-4">
          {enquetes.map((enquete) => (
            <SurveyCard
              key={enquete.id}
              id={enquete.id}
              title={enquete.title}
              description={enquete.description}
              status={enquete.status}
              date={new Date(enquete.created_at).toLocaleDateString()} 
              sectionsCount={enquete.sections_count} 
              questionsCount={enquete.questions_count}
              onEdit={() => navigate(`/surveys/${enquete.id}/edit`)}
              onAnalytics={() => navigate(`/surveys/${enquete.id}/analytics`)}
              onDuplicate={() => handleDupliquerEnquete(enquete.id)}
              onDelete={() => handleSupprimerEnquete(enquete.id)}
            />
          ))}
        </div>
      )}

      {/* 📦 النافذة المنبثقة المربوطة بالـ Handler الجديد والـ ID الحقيقي */}
      <SurveyModal 
        isOpen={estModalOuvert} 
        onClose={() => setEstModalOuvert(false)} 
        onCreate={handleSuiteCreation} // ✅ متوافق تماماً دبا
      />
    </div>
  );
};