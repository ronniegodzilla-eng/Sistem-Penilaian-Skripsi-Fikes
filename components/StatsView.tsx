import React, { useMemo } from 'react';
import { PieChart, UserX, AlertCircle, TrendingUp, Award, Activity, CheckCircle2, UserCheck } from 'lucide-react';
import { Student, Assessment, ExamType, Role } from '../types';
import { FINAL_WEIGHTS } from '../constants';

interface StatsViewProps {
  students: Student[];
  assessments: Assessment[];
  examType: ExamType;
  onExamTypeChange: (type: ExamType) => void;
}

const StatsView: React.FC<StatsViewProps> = ({ students, assessments, examType, onExamTypeChange }) => {
  
  // -- Calculations --

  // 1. Calculate Grades for all students
  const studentMetrics = useMemo(() => {
    return students.map(s => {
      // Find assessments
      const p1 = assessments.find(a => a.studentId === s.id && a.evaluatorRole === Role.PEMBIMBING_1 && a.examType === examType)?.totalScore || 0;
      const p2 = assessments.find(a => a.studentId === s.id && a.evaluatorRole === Role.PEMBIMBING_2 && a.examType === examType)?.totalScore || 0;
      const e1 = assessments.find(a => a.studentId === s.id && a.evaluatorRole === Role.PENGUJI_1 && a.examType === examType)?.totalScore || 0;
      const e2 = assessments.find(a => a.studentId === s.id && a.evaluatorRole === Role.PENGUJI_2 && a.examType === examType)?.totalScore || 0;
      
      const count = assessments.filter(a => a.studentId === s.id && a.examType === examType).length;
      const isComplete = count === 4;

      const finalScore = (
        (p1 * FINAL_WEIGHTS.pembimbing1) +
        (p2 * FINAL_WEIGHTS.pembimbing2) +
        (e1 * FINAL_WEIGHTS.penguji1) +
        (e2 * FINAL_WEIGHTS.penguji2)
      );

      let letter = "E";
      if (finalScore >= 90) letter = "A";
      else if (finalScore >= 85) letter = "A-";
      else if (finalScore >= 80) letter = "B+";
      else if (finalScore >= 75) letter = "B";
      else if (finalScore >= 70) letter = "B-";
      else if (finalScore >= 65) letter = "C+";
      else if (finalScore >= 60) letter = "C";
      else if (finalScore >= 55) letter = "C-";
      else if (finalScore >= 50) letter = "D";

      const isPass = finalScore >= 55;

      return {
        ...s,
        isComplete,
        finalScore: isComplete ? finalScore : 0, // Only count score if complete (or partial, depends on policy. Here strictly complete for stats)
        letter: isComplete ? letter : null,
        isPass: isComplete ? isPass : false
      };
    });
  }, [students, assessments, examType]);

  // 2. Metrics aggregation
  const completedStudents = studentMetrics.filter(s => s.isComplete);
  const totalCompleted = completedStudents.length;
  
  // Grade Distribution
  const gradeDist = { "A": 0, "A-": 0, "B+": 0, "B": 0, "B-": 0, "C+": 0, "C": 0, "C-": 0, "D": 0, "E": 0 };
  completedStudents.forEach(s => {
      if (s.letter && s.letter in gradeDist) {
          gradeDist[s.letter as keyof typeof gradeDist]++;
      }
  });

  // Pass Rate
  const passedCount = completedStudents.filter(s => s.isPass).length;
  const passRate = totalCompleted > 0 ? (passedCount / totalCompleted) * 100 : 0;

  // Average Scores
  const calculateAverageRole = (role: Role) => {
      const relevantAssessments = assessments.filter(a => a.evaluatorRole === role && a.examType === examType);
      if (relevantAssessments.length === 0) return 0;
      const sum = relevantAssessments.reduce((acc, curr) => acc + curr.totalScore, 0);
      return sum / relevantAssessments.length;
  };

  const avgP1 = calculateAverageRole(Role.PEMBIMBING_1);
  const avgP2 = calculateAverageRole(Role.PEMBIMBING_2);
  const avgU1 = calculateAverageRole(Role.PENGUJI_1);
  const avgU2 = calculateAverageRole(Role.PENGUJI_2);

  // Missing Students logic (from previous version)
  const missingK3 = studentMetrics.filter(s => s.prodi === 'K3' && !s.isComplete);
  const missingKesling = studentMetrics.filter(s => s.prodi === 'Kesling' && !s.isComplete);

  // Pending Evaluators logic (from previous version)
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-primary-600" />
            Statistik & Infografis
          </h2>
          <div className="flex items-center gap-2">
             <select 
                value={examType} 
                onChange={(e) => onExamTypeChange(e.target.value as ExamType)}
                className="text-sm border-slate-300 rounded-lg py-2 pl-3 pr-8 bg-white shadow-sm font-medium text-slate-700 focus:ring-primary-500 focus:border-primary-500"
             >
                <option value={ExamType.SEMINAR_PROPOSAL}>Seminar Proposal</option>
                <option value={ExamType.SIDANG_SKRIPSI}>Sidang Skripsi</option>
             </select>
          </div>
      </div>

      {/* Top Level Infographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Progress Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10">
                <CheckCircle2 className="w-16 h-16 text-primary-600" />
             </div>
             <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Mahasiswa Selesai</h3>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{totalCompleted}</span>
                <span className="text-sm text-slate-500">/ {students.length}</span>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                <div 
                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-1000" 
                    style={{ width: `${students.length > 0 ? (totalCompleted / students.length) * 100 : 0}%` }}
                ></div>
             </div>
             <p className="text-xs text-primary-600 font-medium mt-2">
                {students.length > 0 ? ((totalCompleted / students.length) * 100).toFixed(1) : 0}% Selesai
             </p>
          </div>

          {/* Pass Rate Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10">
                <Award className="w-16 h-16 text-green-600" />
             </div>
             <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Tingkat Kelulusan</h3>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{passRate.toFixed(0)}%</span>
             </div>
             <div className="flex gap-2 mt-3 text-xs">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">{passedCount} Lulus</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">{totalCompleted - passedCount} Tidak</span>
             </div>
          </div>

          {/* Average Scores Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10">
                <TrendingUp className="w-16 h-16 text-blue-600" />
             </div>
             <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Rata-Rata Nilai</h3>
             <div className="space-y-1.5 mt-2">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Pembimbing</span>
                    <span className="font-bold text-slate-900">{((avgP1 + avgP2) / 2).toFixed(1)}</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-1">
                    <div className="bg-blue-400 h-1 rounded-full" style={{ width: `${((avgP1 + avgP2) / 2)}%` }}></div>
                 </div>
                 <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-600">Penguji</span>
                    <span className="font-bold text-slate-900">{((avgU1 + avgU2) / 2).toFixed(1)}</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-1">
                    <div className="bg-indigo-400 h-1 rounded-full" style={{ width: `${((avgU1 + avgU2) / 2)}%` }}></div>
                 </div>
             </div>
          </div>
          
           {/* Pending Workload Card */}
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10">
                <UserCheck className="w-16 h-16 text-orange-600" />
             </div>
             <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Tanggungan Nilai</h3>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{pendingEvaluators.length}</span>
                <span className="text-sm text-slate-500">Slot Kosong</span>
             </div>
             <div className="mt-3 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded inline-block">
                Butuh tindak lanjut dosen
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Grade Distribution Chart */}
         <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
                 <Activity className="w-5 h-5 text-slate-400" />
                 Distribusi Nilai Akhir
             </h3>
             
             <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2">
                 {Object.entries(gradeDist).map(([grade, count]) => {
                     const percentage = totalCompleted > 0 ? (count / totalCompleted) * 100 : 0;
                     // Avoid 0 height for visual purposes if percentage is 0 but show label
                     const barHeight = percentage === 0 ? 2 : percentage; 
                     return (
                         <div key={grade} className="flex flex-col items-center gap-2 flex-1 group">
                             <div className="relative w-full flex justify-end flex-col items-center h-full">
                                 {/* Tooltip-like count */}
                                 <div className="mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                     {count}
                                 </div>
                                 <div 
                                    className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ${
                                        grade === 'E' || grade === 'D' ? 'bg-red-400 hover:bg-red-500' :
                                        grade.startsWith('C') ? 'bg-yellow-400 hover:bg-yellow-500' :
                                        'bg-primary-500 hover:bg-primary-600'
                                    }`}
                                    style={{ height: `${barHeight}%` }}
                                 ></div>
                             </div>
                             <span className="text-xs font-semibold text-slate-600">{grade}</span>
                         </div>
                     );
                 })}
             </div>
         </div>

         {/* Detailed Status Panel */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Mahasiswa Belum Lengkap
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-orange-50 p-3 rounded-lg text-center border border-orange-100">
                    <div className="text-2xl font-bold text-orange-600">{missingK3.length}</div>
                    <div className="text-xs text-orange-800 font-medium">K3</div>
                </div>
                <div className="bg-teal-50 p-3 rounded-lg text-center border border-teal-100">
                    <div className="text-2xl font-bold text-teal-600">{missingKesling.length}</div>
                    <div className="text-xs text-teal-800 font-medium">Kesling</div>
                </div>
            </div>

            <div className="flex-1 overflow-auto max-h-[250px] pr-2 custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                    <tr>
                        <th className="px-2 py-2">Nama</th>
                        <th className="px-2 py-2 text-right">Progres</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                    {[...missingK3, ...missingKesling].map(s => {
                        const doneCount = assessments.filter(a => a.studentId === s.id && a.examType === examType).length;
                        return (
                            <tr key={s.id}>
                                <td className="px-2 py-2">
                                    <div className="truncate max-w-[120px] font-medium text-slate-700">{s.name}</div>
                                    <div className="text-[10px] text-slate-400">{s.prodi}</div>
                                </td>
                                <td className="px-2 py-2 text-right text-xs text-slate-500">
                                    <span className={`px-1.5 py-0.5 rounded ${doneCount === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                        {doneCount}/4
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
         </div>
      </div>

      {/* Pending Evaluators Full Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <div className="font-semibold text-slate-700 flex items-center gap-2">
                <UserX className="w-4 h-4 text-slate-500" />
                Daftar Dosen Belum Input Nilai
             </div>
             <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{pendingEvaluators.length} Data</span>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 shadow-sm">
                <tr>
                  <th className="px-4 py-3">Nama Dosen</th>
                  <th className="px-4 py-3">Peran</th>
                  <th className="px-4 py-3">Mahasiswa</th>
                  <th className="px-4 py-3">Prodi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingEvaluators.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-slate-400 italic">Semua nilai telah lengkap!</td></tr>
                ) : (
                    pendingEvaluators.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{p.lecturerName}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                            <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded">{p.role}</span>
                        </td>
                        <td className="px-4 py-3">{p.studentName}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{p.prodi}</td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};

export default StatsView;