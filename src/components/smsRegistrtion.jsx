import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCropModal from './ImageCropModal';
import { parseJsonResponse, BASE_URL } from '../api';

const SmsRegistration = ({ onBack, onNavigateToLogin }) => {
    const [step, setStep] = useState(1);
    const [dpBase64, setDpBase64] = useState('');
    const [rawCropImageSrc, setRawCropImageSrc] = useState(null);
    const [role, setRole] = useState('teacher');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [subject, setSubject] = useState('');
    const [grade, setGrade] = useState('');
    const [department, setDepartment] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegisterOrNext = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (step === 1) {
            const isRoleValid = role === 'teacher' ? !!subject : role === 'student' ? !!grade : true;
            if (!firstName || !lastName || !email || !password || !phoneNumber || !isRoleValid) {
                setError('Please fill all required fields');
                return;
            }
            setError('');
            setStep(2);
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phoneNumber,
                    subject: role === 'teacher' ? subject : undefined,
                    grade: role === 'student' ? grade : undefined,
                    department: role === 'admin' ? department : undefined,
                    password,
                    role,
                    dp: dpBase64
                })
            });
            
            const data = await parseJsonResponse(response);
            // Success, navigate to respective dashboard
            localStorage.setItem('user', JSON.stringify(data.user));
            if (role === 'teacher') {
                navigate('/teacher-dashboard');
            } else if (role === 'admin') {
                navigate('/admin-dashboard');
            } else if (role === 'student') {
                navigate('/student-dashboard');
            }
        } catch (err) {
            setError(err.message || 'Server error connecting to backend. Please check backend server and .env file.');
        }
    };

    return (
        <div className="flex min-h-screen bg-white relative">
            {rawCropImageSrc && (
                <ImageCropModal 
                    imageSrc={rawCropImageSrc} 
                    onComplete={(cropped) => {
                        setDpBase64(cropped);
                        setRawCropImageSrc(null);
                    }} 
                    onCancel={() => setRawCropImageSrc(null)}
                />
            )}
            {onBack && (
                <button onClick={onBack} className="absolute top-6 left-6 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
            )}
            {/* Visual Decoration for Registration (Hidden on mobile) */}
            <div className="hidden lg:flex w-[45%] flex-col justify-between bg-zinc-950 p-12 text-white relative overflow-hidden">
                {/* Abstract background elements */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-96 h-96 rounded-full bg-purple-500 opacity-20 blur-[100px]"></div>

                <div className="z-10 mt-12">
                    <div className="mb-12 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/10">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"></path></svg>
                    </div>
                    <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
                        Transform your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">academic flow</span>
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-md">
                        Join EduManage today to empower your teachers and streamline administration.
                    </p>
                </div>

                <div className="z-10 mb-8 p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex gap-1 mb-3 text-indigo-400">
                        {'★★★★★'.split('').map((star, i) => <span key={i}>{star}</span>)}
                    </div>
                    <blockquote className="text-zinc-300 font-medium leading-relaxed">
                        "Switching to EduManage was the best decision for our district. The dual dashboard interface saves us countless hours every week."
                    </blockquote>
                    <div className="mt-4 font-bold text-sm text-white">— Sarah Jenkins, Principal</div>
                </div>
            </div>

            {/* Form Container */}
            <div className="flex w-full lg:w-[55%] items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile Header (Hidden on Desktop) */}
                    <div className="mb-10 lg:hidden text-center">
                        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">EduManage</h1>
                        <p className="mt-2 text-zinc-500 font-medium">Create your school account</p>
                    </div>

                    <h2 className="hidden lg:block text-3xl font-extrabold text-zinc-900 mb-8 tracking-tight">Create your account</h2>

                    <div className="flex bg-zinc-100 p-1 rounded-2xl mb-6">
                        <button
                            type="button"
                            onClick={() => { setRole('teacher'); setError(''); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${role === 'teacher' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            Teacher
                        </button>
                        <button
                            type="button"
                            onClick={() => { setRole('student'); setError(''); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${role === 'student' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            Student
                        </button>
                        <button
                            type="button"
                            onClick={() => { setRole('admin'); setError(''); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${role === 'admin' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            Admin
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 border-l-4 border-red-500 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form className="space-y-4" onSubmit={handleRegisterOrNext}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-zinc-700 ml-1">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Enter your first name"
                                        className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-zinc-800 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/10"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-zinc-700 ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Enter your last name"
                                        className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-zinc-800 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-zinc-700 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-zinc-800 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/10"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-zinc-700 ml-1">Phone Number</label>
                                <input
                                    type="text"
                                    required
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter your phone number"
                                    className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-zinc-800 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/10"
                                />
                            </div>
                            {role === 'teacher' ? (
                                <div>
                                    <label className="text-sm font-semibold text-zinc-700 ml-1">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Enter your subject"
                                        className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-zinc-800 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/10"
                                    />
                                </div>
                            ) : role === 'student' ? (
                                <div>
                                    <label className="text-sm font-semibold text-zinc-700 ml-1">Grade/Class</label>
                                    <input
                                        type="text"
                                        required
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        placeholder="Enter your grade or class"
                                        className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-zinc-800 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/10"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="text-sm font-semibold text-zinc-700 ml-1">Department / Designation</label>
                                    <input
                                        type="text"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        placeholder="e.g. Administration, Principal"
                                        className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-zinc-800 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/10"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-semibold text-zinc-700 ml-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-zinc-800 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/10"
                                />
                            </div>

                            <button
                                type="submit"
                                className="mt-8 w-full rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
                            >
                                Continue to Next Step
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-extrabold text-zinc-900 mb-2">Choose your Profile Picture</h2>
                                <p className="text-sm text-zinc-500 font-medium">Upload a photo to be displayed on your dashboard.</p>
                            </div>
                            
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-300 rounded-3xl bg-zinc-50 hover:bg-zinc-100/80 transition-colors cursor-pointer relative group" onClick={() => document.getElementById('dp-upload').click()}>
                                <input 
                                    type="file" 
                                    id="dp-upload"
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setRawCropImageSrc(reader.result);
                                            reader.readAsDataURL(file);
                                        }
                                        e.target.value = null;
                                    }}
                                />
                                {dpBase64 ? (
                                    <div className="relative">
                                        <img src={dpBase64} alt="Profile Preview" className="w-40 h-40 rounded-full object-cover shadow-xl border-4 border-white transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-white shadow-md flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                    </div>
                                )}
                                <p className="mt-6 text-sm font-bold text-indigo-600 border px-6 py-2.5 border-indigo-100 rounded-full bg-white shadow-sm hover:shadow-md transition-all">Select from Gallery</p>
                            </div>
                            
                            <div className="flex space-x-3 pt-6">
                                <button 
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 rounded-2xl bg-white border-2 border-zinc-200 px-5 py-4 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-[0.98]"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRegisterOrNext}
                                    className="flex-[2] rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    Confirm & Access Dashboard
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </button>
                            </div>
                        </div>
                    )}

                    <p className="mt-8 text-center text-sm font-medium text-zinc-500">
                        Already have an account?{' '}
                        <button type="button" onClick={onNavigateToLogin} className="font-bold text-zinc-900 hover:underline">
                            Log in securely
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SmsRegistration;

