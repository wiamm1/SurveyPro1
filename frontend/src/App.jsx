// src/App.jsx

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Login from './Login';
import { SurveyListPage } from './pages/SurveyListPage';
import { SurveyEditorPage } from './pages/SurveyEditorPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RequirePermission } from './components/auth/RequirePermission';
import { useAuthStore } from './store/useAuthStore';
import { useEffect } from 'react';
import { UserManagementPage } from './pages/UserManagementPage';
import { AppShell } from './components/layout/AppShell';
import { Toaster } from 'sonner';

const ForbiddenPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-500">
        403
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Accès refusé</h1>
      <p className="mt-3 text-sm text-slate-500">
        Vous n'avez pas les permissions nécessaires pour consulter cette page.
      </p>
      <a
        href="/surveys"
        className="mt-6 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Retour
      </a>
    </div>
  </div>
);

function App() {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <Router>
      <Toaster richColors position="top-right" />
      <Routes>
        {/* 🔓 مسار مفتوح للجميع: صفحة تسجيل الدخول */}
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* 🔒 مسار محمي: يجب تسجيل الدخول للوصول */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/surveys" element={<SurveyListPage />} />
          <Route
            path="/surveys/:id/edit"
            element={
              <ProtectedRoute>
                <RequirePermission
                  permission="surveys:update"
                  fallback={<Navigate to="/403" replace />}
                >
                  <SurveyEditorPage />
                </RequirePermission>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/branding"
            element={
              <ProtectedRoute requiredRole="admin">
                <div />
              </ProtectedRoute>
            }
          />
          <Route
            path="/webhooks"
            element={
              <ProtectedRoute requiredRole="admin">
                <div />
              </ProtectedRoute>
            }
          />
          <Route
            path="/automations"
            element={
              <ProtectedRoute requiredRole="admin">
                <div />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 🔄 توجيه تلقائي: أي واحد دخل للموقع، السيستم كيديه لـ /surveys
            وإلى مكانش مسجل كـ Admin، الـ AdminRoute غاتردوا لـ /login تلقائياً */}
        <Route path="*" element={<Navigate to="/surveys" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
