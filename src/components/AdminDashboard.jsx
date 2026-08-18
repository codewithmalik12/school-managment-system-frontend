import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCropModal from './ImageCropModal';

const AdminDashboard = () => {
    const navigate = useNavigate();

    // -- State Management --
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'teachers', 'students', 'notices', 'settings'
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [notices, setNotices] = useState([]);
    
    // Logged in admin state
    const [adminUser, setAdminUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.role !== 'admin') {
                navigate('/login');
                return;
            }
            setAdminUser(parsed);
        } else {
            navigate('/login');
            return;
        }

        fetchTeachers();
        fetchStudents();
        fetchNotices();
    }, [navigate]);

    const fetchTeachers = async () => {
        try {
            const response = await fetch('/api/admin/teachers');
            if (response.ok) {
                const data = await response.json();
                const mapped = data.teachers.map(t => ({
                    id: t._id,
                    name: `${t.firstName} ${t.lastName}`,
                    firstName: t.firstName,
                    lastName: t.lastName,
                    email: t.email,
                    subject: t.subject || 'Unassigned',
                    phoneNumber: t.phoneNumber || '',
                    classes: t.classes || [],
                    dp: t.dp || ''
                }));
                setTeachers(mapped);
            }
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/admin/students');
            if (response.ok) {
                const data = await response.json();
                const mapped = data.students.map(s => ({
                    id: s._id,
                    name: `${s.firstName} ${s.lastName}`,
                    firstName: s.firstName,
                    lastName: s.lastName,
                    email: s.email,
                    grade: s.grade || 'Unassigned',
                    phoneNumber: s.phoneNumber || '',
                    rollNo: s.rollNo || '',
                    feeStatus: s.feeStatus || 'Unpaid',
                    feeAmount: s.feeAmount || 0,
                    feeDueDate: s.feeDueDate ? s.feeDueDate.substring(0, 10) : '',
                    results: s.results || [],
                    dp: s.dp || ''
                }));
                setStudents(mapped);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
        }
    };

    const fetchNotices = async () => {
        try {
            const response = await fetch('/api/admin/notices');
            if (response.ok) {
                const data = await response.json();
                setNotices(data.notices || []);
            }
        } catch (error) {
            console.error('Failed to fetch notices:', error);
        }
    };

    // Form States
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState('teacher'); // 'teacher' or 'student'
    const [editingId, setEditingId] = useState(null);
    
    // Teacher Form Fields
    const [teacherFormData, setTeacherFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        subject: '',
        classes: [] // array of { className, subject }
    });
    const [newClassName, setNewClassName] = useState('');
    const [newSubject, setNewSubject] = useState('');

    // Student Form Fields
    const [studentFormData, setStudentFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        grade: '',
        rollNo: '',
        feeStatus: 'Unpaid',
        feeAmount: 0,
        feeDueDate: ''
    });

    // Notices Form Fields
    const [noticeTitle, setNoticeTitle] = useState('');
    const [noticeContent, setNoticeContent] = useState('');
    const [noticeTarget, setNoticeTarget] = useState('all');

    // Admin Profile Form Fields
    const [adminProfileData, setAdminProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [adminProfileError, setAdminProfileError] = useState('');
    const [adminProfileSuccess, setAdminProfileSuccess] = useState('');
    const [isSavingAdminProfile, setIsSavingAdminProfile] = useState(false);

    // Crop DP States
    const [newDpBase64, setNewDpBase64] = useState(null);
    const [rawCropImageSrc, setRawCropImageSrc] = useState(null);
    const [isUpdatingDp, setIsUpdatingDp] = useState(false);

    useEffect(() => {
        if (adminUser) {
            setAdminProfileData({
                firstName: adminUser.firstName || '',
                lastName: adminUser.lastName || '',
                email: adminUser.email || '',
                phoneNumber: adminUser.phoneNumber || '',
                password: '',
                confirmPassword: ''
            });
        }
    }, [adminUser]);

    // -- Handlers for Teacher Form --
    const handleAddTeacherClick = () => {
        setFormType('teacher');
        setTeacherFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phoneNumber: '',
            subject: '',
            classes: []
        });
        setEditingId(null);
        setShowForm(true);
    };

    const handleEditTeacherClick = (teacher) => {
        setFormType('teacher');
        setTeacherFormData({
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email,
            password: '', // do not display old password
            phoneNumber: teacher.phoneNumber,
            subject: teacher.subject,
            classes: teacher.classes || []
        });
        setEditingId(teacher.id);
        setShowForm(true);
    };

    const handleTeacherSubmit = async (e) => {
        e.preventDefault();
        try {
            const body = { ...teacherFormData };
            if (!body.password) delete body.password; // don't update password if empty

            if (editingId) {
                const response = await fetch(`/api/admin/teachers/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (response.ok) fetchTeachers();
            } else {
                const response = await fetch("/api/admin/teachers", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...body })
                });
                if (response.ok) fetchTeachers();
            }
            setShowForm(false);
        } catch (error) {
            console.error('Teacher submit error:', error);
        }
    };

    const addClassToTeacher = () => {
        if (!newClassName || !newSubject) return;
        setTeacherFormData({
            ...teacherFormData,
            classes: [...teacherFormData.classes, { className: newClassName, subject: newSubject }]
        });
        setNewClassName('');
        setNewSubject('');
    };

    const removeClassFromTeacher = (index) => {
        setTeacherFormData({
            ...teacherFormData,
            classes: teacherFormData.classes.filter((_, i) => i !== index)
        });
    };

    const handleDeleteTeacher = async (id) => {
        if (!window.confirm("Are you sure you want to remove this teacher?")) return;
        try {
            await fetch(`/api/admin/teachers/${id}`, { method: 'DELETE' });
            setTeachers(teachers.filter(t => t.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    // -- Handlers for Student Form --
    const handleAddStudentClick = () => {
        setFormType('student');
        setStudentFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phoneNumber: '',
            grade: '',
            rollNo: '',
            feeStatus: 'Unpaid',
            feeAmount: 0,
            feeDueDate: ''
        });
        setEditingId(null);
        setShowForm(true);
    };

    const handleEditStudentClick = (student) => {
        setFormType('student');
        setStudentFormData({
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            password: '',
            phoneNumber: student.phoneNumber,
            grade: student.grade,
            rollNo: student.rollNo,
            feeStatus: student.feeStatus,
            feeAmount: student.feeAmount,
            feeDueDate: student.feeDueDate
        });
        setEditingId(student.id);
        setShowForm(true);
    };

    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        try {
            const body = { ...studentFormData };
            if (!body.password) delete body.password;

            if (editingId) {
                const response = await fetch(`/api/admin/students/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (response.ok) fetchStudents();
            } else {
                const response = await fetch(`/api/admin/students`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (response.ok) fetchStudents();
            }
            setShowForm(false);
        } catch (error) {
            console.error('Student submit error:', error);
        }
    };

    const handleDeleteStudent = async (id) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;
        try {
            await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
            setStudents(students.filter(s => s.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    // -- Handlers for Notice Posting --
    const handleNoticeSubmit = async (e) => {
        e.preventDefault();
        if (!noticeTitle || !noticeContent) return;
        try {
            const response = await fetch('/api/admin/notices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: noticeTitle, content: noticeContent, target: noticeTarget })
            });
            if (response.ok) {
                setNoticeTitle('');
                setNoticeContent('');
                setNoticeTarget('all');
                fetchNotices();
            }
        } catch (error) {
            console.error('Notice create error:', error);
        }
    };

    const handleDeleteNotice = async (id) => {
        if (!window.confirm("Are you sure you want to delete this notice?")) return;
        try {
            const response = await fetch(`/api/admin/notices/${id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchNotices();
            }
        } catch (error) {
            console.error('Notice delete error:', error);
        }
    };

    // -- Handlers for Admin Profile --
    const handleAdminProfileSubmit = async (e) => {
        e.preventDefault();
        setAdminProfileError('');
        setAdminProfileSuccess('');

        if (adminProfileData.password && adminProfileData.password !== adminProfileData.confirmPassword) {
            setAdminProfileError('Passwords do not match');
            return;
        }

        setIsSavingAdminProfile(true);
        try {
            const body = {
                firstName: adminProfileData.firstName,
                lastName: adminProfileData.lastName,
                email: adminProfileData.email,
                phoneNumber: adminProfileData.phoneNumber
            };
            if (adminProfileData.password) {
                body.password = adminProfileData.password;
            }

            const response = await fetch(`/api/auth/update-profile/${adminUser._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) {
                setAdminProfileError(data.message || 'Failed to update profile');
                return;
            }
            setAdminUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            setAdminProfileSuccess('Profile updated successfully!');
            setAdminProfileData({
                ...adminProfileData,
                password: '',
                confirmPassword: ''
            });
        } catch (error) {
            setAdminProfileError('Server error updating profile');
        } finally {
            setIsSavingAdminProfile(false);
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
        if (!newDpBase64 || !adminUser) return;
        setIsUpdatingDp(true);
        try {
            const response = await fetch(`/api/auth/update-dp/${adminUser._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dp: newDpBase64 })
            });
            const data = await response.json();
            if (response.ok) {
                setAdminUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                setNewDpBase64(null);
            }
        } catch (error) {
            console.error("DP Update failed:", error);
        } finally {
            setIsUpdatingDp(false);
        }
    };

    // Calculations
    const totalCollectedFees = students
        .filter(s => s.feeStatus === 'Paid')
        .reduce((sum, s) => sum + s.feeAmount, 0);

    const pendingFeesCount = students
        .filter(s => s.feeStatus !== 'Paid').length;

    // -- Renderers --
    const renderOverview = () => (
        <React.Fragment>
            <header className="h-20 rounded-3xl border border-white/5 bg-slate-900/60 shadow-[0_4px_30px_rgb(0,0,0,0.5)] backdrop-blur-2xl flex items-center justify-between px-4 md:px-8 mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-slate-800 text-white rounded-xl border border-white/10 hover:bg-slate-700 transition-colors shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">System Overview</h2>
                        <p className="text-xs md:text-sm text-slate-400 font-medium hidden sm:block">Manage and monitor school activities</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3 md:space-x-6 relative">
                    <div className="hidden sm:block text-right">
                        <span className="block text-sm font-bold text-white">{adminUser?.firstName} {adminUser?.lastName}</span>
                        <span className="block text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">Administrator</span>
                    </div>
                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('admin-dp-upload').click()}>
                        <input type="file" id="admin-dp-upload" className="hidden" accept="image/*" onChange={handleDpSelect} />
                        {newDpBase64 || adminUser?.dp ? (
                            <img src={newDpBase64 || adminUser?.dp} alt="Admin" className="w-10 h-10 rounded-full object-cover border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                                {(adminUser?.firstName || 'A').charAt(0)}
                            </div>
                        )}
                        {newDpBase64 && (
                            <div className="absolute top-12 right-0 bg-slate-900 border border-white/10 rounded-xl p-2 shadow-2xl z-20 flex gap-2 w-max animate-bounce">
                                <button disabled={isUpdatingDp} onClick={confirmDpUpdate} className="px-2 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-bold rounded-lg disabled:opacity-50">Confirm</button>
                                <button disabled={isUpdatingDp} onClick={() => setNewDpBase64(null)} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold rounded-lg">Cancel</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-auto pb-4 pr-1 md:pr-2 custom-scrollbar">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                    <div className="bg-slate-900/50 backdrop-blur-2xl p-5 md:p-6 rounded-3xl shadow-xl border border-white/5 relative overflow-hidden group transition-all hover:border-cyan-500/30">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl transition-all group-hover:bg-cyan-500/20"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">Total Students</h3>
                                <p className="text-3xl md:text-4xl font-extrabold text-white mb-2 pb-1">{students.length}</p>
                                <p className="text-xs text-emerald-400 font-semibold flex items-center bg-emerald-400/10 inline-flex px-2 py-1 rounded-md">
                                    {pendingFeesCount} fee accounts pending
                                </p>
                            </div>
                            <div className="p-3 bg-slate-800 rounded-2xl text-cyan-400 border border-white/5 shadow-inner">
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-2xl p-5 md:p-6 rounded-3xl shadow-xl border border-white/5 relative overflow-hidden group transition-all hover:border-fuchsia-500/30">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl transition-all group-hover:bg-fuchsia-500/20"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">Total Teachers</h3>
                                <p className="text-3xl md:text-4xl font-extrabold text-white mb-2 pb-1">{teachers.length}</p>
                                <p className="text-xs text-fuchsia-400 font-semibold flex items-center bg-fuchsia-400/10 inline-flex px-2 py-1 rounded-md">
                                    Instructors database
                                </p>
                            </div>
                            <div className="p-3 bg-slate-800 rounded-2xl text-fuchsia-400 border border-white/5 shadow-inner">
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 p-5 md:p-6 shadow-xl border border-indigo-500/30 transition-all hover:border-indigo-400/50">
                        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl transition-transform group-hover:scale-150 duration-700 z-0"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <h3 className="text-indigo-200 text-xs uppercase tracking-wider font-bold mb-2">Fees Collected</h3>
                                <p className="text-3xl md:text-4xl font-extrabold text-white mb-2 pb-1">${totalCollectedFees}</p>
                                <p className="text-xs text-indigo-300 font-medium flex items-center">From Paid status students</p>
                            </div>
                            <div className="p-3 bg-indigo-500/20 backdrop-blur-md rounded-2xl text-indigo-300 border border-indigo-400/20">
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/5 p-5 md:p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white tracking-wide">Quick Student List</h3>
                            <button onClick={() => setActiveTab('students')} className="text-cyan-400 text-xs hover:underline">View All</button>
                        </div>
                        <div className="space-y-4">
                            {students.slice(0, 5).map(student => (
                                <div key={student.id} className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl border border-white/5">
                                    <div className="flex items-center space-x-3">
                                        {student.dp ? (
                                            <img src={student.dp} alt={student.name} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">{student.name.charAt(0)}</div>
                                        )}
                                        <div>
                                            <span className="block text-sm font-bold text-white">{student.name}</span>
                                            <span className="block text-[10px] text-slate-500">Roll No: {student.rollNo || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        student.feeStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                                    }`}>{student.feeStatus}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/5 p-5 md:p-6">
                        <h3 className="text-lg font-bold text-white tracking-wide mb-6">Recent Notices</h3>
                        <div className="space-y-6">
                            {notices.slice(0, 4).map(notice => (
                                <div key={notice._id} className="flex items-start space-x-4">
                                    <div className="mt-1.5 h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-200">{notice.title}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(notice.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {notices.length === 0 && <p className="text-slate-500 text-xs">No notices posted yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );

    const renderTeachers = () => (
        <React.Fragment>
            <header className="h-auto min-h-20 rounded-3xl border border-white/5 bg-slate-900/60 shadow-[0_4px_30px_rgb(0,0,0,0.5)] backdrop-blur-2xl flex flex-wrap md:flex-nowrap items-center justify-between p-4 md:px-8 mb-6 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-slate-800 text-white rounded-xl border border-white/10 hover:bg-slate-700 transition-colors shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">Teachers Management</h2>
                        <p className="text-xs md:text-sm text-slate-400 font-medium">Add, update classes, and manage instructors</p>
                    </div>
                </div>
                {!showForm && (
                    <button onClick={handleAddTeacherClick} className="w-full md:w-auto flex justify-center items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-5 py-2.5 rounded-full font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        <span>Add Teacher</span>
                    </button>
                )}
            </header>

            <div className="flex-1 overflow-auto pb-4 pr-1 md:pr-2 custom-scrollbar">
                {showForm && formType === 'teacher' ? (
                    <div className="max-w-2xl mx-auto bg-slate-900/50 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/5 p-6 md:p-8 relative overflow-hidden group transition-all">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl transition-all"></div>
                        <h3 className="text-xl font-bold text-white mb-6 relative z-10">{editingId ? 'Edit Teacher' : 'Add New Teacher'}</h3>
                        <form onSubmit={handleTeacherSubmit} className="relative z-10 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">First Name</label>
                                    <input type="text" value={teacherFormData.firstName} onChange={e => setTeacherFormData({ ...teacherFormData, firstName: e.target.value })} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">Last Name</label>
                                    <input type="text" value={teacherFormData.lastName} onChange={e => setTeacherFormData({ ...teacherFormData, lastName: e.target.value })} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">Email Address</label>
                                <input type="email" value={teacherFormData.email} onChange={e => setTeacherFormData({ ...teacherFormData, email: e.target.value })} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">Password {editingId && '(Leave blank to keep current)'}</label>
                                <input type="password" value={teacherFormData.password} onChange={e => setTeacherFormData({ ...teacherFormData, password: e.target.value })} required={!editingId} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">Phone Number</label>
                                <input type="text" value={teacherFormData.phoneNumber} onChange={e => setTeacherFormData({ ...teacherFormData, phoneNumber: e.target.value })} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">Subject Specialization</label>
                                <input type="text" value={teacherFormData.subject} onChange={e => setTeacherFormData({ ...teacherFormData, subject: e.target.value })} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                            </div>

                            {/* Class Assignment Management */}
                            <div className="border-t border-white/5 pt-5 space-y-4">
                                <h4 className="text-sm font-bold text-white">Assign Classes & Subjects</h4>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <input type="text" placeholder="Grade/Class (e.g. Grade 10)" value={newClassName} onChange={e => setNewClassName(e.target.value)} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-2 text-xs focus:outline-none" />
                                    </div>
                                    <div className="flex-1">
                                        <input type="text" placeholder="Subject (e.g. Physics)" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-2 text-xs focus:outline-none" />
                                    </div>
                                    <button type="button" onClick={addClassToTeacher} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl">Add</button>
                                </div>

                                <div className="space-y-2">
                                    {teacherFormData.classes.map((cls, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-slate-800 p-2.5 rounded-lg border border-white/5 text-xs text-slate-300">
                                            <span><strong>{cls.className}</strong> — {cls.subject}</span>
                                            <button type="button" onClick={() => removeClassFromTeacher(idx)} className="text-pink-500 hover:text-pink-400 font-bold">Remove</button>
                                        </div>
                                    ))}
                                    {teacherFormData.classes.length === 0 && (
                                        <p className="text-slate-500 text-xs italic">No classes assigned yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                                <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors">
                                    {editingId ? 'Save Changes' : 'Create Teacher'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl border border-white/5 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/5 overflow-hidden">
                        {teachers.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-slate-400">No teachers found. Add one to get started.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-slate-900/40">
                                            <th className="px-6 py-4 text-xs tracking-wider text-slate-400 uppercase font-semibold">Teacher</th>
                                            <th className="px-6 py-4 text-xs tracking-wider text-slate-400 uppercase font-semibold">Subject</th>
                                            <th className="px-6 py-4 text-xs tracking-wider text-slate-400 uppercase font-semibold">Assigned Classes</th>
                                            <th className="px-6 py-4 text-xs tracking-wider text-slate-400 uppercase font-semibold">Email</th>
                                            <th className="px-6 py-4 text-xs tracking-wider text-slate-400 uppercase font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teachers.map(teacher => (
                                            <tr key={teacher.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                                                    {teacher.dp ? (
                                                        <img src={teacher.dp} alt={teacher.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
                                                                {teacher.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span>{teacher.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                                                        {teacher.subject}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {teacher.classes && teacher.classes.map((cls, idx) => (
                                                            <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium border border-white/5">
                                                                {cls.className} ({cls.subject})
                                                            </span>
                                                        ))}
                                                        {(!teacher.classes || teacher.classes.length === 0) && (
                                                            <span className="text-slate-500 text-xs italic">None</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400 text-sm">{teacher.email}</td>
                                                <td className="px-6 py-4 flex justify-end space-x-2">
                                                    <button onClick={() => handleEditTeacherClick(teacher)} className="p-2 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-colors" title="Edit">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteTeacher(teacher.id)} className="p-2 rounded-lg bg-slate-800 text-pink-500 hover:bg-pink-500 hover:text-white transition-colors" title="Delete">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </React.Fragment>
    );

    const renderStudents = () => (
        <React.Fragment>
            <header className="h-auto min-h-20 rounded-3xl border border-white/5 bg-slate-900/60 shadow-[0_4px_30px_rgb(0,0,0,0.5)] backdrop-blur-2xl flex flex-wrap md:flex-nowrap items-center justify-between p-4 md:px-8 mb-6 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-slate-800 text-white rounded-xl border border-white/10 hover:bg-slate-700 transition-colors shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">Students Directory</h2>
                        <p className="text-xs md:text-sm text-slate-400 font-medium">Add, edit details, and manage student fee status</p>
                    </div>
                </div>
                {!showForm && (
                    <button onClick={handleAddStudentClick} className="w-full md:w-auto flex justify-center items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-5 py-2.5 rounded-full font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        <span>Add Student</span>
                    </button>
                )}
            </header>

            <div className="flex-1 overflow-auto pb-4 pr-1 md:pr-2 custom-scrollbar">
                {showForm && formType === 'student' ? (
                    <div className="max-w-2xl mx-auto bg-slate-900/50 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/5 p-6 md:p-8 relative overflow-hidden group transition-all">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl transition-all"></div>
                        <h3 className="text-xl font-bold text-white mb-6 relative z-10">{editingId ? 'Edit Student' : 'Add New Student'}</h3>
                        <form onSubmit={handleStudentSubmit} className="relative z-10 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">First Name</label>
                                    <input type="text" value={studentFormData.firstName} onChange={e => setStudentFormData({ ...studentFormData, firstName: e.target.value })} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">Last Name</label>
                                    <input type="text" value={studentFormData.lastName} onChange={e => setStudentFormData({ ...studentFormData, lastName: e.target.value })} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">Email Address</label>
                                <input type="email" value={studentFormData.email} onChange={e => setStudentFormData({ ...studentFormData, email: e.target.value })} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">Password {editingId && '(Leave blank to keep current)'}</label>
                                <input type="password" value={studentFormData.password} onChange={e => setStudentFormData({ ...studentFormData, password: e.target.value })} required={!editingId} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">Grade/Class (e.g. Grade 10)</label>
                                    <input type="text" value={studentFormData.grade} onChange={e => setStudentFormData({ ...studentFormData, grade: e.target.value })} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">Roll Number (auto-generated if empty)</label>
                                    <input type="text" value={studentFormData.rollNo} onChange={e => setStudentFormData({ ...studentFormData, rollNo: e.target.value })} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="SMS-1001" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">Phone Number</label>
                                <input type="text" value={studentFormData.phoneNumber} onChange={e => setStudentFormData({ ...studentFormData, phoneNumber: e.target.value })} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" />
                            </div>

                            {/* Fee Management Fields */}
                            <div className="border-t border-white/5 pt-5 space-y-4">
                                <h4 className="text-sm font-bold text-white">Fee Management</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Fee Status</label>
                                        <select value={studentFormData.feeStatus} onChange={e => setStudentFormData({ ...studentFormData, feeStatus: e.target.value })} className="w-full bg-slate-800/50 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none">
                                            <option value="Paid">Paid</option>
                                            <option value="Unpaid">Unpaid</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Fee Amount ($)</label>
                                        <input type="number" value={studentFormData.feeAmount} onChange={e => setStudentFormData({ ...studentFormData, feeAmount: Number(e.target.value) })} className="w-full bg-slate-800/50 border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Fee Due Date</label>
                                        <input type="date" value={studentFormData.feeDueDate} onChange={e => setStudentFormData({ ...studentFormData, feeDueDate: e.target.value })} className="w-full bg-slate-800/50 border border-white/10 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                                <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors">
                                    {editingId ? 'Save Changes' : 'Create Student'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl border border-white/5 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/5 overflow-hidden">
                        {students.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-slate-400">No students registered yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-slate-900/40">
                                            <th className="px-6 py-4 text-xs tracking-wider text-slate-400 uppercase font-semibold">Student</th>
                                            <th className="px-6 py-4 text-xs tracking-wider text-slate-400 uppercase font-semibold">Roll No</th>
                                            <th className="px-6 py-4 text-xs tracking-wider text-slate-400 uppercase font-semibold">Grade</th>
                                            <th className="px-6 py-4 text-xs tracking-wider text-slate-400 uppercase font-semibold">Fee status</th>
                                            <th className="px-6 py-4 text-xs tracking-wider text-slate-400 uppercase font-semibold">Fee Amount</th>
                                            <th className="px-6 py-4 text-xs tracking-wider text-slate-400 uppercase font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(student => (
                                            <tr key={student.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                                                    {student.dp ? (
                                                        <img src={student.dp} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span>{student.name}</span>
                                                </td>
                                                <td className="px-6 py-4 text-indigo-400 font-bold text-sm">{student.rollNo || 'N/A'}</td>
                                                <td className="px-6 py-4 text-slate-300 text-sm">{student.grade}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        student.feeStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                        student.feeStatus === 'Pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                        'bg-pink-500/20 text-pink-500 border border-pink-500/30'
                                                    }`}>{student.feeStatus}</span>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-white text-sm">${student.feeAmount}</td>
                                                <td className="px-6 py-4 flex justify-end space-x-2">
                                                    <button onClick={() => handleEditStudentClick(student)} className="p-2 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-colors" title="Edit">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteStudent(student.id)} className="p-2 rounded-lg bg-slate-800 text-pink-500 hover:bg-pink-500 hover:text-white transition-colors" title="Delete">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </React.Fragment>
    );

    const renderNotices = () => (
        <React.Fragment>
            <header className="h-20 rounded-3xl border border-white/5 bg-slate-900/60 shadow-[0_4px_30px_rgb(0,0,0,0.5)] backdrop-blur-2xl flex items-center justify-between px-4 md:px-8 mb-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">Notice Board</h2>
                    <p className="text-xs md:text-sm text-slate-400 font-medium">Broadcast campus announcements to users</p>
                </div>
            </header>

            <div className="flex-1 overflow-auto pb-4 pr-1 md:pr-2 custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form onSubmit={handleNoticeSubmit} className="lg:col-span-4 bg-slate-900/50 backdrop-blur-2xl rounded-3xl border border-white/5 p-6 space-y-4 self-start">
                    <h3 className="text-lg font-bold text-white">Post New Announcement</h3>
                    <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-2">Notice Title</label>
                        <input type="text" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors text-sm" placeholder="e.g. Midterm Examination Schedule" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-2">Target Audience</label>
                        <select value={noticeTarget} onChange={e => setNoticeTarget(e.target.value)} className="w-full bg-slate-800/50 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none">
                            <option value="all">Everyone (All)</option>
                            <option value="student">Students Only</option>
                            <option value="teacher">Teachers Only</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-2">Announcement Content</label>
                        <textarea rows="4" value={noticeContent} onChange={e => setNoticeContent(e.target.value)} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-sm" placeholder="Write notice content..."></textarea>
                    </div>
                    <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">Post Notice</button>
                </form>

                <div className="lg:col-span-8 bg-slate-900/50 backdrop-blur-2xl rounded-3xl border border-white/5 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Announcement Archive</h3>
                    <div className="space-y-4">
                        {notices.map(notice => (
                            <div key={notice._id} className="p-4 bg-slate-800/40 border border-white/5 rounded-2xl flex justify-between items-start">
                                <div className="flex-1 mr-4">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-bold text-white text-sm">{notice.title}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${
                                            notice.target === 'student' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                            notice.target === 'teacher' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' :
                                            'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                        }`}>{notice.target}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{notice.content}</p>
                                    <span className="block text-[10px] text-slate-500 mt-2">{new Date(notice.createdAt).toLocaleString()}</span>
                                </div>
                                <button onClick={() => handleDeleteNotice(notice._id)} className="text-pink-500 hover:text-pink-400 p-1 bg-slate-800 rounded-lg border border-white/5" title="Delete">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        ))}
                        {notices.length === 0 && (
                            <p className="text-slate-500 text-sm text-center py-12">No announcements posted yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );

    const renderSettings = () => (
        <React.Fragment>
            <header className="h-20 rounded-3xl border border-white/5 bg-slate-900/60 shadow-[0_4px_30px_rgb(0,0,0,0.5)] backdrop-blur-2xl flex items-center justify-between px-4 md:px-8 mb-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">Admin Profile Settings</h2>
                    <p className="text-xs md:text-sm text-slate-400 font-medium">Update your credentials and display picture</p>
                </div>
            </header>

            <div className="flex-1 overflow-auto pb-4 pr-1 md:pr-2 custom-scrollbar">
                <div className="max-w-2xl mx-auto bg-slate-900/50 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/5 p-6 md:p-8">
                    {adminProfileError && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 border-l-4 border-red-500 text-sm text-red-700">
                            {adminProfileError}
                        </div>
                    )}
                    {adminProfileSuccess && (
                        <div className="mb-6 rounded-lg bg-emerald-50 p-4 border-l-4 border-emerald-500 text-sm text-emerald-700">
                            {adminProfileSuccess}
                        </div>
                    )}

                    <form onSubmit={handleAdminProfileSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">First Name</label>
                                <input type="text" value={adminProfileData.firstName} onChange={e => setAdminProfileData({ ...adminProfileData, firstName: e.target.value })} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">Last Name</label>
                                <input type="text" value={adminProfileData.lastName} onChange={e => setAdminProfileData({ ...adminProfileData, lastName: e.target.value })} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">Email Address</label>
                            <input type="email" value={adminProfileData.email} onChange={e => setAdminProfileData({ ...adminProfileData, email: e.target.value })} required className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">Phone Number</label>
                            <input type="text" value={adminProfileData.phoneNumber} onChange={e => setAdminProfileData({ ...adminProfileData, phoneNumber: e.target.value })} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors" />
                        </div>

                        <div className="border-t border-white/5 pt-5 space-y-4">
                            <h4 className="text-sm font-bold text-white">Change Password (leave empty to keep current)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">New Password</label>
                                    <input type="password" value={adminProfileData.password} onChange={e => setAdminProfileData({ ...adminProfileData, password: e.target.value })} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">Confirm Password</label>
                                    <input type="password" value={adminProfileData.confirmPassword} onChange={e => setAdminProfileData({ ...adminProfileData, confirmPassword: e.target.value })} className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors" placeholder="••••••••" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={isSavingAdminProfile} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {isSavingAdminProfile ? 'Saving...' : 'Update Settings'}
                        </button>
                    </form>
                </div>
            </div>
        </React.Fragment>
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

            {/* Dark Mode Neon Dynamic Background Blurs */}
            <div className="absolute top-0 -left-20 h-[600px] w-[600px] rounded-full bg-cyan-600/10 mix-blend-screen blur-[120px] z-0" />
            <div className="absolute bottom-0 right-0 h-[700px] w-[700px] rounded-full bg-fuchsia-600/10 mix-blend-screen blur-[150px] z-0" />

            {/* Mobile Sidebar Overlay Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 m-4 mr-0 rounded-3xl border border-white/5 bg-slate-900/95 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-2xl flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
                <div className="h-24 flex items-center justify-between px-6 border-b border-white/5">
                    <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] mr-3">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"></path>
                            </svg>
                        </div>
                        <h1 className="text-xl font-extrabold tracking-tight text-white">
                            Admin<span className="text-cyan-400">Hub</span>
                        </h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white transition-colors p-1 bg-white/5 rounded-lg border border-white/5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <div
                        onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); setShowForm(false); }}
                        className={`${activeTab === 'dashboard' ? 'bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] text-white' : 'hover:bg-white/5 text-slate-400'} border border-transparent ${activeTab === 'dashboard' ? '!border-white/5' : ''} rounded-xl px-4 py-3 flex items-center space-x-3 cursor-pointer transition-all`}
                    >
                        <svg className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-cyan-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                        <span className="font-semibold text-sm">Dashboard</span>
                    </div>
                    <div
                        onClick={() => { setActiveTab('teachers'); setIsSidebarOpen(false); setShowForm(false); }}
                        className={`${activeTab === 'teachers' ? 'bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] text-white' : 'hover:bg-white/5 text-slate-400'} border border-transparent ${activeTab === 'teachers' ? '!border-white/5' : ''} rounded-xl px-4 py-3 flex items-center space-x-3 cursor-pointer transition-colors`}
                    >
                        <svg className={`w-5 h-5 ${activeTab === 'teachers' ? 'text-fuchsia-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        <span className="font-medium text-sm">Teachers</span>
                    </div>
                    <div
                        onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); setShowForm(false); }}
                        className={`${activeTab === 'students' ? 'bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] text-white' : 'hover:bg-white/5 text-slate-400'} border border-transparent ${activeTab === 'students' ? '!border-white/5' : ''} rounded-xl px-4 py-3 flex items-center space-x-3 cursor-pointer transition-colors`}
                    >
                        <svg className={`w-5 h-5 ${activeTab === 'students' ? 'text-emerald-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l-9-5-9 5m0 0l9 5 9-5M4 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        <span className="font-medium text-sm">Students</span>
                    </div>
                    <div
                        onClick={() => { setActiveTab('notices'); setIsSidebarOpen(false); }}
                        className={`${activeTab === 'notices' ? 'bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] text-white' : 'hover:bg-white/5 text-slate-400'} border border-transparent ${activeTab === 'notices' ? '!border-white/5' : ''} rounded-xl px-4 py-3 flex items-center space-x-3 cursor-pointer transition-colors`}
                    >
                        <svg className={`w-5 h-5 ${activeTab === 'notices' ? 'text-cyan-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        <span className="font-medium text-sm">Notices Board</span>
                    </div>
                    <div
                        onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
                        className={`${activeTab === 'settings' ? 'bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] text-white' : 'hover:bg-white/5 text-slate-400'} border border-transparent ${activeTab === 'settings' ? '!border-white/5' : ''} rounded-xl px-4 py-3 flex items-center space-x-3 cursor-pointer transition-colors`}
                    >
                        <svg className={`w-5 h-5 ${activeTab === 'settings' ? 'text-cyan-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span className="font-medium text-sm">Settings</span>
                    </div>
                </nav>
                <div className="p-4 border-t border-white/5 space-y-2">
                    <button onClick={() => navigate('/')} className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 text-slate-300 hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        <span className="font-semibold text-sm">Back Home</span>
                    </button>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-500 hover:text-pink-400 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        <span className="font-semibold text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col overflow-hidden p-2 md:p-4">
                {activeTab === 'dashboard' ? renderOverview() :
                 activeTab === 'teachers' ? renderTeachers() :
                 activeTab === 'students' ? renderStudents() :
                 activeTab === 'notices' ? renderNotices() :
                 renderSettings()}
            </main>
        </div>
    );
};

export default AdminDashboard;

