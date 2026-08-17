import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCropModal from './ImageCropModal';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'classes', 'settings'
    
    // Assigned Classes State
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null); // { className, subject }
    const [classStudents, setClassStudents] = useState([]);
    
    // Marks Entry States
    const [selectedStudent, setSelectedStudent] = useState(null); // student object
    const [showMarksForm, setShowMarksForm] = useState(false);
    const [marksFormData, setMarksFormData] = useState({
        subject: '',
        marks: 0,
        totalMarks: 100,
        examName: 'Midterm'
    });

    // Profile Settings States
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
            if (parsed.role !== 'teacher') {
                navigate('/login');
                return;
            }
            setUser(parsed);
            setFirstName(parsed.firstName || '');
            setLastName(parsed.lastName || '');
            setEmail(parsed.email || '');
            setPhoneNumber(parsed.phoneNumber || '');
            
            fetchAssignedClasses(parsed._id);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchAssignedClasses = async (teacherId) => {
        try {
            const response = await fetch(`/api/teacher/classes/${teacherId}`);
            if (response.ok) {
                const data = await response.json();
                setAssignedClasses(data.classes || []);
            }
        } catch (error) {
            console.error("Failed to fetch classes:", error);
        }
    };

    const handleClassClick = async (cls) => {
        setSelectedClass(cls);
        try {
            const response = await fetch(`/api/teacher/students/${encodeURIComponent(cls.className)}`);
            if (response.ok) {
                const data = await response.json();
                setClassStudents(data.students || []);
            }
        } catch (error) {
            console.error("Failed to fetch students:", error);
        }
    };

    const handleMarksClick = (student, subject) => {
        setSelectedStudent(student);
        // Find if this student already has results for this exam + subject
        const existingResult = student.results?.find(r => r.subject.toLowerCase() === subject.toLowerCase());
        
        setMarksFormData({
            subject: subject,
            marks: existingResult ? existingResult.marks : 0,
            totalMarks: existingResult ? existingResult.totalMarks : 100,
            examName: existingResult ? existingResult.examName : 'Midterm'
        });
        setShowMarksForm(true);
    };

    const handleMarksSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !selectedClass) return;
        try {
            const response = await fetch('/api/teacher/marks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudent._id,
                    subject: marksFormData.subject,
                    marks: Number(marksFormData.marks),
                    totalMarks: Number(marksFormData.totalMarks),
                    examName: marksFormData.examName
                })
            });
            if (response.ok) {
                // Refresh student list
                handleClassClick(selectedClass);
                setShowMarksForm(false);
                setSelectedStudent(null);
            }
        } catch (error) {
            console.error("Failed to save marks:", error);
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

    // Render Sub-components
    const renderOverview = () => (
        <div className="space-y-6">
            <header className="h-28 py-4 rounded-3xl border border-white/5 bg-slate-900/40 shadow-[0_4px_30px_rgb(0,0,0,0.5)] backdrop-blur-2xl flex flex-col justify-center px-6 md:px-8 mb-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent z-0"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-slate-800 text-white rounded-xl border border-white/10 hover:bg-slate-700 transition-colors shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <div className="flex items-center gap-4 sm:gap-6 relative">
                        <div className="relative group cursor-pointer inline-block shrink-0" onClick={() => document.getElementById('dashboard-dp-upload').click()}>
                            <input 
                                type="file" 
                                id="dashboard-dp-upload"
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleDpSelect}
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-10 border-4 border-transparent">
                                <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </div>
                            {newDpBase64 || user?.dp ? (
                                <img src={newDpBase64 || user?.dp} alt="Profile" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-slate-800 shadow-[0_0_15px_rgba(16,185,129,0.3)] relative z-0" />
                            ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-slate-800 shadow-[0_0_15px_rgba(16,185,129,0.3)] relative z-0">
                                    {(user?.firstName || 'T').charAt(0)}
                                </div>
                            )}
                        </div>
                        
                        {newDpBase64 && (
                            <div className="absolute -bottom-10 left-0 bg-slate-900 border border-white/10 rounded-xl p-2 shadow-2xl z-20 flex gap-2 w-max animate-bounce">
                                <button 
                                    disabled={isUpdatingDp}
                                    onClick={confirmDpUpdate}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 outline-none text-white text-xs font-bold rounded-lg transition-colors flex items-center shadow-[0_0_10px_rgba(16,185,129,0.3)] disabled:opacity-50"
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
                                Good Day, {user?.firstName || 'Jane'}! 👋
                            </h2>
                            <p className="text-slate-400 font-medium text-xs sm:text-sm">
                                You are assigned to teach <span className="text-emerald-400 font-bold">{assignedClasses.length} classes</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats Card */}
                <div className="bg-slate-900/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                    <h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-4">Teaching Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-800/40 rounded-2xl border border-white/5">
                            <span className="block text-slate-500 text-xs font-semibold">Assigned Subjects</span>
                            <span className="text-2xl font-extrabold text-white">{user?.subject || 'Physics'}</span>
                        </div>
                        <div className="p-4 bg-slate-800/40 rounded-2xl border border-white/5">
                            <span className="block text-slate-500 text-xs font-semibold">Total Classes</span>
                            <span className="text-2xl font-extrabold text-white">{assignedClasses.length}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Notice Bulletin</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">Admin updates and assignments are managed centrally. Please communicate class changes to the administration.</p>
                    </div>
                    <button onClick={() => setActiveTab('classes')} className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                        Manage Assigned Classes
                    </button>
                </div>
            </div>
        </div>
    );

    const renderClasses = () => (
        <div className="bg-slate-900/50 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 space-y-6">
            {!selectedClass ? (
                <div>
                    <h3 className="text-xl font-bold text-white mb-6">Assigned Classes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignedClasses.map((cls, index) => (
                            <div 
                                key={index} 
                                onClick={() => handleClassClick(cls)}
                                className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
                            >
                                <div>
                                    <h4 className="text-lg font-extrabold text-white mb-1 group-hover:text-emerald-400 transition-colors">{cls.className}</h4>
                                    <p className="text-slate-400 text-sm">Subject: {cls.subject}</p>
                                </div>
                                <div className="mt-6 flex justify-between items-center text-xs text-slate-500">
                                    <span>Manage Student Marks</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </div>
                        ))}
                        {assignedClasses.length === 0 && (
                            <p className="text-slate-500 text-sm italic">You have not been assigned any classes by the Admin yet.</p>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => { setSelectedClass(null); setClassStudents([]); }} className="flex items-center text-slate-400 hover:text-white text-sm font-semibold transition-colors">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            Back to Classes
                        </button>
                        <h3 className="text-xl font-bold text-white">{selectedClass.className} — {selectedClass.subject} Student List</h3>
                    </div>

                    {showMarksForm && selectedStudent && (
                        <div className="mb-6 p-6 bg-slate-800/80 rounded-3xl border border-white/10 max-w-lg mx-auto">
                            <h4 className="text-base font-bold text-white mb-4">Enter Marks for {selectedStudent.firstName} {selectedStudent.lastName}</h4>
                            <form onSubmit={handleMarksSubmit} className="space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 mb-1">Exam Type</label>
                                        <select value={marksFormData.examName} onChange={e => setMarksFormData({ ...marksFormData, examName: e.target.value })} className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2">
                                            <option value="Midterm">Midterm Exam</option>
                                            <option value="Final Exam">Final Exam</option>
                                            <option value="Monthly Test">Monthly Test</option>
                                            <option value="Assignment">Assignment</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Subject</label>
                                        <input type="text" value={marksFormData.subject} disabled className="w-full bg-slate-900/50 border border-white/10 text-slate-400 rounded-xl px-3 py-2" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 mb-1">Marks Obtained</label>
                                        <input type="number" value={marksFormData.marks} onChange={e => setMarksFormData({ ...marksFormData, marks: Number(e.target.value) })} required className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Total Marks</label>
                                        <input type="number" value={marksFormData.totalMarks} onChange={e => setMarksFormData({ ...marksFormData, totalMarks: Number(e.target.value) })} required className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2" />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl">Save Marks</button>
                                    <button type="button" onClick={() => setShowMarksForm(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl">Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden">
                        {classStudents.length === 0 ? (
                            <p className="p-12 text-center text-slate-500 text-sm">No students registered in this grade.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-slate-900/40 text-slate-400 uppercase font-semibold">
                                            <th className="px-6 py-4">Student</th>
                                            <th className="px-6 py-4">Roll No</th>
                                            <th className="px-6 py-4">Current Grade Marks ({selectedClass.subject})</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classStudents.map(student => {
                                            const score = student.results?.find(r => r.subject.toLowerCase() === selectedClass.subject.toLowerCase());
                                            return (
                                                <tr key={student._id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors text-slate-300">
                                                    <td className="px-6 py-4 font-bold text-white flex items-center space-x-3">
                                                        {student.dp ? (
                                                            <img src={student.dp} alt={student.firstName} className="w-8 h-8 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">{student.firstName.charAt(0)}</div>
                                                        )}
                                                        <span>{student.firstName} {student.lastName}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400">{student.rollNo || 'N/A'}</td>
                                                    <td className="px-6 py-4 font-semibold">
                                                        {score ? (
                                                            <span className="text-white bg-slate-800 px-3 py-1 rounded border border-white/5">
                                                                {score.marks} / {score.totalMarks} ({score.examName})
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500 italic">No marks added</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => handleMarksClick(student, selectedClass.subject)} 
                                                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors"
                                                        >
                                                            {score ? 'Update Marks' : 'Enter Marks'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
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
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-2">Last Name</label>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Phone Number</label>
                    <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>

                <div className="border-t border-white/5 pt-5 space-y-4">
                    <h4 className="text-sm font-bold text-white">Change Password (leave empty to keep current)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">New Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="••••••••" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">Confirm Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="••••••••" />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={isSavingProfile} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
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
            {/* Blurs */}
            <div className="absolute top-1/4 -right-20 h-[600px] w-[600px] rounded-full bg-emerald-600/10 mix-blend-screen blur-[120px] z-0" />
            <div className="absolute bottom-0 left-10 h-[700px] w-[700px] rounded-full bg-indigo-600/10 mix-blend-screen blur-[150px] z-0" />

            {/* Mobile Sidebar overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 m-4 mr-0 rounded-3xl border border-white/5 bg-slate-900/95 shadow-2xl backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
                <div>
                   <div className="h-24 flex items-center justify-between px-6 border-b border-white/5">
                      <div className="flex items-center w-full">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] mr-3">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l-9 5-9-5zm0 0v6"></path></svg>
                          </div>
                          <h1 className="text-xl font-extrabold tracking-tight text-white">Teach<span className="text-emerald-400">Portal</span></h1>
                      </div>
                      <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors p-1 bg-white/5 rounded-lg border border-white/5">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                   </div>
                   <nav className="p-4 space-y-2 mt-2">
                        <button onClick={() => { setActiveTab('dashboard'); setSelectedClass(null); setIsSidebarOpen(false); }} className={`w-full text-left rounded-xl px-4 py-3 flex items-center cursor-pointer transition-all ${
                            activeTab === 'dashboard' ? 'bg-white/10 text-white border border-white/5 shadow-sm' : 'hover:bg-white/5 text-slate-400'
                        }`}>
                            <svg className={`w-5 h-5 mr-3 shrink-0 ${activeTab === 'dashboard' ? 'text-emerald-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                            <span className="font-semibold text-sm">Dashboard</span>
                        </button>
                        
                        <button onClick={() => { setActiveTab('classes'); setSelectedClass(null); setIsSidebarOpen(false); }} className={`w-full text-left rounded-xl px-4 py-3 flex items-center cursor-pointer transition-all ${
                            activeTab === 'classes' ? 'bg-white/10 text-white border border-white/5 shadow-sm' : 'hover:bg-white/5 text-slate-400'
                        }`}>
                            <svg className={`w-5 h-5 mr-3 shrink-0 ${activeTab === 'classes' ? 'text-emerald-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                            <span className="font-semibold text-sm">My Classes</span>
                        </button>

                        <button onClick={() => { setActiveTab('settings'); setSelectedClass(null); setIsSidebarOpen(false); }} className={`w-full text-left rounded-xl px-4 py-3 flex items-center cursor-pointer transition-all ${
                            activeTab === 'settings' ? 'bg-white/10 text-white border border-white/5 shadow-sm' : 'hover:bg-white/5 text-slate-400'
                        }`}>
                            <svg className={`w-5 h-5 mr-3 shrink-0 ${activeTab === 'settings' ? 'text-emerald-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="font-semibold text-sm">Profile Settings</span>
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
                     activeTab === 'classes' ? renderClasses() :
                     renderSettings()}
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard;

