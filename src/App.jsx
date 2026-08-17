import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import SmsLogin from './components/SmsLogin';
import SmsRegistration from './components/smsRegistrtion';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { checkConnection } from './api';

const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkConnection()
      .then(res => console.log("Backend Connection Status:", res.message))
      .catch(err => console.error("Backend Connection Failed:", err));
  }, []);

  return (
    <Routes>
      <Route path="/" element={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl flex flex-col">
            <div className="bg-indigo-600 p-12 text-center">
              <h1 className="text-4xl font-extrabold text-white tracking-tight">EduManage</h1>
              <p className="mt-4 text-lg text-indigo-200">Select your workspace portal to continue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 flex-grow">
              <button
                onClick={() => navigate('/register')}
                className="group flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 p-8 transition-all hover:border-indigo-600 hover:bg-indigo-50"
              >
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Create your account</h3>
                <p className="mt-2 text-center text-sm text-slate-500">Access your classes, grades, and student information.</p>
              </button>

              <button
                onClick={() => navigate('/login')}
                className="group flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 p-8 transition-all hover:border-purple-600 hover:bg-purple-50"
              >
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Sign in</h3>
                <p className="mt-2 text-center text-sm text-slate-500">Manage school settings, staff, and student records.</p>
              </button>
            </div>
          </div>
        </div>
      } />

      <Route path="/login" element={
        <SmsLogin onBack={() => navigate('/')} onNavigateToRegister={() => navigate('/register')} />
      } />

      <Route path="/register" element={
        <SmsRegistration onBack={() => navigate('/')} onNavigateToLogin={() => navigate('/login')} />
      } />

      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
    </Routes>
  );
};


 const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};
export default App;
