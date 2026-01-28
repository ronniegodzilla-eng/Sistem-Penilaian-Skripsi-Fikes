import React, { useState, useEffect } from 'react';
import { GraduationCap, LayoutDashboard, Database, X, Lock, Home, PieChart, RefreshCw, WifiOff } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, isDemoMode } from './firebase';
import HomeView from './components/HomeView';
import SupervisorForm from './components/SupervisorForm';
import ExaminerForm from './components/ExaminerForm';
import RecapView from './components/RecapView';
import DatabaseView from './components/DatabaseView';
import StatsView from './components/StatsView';
import { Role, ExamType, Assessment, Student } from './types';
import { LOGO_URL, INITIAL_STUDENTS } from './constants';

type View = 'home' | 'recap' | 'database' | 'stats' | 'form';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [examType, setExamType] = useState<ExamType>(ExamType.SIDANG_SKRIPSI);
  const [logoError, setLogoError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Real-time Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  // Active Assessment Session
  const [activeSession, setActiveSession] = useState<{
    role: Role;
    studentId: string;
  } | null>(null);

  // Authentication State
  const [isDatabaseUnlocked, setIsDatabaseUnlocked] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');

  // 1. Subscribe to 'students' collection
  useEffect(() => {
    if (isDemoMode) {
        // DEMO MODE: Load static data directly
        console.log("App running in Demo Mode");
        setStudents(INITIAL_STUDENTS.sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
        return;
    }

    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const fetchedStudents: Student[] = [];
      snapshot.forEach((doc) => {
        fetchedStudents.push(doc.data() as Student);
      });
      // Sort by Name alphabetically
      fetchedStudents.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(fetchedStudents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Subscribe to 'assessments' collection
  useEffect(() => {
    if (isDemoMode) {
        // DEMO MODE: No initial assessments (or could load from localStorage if desired)
        setLoading(false);
        return;
    }

    const unsubscribe = onSnapshot(collection(db, "assessments"), (snapshot) => {
      const fetchedAssessments: Assessment[] = [];
      snapshot.forEach((doc) => {
        fetchedAssessments.push(doc.data() as Assessment);
      });
      setAssessments(fetchedAssessments);
    }, (error) => {
      console.error("Error fetching assessments:", error);
    });

    return () => unsubscribe();
  }, []);

  // 4. Security: Auto-lock database when navigating away
  useEffect(() => {
    if (currentView !== 'database') {
      setIsDatabaseUnlocked(false);
    }
  }, [currentView]);

  // --- FIRESTORE ACTIONS ---

  const handleSaveAssessment = async (newAssessment: Assessment) => {
    if (isDemoMode) {
        setAssessments(prev => {
            const idx = prev.findIndex(a => a.id === newAssessment.id);
            if (idx !== -1) {
                const copy = [...prev];
                copy[idx] = newAssessment;
                return copy;
            }
            return [...prev, newAssessment];
        });
        alert("Mode Demo: Data tersimpan di memori browser (akan hilang saat refresh).");
        return;
    }

    try {
      await setDoc(doc(db, "assessments", newAssessment.id), newAssessment);
    } catch (e) {
      alert("Gagal menyimpan nilai ke server: " + e);
    }
  };

  const handleDeleteAssessments = async (studentIds: string[], type: ExamType) => {
    if (isDemoMode) {
        setAssessments(prev => prev.filter(a => !(studentIds.includes(a.studentId) && a.examType === type)));
        return;
    }

    const batch = writeBatch(db);
    // Find assessments to delete
    const toDelete = assessments.filter(a => 
      studentIds.includes(a.studentId) && a.examType === type
    );

    toDelete.forEach(a => {
      batch.delete(doc(db, "assessments", a.id));
    });

    try {
      await batch.commit();
    } catch (e) {
      alert("Gagal menghapus nilai: " + e);
    }
  };

  // --- CRUD Actions for DatabaseView ---

  const handleAddStudent = async (student: Student) => {
    if (isDemoMode) {
        setStudents(prev => [...prev, student].sort((a, b) => a.name.localeCompare(b.name)));
        return;
    }

    try {
      await setDoc(doc(db, "students", student.id), student);
    } catch (e) {
      console.error("Error adding student", e);
      alert("Gagal menambah mahasiswa");
    }
  };

  const handleUpdateStudent = async (student: Student) => {
    if (isDemoMode) {
        setStudents(prev => prev.map(s => s.id === student.id ? student : s));
        return;
    }

    try {
      await setDoc(doc(db, "students", student.id), student);
    } catch (e) {
      console.error("Error updating student", e);
      alert("Gagal update mahasiswa");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (isDemoMode) {
        setStudents(prev => prev.filter(s => s.id !== id));
        return;
    }

    try {
      await deleteDoc(doc(db, "students", id));
    } catch (e) {
      console.error("Error deleting student", e);
      alert("Gagal hapus mahasiswa");
    }
  };

  const handleImportStudents = async (newStudents: Student[]) => {
    if (isDemoMode) {
        setStudents(prev => {
             // Simple merge logic for demo
             const combined = [...prev, ...newStudents];
             // Remove duplicates based on ID if any (simplified)
             return combined.sort((a, b) => a.name.localeCompare(b.name));
        });
        alert(`Mode Demo: ${newStudents.length} data ditambahkan ke memori.`);
        return;
    }

    try {
      const batch = writeBatch(db);
      newStudents.forEach(s => {
        const ref = doc(db, "students", s.id);
        batch.set(ref, s);
      });
      await batch.commit();
    } catch (e) {
      console.error("Error import", e);
      alert("Gagal import data: " + e);
    }
  };

  // --- Navigation & Auth ---

  const handleStartAssessment = (role: Role, studentId: string) => {
    setActiveSession({ role, studentId });
    setCurrentView('form');
  };

  const handleDatabaseClick = () => {
    setShowLoginModal(true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === 'Fikes' && loginForm.pass === 'Fikes01132039') {
      setIsDatabaseUnlocked(true);
      setShowLoginModal(false);
      setCurrentView('database');
      setLoginError('');
      setLoginForm({ user: '', pass: '' });
    } else {
      setLoginError('Username atau Password salah!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 gap-2">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span>Menghubungkan ke Database...</span>
      </div>
    );
  }

  const renderContent = () => {
    switch(currentView) {
      case 'home':
        return (
          <HomeView 
            students={students} 
            currentExamType={examType}
            onExamTypeChange={setExamType}
            onStartAssessment={handleStartAssessment} 
          />
        );
      
      case 'form':
        if (!activeSession) return null;
        const student = students.find(s => s.id === activeSession.studentId);
        if (!student) return <div>Data mahasiswa tidak ditemukan (mungkin telah dihapus admin).</div>;

        const sessionKey = `${activeSession.studentId}-${activeSession.role}-${examType}`;

        if (activeSession.role.includes('Pembimbing')) {
          return (
            <SupervisorForm 
              key={sessionKey}
              examType={examType}
              role={activeSession.role as Role.PEMBIMBING_1 | Role.PEMBIMBING_2}
              student={student}
              existingAssessments={assessments}
              onSave={handleSaveAssessment}
              onBack={() => setCurrentView('home')}
            />
          );
        } else {
          return (
            <ExaminerForm 
               key={sessionKey}
               examType={examType}
               role={activeSession.role as Role.PENGUJI_1 | Role.PENGUJI_2}
               student={student}
               existingAssessments={assessments}
               onSave={handleSaveAssessment}
               onBack={() => setCurrentView('home')}
            />
          );
        }

      case 'recap':
        return (
          <RecapView 
            assessments={assessments} 
            examType={examType} 
            students={students} 
            onDeleteAssessments={handleDeleteAssessments}
            onExamTypeChange={setExamType}
          />
        );
      
      case 'database':
        if (!isDatabaseUnlocked) {
           return <div className="text-center p-10 text-slate-500">Akses ditolak. Silahkan login kembali.</div>;
        }
        return (
          <DatabaseView 
            students={students} 
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onImportStudents={handleImportStudents}
          />
        );
      
      case 'stats':
        return <StatsView 
          students={students} 
          assessments={assessments} 
          examType={examType} 
          onExamTypeChange={setExamType}
        />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Demo Mode Banner */}
      {isDemoMode && (
         <div className="bg-orange-500 text-white text-xs font-bold text-center py-1 px-4 flex items-center justify-center gap-2">
            <WifiOff className="w-3 h-3" />
            MODE DEMO (OFFLINE): Data tidak akan tersimpan ke cloud. Setup Firebase (.env) untuk mengaktifkan database online.
         </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between h-auto md:h-20 py-3 md:py-0 gap-3">
            <div className="flex items-center gap-3">
              <div className="shrink-0 flex items-center justify-center">
                {logoError ? (
                   <div className="bg-primary-600 p-2 rounded-lg text-white">
                      <GraduationCap className="w-6 h-6" />
                   </div>
                ) : (
                  <img 
                    src={LOGO_URL} 
                    alt="Logo Ibnu Sina" 
                    className="h-10 w-auto md:h-12 object-contain"
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
              <div className="leading-tight">
                <h1 className="text-base md:text-lg font-bold text-slate-900 leading-snug">Aplikasi Penilaian Proposal/Skripsi</h1>
                <p className="text-[10px] md:text-xs text-primary-700 font-bold tracking-wide">Fakultas Ilmu Kesehatan Universitas Ibnu Sina</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              <button 
                onClick={() => setCurrentView('home')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${currentView === 'home' || currentView === 'form' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Utama</span>
              </button>

              <button 
                onClick={() => setCurrentView('recap')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${currentView === 'recap' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Rekap</span>
              </button>

              <button 
                onClick={() => setCurrentView('stats')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${currentView === 'stats' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <PieChart className="w-4 h-4" />
                <span className="hidden sm:inline">Statistik</span>
              </button>

              <button 
                onClick={handleDatabaseClick}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${currentView === 'database' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Database</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 lg:p-8">
          {renderContent()}
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Lock className="w-4 h-4 text-slate-500" />
                 Login Database
               </h3>
               <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-600">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {loginError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 text-center">
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input 
                  type="text" 
                  value={loginForm.user}
                  onChange={e => setLoginForm({...loginForm, user: e.target.value})}
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-200 p-2 border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={loginForm.pass}
                  onChange={e => setLoginForm({...loginForm, pass: e.target.value})}
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-200 p-2 border"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-lg transition-all"
              >
                Masuk
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;