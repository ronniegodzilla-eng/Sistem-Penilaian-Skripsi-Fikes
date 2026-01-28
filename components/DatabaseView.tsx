import React, { useState, useRef } from 'react';
import { Database, Plus, Edit2, Trash2, Search, X, Save, Upload, FileText } from 'lucide-react';
import { Student } from '../types';

interface DatabaseViewProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
}

const DatabaseView: React.FC<DatabaseViewProps> = ({ students, onUpdateStudents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Default add form state
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

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.npm.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data mahasiswa ini?')) {
      const updated = students.filter(s => s.id !== id);
      onUpdateStudents(updated);
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

  const saveEdit = () => {
    if (!editForm.name || !editForm.npm) return;
    const updated = students.map(s => s.id === isEditing ? { ...s, ...editForm } as Student : s);
    onUpdateStudents(updated);
    setIsEditing(null);
    setEditForm({});
  };

  const handleAdd = () => {
    if (!addForm.name || !addForm.npm) return;
    const newStudent: Student = {
      id: `new-${Date.now()}`,
      name: addForm.name || '',
      npm: addForm.npm || '',
      prodi: addForm.prodi || 'K3',
      title: addForm.title || '-',
      pembimbing1: addForm.pembimbing1 || '',
      pembimbing2: addForm.pembimbing2 || '',
      penguji1: addForm.penguji1 || '',
      penguji2: addForm.penguji2 || ''
    };
    onUpdateStudents([...students, newStudent]);
    setIsAdding(false);
    setAddForm(defaultForm);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      // Skip header row
      const newStudents: Student[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parse (handling potential commas in quotes would require a stronger parser, 
        // but simple split is okay for basic names)
        // Improved split to handle quoted fields somewhat better
        const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const cleanCols = cols.map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        
        if (cleanCols.length >= 2) {
           // Expected format: Nama, NPM, Prodi, Judul, P1, P2, U1, U2
           newStudents.push({
             id: `import-${Date.now()}-${i}`,
             name: cleanCols[0] || 'Unknown',
             npm: cleanCols[1] || 'Unknown',
             prodi: cleanCols[2] || 'K3',
             title: cleanCols[3] || '-',
             pembimbing1: cleanCols[4] || '',
             pembimbing2: cleanCols[5] || '',
             penguji1: cleanCols[6] || '',
             penguji2: cleanCols[7] || ''
           });
        }
      }

      if (newStudents.length > 0) {
        if (window.confirm(`Ditemukan ${newStudents.length} data. Tambahkan ke database? (Data duplikat tidak dicek otomatis)`)) {
          onUpdateStudents([...students, ...newStudents]);
          alert('Data berhasil diimpor!');
        }
      } else {
        alert('Gagal membaca format CSV atau file kosong.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    // Generate CSV from current students data
    const headers = ["Nama", "NPM", "Prodi", "Judul Skripsi", "Pembimbing 1", "Pembimbing 2", "Penguji 1", "Penguji 2"];
    
    // Function to escape CSV fields
    const escapeCsv = (field: string) => {
      if (!field) return '';
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const rows = students.map(s => [
      escapeCsv(s.name),
      escapeCsv(s.npm),
      escapeCsv(s.prodi),
      escapeCsv(s.title),
      escapeCsv(s.pembimbing1),
      escapeCsv(s.pembimbing2),
      escapeCsv(s.penguji1),
      escapeCsv(s.penguji2)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `database_mahasiswa_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-600" />
            Database Mahasiswa
          </h2>
          <p className="text-slate-500 text-sm">Kelola data mahasiswa, dosen, dan judul</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
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
          
          <button onClick={downloadTemplate} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
            <FileText className="w-4 h-4" />
            Unduh Data (CSV)
          </button>
          
          <div className="relative">
             <input 
               type="file" 
               accept=".csv"
               ref={fileInputRef}
               onChange={handleFileUpload}
               className="hidden"
               id="csv-upload"
             />
             <label 
               htmlFor="csv-upload" 
               className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
             >
               <Upload className="w-4 h-4" />
               Impor CSV
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
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b sticky top-0">
            <tr>
              <th className="px-4 py-3">NPM</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Prodi</th>
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Pembimbing</th>
              <th className="px-4 py-3">Penguji</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
               <tr><td colSpan={7} className="p-8 text-center text-slate-400">Tidak ada data ditemukan</td></tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="bg-white hover:bg-slate-50">
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
      <div className="bg-slate-50 p-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
        <span>Total: {filteredStudents.length} Mahasiswa</span>
        <span>Menampilkan hasil pencarian untuk "{searchTerm}"</span>
      </div>
    </div>
  );
};

export default DatabaseView;