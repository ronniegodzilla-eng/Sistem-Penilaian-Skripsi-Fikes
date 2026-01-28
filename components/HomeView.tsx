import React, { useState } from 'react';
import { ChevronRight, GraduationCap } from 'lucide-react';
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
    <div className="max-w-xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="flex justify-center mb-6">
           {logoError ? (
             <div className="bg-primary-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-primary-600">
               <GraduationCap className="w-12 h-12" />
             </div>
           ) : (
             <img 
               src={LOGO_URL} 
               alt="Logo Ibnu Sina" 
               className="w-24 h-24 object-contain"
               onError={() => setLogoError(true)}
             />
           )}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Selamat Datang</h2>
        <p className="text-slate-600">
          Sistem Penilaian Fakultas Ilmu Kesehatan<br/>Universitas Ibnu Sina
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-5">
        
        {/* 1. Exam Type Selection */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">Jenis Penilaian</label>
          <select
            value={currentExamType}
            onChange={(e) => onExamTypeChange(e.target.value as ExamType)}
            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900"
          >
            <option value={ExamType.SIDANG_SKRIPSI}>Sidang Skripsi</option>
            <option value={ExamType.SEMINAR_PROPOSAL}>Seminar Proposal</option>
          </select>
        </div>

        {/* 2. Role Selection */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">Peran Penilai</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as Role)}
            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900"
          >
            <option value="">-- Pilih Peran --</option>
            <option value={Role.PEMBIMBING_1}>Pembimbing 1</option>
            <option value={Role.PEMBIMBING_2}>Pembimbing 2</option>
            <option value={Role.PENGUJI_1}>Penguji 1</option>
            <option value={Role.PENGUJI_2}>Penguji 2</option>
          </select>
        </div>

        {/* 3. Prodi Selection */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">Program Studi</label>
          <select
             value={selectedProdi}
             onChange={(e) => {
               setSelectedProdi(e.target.value);
               setSelectedStudentId(''); // Reset student when prodi changes
             }}
             className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900"
          >
            <option value="">-- Pilih Prodi --</option>
            <option value="K3">K3 (Keselamatan Kerja)</option>
            <option value="Kesling">Kesling (Lingkungan)</option>
          </select>
        </div>

        {/* 4. Student Selection */}
        <div className="space-y-1.5">
           <label className="block text-sm font-semibold text-slate-700">Mahasiswa</label>
           <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={!selectedProdi}
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white disabled:bg-slate-100 disabled:text-slate-400 text-slate-900"
           >
              <option value="">-- Pilih Mahasiswa --</option>
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.npm}</option>
              ))}
           </select>
           {filteredStudents.length === 0 && selectedProdi && (
             <p className="text-xs text-red-500 mt-1">Tidak ada data mahasiswa untuk prodi ini.</p>
           )}
        </div>

        <div className="pt-4">
          <button
            onClick={handleStart}
            disabled={!selectedRole || !selectedProdi || !selectedStudentId}
            className="w-full flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-lg font-bold py-3 px-8 rounded-lg shadow-sm transition-all"
          >
            Mulai Penilaian
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeView;