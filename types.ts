export enum Role {
  PEMBIMBING_1 = 'Pembimbing 1',
  PEMBIMBING_2 = 'Pembimbing 2',
  PENGUJI_1 = 'Penguji 1',
  PENGUJI_2 = 'Penguji 2',
}

export enum ExamType {
  SEMINAR_PROPOSAL = 'Seminar Proposal',
  SIDANG_SKRIPSI = 'Sidang Skripsi',
}

export interface Student {
  id: string;
  npm: string;
  name: string;
  title: string;
  prodi: string;
  pembimbing1: string;
  pembimbing2: string;
  penguji1: string;
  penguji2: string;
}

export interface SupervisorScore {
  [key: string]: number; // rubric item id -> score (1-5)
}

export interface ExaminerScore {
  sistematika: number; // 0-100
  isi: number;
  penyajian: number;
  tanyaJawab: number;
}

export interface BeritaAcara {
  date: string;
  time: string;
  events: string;
  notes: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  evaluatorRole: Role;
  examType: ExamType;
  supervisorScores?: SupervisorScore;
  examinerScores?: ExaminerScore;
  beritaAcara?: BeritaAcara;
  totalScore: number; // Calculated final score for this specific evaluator (0-100)
  timestamp: number;
}