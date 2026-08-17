import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseJsonResponse } from '../api';

const SmsLogin = ({ onBack, onNavigateToRegister }) => {
  const [role, setRole] = useState('teacher'); // 'teacher' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
        const data = await parseJsonResponse(response);

        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.role === 'teacher') {
            navigate('/teacher-dashboard');
        } else if (data.user.role === 'admin') {
            navigate('/admin-dashboard');
        } else if (data.user.role === 'student') {
            navigate('/student-dashboard');
        }
    } catch (err) {
        setError(err.message || 'Server error connecting to backend');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 relative overflow-hidden">

      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-indigo-600 skew-y-6 origin-top-left -z-10 shadow-xl"></div>

      <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl opacity-95 relative">
        {onBack && (
           <button onClick={onBack} className="absolute top-6 left-6 text-indigo-200 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
        )}
        <div className="p-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 mt-4 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"></path></svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-slate-500 font-medium">Login to your EduManage portal</p>
        </div>

        <div className="px-10 pb-10">
          {/* Role Toggle */}
          <div className="mb-8 flex space-x-1 rounded-xl bg-slate-100/80 p-1">
            <button
              onClick={() => setRole('teacher')}
              type="button"
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${role === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Teacher
            </button>
            <button
              onClick={() => setRole('student')}
              type="button"
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${role === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Student
            </button>
            <button
              onClick={() => setRole('admin')}
              type="button"
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${role === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Admin
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 border-l-4 border-red-500 text-sm text-red-700">
                {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-500">Forgot?</a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <button
              type="submit"
              className="mt-8 w-full rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.98]"
            >
              Sign In as {role === 'teacher' ? 'Teacher' : role === 'admin' ? 'Admin' : 'Student'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-500">
            Don't have an account?{' '}
            <button type="button" onClick={onNavigateToRegister} className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsLogin;
