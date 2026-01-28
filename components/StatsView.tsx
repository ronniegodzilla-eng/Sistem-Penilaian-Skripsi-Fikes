import React from 'react';
import { PieChart, UserX, AlertCircle } from 'lucide-react';
import { Student, Assessment, ExamType, Role } from '../types';

interface StatsViewProps {
  students: Student[];
  assessments: Assessment[];
  examType: ExamType;
}

const StatsView: React.FC<StatsViewProps> = ({ students, assessments, examType }) => {
  
  // 1. Filter students who haven't completed assessments for the current Exam Type
  // A student is "complete" if they have 4 assessments (P1, P2, U1, U2)
  const getMissingStudents = (prodi: string) => {
    return students.filter(s => {
      if (s.prodi !== prodi) return false;
      const studentAssessments = assessments.filter(
        a => a.studentId === s.id && a.examType === examType
      );
      // If less than 4 assessments, they are incomplete/missing something
      return studentAssessments.length < 4;
    });
  };

  const missingK3 = getMissingStudents('K3');
  const missingKesling = getMissingStudents('Kesling');

  // 2. Pending Evaluators
  // List evaluators who are assigned in the database but haven't submitted a score
  const getPendingEvaluators = () => {
    const pendingList: Array<{
      lecturerName: string;
      role: string;
      studentName: string;
      prodi: string;
    }> = [];

    students.forEach(s => {
      const rolesToCheck = [
        { role: Role.PEMBIMBING_1, name: s.pembimbing1 },
        { role: Role.PEMBIMBING_2, name: s.pembimbing2 },
        { role: Role.PENGUJI_1, name: s.penguji1 },
        { role: Role.PENGUJI_2, name: s.penguji2 },
      ];

      rolesToCheck.forEach(check => {
        // Skip if no lecturer assigned in DB
        if (!check.name || check.name === '-') return;

        const hasAssessed = assessments.some(
          a => a.studentId === s.id && a.evaluatorRole === check.role && a.examType === examType
        );

        if (!hasAssessed) {
          pendingList.push({
            lecturerName: check.name,
            role: check.role,
            studentName: s.name,
            prodi: s.prodi
          });
        }
      });
    });

    return pendingList;
  };

  const pendingEvaluators = getPendingEvaluators();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <PieChart className="w-6 h-6 text-primary-600" />
        Statistik Data Penilaian ({examType})
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
             <AlertCircle className="w-5 h-5 text-orange-500" />
             Mahasiswa Belum Lengkap Nilai
           </h3>
           <div className="grid grid-cols-2 gap-4">
             <div className="bg-orange-50 p-4 rounded-lg text-center">
               <div className="text-3xl font-bold text-orange-600">{missingK3.length}</div>
               <div className="text-sm text-orange-800 font-medium">Prodi K3</div>
             </div>
             <div className="bg-teal-50 p-4 rounded-lg text-center">
               <div className="text-3xl font-bold text-teal-600">{missingKesling.length}</div>
               <div className="text-sm text-teal-800 font-medium">Prodi Kesling</div>
             </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
             <UserX className="w-5 h-5 text-red-500" />
             Total Tanggungan Nilai Dosen
           </h3>
           <div className="flex items-center justify-center h-24">
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-800">{pendingEvaluators.length}</div>
                <div className="text-sm text-slate-500">Input Nilai Belum Masuk</div>
              </div>
           </div>
        </div>
      </div>

      {/* Detail Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Missing Students Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-96">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700">
            Daftar Mahasiswa Belum Selesai Ujian
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2">Nama</th>
                  <th className="px-4 py-2">Prodi</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...missingK3, ...missingKesling].map(s => {
                    // Quick check progress
                    const doneCount = assessments.filter(a => a.studentId === s.id && a.examType === examType).length;
                    return (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-2">{s.name}</td>
                        <td className="px-4 py-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${s.prodi === 'K3' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>
                            {s.prodi}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-500">
                          {doneCount}/4 Nilai
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Evaluators Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-96">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700">
            Daftar Dosen Belum Input Nilai
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2">Nama Dosen</th>
                  <th className="px-4 py-2">Peran</th>
                  <th className="px-4 py-2">Mahasiswa</th>
                </tr>
              </thead>
              <tbody>
                {pendingEvaluators.map((p, idx) => (
                   <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                     <td className="px-4 py-2 font-medium">{p.lecturerName}</td>
                     <td className="px-4 py-2 text-xs text-slate-500">{p.role}</td>
                     <td className="px-4 py-2">
                       <div>{p.studentName}</div>
                       <div className="text-[10px] text-slate-400">{p.prodi}</div>
                     </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatsView;