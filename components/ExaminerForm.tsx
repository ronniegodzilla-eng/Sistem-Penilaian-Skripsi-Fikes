import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { Student, Role, ExamType, Assessment, ExaminerScore } from '../types';
import { EXAMINER_WEIGHTS } from '../constants';

interface ExaminerFormProps {
  examType: ExamType;
  role: Role.PENGUJI_1 | Role.PENGUJI_2;
  student: Student;
  existingAssessments: Assessment[];
  onSave: (assessment: Assessment) => void;
  onBack: () => void;
}

const ExaminerForm: React.FC<ExaminerFormProps> = ({ examType, role, student, existingAssessments, onSave, onBack }) => {
  const [scores, setScores] = useState<ExaminerScore>({
    sistematika: 0,
    isi: 0,
    penyajian: 0,
    tanyaJawab: 0
  });
  const [isSaved, setIsSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load existing data ON MOUNT ONLY
  // Removed 'existingAssessments' from dependency array to support parallel non-destructive editing
  useEffect(() => {
    if (student) {
      const found = existingAssessments.find(
        (a) => a.studentId === student.id && a.evaluatorRole === role && a.examType === examType
      );
      if (found && found.examinerScores) {
        setScores(found.examinerScores);
        setIsSaved(true);
      } else {
        setScores({ sistematika: 0, isi: 0, penyajian: 0, tanyaJawab: 0 });
        setIsSaved(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, role, examType]);

  const calculateTotal = (): number => {
    return (
      (scores.sistematika * EXAMINER_WEIGHTS.sistematika) +
      (scores.isi * EXAMINER_WEIGHTS.isi) +
      (scores.penyajian * EXAMINER_WEIGHTS.penyajian) +
      (scores.tanyaJawab * EXAMINER_WEIGHTS.tanyaJawab)
    );
  };

  const handleScoreChange = (field: keyof ExaminerScore, value: string) => {
    let numVal = parseFloat(value);
    if (isNaN(numVal)) numVal = 0;
    if (numVal > 100) numVal = 100;
    if (numVal < 0) numVal = 0;
    setScores(prev => ({ ...prev, [field]: numVal }));
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSave = () => {
    if (!student) return;

    const total = calculateTotal();
    
    const assessment: Assessment = {
      id: `${examType}-${role}-${student.id}`,
      studentId: student.id,
      evaluatorRole: role,
      examType: examType,
      examinerScores: scores,
      totalScore: total,
      timestamp: Date.now()
    };

    onSave(assessment);
    setIsSaved(true);
    setShowConfirm(false);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="bg-primary-600 p-4 sm:p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6" />
            Form Penilaian
          </h2>
          <p className="text-primary-100 text-sm mt-1">{role} - {examType}</p>
        </div>
        <button onClick={onBack} className="text-white hover:bg-primary-700 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium border border-white/20 sm:border-transparent">
            <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </div>

      <form onSubmit={handleInitialSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Student Info Card */}
        <div className="p-4 bg-slate-50 rounded-md border border-slate-200 text-sm text-slate-600 space-y-3">
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-2">Informasi Mahasiswa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <p><strong className="text-slate-900 w-24 inline-block">Nama:</strong> {student.name}</p>
              <p><strong className="text-slate-900 w-24 inline-block">NPM:</strong> {student.npm}</p>
              <p><strong className="text-slate-900 w-24 inline-block">Prodi:</strong> {student.prodi}</p>
              <p className="md:col-span-2"><strong className="text-slate-900 w-24 inline-block">Judul:</strong> {student.title}</p>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b">Komponen Penilaian (0 - 100)</h3>
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm sm:text-base font-medium text-slate-900">Sistematika Penulisan</label>
                  <span className="text-xs text-slate-500 block">Bobot: {EXAMINER_WEIGHTS.sistematika * 100}%</span>
                </div>
                <div className="w-24 sm:w-32">
                  <input 
                      type="number" 
                      min="0" max="100" 
                      value={scores.sistematika || ''}
                      onChange={(e) => handleScoreChange('sistematika', e.target.value)}
                      className="w-full text-center rounded-md border-slate-300 p-2.5 sm:p-2 border focus:ring-2 focus:ring-primary-500 text-lg font-medium"
                      placeholder="0"
                      required
                  />
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-row items-center justify-between gap-4">
                <div className="flex-1">
                <label className="block text-sm sm:text-base font-medium text-slate-900">Isi Tulisan</label>
                <span className="text-xs text-slate-500 block">Bobot: {EXAMINER_WEIGHTS.isi * 100}%</span>
                </div>
                <div className="w-24 sm:w-32">
                <input 
                    type="number" 
                    min="0" max="100" 
                    value={scores.isi || ''}
                    onChange={(e) => handleScoreChange('isi', e.target.value)}
                    className="w-full text-center rounded-md border-slate-300 p-2.5 sm:p-2 border focus:ring-2 focus:ring-primary-500 text-lg font-medium"
                    placeholder="0"
                    required
                />
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-row items-center justify-between gap-4">
                <div className="flex-1">
                <label className="block text-sm sm:text-base font-medium text-slate-900">Penyajian</label>
                <span className="text-xs text-slate-500 block">Bobot: {EXAMINER_WEIGHTS.penyajian * 100}%</span>
                </div>
                <div className="w-24 sm:w-32">
                <input 
                    type="number" 
                    min="0" max="100" 
                    value={scores.penyajian || ''}
                    onChange={(e) => handleScoreChange('penyajian', e.target.value)}
                    className="w-full text-center rounded-md border-slate-300 p-2.5 sm:p-2 border focus:ring-2 focus:ring-primary-500 text-lg font-medium"
                    placeholder="0"
                    required
                />
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-row items-center justify-between gap-4">
                <div className="flex-1">
                <label className="block text-sm sm:text-base font-medium text-slate-900">Tanya Jawab</label>
                <span className="text-xs text-slate-500 block">Bobot: {EXAMINER_WEIGHTS.tanyaJawab * 100}%</span>
                </div>
                <div className="w-24 sm:w-32">
                <input 
                    type="number" 
                    min="0" max="100" 
                    value={scores.tanyaJawab || ''}
                    onChange={(e) => handleScoreChange('tanyaJawab', e.target.value)}
                    className="w-full text-center rounded-md border-slate-300 p-2.5 sm:p-2 border focus:ring-2 focus:ring-primary-500 text-lg font-medium"
                    placeholder="0"
                    required
                />
                </div>
            </div>

            </div>
        </div>

        <div className="sticky bottom-0 z-20 bg-white border-t border-slate-200 p-4 -mx-4 sm:mx-0 sm:rounded-lg sm:border shadow-lg sm:shadow-none flex justify-between items-center">
            <span className="text-slate-700 font-medium text-sm sm:text-base">Nilai Akhir (Terbobot):</span>
            <span className="text-2xl font-bold text-primary-700">{calculateTotal().toFixed(2)}</span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            {isSaved && (
                <span className="text-green-600 text-sm font-medium flex items-center animate-pulse order-2 sm:order-1">
                <CheckCircle className="w-4 h-4 mr-1" />
                Data Tersimpan
                </span>
            )}
            <button 
            type="submit"
            className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-all focus:ring-4 focus:ring-primary-200 order-1 sm:order-2 text-lg sm:text-base"
            >
            Simpan Penilaian
            </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto text-primary-600">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Simpan Penilaian?</h3>
                <p className="text-sm text-slate-600">Pastikan semua data sudah benar. Anda dapat mengubahnya kembali nanti jika diperlukan.</p>
                <div className="flex gap-3 justify-center pt-2">
                    <button 
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={confirmSave}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                    >
                        Ya, Simpan
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ExaminerForm;