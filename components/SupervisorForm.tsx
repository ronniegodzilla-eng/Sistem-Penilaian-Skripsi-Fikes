import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Calendar, FileText, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { Student, Role, ExamType, Assessment, SupervisorScore, BeritaAcara } from '../types';
import { SUPERVISOR_RUBRIC_ITEMS } from '../constants';

interface SupervisorFormProps {
  examType: ExamType;
  role: Role.PEMBIMBING_1 | Role.PEMBIMBING_2;
  student: Student;
  existingAssessments: Assessment[];
  onSave: (assessment: Assessment) => void;
  onBack: () => void;
}

const SupervisorForm: React.FC<SupervisorFormProps> = ({ examType, role, student, existingAssessments, onSave, onBack }) => {
  const [scores, setScores] = useState<SupervisorScore>({});
  const [beritaAcara, setBeritaAcara] = useState<BeritaAcara>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    events: '',
    notes: ''
  });
  const [isSaved, setIsSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Initialize scores with 0
  useEffect(() => {
    const initialScores: SupervisorScore = {};
    SUPERVISOR_RUBRIC_ITEMS.forEach((_, index) => {
      initialScores[index] = 0;
    });
    setScores(initialScores);
  }, []);

  // Check for existing data ON MOUNT ONLY
  // Removing 'existingAssessments' from dependency array to prevent 
  // parallel updates from other tabs wiping out local unsaved changes.
  useEffect(() => {
    if (student) {
      const found = existingAssessments.find(
        (a) => a.studentId === student.id && a.evaluatorRole === role && a.examType === examType
      );
      if (found && found.supervisorScores) {
        setScores(found.supervisorScores);
        if (found.beritaAcara) {
          setBeritaAcara(found.beritaAcara);
        }
        setIsSaved(true);
      } else {
         // Reset for new student
         const resetScores: SupervisorScore = {};
         SUPERVISOR_RUBRIC_ITEMS.forEach((_, index) => resetScores[index] = 0);
         setScores(resetScores);
         setIsSaved(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, role, examType]); 


  const calculateTotal = (): number => {
    let sum = 0;
    Object.values(scores).forEach((val) => sum += (val as number));
    return sum;
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
      supervisorScores: scores,
      beritaAcara: role === Role.PEMBIMBING_2 ? beritaAcara : undefined,
      totalScore: total,
      timestamp: Date.now()
    };

    onSave(assessment);
    setIsSaved(true);
    setShowConfirm(false);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative pb-10">
      <div className="bg-primary-600 p-4 sm:p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
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
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600 space-y-3">
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-2">Informasi Mahasiswa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <p><strong className="text-slate-900 w-24 inline-block">Nama:</strong> {student.name}</p>
              <p><strong className="text-slate-900 w-24 inline-block">NPM:</strong> {student.npm}</p>
              <p><strong className="text-slate-900 w-24 inline-block">Prodi:</strong> {student.prodi}</p>
              <p className="md:col-span-2"><strong className="text-slate-900 w-24 inline-block">Judul:</strong> {student.title}</p>
              <div className="border-t border-slate-200 my-1 md:col-span-2 pt-1"></div>
              <p className="text-xs text-slate-500 md:col-span-2">
                <span className="font-semibold text-slate-700">Tim:</span> P1: {student.pembimbing1}, P2: {student.pembimbing2}, U1: {student.penguji1}, U2: {student.penguji2}
              </p>
            </div>
        </div>

        {/* Rubric Grid */}
        <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b">Rubrik Penilaian (Skala 1-5)</h3>
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {SUPERVISOR_RUBRIC_ITEMS.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white border border-slate-100 shadow-sm rounded-lg hover:border-primary-200 transition-colors">
                  <span className="text-slate-800 font-medium text-sm flex-1">{index + 1}. {item}</span>
                  
                  <div className="flex gap-2 items-center justify-between sm:justify-start">
                      {[1, 2, 3, 4, 5].map((val) => (
                      <label key={val} className="flex flex-col items-center cursor-pointer group relative">
                          <input 
                          type="radio"
                          name={`rubric-${index}`}
                          value={val}
                          checked={scores[index] === val}
                          onChange={() => setScores(prev => ({ ...prev, [index]: val }))}
                          className="peer sr-only" // Hide default radio
                          required
                          />
                          <div className="w-10 h-10 sm:w-10 sm:h-10 rounded-full border-2 border-slate-200 text-slate-500 font-bold flex items-center justify-center transition-all peer-checked:border-primary-500 peer-checked:bg-primary-500 peer-checked:text-white group-hover:border-primary-300">
                            {val}
                          </div>
                      </label>
                      ))}
                  </div>
                </div>
            ))}
            </div>
        </div>

        {/* Total Score Preview */}
        <div className="sticky bottom-0 z-20 bg-white border-t border-slate-200 p-4 -mx-4 sm:mx-0 sm:rounded-lg sm:border shadow-lg sm:shadow-none flex justify-between items-center">
            <span className="text-slate-700 font-medium text-sm sm:text-base">Total Nilai:</span>
            <span className="text-2xl font-bold text-primary-700">{calculateTotal()} / 100</span>
        </div>

        {/* Berita Acara - Only for Pembimbing 2 */}
        {role === Role.PEMBIMBING_2 && (
            <div className="bg-slate-50 p-4 sm:p-6 rounded-lg border border-slate-200 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Berita Acara & Catatan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                    type="date"
                    value={beritaAcara.date}
                    onChange={(e) => setBeritaAcara(prev => ({ ...prev, date: e.target.value }))}
                    className="pl-10 w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-200 p-3 border"
                    required
                    />
                </div>
                </div>
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Waktu</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                    type="time"
                    value={beritaAcara.time}
                    onChange={(e) => setBeritaAcara(prev => ({ ...prev, time: e.target.value }))}
                    className="pl-10 w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-200 p-3 border"
                    required
                    />
                </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kejadian Selama Ujian</label>
                <textarea 
                value={beritaAcara.events}
                onChange={(e) => setBeritaAcara(prev => ({ ...prev, events: e.target.value }))}
                rows={3}
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-200 p-3 border"
                placeholder="Deskripsikan jika ada kejadian khusus..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan, Masukan & Saran Penguji</label>
                <textarea 
                value={beritaAcara.notes}
                onChange={(e) => setBeritaAcara(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-200 p-3 border"
                placeholder="Tuliskan revisi atau masukan..."
                required
                />
            </div>
            </div>
        )}

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

export default SupervisorForm;