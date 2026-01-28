import React, { useState } from 'react';
import { Download, Table, Trash2, FileText, AlertCircle, Lock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Assessment, Role, ExamType, Student } from '../types';
import { FINAL_WEIGHTS, SUPERVISOR_RUBRIC_ITEMS, EXAMINER_WEIGHTS } from '../constants';

interface RecapViewProps {
  assessments: Assessment[];
  examType: ExamType;
  students: Student[];
  onDeleteAssessments?: (studentIds: string[], examType: ExamType) => void;
  onExamTypeChange: (type: ExamType) => void;
}

const RecapView: React.FC<RecapViewProps> = ({ assessments, examType, students, onDeleteAssessments, onExamTypeChange }) => {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

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
    setDeletePassword('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  // Individual Delete Trigger
  const handleIndividualDelete = (id: string) => {
    setSelectedStudents(new Set([id]));
    setDeletePassword('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    // Validate Password
    if (deletePassword !== 'Fikes01132039') {
        setDeleteError('Password salah!');
        return;
    }

    if (onDeleteAssessments) {
      onDeleteAssessments(Array.from(selectedStudents), examType);
      setSelectedStudents(new Set());
      setShowDeleteModal(false);
      setDeletePassword('');
      setDeleteError('');
    }
  };

  // --- EXPORT TO EXCEL ---
  const handleExportExcel = () => {
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

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Auto-width adjustment
    const wscols = headers.map(h => ({ wch: h.length + 5 }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai");
    
    XLSX.writeFile(wb, `Rekap_Nilai_${examType.replace(' ', '_')}.xlsx`);
  };

  // --- EXPORT TO PDF (Core Function) ---
  const exportPDF = (targetStudents: Student[]) => {
    if (targetStudents.length === 0) {
        alert("Silakan pilih minimal satu mahasiswa untuk mengunduh arsip.");
        return;
    }

    const doc = new jsPDF();
    let pageCount = 0;

    targetStudents.forEach((student, studentIndex) => {
        // Find Assessments
        const assessP1 = assessments.find(a => a.studentId === student.id && a.evaluatorRole === Role.PEMBIMBING_1 && a.examType === examType);
        const assessP2 = assessments.find(a => a.studentId === student.id && a.evaluatorRole === Role.PEMBIMBING_2 && a.examType === examType);
        const assessU1 = assessments.find(a => a.studentId === student.id && a.evaluatorRole === Role.PENGUJI_1 && a.examType === examType);
        const assessU2 = assessments.find(a => a.studentId === student.id && a.evaluatorRole === Role.PENGUJI_2 && a.examType === examType);

        // Helper for Header
        const drawHeader = (title: string) => {
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("Fakultas Ilmu Kesehatan - Universitas Ibnu Sina", 14, 15);
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.setFont("helvetica", "bold");
            doc.text(title, 14, 25);
            doc.setFont("helvetica", "normal");
            
            // Student Info Box
            doc.setFontSize(10);
            doc.setDrawColor(200);
            doc.setFillColor(250);
            doc.rect(14, 32, 182, 30, 'FD'); // Box
            
            doc.text(`Nama: ${student.name}`, 18, 40);
            doc.text(`NPM: ${student.npm}`, 18, 46);
            doc.text(`Prodi: ${student.prodi}`, 18, 52);
            const titleSplit = doc.splitTextToSize(`Judul: ${student.title}`, 170);
            doc.text(titleSplit, 18, 58);
        };

        // --- PAGE 1: BERITA ACARA (From Pembimbing 2) ---
        if (pageCount > 0) doc.addPage();
        pageCount++;

        drawHeader(`BERITA ACARA - ${examType.toUpperCase()}`);
        
        doc.setFontSize(11);
        doc.text("Detail Pelaksanaan:", 14, 75);

        if (assessP2 && assessP2.beritaAcara) {
            const ba = assessP2.beritaAcara;
            const bodyData = [
                ["Tanggal", ba.date],
                ["Waktu", ba.time],
                ["Kejadian Khusus", ba.events || "-"],
                ["Catatan / Revisi", ba.notes || "-"]
            ];
            
            autoTable(doc, {
                startY: 80,
                head: [],
                body: bodyData,
                theme: 'plain',
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
                styles: { fontSize: 10, cellPadding: 3 }
            });
            
            // Signatures Section
            let finalY = (doc as any).lastAutoTable.finalY + 20;
            doc.text("Mengetahui,", 14, finalY);
            doc.text("Pembimbing 2 / Sekretaris Sidang", 14, finalY + 15);
            doc.text(`( ${student.pembimbing2} )`, 14, finalY + 40);

        } else {
            doc.setTextColor(200, 0, 0);
            doc.text("Data Berita Acara belum diisi oleh Pembimbing 2.", 14, 85);
            doc.setTextColor(0);
        }

        // --- PAGE 2-5: ASSESSMENT FORMS ---
        const forms = [
            { role: Role.PEMBIMBING_1, data: assessP1, label: "PEMBIMBING 1", evaluatorName: student.pembimbing1 },
            { role: Role.PEMBIMBING_2, data: assessP2, label: "PEMBIMBING 2", evaluatorName: student.pembimbing2 },
            { role: Role.PENGUJI_1, data: assessU1, label: "PENGUJI 1", evaluatorName: student.penguji1 },
            { role: Role.PENGUJI_2, data: assessU2, label: "PENGUJI 2", evaluatorName: student.penguji2 },
        ];

        forms.forEach(form => {
            doc.addPage();
            pageCount++;
            drawHeader(`LEMBAR PENILAIAN - ${form.label}`);
            
            doc.setFontSize(10);
            doc.text(`Dosen Penilai: ${form.evaluatorName}`, 14, 70);

            if (form.data) {
                let tableBody = [];
                let totalScore = form.data.totalScore;

                if (form.data.supervisorScores) {
                    // Supervisor Logic
                    tableBody = SUPERVISOR_RUBRIC_ITEMS.map((item, idx) => [
                        idx + 1,
                        item,
                        form.data.supervisorScores![idx] || 0
                    ]);
                    
                    autoTable(doc, {
                        startY: 75,
                        head: [['No', 'Komponen Penilaian', 'Nilai (1-5)']],
                        body: tableBody,
                        theme: 'grid',
                        columnStyles: { 0: { cellWidth: 10 }, 2: { cellWidth: 20, halign: 'center' } },
                        headStyles: { fillColor: [22, 163, 74] } // Primary Green
                    });

                } else if (form.data.examinerScores) {
                    // Examiner Logic
                    const s = form.data.examinerScores;
                    tableBody = [
                        ['1', 'Sistematika Penulisan', `${(EXAMINER_WEIGHTS.sistematika * 100)}%`, s.sistematika],
                        ['2', 'Isi Tulisan', `${(EXAMINER_WEIGHTS.isi * 100)}%`, s.isi],
                        ['3', 'Penyajian', `${(EXAMINER_WEIGHTS.penyajian * 100)}%`, s.penyajian],
                        ['4', 'Tanya Jawab', `${(EXAMINER_WEIGHTS.tanyaJawab * 100)}%`, s.tanyaJawab],
                    ];

                    autoTable(doc, {
                        startY: 75,
                        head: [['No', 'Komponen', 'Bobot', 'Nilai (0-100)']],
                        body: tableBody,
                        theme: 'grid',
                        columnStyles: { 0: { cellWidth: 10 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25, halign: 'center' } },
                        headStyles: { fillColor: [22, 163, 74] }
                    });
                }

                // Total Score
                const finalY = (doc as any).lastAutoTable.finalY + 10;
                doc.setFont("helvetica", "bold");
                doc.text(`TOTAL NILAI: ${totalScore.toFixed(2)}`, 14, finalY);
                
                // Signature
                doc.setFont("helvetica", "normal");
                doc.text("Tanda Tangan Penilai,", 140, finalY + 10);
                doc.text(`( ${form.evaluatorName} )`, 140, finalY + 35);

            } else {
                doc.setTextColor(150);
                doc.text("Penilaian belum dilakukan.", 14, 80);
                doc.setTextColor(0);
            }
        });
    });

    // Save PDF
    const filename = targetStudents.length === 1 
      ? `Arsip_Lengkap_${targetStudents[0].name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      : `Arsip_Gabungan_${examType.replace(' ', '_')}.pdf`;
    
    doc.save(filename);
  };

  // --- Wrapper for Bulk Button ---
  const handleBulkExportPDF = () => {
    const targets = students.filter(s => selectedStudents.has(s.id));
    if (targets.length === 0) {
        alert("Mohon pilih (checklist) minimal satu mahasiswa untuk menggunakan fitur unduh massal.");
    } else {
        exportPDF(targets);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Table className="w-5 h-5 text-primary-600" />
            Rekapitulasi Nilai
          </h2>
          <div className="flex items-center gap-2 mt-1">
             <select 
                value={examType} 
                onChange={(e) => onExamTypeChange(e.target.value as ExamType)}
                className="text-sm border-slate-200 rounded-md py-1 pr-8 pl-2 bg-slate-50 font-medium text-slate-700 focus:ring-primary-500 focus:border-primary-500"
             >
                <option value={ExamType.SEMINAR_PROPOSAL}>Seminar Proposal</option>
                <option value={ExamType.SIDANG_SKRIPSI}>Sidang Skripsi</option>
             </select>
          </div>
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
            onClick={handleBulkExportPDF}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Unduh Arsip</span> PDF (Massal)
          </button>

          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span> Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
            <tr>
              <th className="px-3 py-3 w-4 sticky left-0 bg-slate-50 z-20">
                 <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedStudents.size === students.length && students.length > 0}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                 />
              </th>
              <th className="px-4 py-3 min-w-[200px]">Mahasiswa</th>
              <th className="px-3 py-3 whitespace-nowrap">Prodi</th>
              <th className="px-2 py-3 text-center whitespace-nowrap">P. 1<br/><span className="text-[10px] text-slate-500">(35%)</span></th>
              <th className="px-2 py-3 text-center whitespace-nowrap">P. 2<br/><span className="text-[10px] text-slate-500">(25%)</span></th>
              <th className="px-2 py-3 text-center whitespace-nowrap">Uji 1<br/><span className="text-[10px] text-slate-500">(20%)</span></th>
              <th className="px-2 py-3 text-center whitespace-nowrap">Uji 2<br/><span className="text-[10px] text-slate-500">(20%)</span></th>
              <th className="px-3 py-3 text-center font-bold text-primary-700 whitespace-nowrap">Total</th>
              <th className="px-3 py-3 text-center whitespace-nowrap">Mutu</th>
              <th className="px-3 py-3 text-center whitespace-nowrap">Kelulusan</th>
              <th className="px-3 py-3 text-center whitespace-nowrap">Status Data</th>
              <th className="px-3 py-3 text-center sticky right-0 bg-slate-50 z-20 shadow-[-5px_0px_5px_-5px_rgba(0,0,0,0.1)] whitespace-nowrap">Aksi</th>
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
                  <td className="px-3 py-4 sticky left-0 z-10 bg-inherit border-r sm:border-r-0 border-slate-100">
                     <input 
                        type="checkbox" 
                        checked={selectedStudents.has(student.id)}
                        onChange={() => handleSelectOne(student.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                     />
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900">
                    <div className="line-clamp-2">{student.name}</div>
                    <div className="text-slate-500 text-xs font-normal mt-0.5">{student.npm}</div>
                  </td>
                  <td className="px-3 py-4 text-slate-600 whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md border border-slate-200">
                      {student.prodi}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-center whitespace-nowrap">
                    {p1 !== null ? (
                        <div className="flex items-center justify-center gap-1 text-green-600 font-medium">
                            {p1}
                        </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                   <td className="px-2 py-4 text-center whitespace-nowrap">
                    {p2 !== null ? (
                        <div className="flex items-center justify-center gap-1 text-green-600 font-medium">
                            {p2}
                        </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                   <td className="px-2 py-4 text-center whitespace-nowrap">
                    {e1 !== null ? (
                        <div className="flex items-center justify-center gap-1 text-green-600 font-medium">
                            {e1.toFixed(0)}
                        </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                   <td className="px-2 py-4 text-center whitespace-nowrap">
                    {e2 !== null ? (
                        <div className="flex items-center justify-center gap-1 text-green-600 font-medium">
                            {e2.toFixed(0)}
                        </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-3 py-4 text-center font-bold text-base text-primary-700 whitespace-nowrap">
                    {final.toFixed(2)}
                  </td>
                  <td className="px-3 py-4 text-center font-semibold text-slate-700 whitespace-nowrap">
                    {letter}
                  </td>
                  <td className="px-3 py-4 text-center whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${passStatus === 'LULUS' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {passStatus}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${status.label === 'Lengkap' ? 'bg-blue-50 text-blue-700 border-blue-200' : status.label === 'Sebagian' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center sticky right-0 bg-inherit z-10 shadow-[-5px_0px_5px_-5px_rgba(0,0,0,0.1)] border-l border-slate-100 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={() => exportPDF([student])}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Unduh Arsip Detail Individu (PDF)"
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
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
                <div className="text-center">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Hapus Data Nilai?</h3>
                    <p className="text-sm text-slate-600 mt-2 mb-4">
                        Anda akan menghapus nilai untuk <strong>{selectedStudents.size} mahasiswa</strong>. 
                        Tindakan ini <span className="text-red-600 font-semibold">tidak dapat dibatalkan</span>.
                    </p>
                </div>
                
                {/* Password Input */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                   <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Masukkan Password Admin</label>
                   <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                         type="password" 
                         value={deletePassword}
                         onChange={(e) => {
                             setDeletePassword(e.target.value);
                             setDeleteError('');
                         }}
                         className="w-full pl-9 pr-3 py-2 rounded border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                         placeholder="Password database..."
                      />
                   </div>
                   {deleteError && (
                       <p className="text-xs text-red-600 mt-1 font-medium">{deleteError}</p>
                   )}
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