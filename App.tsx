import React, { useState, useEffect } from 'react';
import { GraduationCap, LayoutDashboard, Database, X, Lock, Home, PieChart } from 'lucide-react';
import HomeView from './components/HomeView';
import SupervisorForm from './components/SupervisorForm';
import ExaminerForm from './components/ExaminerForm';
import RecapView from './components/RecapView';
import DatabaseView from './components/DatabaseView';
import StatsView from './components/StatsView';
import { Role, ExamType, Assessment, Student } from './types';
import { INITIAL_STUDENTS, LOGO_URL } from './constants';

type View = 'home' | 'recap' | 'database' | 'stats' | 'form';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [examType, setExamType] = useState<ExamType>(ExamType.SIDANG_SKRIPSI);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [logoError, setLogoError] = useState(false);
  
  // Student Data Management
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('sistem-sidang-students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  // Active Assessment Session
  const [activeSession, setActiveSession] = useState<{
    role: Role;
    studentId: string;
  } | null>(null);

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');

  // Persist students on change
  useEffect(() => {
    localStorage.setItem('sistem-sidang-students', JSON.stringify(students));
  }, [students]);

  const handleUpdateStudents = (updatedStudents: Student[]) => {
    setStudents(updatedStudents);
  };

  const handleSaveAssessment = (newAssessment: Assessment) => {
    setAssessments(prev => {
      // Remove existing if any (update logic)
      const filtered = prev.filter(a => a.id !== newAssessment.id);
      return [...filtered, newAssessment];
    });
  };

  const handleDeleteAssessments = (studentIds: string[], type: ExamType) => {
    setAssessments(prev => prev.filter(a => 
      !(studentIds.includes(a.studentId) && a.examType === type)
    ));
  };

  const handleStartAssessment = (role: Role, studentId: string) => {
    setActiveSession({ role, studentId });
    setCurrentView('form');
  };

  const handleDatabaseClick = () => {
    if (isAuthenticated) {
      setCurrentView('database');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === 'Fikes' && loginForm.pass === 'Fikes01132039') {
      setIsAuthenticated(true);
      setShowLoginModal(false);
      setCurrentView('database');
      setLoginError('');
      setLoginForm({ user: '', pass: '' });
    } else {
      setLoginError('Username atau Password salah!');
    }
  };

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
        if (!student) return <div>Data mahasiswa tidak ditemukan</div>;

        if (activeSession.role.includes('Pembimbing')) {
          return (
            <SupervisorForm 
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
          />
        );
      
      case 'database':
        return <DatabaseView students={students} onUpdateStudents={handleUpdateStudents} />;
      
      case 'stats':
        return <StatsView students={students} assessments={assessments} examType={examType} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
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
              {/* Dropdown in navbar synced with home view state */}
              <select 
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamType)}
                className="bg-slate-100 border-none text-xs font-semibold text-slate-700 rounded-lg px-2 py-2 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <option value={ExamType.SIDANG_SKRIPSI}>Sidang Skripsi</option>
                <option value={ExamType.SEMINAR_PROPOSAL}>Seminar Proposal</option>
              </select>

              <div className="h-6 w-px bg-slate-300 mx-1 hidden md:block"></div>

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