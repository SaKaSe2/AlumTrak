export type Bidang = "Akademik" | "Penelitian" | "IT" | "Teknik" | "Lainnya";

export interface DataAlumni {
  id: string;
  nama: string;
  prodi: string;
  bidang: Bidang;
  tahun_lulus: string;
  kota_asal: string;
  status_lacak: "Belum Dilacak" | "Teridentifikasi dari Sumber Publik" | "Perlu Verifikasi Manual" | "Belum Ditemukan di Sumber Publik" | "Opt-Out (Privasi)";
  tanggal_update: string;
  confidence_score: number;
}

export interface ProfilPencarian {
  id: string;
  alumniId: string;
  nama_lengkap: string;
  variasi_nama: string[];
  kata_kunci_afiliasi: string[];
  kata_kunci_konteks: string[];
  status_lacak: string;
  opt_out: boolean;
  flag_nama_umum?: boolean;
  bobot_afiliasi?: 'TINGGI' | 'NORMAL';
}

export type TipeSumber = "akademik" | "profesional" | "sosmed" | "teknis" | "umum";
export type MetodeSumber = "query_search" | "api" | "web_search" | "rss";

export interface SumberPencarian {
  nama: string;
  tipe: TipeSumber;
  endpoint: string;
  metode: MetodeSumber;
}

export interface SinyalIdentitas {
  nama_ditemukan?: string;
  afiliasi?: string;
  jabatan_role?: string;
  lokasi?: string;
  bidang_topik?: string;
  tahun_aktivitas?: string;
  url_profil: string;
  sumber: string;
  snippet_relevan: string;
  judul: string;
}

export interface KandidatSkor {
  sinyal: SinyalIdentitas;
  skor: number;
  kelompok: "Kemungkinan Kuat" | "Perlu Verifikasi" | "Tidak Cocok";
  flag_review?: boolean;
}

export interface BuktiPelacakan {
  alumni_id: string;
  sumber_temuan: string;
  ringkasan_info: {
    jabatan?: string;
    instansi?: string;
    lokasi?: string;
    bidang_topik?: string;
  };
  confidence_score: number;
  tanggal_ditemukan: string;
  bukti_pointer: {
    url: string;
    judul: string;
    snippet: string;
  };
  queries_dipakai: string[];
}
