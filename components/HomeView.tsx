import React, { useState } from 'react';
import { ChevronRight, GraduationCap, FileText, User, School, CheckCircle2 } from 'lucide-react';
import { Role, Student, ExamType } from '../types';
import { LOGO_URL } from '../constants';

interface HomeViewProps {
  students: Student[];
  currentExamType: ExamType;
  onExamTypeChange: (type: ExamType) => void;
  onStartAssessment: (role: Role, studentId: string) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
  students, 
  currentExamType, 
  onExamTypeChange, 
  onStartAssessment 
}) => {
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [selectedProdi, setSelectedProdi] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [logoError, setLogoError] = useState(false);

  const filteredStudents = selectedProdi
    ? students.filter(s => s.prodi === selectedProdi)
    : [];

  const handleStart = () => {
    if (selectedRole && selectedStudentId) {
      onStartAssessment(selectedRole, selectedStudentId);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-10">
      
      {/* Hero Section */}
      <div className="text-center mb-10 space-y-4">
        <div className="relative inline-block">
            {logoError ? (
                <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mx-auto ring-4 ring-white shadow-lg">
                    <GraduationCap className="w-12 h-12" />
                </div>
            ) : (
                <div className="p-1 bg-white rounded-full shadow-lg ring-1 ring-slate-100 mx-auto w-fit">
                    <img 
                        src={LOGO_URL} 
                        alt="Logo Ibnu Sina" 
                        className="h-24 w-auto object-contain"
                        onError={() => setLogoError(true)}
                    />
                </div>
            )}
        </div>
        <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Sistem Penilaian Sidang
            </h1>
            <p className="text-slate-500 font-medium text-lg mt-2">
              Fakultas Ilmu Kesehatan Universitas Ibnu Sina
            </p>
        </div>
      </div>

      {/* Main Interaction Card */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
        
        {/* Step 1: Big Selection Cards for Exam Type */}
        <div className="bg-slate-50 p-6 border-b border-slate-200">
           <h2 className="text-center text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
             Langkah 1: Pilih Jenis Ujian
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card: Seminar Proposal */}
              <button
                onClick={() => onExamTypeChange(ExamType.SEMINAR_PROPOSAL)}
                className={`relative group p-6 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 text-left ${
                  currentExamType === ExamType.SEMINAR_PROPOSAL
                    ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600 shadow-md'
                    : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-slate-50'
                }`}
              >
                <div className={`p-3 rounded-lg ${currentExamType === ExamType.SEMINAR_PROPOSAL ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600'}`}>
                    <FileText className="w-8 h-8" />
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${currentExamType === ExamType.SEMINAR_PROPOSAL ? 'text-primary-800' : 'text-slate-700'}`}>Seminar Proposal</h3>
                    <p className="text-sm text-slate-500">Penilaian Bab 1 - Bab 3</p>
                </div>
                {currentExamType === ExamType.SEMINAR_PROPOSAL && (
                    <div className="absolute top-4 right-4 text-primary-600">
                        <CheckCircle2 className="w-6 h-6 fill-primary-100" />
                    </div>
                )}
              </button>

              {/* Card: Sidang Skripsi */}
              <button
                onClick={() => onExamTypeChange(ExamType.SIDANG_SKRIPSI)}
                className={`relative group p-6 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 text-left ${
                  currentExamType === ExamType.SIDANG_SKRIPSI
                    ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600 shadow-md'
                    : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-slate-50'
                }`}
              >
                <div className={`p-3 rounded-lg ${currentExamType === ExamType.SIDANG_SKRIPSI ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600'}`}>
                    <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${currentExamType === ExamType.SIDANG_SKRIPSI ? 'text-primary-800' : 'text-slate-700'}`}>Sidang Skripsi</h3>
                    <p className="text-sm text-slate-500">Penilaian Bab 4 - Bab 5</p>
                </div>
                {currentExamType === ExamType.SIDANG_SKRIPSI && (
                    <div className="absolute top-4 right-4 text-primary-600">
                        <CheckCircle2 className="w-6 h-6 fill-primary-100" />
                    </div>
                )}
              </button>

           </div>
        </div>

        {/* Step 2: Form Inputs */}
        <div className="p-6 md:p-8">
            <h2 className="text-center text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">
                Langkah 2: Lengkapi Data Penilaian
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Role Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        Peran Penguji
                    </label>
                    <div className="relative">
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as Role)}
                            className="w-full p-3 pl-4 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-900 font-medium appearance-none"
                        >
                            <option value="">-- Pilih Peran --</option>
                            <option value={Role.PEMBIMBING_1}>Pembimbing 1</option>
                            <option value={Role.PEMBIMBING_2}>Pembimbing 2</option>
                            <option value={Role.PENGUJI_1}>Penguji 1</option>
                            <option value={Role.PENGUJI_2}>Penguji 2</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                           <ChevronRight className="w-4 h-4 rotate-90" />
                        </div>
                    </div>
                </div>

                {/* Prodi Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <School className="w-4 h-4 text-slate-400" />
                        Program Studi
                    </label>
                    <div className="relative">
                        <select
                            value={selectedProdi}
                            onChange={(e) => {
                                setSelectedProdi(e.target.value);
                                setSelectedStudentId('');
                            }}
                            className="w-full p-3 pl-4 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-900 font-medium appearance-none"
                        >
                            <option value="">-- Pilih Prodi --</option>
                            <option value="K3">K3 (Keselamatan Kerja)</option>
                            <option value="Kesling">Kesling (Lingkungan)</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                           <ChevronRight className="w-4 h-4 rotate-90" />
                        </div>
                    </div>
                </div>

                {/* Student Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        Mahasiswa
                    </label>
                    <div className="relative">
                        <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            disabled={!selectedProdi}
                            className="w-full p-3 pl-4 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-medium appearance-none"
                        >
                            <option value="">
                                {selectedProdi ? '-- Pilih Nama Mahasiswa --' : '-- Pilih Prodi Dulu --'}
                            </option>
                            {filteredStudents.map(s => (
                                <option key={s.id} value={s.id}>{s.name} - {s.npm}</option>
                            ))}
                        </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                           <ChevronRight className="w-4 h-4 rotate-90" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={handleStart}
                disabled={!selectedRole || !selectedProdi || !selectedStudentId}
                className="w-full mt-8 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
            >
                Mulai Penilaian
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="text-center text-slate-400 text-sm mt-4">
               Pastikan <strong>Jenis Ujian</strong> di atas sudah sesuai sebelum memulai.
            </p>
        </div>
      </div>
    </div>
  );
};

export default HomeView;