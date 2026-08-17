import React, { useState } from 'react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('teacher'); // 'admin' or 'teacher'

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 sm:p-8">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 -left-10 h-[400px] w-[400px] rounded-full bg-indigo-400/20 mix-blend-multiply blur-3xl" />
      <div className="absolute top-1/3 -right-10 h-[400px] w-[400px] rounded-full bg-purple-400/20 mix-blend-multiply blur-3xl" />
      <div className="absolute -bottom-8 left-1/3 h-[400px] w-[400px] rounded-full bg-pink-400/20 mix-blend-multiply blur-3xl" />

      {/* Main Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300">

        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 tracking-tight">
            EduManage
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {isLogin ? 'Sign in to access your dashboard' : 'Create your school account'}
          </p>
        </div>

        {/* Role Selector Tabs (Only show if registering, or maybe for login too to specify portal) */}
        <div className="mb-6 flex rounded-xl bg-slate-200/50 p-1">
          <button
            onClick={() => setRole('teacher')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-300 ${role === 'teacher'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Creat your account
          </button>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 ml-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-medium text-slate-700">Password</label>
              {isLogin && <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">Forgot?</a>}
            </div>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 ml-1">Phone Number</label>
              <input
                type="number"
                placeholder="Enter your phone number"
                className="w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95"
            >
              <span className="relative z-10">{isLogin ? 'Sign In' : 'Create Account'}</span>
              <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-tr from-purple-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            </button>
          </div>
        </form>

        {/* Footer Toggle */}
        <div className="mt-8 text-center text-sm text-slate-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-indigo-600 transition-colors hover:text-indigo-800 focus:outline-none"
          >
            {isLogin ? 'Register now' : 'Sign in instead'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;

