import React, { useState } from 'react';
import { Download, Table, Check, Trash2, FileText, AlertCircle } from 'lucide-react';
import { Assessment, Role, ExamType, Student } from '../types';
import { FINAL_WEIGHTS, SUPERVISOR_RUBRIC_ITEMS } from '../constants';

interface RecapViewProps {
  assessments: Assessment[];
  examType: ExamType;
  students: Student[];
  onDeleteAssessments?: (studentIds: string[], examType: ExamType) => void;
}

const RecapView: React.FC<RecapViewProps> = ({ assessments, examType, students, onDeleteAssessments }) => {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Helper to get score for a student and role
  const getScore = (studentId: string, role: Role): number | null => {
    const assessment = assessments.find(
      a => a.studentId === studentId && a.evaluatorRole === role && a.examType === examType
    );
    return assessment ? assessment.totalScore : null;
  };

  const calculateFinal = (p1: number | null, p2: number | null, e1: number | null, e2: number | null) => {
    const vP1 = p1 || 0;
    const vP2 = p2 || 0;
    const vE1 = e1 || 0;
    const vE2 = e2 || 0;

    return (
      (vP1 * FINAL_WEIGHTS.pembimbing1) +
      (vP2 * FINAL_WEIGHTS.pembimbing2) +
      (vE1 * FINAL_WEIGHTS.penguji1) +
      (vE2 * FINAL_WEIGHTS.penguji2)
    );
  };

  const getLetterGrade = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 85) return "A-";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "B-";
    if (score >= 65) return "C+";
    if (score >= 60) return "C";
    if (score >= 55) return "C-";
    if (score >= 50) return "D";
    return "E";
  };

  const getPassStatus = (score: number) => {
    return score >= 55 ? "LULUS" : "TIDAK LULUS";
  };

  const getStatus = (studentId: string) => {
    const p1 = getScore(studentId, Role.PEMBIMBING_1);
    const p2 = getScore(studentId, Role.PEMBIMBING_2);
    const e1 = getScore(studentId, Role.PENGUJI_1);
    const e2 = getScore(studentId, Role.PENGUJI_2);
    
    const count = [p1, p2, e1, e2].filter(s => s !== null).length;
    
    if (count === 4) return { label: 'Lengkap', class: 'bg-green-100 text-green-700' };
    if (count > 0) return { label: 'Sebagian', class: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Belum Ada', class: 'bg-slate-100 text-slate-500' };
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudents(new Set(students.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStudents(newSelected);
  };

  // Bulk Delete Trigger
  const handleDeleteClick = () => {
    if (selectedStudents.size === 0) return;
    setShowDeleteModal(true);
  };

  // Individual Delete Trigger
  const handleIndividualDelete = (id: string) => {
    setSelectedStudents(new Set([id]));
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (onDeleteAssessments) {
      onDeleteAssessments(Array.from(selectedStudents), examType);
      setSelectedStudents(new Set());
      setShowDeleteModal(false);
    }
  };

  const generateDetailCSV = (targetStudents: Student[]) => {
    const headers = [
      "Timestamp", "Jenis Ujian", "NPM", "Nama Mahasiswa", "Prodi", "Peran Penilai", "Nama Penilai", "Total Skor",
      "Detail Nilai / Catatan" 
    ];

    const rows: string[][] = [];

    targetStudents.forEach(student => {
      const studentAssessments = assessments.filter(a => a.studentId === student.id && a.examType === examType);
      
      if (studentAssessments.length === 0) return;

      studentAssessments.forEach(assessment => {
        let evaluatorName = '-';
        if (assessment.evaluatorRole === Role.PEMBIMBING_1) evaluatorName = student.pembimbing1;
        if (assessment.evaluatorRole === Role.PEMBIMBING_2) evaluatorName = student.pembimbing2;
        if (assessment.evaluatorRole === Role.PENGUJI_1) evaluatorName = student.penguji1;
        if (assessment.evaluatorRole === Role.PENGUJI_2) evaluatorName = student.penguji2;

        const dateStr = new Date(assessment.timestamp).toLocaleString('id-ID');
        
        // Detailed Scores String
        let details = "";
        if (assessment.supervisorScores) {
          details = SUPERVISOR_RUBRIC_ITEMS.map((item, idx) => {
            const score = assessment.supervisorScores?.[idx] || 0;
            return `${idx+1}. ${item}: ${score}`;
          }).join(" | ");
        } else if (assessment.examinerScores) {
          details = `Sistematika: ${assessment.examinerScores.sistematika} | Isi: ${assessment.examinerScores.isi} | Penyajian: ${assessment.examinerScores.penyajian} | Tanya Jawab: ${assessment.examinerScores.tanyaJawab}`;
        }

        // Append Berita Acara if exists
        if (assessment.beritaAcara) {
           details += ` || [Berita Acara] Tgl: ${assessment.beritaAcara.date}, Wkt: ${assessment.beritaAcara.time}, Kejadian: ${assessment.beritaAcara.events}, Catatan: ${assessment.beritaAcara.notes}`;
        }

        // Escape for CSV
        details = `"${details.replace(/"/g, '""')}"`;

        rows.push([
          dateStr,
          examType,
          student.npm,
          student.name,
          student.prodi,
          assessment.evaluatorRole,
          evaluatorName,
          assessment.totalScore.toFixed(2),
          details
        ]);
      });
    });

    if (rows.length === 0) {
      alert("Tidak ada data nilai untuk diexport pada mahasiswa yang dipilih.");
      return;
    }

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    const filename = targetStudents.length === 1 
      ? `Arsip_${targetStudents[0].name.replace(/[^a-zA-Z0-9]/g, '_')}_${examType.replace(' ', '_')}.csv`
      : `Arsip_Detail_${examType.replace(' ', '_')}.csv`;

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDetails = () => {
    // Determine students to export: if selection exists use selection, otherwise use all
    const studentsToExport = selectedStudents.size > 0 
      ? students.filter(s => selectedStudents.has(s.id))
      : students;
    
    generateDetailCSV(studentsToExport);
  };

  const handleExportSummary = () => {
    const headers = [
      "NPM", "Nama", "Prodi",
      "Pembimbing 1 (35%)", "Pembimbing 2 (25%)", 
      "Penguji 1 (20%)", "Penguji 2 (20%)", 
      "Nilai Akhir", "Huruf Mutu", "Status Kelulusan", "Status Data"
    ];

    const rows = students.map(s => {
      const p1 = getScore(s.id, Role.PEMBIMBING_1);
      const p2 = getScore(s.id, Role.PEMBIMBING_2);
      const e1 = getScore(s.id, Role.PENGUJI_1);
      const e2 = getScore(s.id, Role.PENGUJI_2);
      const final = calculateFinal(p1, p2, e1, e2);
      const letter = getLetterGrade(final);
      const passStatus = getPassStatus(final);
      const statusData = [p1, p2, e1, e2].every(x => x !== null) ? 'Lengkap' : 'Belum Lengkap';
      
      return [
        s.npm,
        s.name,
        s.prodi,
        p1 !== null ? p1 : '-',
        p2 !== null ? p2 : '-',
        e1 !== null ? e1.toFixed(2) : '-',
        e2 !== null ? e2.toFixed(2) : '-',
        final.toFixed(2),
        letter,
        passStatus,
        statusData
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Nilai_${examType.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Table className="w-5 h-5 text-primary-600" />
            Rekapitulasi Nilai
          </h2>
          <p className="text-slate-500 text-sm">{examType}</p>
        </div>
        
        <div className="flex gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          {selectedStudents.size > 0 && (
             <button 
              onClick={handleDeleteClick}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
             >
               <Trash2 className="w-4 h-4" />
               <span className="hidden sm:inline">Hapus Terpilih</span> ({selectedStudents.size})
             </button>
          )}

          <button 
            onClick={handleExportDetails}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Arsip</span> Detail
          </button>

          <button 
            onClick={handleExportSummary}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span> CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 w-4 sticky left-0 bg-slate-50 z-10">
                 <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedStudents.size === students.length && students.length > 0}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                 />
              </th>
              <th className="px-6 py-3">Mahasiswa</th>
              <th className="px-6 py-3">Prodi</th>
              <th className="px-6 py-3 text-center">P. 1 (35%)</th>
              <th className="px-6 py-3 text-center">P. 2 (25%)</th>
              <th className="px-6 py-3 text-center">Uji 1 (20%)</th>
              <th className="px-6 py-3 text-center">Uji 2 (20%)</th>
              <th className="px-6 py-3 text-center font-bold text-primary-700">Total</th>
              <th className="px-6 py-3 text-center">Mutu</th>
              <th className="px-6 py-3 text-center">Kelulusan</th>
              <th className="px-6 py-3 text-center">Status Data</th>
              <th className="px-6 py-3 text-center sticky right-0 bg-slate-50 z-10 shadow-[-5px_0px_5px_-5px_rgba(0,0,0,0.1)]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
               const p1 = getScore(student.id, Role.PEMBIMBING_1);
               const p2 = getScore(student.id, Role.PEMBIMBING_2);
               const e1 = getScore(student.id, Role.PENGUJI_1);
               const e2 = getScore(student.id, Role.PENGUJI_2);
               const final = calculateFinal(p1, p2, e1, e2);
               const status = getStatus(student.id);
               const letter = getLetterGrade(final);
               const passStatus = getPassStatus(final);

               return (
                <tr key={student.id} className={`border-b hover:bg-slate-50 ${selectedStudents.has(student.id) ? 'bg-blue-50' : 'bg-white'}`}>
                  <td className="px-4 py-4 sticky left-0 z-10 bg-inherit border-r sm:border-r-0 border-slate-100">
                     <input 
                        type="checkbox" 
                        checked={selectedStudents.has(student.id)}
                        onChange={() => handleSelectOne(student.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                     />
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <div>{student.name}</div>
                    <div className="text-slate-500 text-xs font-normal">{student.npm}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md border border-slate-200">
                      {student.prodi}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {p1 !== null ? (
                        <div className="flex items-center justify-center gap-1 text-green-600">
                            <Check className="w-3 h-3" />
                            {p1}
                        </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                   <td className="px-6 py-4 text-center">
                    {p2 !== null ? (
                        <div className="flex items-center justify-center gap-1 text-green-600">
                            <Check className="w-3 h-3" />
                            {p2}
                        </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                   <td className="px-6 py-4 text-center">
                    {e1 !== null ? (
                        <div className="flex items-center justify-center gap-1 text-green-600">
                            <Check className="w-3 h-3" />
                            {e1.toFixed(0)}
                        </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                   <td className="px-6 py-4 text-center">
                    {e2 !== null ? (
                        <div className="flex items-center justify-center gap-1 text-green-600">
                            <Check className="w-3 h-3" />
                            {e2.toFixed(0)}
                        </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-lg text-primary-700">
                    {final.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-700">
                    {letter}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${passStatus === 'LULUS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {passStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center sticky right-0 bg-inherit z-10 shadow-[-5px_0px_5px_-5px_rgba(0,0,0,0.1)] border-l border-slate-100">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={() => generateDetailCSV([student])}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Unduh Arsip Detail Individu"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleIndividualDelete(student.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Nilai Individu"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
               );
            })}
          </tbody>
        </table>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Hapus Data Nilai?</h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Anda akan menghapus nilai untuk <strong>{selectedStudents.size} mahasiswa</strong> yang dipilih. 
                    Tindakan ini <span className="text-red-600 font-semibold">tidak dapat dibatalkan</span>.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button 
                        onClick={() => setShowDeleteModal(false)}
                        className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default RecapView;