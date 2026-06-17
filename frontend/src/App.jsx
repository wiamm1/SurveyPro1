// src/App.jsx

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './Login';
import { EditSurveyPage } from './components/surveys/EditSurveyPage.tsx';
import { SurveysPage } from './pages/SurveysPage';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');

  if (token) {
    return <Outlet />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔓 مسار مفتوح للجميع: صفحة تسجيل الدخول */}
        <Route path="/login" element={<Login />} />

        {/* 🔒 مسار محمي: يجب تسجيل الدخول للوصول */}
        <Route element={<ProtectedRoute />}>
          <Route path="/surveys" element={<SurveysPage />} />
          <Route path="/surveys/:id/edit" element={<EditSurveyPage />} />
        </Route>

        {/* 🔄 توجيه تلقائي: أي واحد دخل للموقع، السيستم كيديه لـ /surveys
            وإلى مكانش مسجل كـ Admin، الـ AdminRoute غاتردوا لـ /login تلقائياً */}
        <Route path="*" element={<Navigate to="/surveys" replace />} />
        
      </Routes>
    </Router>
  );
}

export default App;