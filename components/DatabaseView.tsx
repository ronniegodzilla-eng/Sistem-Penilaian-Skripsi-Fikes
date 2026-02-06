import React, { useState, useRef, useMemo } from 'react';
import { Database, Plus, Edit2, Trash2, Search, X, Save, Upload, FileText, Loader2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student } from '../types';

interface DatabaseViewProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onDeleteStudents?: (ids: string[]) => void;
  onImportStudents: (students: Student[]) => void;
}

type SortKey = keyof Student;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey | null;
  direction: SortDirection;
}

const DatabaseView: React.FC<DatabaseViewProps> = ({ 
    students, 
    onAddStudent, 
    onUpdateStudent, 
    onDeleteStudent,
    onDeleteStudents,
    onImportStudents 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Sorting & Selection State
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const defaultForm = {
    name: '',
    npm: '',
    prodi: 'K3',
    title: '-',
    pembimbing1: '',
    pembimbing2: '',
    penguji1: '',
    penguji2: ''
  };
  const [addForm, setAddForm] = useState<Partial<Student>>(defaultForm);

  // Filter and Sort Logic
  const sortedAndFilteredStudents = useMemo(() => {
    // 1. Filter
    let result = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.npm.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Sort
    if (sortConfig.key) {
        result.sort((a, b) => {
            const valA = (a[sortConfig.key!] || '').toString().toLowerCase();
            const valB = (b[sortConfig.key!] || '').toString().toLowerCase();

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return result;
  }, [students, searchTerm, sortConfig]);

  // Handlers
  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
        key,
        direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        // Select all visible (filtered) students
        setSelectedIds(new Set(sortedAndFilteredStudents.map(s => s.id)));
    } else {
        setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data mahasiswa ini dari database cloud?')) {
      onDeleteStudent(id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBulkDelete = () => {
     if (selectedIds.size === 0) return;
     if (window.confirm(`Yakin ingin menghapus ${selectedIds.size} mahasiswa terpilih?`)) {
        if (onDeleteStudents) {
            onDeleteStudents(Array.from(selectedIds));
            setSelectedIds(new Set());
        } else {
            // Fallback if prop not provided (though it should be)
            selectedIds.forEach(id => onDeleteStudent(id));
            setSelectedIds(new Set());
        }
     }
  };

  const startEdit = (student: Student) => {
    setIsEditing(student.id);
    setEditForm({ ...student });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editForm.name || !editForm.npm) return;
    const updatedStudent = { ...students.find(s => s.id === isEditing), ...editForm } as Student;
    onUpdateStudent(updatedStudent);
    setIsEditing(null);
    setEditForm({});
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.npm) return;
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      name: addForm.name || '',
      npm: addForm.npm || '',
      prodi: addForm.prodi || 'K3',
      title: addForm.title || '-',
      pembimbing1: addForm.pembimbing1 || '',
      pembimbing2: addForm.pembimbing2 || '',
      penguji1: addForm.penguji1 || '',
      penguji2: addForm.penguji2 || ''
    };
    onAddStudent(newStudent);
    setIsAdding(false);
    setAddForm(defaultForm);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result;
      if (!data) {
          setProcessing(false);
          return;
      }

      try {
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const studentsToImport: Student[] = [];
        
        // Use explicit map population to avoid type inference issues
        const studentMap = new Map<string, Student>();
        students.forEach(s => studentMap.set(s.npm.trim().toLowerCase(), s));

        for (let i = 1; i < jsonData.length; i++) {
            const cols = jsonData[i];
            if (!cols || cols.length === 0) continue;

            const excelData = {
                name: cols[0] ? String(cols[0]).trim() : '',
                npm: cols[1] ? String(cols[1]).trim() : '',
                prodi: cols[2] ? String(cols[2]).trim() : 'K3',
                title: cols[3] ? String(cols[3]).trim() : '-',
                pembimbing1: cols[4] ? String(cols[4]).trim() : '',
                pembimbing2: cols[5] ? String(cols[5]).trim() : '',
                penguji1: cols[6] ? String(cols[6]).trim() : '',
                penguji2: cols[7] ? String(cols[7]).trim() : ''
            };

            if (!excelData.npm) continue;

            const npmKey = excelData.npm.toLowerCase();
            const existing = studentMap.get(npmKey);
            const idToUse = existing ? existing.id : `import-${Date.now()}-${i}`;

            const studentObj: Student = {
                id: idToUse,
                name: excelData.name,
                npm: excelData.npm,
                prodi: excelData.prodi,
                title: excelData.title,
                pembimbing1: excelData.pembimbing1,
                pembimbing2: excelData.pembimbing2,
                penguji1: excelData.penguji1,
                penguji2: excelData.penguji2
            };
            studentsToImport.push(studentObj);
        }

        if (studentsToImport.length > 0) {
            onImportStudents(studentsToImport);
            alert(`Berhasil memproses ${studentsToImport.length} data. Sedang mengirim ke database...`);
        } else {
            alert('File kosong atau tidak ada data valid.');
        }

      } catch (error) {
          console.error("Excel processing error:", error);
          alert("Gagal membaca file Excel. Pastikan format file benar (.xlsx).");
      } finally {
          setProcessing(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadDatabase = () => {
    const headers = ["Nama", "NPM", "Prodi", "Judul Skripsi", "Pembimbing 1", "Pembimbing 2", "Penguji 1", "Penguji 2"];
    
    // Map existing students to array format
    const data = students.map(s => [
        s.name, 
        s.npm, 
        s.prodi, 
        s.title, 
        s.pembimbing1, 
        s.pembimbing2, 
        s.penguji1, 
        s.penguji2
    ]);

    // If no students, add a placeholder example so the file isn't empty structure
    if (data.length === 0) {
        data.push([ "Contoh Nama", "12345678", "K3", "Analisis Risiko K3", "Dosen A", "Dosen B", "Dosen C", "Dosen D"]);
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database Mahasiswa");
    XLSX.writeFile(wb, `Database_Mahasiswa_Full.xlsx`);
  };

  // Helper for Sort Icons
  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortConfig.key !== colKey) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-primary-600" />
      : <ArrowDown className="w-3 h-3 text-primary-600" />;
  };

  // Helper for Header Cells
  const HeaderCell = ({ label, colKey, className="" }: { label: string, colKey: SortKey, className?: string }) => (
    <th 
        className={`px-4 py-3 cursor-pointer group hover:bg-slate-100 select-none transition-colors ${className}`}
        onClick={() => handleSort(colKey)}
    >
        <div className="flex items-center gap-1">
            {label}
            <SortIcon colKey={colKey} />
        </div>
    </th>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-600" />
            Database Mahasiswa (Cloud)
          </h2>
          <p className="text-slate-500 text-sm">Data tersimpan aman dan realtime di server.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end items-center">
            
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari Nama / NPM..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          {/* Bulk Delete Button */}
          {selectedIds.size > 0 && (
             <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-100 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
             >
                <Trash2 className="w-4 h-4" />
                Hapus ({selectedIds.size})
             </button>
          )}
          
          {/* Download DB Button */}
          <button onClick={downloadDatabase} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50" title="Download data existing ke Excel untuk diedit">
            <FileText className="w-4 h-4" />
            Download DB
          </button>
          
          {/* Import Button */}
          <div className="relative">
             <input 
               type="file" 
               accept=".xlsx, .xls"
               ref={fileInputRef}
               onChange={handleFileUpload}
               className="hidden"
               id="excel-upload"
               disabled={processing}
             />
             <label 
               htmlFor="excel-upload" 
               className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${processing ? 'opacity-50 cursor-wait' : ''}`}
             >
               {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
               Impor
             </label>
          </div>

          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Add Form Panel */}
      {isAdding && (
        <div className="p-4 bg-primary-50 border-b border-primary-100">
          <h3 className="text-sm font-bold text-primary-800 mb-3">Tambah Mahasiswa Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-primary-700 block mb-1">Nama</label>
              <input type="text" className="w-full text-sm border-slate-300 rounded p-2" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-primary-700 block mb-1">NPM</label>
              <input type="text" className="w-full text-sm border-slate-300 rounded p-2" value={addForm.npm} onChange={e => setAddForm({...addForm, npm: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-primary-700 block mb-1">Prodi</label>
              <select className="w-full text-sm border-slate-300 rounded p-2" value={addForm.prodi} onChange={e => setAddForm({...addForm, prodi: e.target.value})}>
                <option value="K3">K3</option>
                <option value="Kesling">Kesling</option>
              </select>
            </div>
             <div>
              <label className="text-xs font-semibold text-primary-700 block mb-1">Judul Skripsi</label>
              <input type="text" className="w-full text-sm border-slate-300 rounded p-2" value={addForm.title} onChange={e => setAddForm({...addForm, title: e.target.value})} />
            </div>
            {/* Lecturer Fields */}
            <div>
              <label className="text-xs font-semibold text-primary-700 block mb-1">Pembimbing 1</label>
              <input type="text" className="w-full text-sm border-slate-300 rounded p-2" value={addForm.pembimbing1} onChange={e => setAddForm({...addForm, pembimbing1: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-primary-700 block mb-1">Pembimbing 2</label>
              <input type="text" className="w-full text-sm border-slate-300 rounded p-2" value={addForm.pembimbing2} onChange={e => setAddForm({...addForm, pembimbing2: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-primary-700 block mb-1">Penguji 1</label>
              <input type="text" className="w-full text-sm border-slate-300 rounded p-2" value={addForm.penguji1} onChange={e => setAddForm({...addForm, penguji1: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-primary-700 block mb-1">Penguji 2</label>
              <input type="text" className="w-full text-sm border-slate-300 rounded p-2" value={addForm.penguji2} onChange={e => setAddForm({...addForm, penguji2: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
              <button onClick={handleAdd} className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700">Simpan</button>
              <button onClick={() => setIsAdding(false)} className="bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded text-sm hover:bg-slate-50">Batal</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 w-8">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={sortedAndFilteredStudents.length > 0 && selectedIds.size === sortedAndFilteredStudents.length}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
              </th>
              <HeaderCell label="NPM" colKey="npm" />
              <HeaderCell label="Nama" colKey="name" />
              <HeaderCell label="Prodi" colKey="prodi" />
              <HeaderCell label="Judul" colKey="title" />
              <HeaderCell label="Pembimbing" colKey="pembimbing1" />
              <HeaderCell label="Penguji" colKey="penguji1" />
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedAndFilteredStudents.length === 0 ? (
               <tr><td colSpan={8} className="p-8 text-center text-slate-400">Tidak ada data ditemukan</td></tr>
            ) : (
              sortedAndFilteredStudents.map((student) => (
                <tr key={student.id} className={`hover:bg-slate-50 ${selectedIds.has(student.id) ? 'bg-blue-50' : 'bg-white'}`}>
                   {/* Checkbox Column */}
                   <td className="px-3 py-3">
                        {isEditing !== student.id && (
                             <input 
                                type="checkbox" 
                                checked={selectedIds.has(student.id)}
                                onChange={() => handleSelectOne(student.id)}
                                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                            />
                        )}
                   </td>

                  {isEditing === student.id ? (
                    // Editing Mode
                    <>
                      <td className="px-2 py-3"><input className="w-full border rounded p-1 text-xs" value={editForm.npm} onChange={e => setEditForm({...editForm, npm: e.target.value})} /></td>
                      <td className="px-2 py-3"><input className="w-full border rounded p-1 text-xs" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                      <td className="px-2 py-3">
                         <select className="w-full border rounded p-1 text-xs" value={editForm.prodi} onChange={e => setEditForm({...editForm, prodi: e.target.value})}>
                            <option value="K3">K3</option>
                            <option value="Kesling">Kesling</option>
                          </select>
                      </td>
                      <td className="px-2 py-3"><input className="w-full border rounded p-1 text-xs" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} /></td>
                      <td className="px-2 py-3 space-y-1">
                        <input placeholder="P1" className="w-full border rounded p-1 text-xs" value={editForm.pembimbing1} onChange={e => setEditForm({...editForm, pembimbing1: e.target.value})} />
                        <input placeholder="P2" className="w-full border rounded p-1 text-xs" value={editForm.pembimbing2} onChange={e => setEditForm({...editForm, pembimbing2: e.target.value})} />
                      </td>
                      <td className="px-2 py-3 space-y-1">
                        <input placeholder="U1" className="w-full border rounded p-1 text-xs" value={editForm.penguji1} onChange={e => setEditForm({...editForm, penguji1: e.target.value})} />
                        <input placeholder="U2" className="w-full border rounded p-1 text-xs" value={editForm.penguji2} onChange={e => setEditForm({...editForm, penguji2: e.target.value})} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={saveEdit} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="text-red-600 hover:bg-red-50 p-1 rounded"><X className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // Display Mode
                    <>
                      <td className="px-4 py-3 font-medium text-slate-900">{student.npm}</td>
                      <td className="px-4 py-3">{student.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${student.prodi === 'K3' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                          {student.prodi}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-[150px]" title={student.title}>{student.title}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div><span className="font-semibold">P1:</span> {student.pembimbing1 || '-'}</div>
                        <div><span className="font-semibold">P2:</span> {student.pembimbing2 || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div><span className="font-semibold">U1:</span> {student.penguji1 || '-'}</div>
                        <div><span className="font-semibold">U2:</span> {student.penguji2 || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => startEdit(student)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 p-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span>Total: {sortedAndFilteredStudents.length} Mahasiswa (Sync Cloud)</span>
        {selectedIds.size > 0 && <span className="font-semibold text-primary-600">{selectedIds.size} Dipilih</span>}
      </div>
    </div>
  );
};

export default DatabaseView;