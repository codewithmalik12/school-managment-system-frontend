import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCropModal from './ImageCropModal';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'results', 'fees', 'notices', 'settings'
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notices, setNotices] = useState([]);
    
    // Profile Update States
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    
    // DP Crop States
    const [newDpBase64, setNewDpBase64] = useState(null);
    const [rawCropImageSrc, setRawCropImageSrc] = useState(null);
    const [isUpdatingDp, setIsUpdatingDp] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            // Verify role
            if (parsed.role !== 'student') {
                navigate('/login');
                return;
            }
            setUser(parsed);
            setFirstName(parsed.firstName || '');
            setLastName(parsed.lastName || '');
            setEmail(parsed.email || '');
            setPhoneNumber(parsed.phoneNumber || '');
        } else {
            navigate('/login');
        }
        
        fetchNotices();
    }, [navigate]);

    const fetchNotices = async () => {
        try {
            const response = await fetch('/api/admin/notices');
            if (response.ok) {
                const data = await response.json();
                // Filter notices targeted to students or all
                const filtered = data.notices.filter(n => n.target === 'all' || n.target === 'student');
                setNotices(filtered);
            }
        } catch (error) {
            console.error("Failed to fetch notices:", error);
        }
    };

    const handleDpSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setRawCropImageSrc(reader.result);
            reader.readAsDataURL(file);
        }
        e.target.value = null;
    };

    const handleCropComplete = (croppedImg) => {
        setNewDpBase64(croppedImg);
        setRawCropImageSrc(null);
    };

    const confirmDpUpdate = async () => {
        if (!newDpBase64 || !user) return;
        setIsUpdatingDp(true);
        try {
            const response = await fetch(`/api/auth/update-dp/${user._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dp: newDpBase64 })
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                setNewDpBase64(null);
            }
        } catch (error) {
            console.error("DP Update failed:", error);
        } finally {
            setIsUpdatingDp(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');

        if (password && password !== confirmPassword) {
            setProfileError('Passwords do not match');
            return;
        }

        setIsSavingProfile(true);
        try {
            const updateBody = {
                firstName,
                lastName,
                email,
                phoneNumber
            };
            if (password) {
                updateBody.password = password;
            }

            const response = await fetch(`/api/auth/update-profile/${user._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateBody)
            });
            
            const data = await response.json();
            if (!response.ok) {
                setProfileError(data.message || 'Failed to update profile');
                return;
            }

            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            setProfileSuccess('Profile updated successfully!');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setProfileError('Server error updating profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Helper functions for GPA / percentage
    const getOverallStats = () => {
        if (!user || !user.results || user.results.length === 0) return { pct: 0, grade: 'N/A' };
        const totalObtained = user.results.reduce((sum, r) => sum + r.marks, 0);
        const totalMax = user.results.reduce((sum, r) => sum + r.totalMarks, 0);
        const pct = Math.round((totalObtained / totalMax) * 100);
        
        let grade = 'F';
        if (pct >= 90) grade = 'A+';
        else if (pct >= 80) grade = 'A';
        else if (pct >= 70) grade = 'B';
        else if (pct >= 60) grade = 'C';
        else if (pct >= 50) grade = 'D';
        
        return { pct, grade };
    };

    const stats = getOverallStats();

    // Render Sub-components
    const renderOverview = () => (
        <div className="space-y-6">
            <header className="h-28 py-4 rounded-3xl border border-white/5 bg-slate-900/40 shadow-[0_4px_30px_rgb(0,0,0,0.5)] backdrop-blur-2xl flex flex-col justify-center px-6 md:px-8 mb-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-1/3  from-indigo-500/10 to-transparent z-0"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-slate-800 text-white rounded-xl border border-white/10 hover:bg-slate-700 transition-colors shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <div className="flex items-center gap-4 sm:gap-6 relative">
                        <div className="relative group cursor-pointer inline-block shrink-0" onClick={() => document.getElementById('dash-dp-input').click()}>
                            <input 
                                type="file" 
                                id="dash-dp-input"
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleDpSelect}
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-10">
                                <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </div>
                            {newDpBase64 || user?.dp ? (
                                <img src={newDpBase64 || user?.dp} alt="Profile" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-slate-800 shadow-[0_0_15px_rgba(99,102,241,0.3)] relative z-0" />
                            ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full   from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-slate-800 shadow-[0_0_15px_rgba(99,102,241,0.3)] relative z-0">
                                    {(user?.firstName || 'S').charAt(0)}
                                </div>
                            )}
                        </div>
                        
                        {newDpBase64 && (
                            <div className="absolute -bottom-10 left-0 bg-slate-900 border border-white/10 rounded-xl p-2 shadow-2xl z-20 flex gap-2 w-max animate-bounce">
                                <button 
                                    disabled={isUpdatingDp}
                                    onClick={confirmDpUpdate}
                                    className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 outline-none text-white text-xs font-bold rounded-lg transition-colors flex items-center shadow-[0_0_10px_rgba(99,102,241,0.3)] disabled:opacity-50"
                                >
                                    {isUpdatingDp ? 'Wait...' : 'Confirm'}
                                </button>
                                <button 
                                    disabled={isUpdatingDp}
                                    onClick={() => setNewDpBase64(null)}
                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 outline-none text-white text-xs font-bold rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1 tracking-wide">
                                Welcome, {user?.firstName} {user?.lastName}! 👋
                            </h2>
                            <p className="text-slate-400 font-medium text-xs sm:text-sm flex flex-wrap gap-x-4 gap-y-1">
                                <span>Roll No: <strong className="text-indigo-400 font-bold">{user?.rollNo || 'Pending'}</strong></span>
                                <span className="hidden sm:inline text-white/10">|</span>
                                <span>Class/Grade: <strong className="text-indigo-400 font-bold">{user?.grade || 'Unassigned'}</strong></span>
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Fee Card */}
                <div className="bg-slate-900/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col justify-between">
                    <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-indigo-500/15 rounded-full blur-xl"></div>
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-slate-400 text-xs uppercase tracking-wider font-bold">Tuition Fee Status</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                user?.feeStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                user?.feeStatus === 'Pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                                {user?.feeStatus || 'Unpaid'}
                            </span>
                        </div>
                        <p className="text-3xl font-extrabold text-white mb-1">${user?.feeAmount || 0}</p>
                        {user?.feeDueDate && (
                            <p className="text-xs text-slate-400">Due Date: {new Date(user.feeDueDate).toLocaleDateString()}</p>
                        )}
                    </div>
                    <button onClick={() => setActiveTab('fees')} className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold text-slate-300 border border-white/5 transition-all">
                        Fee Breakdown
                    </button>
                </div>

                {/* Academic Stats */}
                <div className="bg-slate-900/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col justify-between">
                    <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-indigo-500/15 rounded-full blur-xl"></div>
                    <div>
                        <h4 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-4">Academic Standings</h4>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-extrabold text-white">{stats.pct}%</p>
                            <p className="text-slate-400 text-sm">Overall Average</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Overall Grade: <strong className="text-indigo-400 font-bold">{stats.grade}</strong></p>
                    </div>
                    <button onClick={() => setActiveTab('results')} className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold text-slate-300 border border-white/5 transition-all">
                        View Report Card
                    </button>
                </div>

                {/* Notices Count */}
                <div className="bg-slate-900/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col justify-between">
                    <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-indigo-500/15 rounded-full blur-xl"></div>
                    <div>
                        <h4 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-4">Board Notices</h4>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-extrabold text-white">{notices.length}</p>
                            <p className="text-slate-400 text-sm">Active announcements</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Latest notice posted: {notices[0] ? new Date(notices[0].createdAt).toLocaleDateString() : 'None'}</p>
                    </div>
                    <button onClick={() => setActiveTab('notices')} className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold text-slate-300 border border-white/5 transition-all">
                        Open Bulletin Board
                    </button>
                </div>
            </div>

            {/* Quick Updates Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-slate-900/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Notices</h3>
                    <div className="space-y-4">
                        {notices.slice(0, 3).map((notice) => (
                            <div key={notice._id} className="p-4 bg-slate-800/40 border border-white/5 rounded-2xl">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-bold text-white text-sm">{notice.title}</h4>
                                    <span className="text-xs text-slate-500">{new Date(notice.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{notice.content}</p>
                            </div>
                        ))}
                        {notices.length === 0 && (
                            <p className="text-slate-500 text-center py-6 text-sm">No notices posted for students.</p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 bg-slate-900/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Class Details</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-400">Class teacher</span>
                                <span className="text-slate-200 font-medium">Assigner Pending</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-400">Section</span>
                                <span className="text-slate-200 font-medium">Section A</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-slate-400">Registered Mobile</span>
                                <span className="text-slate-200 font-medium">{user?.phoneNumber || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center">
                        <svg className="w-5 h-5 text-indigo-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-xs text-slate-400 leading-relaxed">Keep your phone and email updated in settings to receive campus notices.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderResults = () => (
        <div className="bg-slate-900/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-6">Report Card & Marks</h3>
            
            {user?.results && user.results.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-white/10 bg-slate-900/40 text-xs text-slate-400 uppercase font-semibold">
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">Exam Name</th>
                                <th className="px-6 py-4">Marks Obtained</th>
                                <th className="px-6 py-4">Total Marks</th>
                                <th className="px-6 py-4">Percentage</th>
                                <th className="px-6 py-4 text-right">Date Released</th>
                            </tr>
                        </thead>
                        <tbody>
                            {user.results.map((res, i) => {
                                const percentage = Math.round((res.marks / res.totalMarks) * 100);
                                return (
                                    <tr key={i} className="border-b border-white/5  transition-colors text-slate-300">
                                        <td className="px-6 py-4 font-bold text-white">{res.subject}</td>
                                        <td className="px-6 py-4">{res.examName}</td>
                                        <td className="px-6 py-4 font-semibold text-indigo-400">{res.marks}</td>
                                        <td className="px-6 py-4">{res.totalMarks}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                                                percentage >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                percentage >= 60 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                percentage >= 50 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                                            }`}>
                                                {percentage}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs text-slate-500">{new Date(res.date).toLocaleDateString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 text-slate-500">
                    <svg className="w-12 h-12 mx-auto text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <p className="text-sm">No exam marks have been posted for you yet.</p>
                </div>
            )}
        </div>
    );

    const renderFees = () => (
        <div className="bg-slate-900/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-6">Tuition & Fee Breakdown</h3>
            
            <div className="p-6 bg-slate-800/40 rounded-3xl border border-white/5 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-slate-400 text-sm font-bold uppercase">Current Invoice</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user?.feeStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        user?.feeStatus === 'Pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                        {user?.feeStatus || 'Unpaid'}
                    </span>
                </div>
                
                <div className="space-y-4 border-b border-white/5 pb-6">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Regular Tuition Fee</span>
                        <span className="text-white font-bold">${user?.feeAmount || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Lab & Facility Charges</span>
                        <span>Included</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Library Charges</span>
                        <span>Included</span>
                    </div>
                </div>

                <div className="flex justify-between items-baseline pt-6 mb-8">
                    <span className="text-slate-300 font-semibold">Total Invoice Amount</span>
                    <span className="text-2xl font-extrabold text-indigo-400">${user?.feeAmount || 0}</span>
                </div>

                {user?.feeStatus !== 'Paid' ? (
                    <div className="bg-pink-500/5 border border-pink-500/10 p-4 rounded-2xl flex items-start gap-3">
                        <svg className="w-5 h-5 text-pink-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        <div>
                            <h5 className="text-pink-400 font-bold text-xs uppercase mb-1">Payment Overdue</h5>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Please pay the total amount by {user?.feeDueDate ? new Date(user.feeDueDate).toLocaleDateString() : 'the due date'} to avoid late penalty charges. Payment can be deposited at the Accounts Office.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex items-center gap-3">
                        <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-xs text-slate-400 leading-relaxed">Thank you! Your tuition fees are fully cleared. No pending actions.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderNoticesTab = () => (
        <div className="bg-slate-900/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-6">Bulletin Board notices</h3>
            <div className="space-y-6 max-w-3xl">
                {notices.map((notice) => (
                    <div key={notice._id} className="p-6 bg-slate-800/30 border border-white/5 rounded-3xl relative overflow-hidden group hover:border-indigo-500/20 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{notice.title}</h4>
                            <span className="text-xs text-slate-500 font-medium">{new Date(notice.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{notice.content}</p>
                    </div>
                ))}
                {notices.length === 0 && (
                    <p className="text-slate-500 text-center py-12">No notices found.</p>
                )}
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="bg-slate-900/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-6">Profile Settings</h3>
            
            {profileError && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 border-l-4 border-red-500 text-sm text-red-700">
                    {profileError}
                </div>
            )}
            {profileSuccess && (
                <div className="mb-6 rounded-lg bg-emerald-50 p-4 border-l-4 border-emerald-500 text-sm text-emerald-700">
                    {profileSuccess}
                </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-2">First Name</label>
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-2">Last Name</label>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Phone Number</label>
                    <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>

                <div className="border-t border-white/5 pt-5 space-y-4">
                    <h4 className="text-sm font-bold text-white">Change Password (leave empty to keep current)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">New Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="••••••••" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">Confirm Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="••••••••" />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={isSavingProfile} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSavingProfile ? 'Saving Changes...' : 'Update Profile Information'}
                </button>
            </form>
        </div>
    );

    return (
        <div className="relative flex h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
            {rawCropImageSrc && (
                <ImageCropModal 
                    imageSrc={rawCropImageSrc} 
                    onComplete={handleCropComplete} 
                    onCancel={() => setRawCropImageSrc(null)}
                />
            )}
            
            {/* Glows */}
            <div className="absolute top-1/4 -right-20  rounded-full bg-indigo-600/10 mix-blend-screen blur-[120px] z-0" />
            <div className="absolute bottom-0 left-10  rounded-full bg-purple-600/10 mix-blend-screen blur-[150px] z-0" />

            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 m-4 mr-0 rounded-3xl border border-white/5 bg-slate-900/95 shadow-2xl backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
                <div>
                    <div className="h-24 flex items-center justify-between px-6 border-b border-white/5">
                        <div className="flex items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl  from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] mr-3">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l-9 5-9-5zm0 0v6"></path></svg>
                            </div>
                            <h1 className="text-xl font-extrabold tracking-tight text-white">Student<span className="text-indigo-400">Hub</span></h1>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors p-1 bg-white/5 rounded-lg border border-white/5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <nav className="p-4 space-y-2 mt-2">
                        <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`w-full text-left rounded-xl px-4 py-3 flex items-center cursor-pointer transition-all ${
                            activeTab === 'dashboard' ? 'bg-white/10 text-white border border-white/5 shadow-sm' : 'hover:bg-white/5 text-slate-400'
                        }`}>
                            <svg className={`w-5 h-5 mr-3 shrink-0 ${activeTab === 'dashboard' ? 'text-indigo-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                            <span className="font-semibold text-sm">Overview</span>
                        </button>

                        <button onClick={() => { setActiveTab('results'); setIsSidebarOpen(false); }} className={`w-full text-left rounded-xl px-4 py-3 flex items-center cursor-pointer transition-all ${
                            activeTab === 'results' ? 'bg-white/10 text-white border border-white/5 shadow-sm' : 'hover:bg-white/5 text-slate-400'
                        }`}>
                            <svg className={`w-5 h-5 mr-3 shrink-0 ${activeTab === 'results' ? 'text-indigo-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <span className="font-semibold text-sm">Results</span>
                        </button>

                        <button onClick={() => { setActiveTab('fees'); setIsSidebarOpen(false); }} className={`w-full text-left rounded-xl px-4 py-3 flex items-center cursor-pointer transition-all ${
                            activeTab === 'fees' ? 'bg-white/10 text-white border border-white/5 shadow-sm' : 'hover:bg-white/5 text-slate-400'
                        }`}>
                            <svg className={`w-5 h-5 mr-3 shrink-0 ${activeTab === 'fees' ? 'text-indigo-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span className="font-semibold text-sm">Fees Status</span>
                        </button>

                        <button onClick={() => { setActiveTab('notices'); setIsSidebarOpen(false); }} className={`w-full text-left rounded-xl px-4 py-3 flex items-center cursor-pointer transition-all ${
                            activeTab === 'notices' ? 'bg-white/10 text-white border border-white/5 shadow-sm' : 'hover:bg-white/5 text-slate-400'
                        }`}>
                            <svg className={`w-5 h-5 mr-3 shrink-0 ${activeTab === 'notices' ? 'text-indigo-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                            <span className="font-semibold text-sm">Notices</span>
                        </button>

                        <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} className={`w-full text-left rounded-xl px-4 py-3 flex items-center cursor-pointer transition-all ${
                            activeTab === 'settings' ? 'bg-white/10 text-white border border-white/5 shadow-sm' : 'hover:bg-white/5 text-slate-400'
                        }`}>
                            <svg className={`w-5 h-5 mr-3 shrink-0 ${activeTab === 'settings' ? 'text-indigo-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="font-semibold text-sm">Settings</span>
                        </button>
                    </nav>
                </div>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <button onClick={() => navigate('/')} className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 text-slate-300 hover:text-white transition-all group">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        <span className="font-semibold text-sm">Back Home</span>
                    </button>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-500 hover:text-pink-400 transition-all group">
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        <span className="font-semibold text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col pt-4 p-2 sm:p-4 overflow-hidden">
                <div className="flex-1 overflow-auto pb-4 pr-1 sm:pr-2 custom-scrollbar">
                    {activeTab === 'dashboard' ? renderOverview() :
                     activeTab === 'results' ? renderResults() :
                     activeTab === 'fees' ? renderFees() :
                     activeTab === 'notices' ? renderNoticesTab() :
                     renderSettings()}
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
