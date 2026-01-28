import { Student } from "./types";

// URL Logo Universitas Ibnu Sina (Source: PDDIKTI Kemdikbud)
export const LOGO_URL = "https://pddikti.kemdikbud.go.id/asset/data/images/logo-pt/101032.png";

// Helper to generate K3 students quickly
const k3Names = [
  "Naily Nur Suliana", "Lucy Normayna .N.", "Muhammad Ridho Alfikri", "Arif Sofyan", "Budi Rasuanto", 
  "Edi Nurikhsan", "Nanda Rizki", "Sastia Ariyanti", "Lailan Alfisyah", "Sabilla Azelna", 
  "Rakeenbolino", "M.Haiqal Eka Putra", "Desi Damayanti", "Alfiqri S. Ghandi", "Darna Febryanti", 
  "Defi Febriani", "Marlina", "Sari Indah Permata Hati", "Aymal Ramadani", "Farah Amanda Putri", 
  "Resta Oldie Aprillia Ngantung", "Clawdia Simatupang", "Shabrina", "Thalia Dame Marinez Simanungkalit", 
  "Wahyu Nur Fadilah", "Bernadus Steven Marselinus", "Mohammad Ihsan Harland Pratama", "Ananda Putri Maharani", 
  "Fauzan Syahputra", "Muhammad Haikal Rifkie Fachriza", "Taufik Qurrahman Saleh", "Muhammad Fayyadh", 
  "Cut Alifa Nur Rahmawati", "Ignasia Emiliana Bunga", "Afdhal Yoga Almaahi", "Friska Rahmawati", 
  "Alvira Sakinah", "Rizky Ramadhan", "Gabriel Vicktory Aritonang", "Nurul Shyafika", "Muhhamad Rossarions", 
  "Nanda Fauzan Azima", "Fathir Ramadhanie", "Sima Ananda Dila", "Lina Setia Ningsih", "Witara Manurung", 
  "Kiki Andriani", "Jilan Sheviolla", "Randy Afrelyus", "Ummu Zahrah Mutmainnah", "Andre Rivaldo", "Rio Alnet", 
  "M. Rizki Hidayatulloh", "Alya Angel", "Siti Yusmida Yanti Nababan", "Muhammad Putra Caesar Zellya", 
  "Putri Dayanara Anakami", "Muhammad Mufti Fadillah", "Amanda Desiana Fitry A", "Firman Rahmadi", 
  "Muhammad Zicko Faizurrahman", "Ryan Sadewa Aprimus Z", "Raja Daniel S M", "Ferdinan Roynaldo Oktaviano Sinaga", 
  "Muhammad Rohid Al Zikry", "Robertus Rizky Deardo Barus", "Rizki", "Rivaldi Christovel Lloyd Warow", 
  "Vira Maya Sari", "Nia Agustina Siregar", "Guntur Julianto Anjani", "Radila Aisya Sandra Rusma", 
  "Syarifah raisya naziha", "Muhammad Rangga Saputra", "Muhammad Umar", "Regina Sari", "Liana Ariska", 
  "Husnul Khotimah", "Abdullah Rahmadi", "Lailitha Wahyu Mumpuni", "Annastasia Jatayu Aventi", 
  "Faizal Fathurrahman Gibyo", "Hassen S Koernadi Lubis", "Dody Setyawan", "Alvin Syahputra", "Dina Yulianti", 
  "Elyana Natasya", "Aprical Yusman", "Oktavia Yuliana Sari", "David Richad San S", "Agustina Berliana Gultom", 
  "Hardi Saputra", "Risky Apriyanto", "Susi Indriyanti Irma", "Erlangga Perdana", "Radianto", 
  "Sumarhadi Dwi Kurniawan", "Endrian Bastiansyah", "Firman Hidayat", "Gendis Revita Salsabilla", 
  "Anggraini Dilla Rahmawati", "Antoline Wita Norita Komsary", "Tiara Cantika", "Thalia Putri", 
  "Syarifah aina", "Andi Nugroho", "Erika", "Oktaviani Nur Zarini", "Siti Mulya Ripah", "Muhammad Al Kharizsmi", 
  "Lutfin Wianda Nasandri", "Ilham Hadiid", "Amelina Adilla", "Ayu Dwi Elkusa", "Arfan Faisal", 
  "William Nathan Naibaho", "Heti Sintia", "Yodita Dwi Larasti", "Muhammad Syukri", "Fadhli Maulana", 
  "Marisina Butar Butar", "Arindha", "Yuliana", "Jhon Roy Lumban Batu", "Kevin Albandas Stela", 
  "Mohd Rafie Hadianza Agusta", "Yufka Ihsandhika Mahendra", "Alfred Cornelius Laia", 
  "Henrick Jaya Parsaoran Silalahi", "Ady Putra", "Muhamad Rizki Darmawan", "Farhan Septian Dwi Syahputra", 
  "M. Saputra Maulana Gumilang", "Dina Try Muliyawaty", "Arista Melinda Rizalia Putri", "Ridho Alif Visti", 
  "Riduan Sirait", "Ja'far Sodiq", "Dinda Ayu Lestari", "Muhammad Rezha", "Muhammad Galih Syahputra", 
  "Andre Rivaldo", "Eko Wardiyanto"
];

const k3Students: Student[] = k3Names.map((name, index) => ({
  id: `k3-${index + 1}`,
  npm: `K3-2025-${String(index + 1).padStart(3, '0')}`,
  name: name,
  title: "-",
  prodi: "K3",
  pembimbing1: "Dosen P1",
  pembimbing2: "Dosen P2",
  penguji1: "Dosen U1",
  penguji2: "Dosen U2"
}));

// Kesling Data from Images
const keslingNames = [
  { npm: '241013251042', name: 'Lamtiur Sinaga' },
  { npm: '241013251037', name: 'Riau Ningsih' },
  { npm: '241013251030', name: 'Wella Anzahni' },
  { npm: '241013251031', name: 'Sherly Rosaline Moniaga' },
  { npm: '241013251040', name: 'Juliana' },
  { npm: '241013251036', name: 'Vita Dianawati' },
  { npm: '221013251010', name: 'Riyansyah Amanda Pratama' },
  { npm: '221013251007', name: 'Aisyah Purma' },
  { npm: '221013251038', name: 'Syafendri' },
  { npm: '221013251021', name: 'Deanne Lathifa' },
  { npm: '221013251018', name: 'Nur Asyikin' },
  { npm: '221013251002', name: 'Putri Amelia' },
  { npm: '221013251027', name: 'Mohdhan Zyahrul' },
  { npm: '221013251008', name: 'M. Faihans Aliefpiyanda' },
  { npm: '221013251019', name: 'Reysa pranatasya' },
  { npm: '221013251003', name: 'M.Vargas Baraja Biantara' },
  { npm: '221013251016', name: 'Maria azmuliyansah' },
  { npm: '221013251035', name: 'Asylla Diva Faradila Munandar' },
  { npm: '221013251030', name: 'Nurul farra ain' },
  { npm: '221013251039', name: 'Intan Trianurfa' },
  { npm: '221013251023', name: 'Salwa Putri Amiza' },
  { npm: '221013251031', name: 'Yuni triana' },
  { npm: '221013251020', name: 'Hafidzul Akmal' },
  { npm: '221013251012', name: 'Erica gina olivia saing' },
  { npm: '221013251015', name: 'Diandra Khairunnisa' },
  { npm: '221013251025', name: 'Putri uly na\'mah' },
  { npm: '221013251033', name: 'Zahra Nur Annisa Apendi Putri' },
  { npm: '221013251022', name: 'M. Luthfi Hakka' },
  { npm: '191013251020', name: 'TANIA AFRIYANTIKA PRANINGSIH' },
  { npm: '201013251001', name: 'LISTA SETIA MARTA' },
  { npm: '201013251002', name: 'ULFA LAILATUL KHASANAH' },
  { npm: '201013251003', name: 'AZIL GHAFFARI' },
  { npm: '201013251017', name: 'MUHAMMAD HUMAM MAJID' },
  { npm: '201013251021', name: 'ADELIA MASRURI FAJAR ASRI M.' },
  { npm: '201013251026', name: 'ALMAIDA SARI' },
  { npm: '211013251002', name: 'ZA\'IM ALTOF' },
  { npm: '211013251022', name: 'GANDA SURYA' },
  { npm: '211013251026', name: 'M. FIKRI BIL KHAIRI' },
  { npm: '211013251037', name: 'SAMSUL MA\'RIF' },
  { npm: '231013251031', name: 'HERLINA' }
];

const keslingStudents: Student[] = keslingNames.map((s, idx) => ({
  id: `kl-${idx + 1}`,
  npm: s.npm,
  name: s.name,
  title: '-',
  prodi: 'Kesling',
  pembimbing1: 'Dosen P1',
  pembimbing2: 'Dosen P2',
  penguji1: 'Dosen U1',
  penguji2: 'Dosen U2'
}));

export const INITIAL_STUDENTS: Student[] = [...k3Students, ...keslingStudents];

export const SUPERVISOR_RUBRIC_ITEMS = [
  "Kedisiplinan",
  "Kesopanan",
  "Tanggung Jawab",
  "Pemahaman Permasalahan dan Konsep Penelitian",
  "Pemahaman Tujuan Penelitian",
  "Perencanaan Desain Penelitian dan Pemilihan Metode",
  "Pemahaman Instrumen Penelitian",
  "Pemahaman Teknik Pengambilan Data",
  "Pemahaman Metode Analisis Data",
  "Keterkaitan Referensi Permasalahan Penelitian",
  "Sistematika Penulisan",
  "Pemilihan Kata dan Bahasa",
  "Teknik Mengutip Referensi",
  "Kerapian",
  "Efektifitas Penggunaan Waktu",
  "Teknik Pembuatan Powerpoint & Multimedia",
  "Teknik Presentasi Dalam Penyajian",
  "Bahasa Tubuh Dalam Presentasi",
  "Layanan Terhadap Audiens",
  "Wawasan Umum diluar Topik"
];

export const EXAMINER_WEIGHTS = {
  sistematika: 0.20,
  isi: 0.30,
  penyajian: 0.20,
  tanyaJawab: 0.30,
};

export const FINAL_WEIGHTS = {
  pembimbing1: 0.35,
  pembimbing2: 0.25,
  penguji1: 0.20,
  penguji2: 0.20,
};