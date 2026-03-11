import {
  DataAlumni,
  ProfilPencarian,
  SumberPencarian,
  SinyalIdentitas,
  KandidatSkor,
  BuktiPelacakan,
} from "../types";

// --- LANGKAH 1: Menyiapkan Profil Target Pencarian per Alumni ---
export function buatProfilPencarian(alumni: DataAlumni): ProfilPencarian {
  const variasiNama = generasiVariasiNama(alumni.nama);

  const profil: ProfilPencarian = {
    id: `PROF-${alumni.id}`,
    alumniId: alumni.id,
    nama_lengkap: alumni.nama,
    variasi_nama: variasiNama,
    kata_kunci_afiliasi: ["Universitas Muhammadiyah Malang", "UMM", "Informatika", alumni.prodi],
    kata_kunci_konteks: [alumni.bidang, alumni.tahun_lulus, alumni.kota_asal],
    status_lacak: alumni.status_lacak,
    opt_out: alumni.status_lacak === "Opt-Out (Privasi)",
  };

  // Jika opt-out, langsung kembalikan tanpa lanjut
  if (profil.opt_out) {
    profil.status_lacak = "Opt-Out (Privasi)";
    return profil;
  }

  // Jika nama umum, beri flag dan naikkan bobot afiliasi
  if (apakahNamaUmum(alumni.nama)) {
    profil.flag_nama_umum = true;
    profil.bobot_afiliasi = "TINGGI";
  }

  return profil;
}

// Contoh: "Muhammad Rizky" -> ["Muhammad Rizky", "M. Rizky", "Rizky M.", "Muh. Rizky"]
function generasiVariasiNama(namaLengkap: string): string[] {
  const parts = namaLengkap.split(" ");
  const variasi = [namaLengkap];
  if (parts.length > 1) {
    variasi.push(`${parts[0][0]}. ${parts.slice(1).join(" ")}`);
    variasi.push(`${parts.slice(1).join(" ")} ${parts[0][0]}.`);
    // Variasi "Muh." jika nama depan panjang
    if (parts[0].length > 3) {
      variasi.push(`${parts[0].substring(0, 3)}. ${parts.slice(1).join(" ")}`);
    }
  }
  return variasi;
}

function apakahNamaUmum(nama: string): boolean {
  const umum = ["Budi", "Agus", "Muhammad", "Siti", "Ahmad", "Putra", "Putri"];
  return umum.some((u) => nama.includes(u));
}

// --- LANGKAH 2: Menentukan Sumber dan Prioritas Pelacakan ---
// Sesuai PDF: 8 sumber (Google Scholar, ResearchGate, ORCID, LinkedIn, Instagram, Facebook, GitHub, Web Umum)
export function tentukanSumberPrioritas(profil: ProfilPencarian): SumberPencarian[] {
  const daftarSumber: SumberPencarian[] = [
    // Sumber akademik
    { nama: "Google Scholar", tipe: "akademik", endpoint: "scholar.google.com", metode: "query_search" },
    { nama: "ResearchGate", tipe: "akademik", endpoint: "researchgate.net", metode: "query_search" },
    { nama: "ORCID", tipe: "akademik", endpoint: "orcid.org/search", metode: "api" },
    // Sumber profesional
    { nama: "LinkedIn", tipe: "profesional", endpoint: "linkedin.com", metode: "web_search" },
    // Sumber media sosial
    { nama: "Instagram", tipe: "sosmed", endpoint: "instagram.com", metode: "web_search" },
    { nama: "Facebook", tipe: "sosmed", endpoint: "facebook.com", metode: "web_search" },
    // Sumber teknis
    { nama: "GitHub", tipe: "teknis", endpoint: "github.com", metode: "api" },
    // Web umum
    { nama: "Web Umum", tipe: "umum", endpoint: "google.com/search", metode: "query_search" },
  ];

  // Atur prioritas berdasarkan bidang alumni (sesuai PDF)
  if (["Akademik", "Penelitian"].includes(profil.kata_kunci_konteks[0])) {
    return prioritasSumber(daftarSumber, ["Google Scholar", "ORCID", "ResearchGate"]);
  } else if (["IT", "Teknik"].includes(profil.kata_kunci_konteks[0])) {
    return prioritasSumber(daftarSumber, ["LinkedIn", "GitHub", "Web Umum"]);
  } else {
    return prioritasSumber(daftarSumber, ["LinkedIn", "Web Umum", "Instagram"]);
  }
}

function prioritasSumber(daftar: SumberPencarian[], utama: string[]): SumberPencarian[] {
  const sorted = [...daftar].sort((a, b) => {
    const idxA = utama.indexOf(a.nama);
    const idxB = utama.indexOf(b.nama);
    // Sumber utama di depan, urut sesuai array prioritas
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });
  return sorted;
}

// --- LANGKAH 3: Menjalankan Job Pelacakan Berkala (Scheduler) ---
// Pilih alumni yang memenuhi kriteria pelacakan ulang
export function pilihAlumniUntukDilacak(daftarAlumni: DataAlumni[]): DataAlumni[] {
  const sekarang = new Date();
  const HARI_180 = 180 * 24 * 60 * 60 * 1000;

  return daftarAlumni.filter((alumni) => {
    if (alumni.status_lacak === "Opt-Out (Privasi)") return false;
    if (alumni.status_lacak === "Belum Dilacak") return true;
    if (alumni.confidence_score < 0.5) return true; // hasil belum meyakinkan
    const lastUpdate = new Date(alumni.tanggal_update).getTime();
    if (sekarang.getTime() - lastUpdate > HARI_180) return true; // perlu pembaruan
    return false;
  });
}

// --- LANGKAH 4: Menghasilkan Query Pencarian ---
// Sesuai PDF: variasi nama + site-specific + query khusus
export function generasiQueryPencarian(profil: ProfilPencarian): string[] {
  const queries: string[] = [];

  // Query dasar dengan variasi nama
  profil.variasi_nama.forEach((nama) => {
    queries.push(`${nama} Universitas Muhammadiyah Malang`);
    queries.push(`${nama} UMM ${profil.kata_kunci_afiliasi[3]}`); // prodi
    queries.push(`${nama} site:scholar.google.com`);
    queries.push(`${nama} site:researchgate.net`);
    queries.push(`${nama} site:linkedin.com`);
    queries.push(`${nama} ORCID`);
    queries.push(`${nama} ${profil.kata_kunci_konteks[0]}`); // bidang_kerja
    queries.push(`${nama} ${profil.kata_kunci_konteks[2]}`); // kota
  });

  // Query khusus sumber tertentu
  queries.push(`${profil.nama_lengkap} researcher Malang`);
  queries.push(`${profil.nama_lengkap} Software Engineer`);
  queries.push(`${profil.nama_lengkap} alumni UMM`);

  return queries;
}

// --- LANGKAH 5: Mengambil Hasil Pencarian dari Sumber Publik ---
// --- LANGKAH 6: Mengekstrak Sinyal Identitas dari Kandidat ---
// (Simulasi untuk prototipe, karena scraping nyata membutuhkan API Key)
export async function simulasiAmbilHasilDanEkstrakSinyal(
  queries: string[],
  sumber: SumberPencarian[],
  profil: ProfilPencarian
): Promise<SinyalIdentitas[]> {
  // Simulasi delay jaringan (menghormati rate limit / JedaAntiSpam)
  await new Promise((resolve) => setTimeout(resolve, 500));

  const isFoundAtAll = Math.random() > 0.2; // 80% chance ditemukan
  if (!isFoundAtAll) return [];

  const mainSource = sumber[0].nama;
  const mockSinyal: SinyalIdentitas = {
    nama_ditemukan: profil.nama_lengkap,
    afiliasi: "Tech Company Inc",
    jabatan_role: profil.kata_kunci_konteks[0] === "IT" ? "Software Engineer" : "Peneliti",
    lokasi: profil.kata_kunci_konteks[2],
    bidang_topik: profil.kata_kunci_konteks[0],
    tahun_aktivitas: new Date().getFullYear().toString(),
    url_profil: `https://${mainSource.toLowerCase().replace(/ /g, "")}.com/in/${profil.nama_lengkap.replace(/ /g, "").toLowerCase()}`,
    sumber: mainSource,
    snippet_relevan: `Profile: ${profil.nama_lengkap} is a professional working at Tech Company Inc since 2022.`,
    judul: `${profil.nama_lengkap} - ${mainSource}`,
  };

  // Kandidat ambigu dari sumber lain (simulasi disambiguasi)
  const ambiguousSinyal: SinyalIdentitas = {
    ...mockSinyal,
    nama_ditemukan: profil.variasi_nama[1] || profil.nama_lengkap,
    afiliasi: "Another University",
    sumber: sumber[1]?.nama || "Instagram",
    url_profil: `https://instagram.com/${profil.nama_lengkap.replace(/ /g, "").toLowerCase()}_2`,
    snippet_relevan: `Photos of ${profil.nama_lengkap} in Another University.`,
  };

  return Math.random() > 0.5 ? [mockSinyal, ambiguousSinyal] : [mockSinyal];
}

// --- LANGKAH 7: Disambiguasi (Membedakan Orang Bernama Sama) ---
// Bobot sesuai PDF: Nama(0.30), Afiliasi(0.35), Timeline(0.20), Bidang(0.15)
export function disambiguasi(sinyalList: SinyalIdentitas[], profil: ProfilPencarian): KandidatSkor[] {
  const hasil: KandidatSkor[] = [];

  sinyalList.forEach((sinyal) => {
    // Hitung kecocokan nama (bobot: 0.30)
    const skorNama = hitungKecocokanNama(sinyal.nama_ditemukan, profil.variasi_nama);
    // Hitung kecocokan afiliasi (bobot: 0.35)
    const skorAfiliasi = hitungKecocokanAfiliasi(sinyal.afiliasi, profil.kata_kunci_afiliasi);
    // Hitung kecocokan timeline (bobot: 0.20)
    const skorTimeline = hitungKecocokanTimeline(sinyal.tahun_aktivitas, profil.kata_kunci_konteks[1]);
    // Hitung kecocokan bidang (bobot: 0.15)
    const skorBidang = hitungKecocokanBidang(sinyal.bidang_topik, profil.kata_kunci_konteks[0]);

    const skor = (skorNama * 0.30) + (skorAfiliasi * 0.35) + (skorTimeline * 0.20) + (skorBidang * 0.15);

    // Klasifikasi sesuai PDF
    let kelompok: "Kemungkinan Kuat" | "Perlu Verifikasi" | "Tidak Cocok";
    if (skor >= 0.75) kelompok = "Kemungkinan Kuat";
    else if (skor >= 0.45) kelompok = "Perlu Verifikasi";
    else kelompok = "Tidak Cocok";

    hasil.push({ sinyal, skor, kelompok });
  });

  // Urutkan berdasarkan skor DESC
  return hasil.sort((a, b) => b.skor - a.skor);
}

function hitungKecocokanNama(namaDitemukan: string | undefined, variasiNama: string[]): number {
  if (!namaDitemukan) return 0;
  // Exact match terhadap salah satu variasi
  if (variasiNama.some((v) => v.toLowerCase() === namaDitemukan.toLowerCase())) return 1.0;
  // Partial match (mengandung nama depan)
  if (variasiNama.some((v) => namaDitemukan.toLowerCase().includes(v.split(" ")[0].toLowerCase()))) return 0.7;
  return 0.2;
}

function hitungKecocokanAfiliasi(afiliasi: string | undefined, kataKunciAfiliasi: string[]): number {
  if (!afiliasi) return 0;
  const matchCount = kataKunciAfiliasi.filter((k) => afiliasi.toLowerCase().includes(k.toLowerCase())).length;
  return Math.min(matchCount / 2, 1.0);
}

function hitungKecocokanTimeline(tahunAktivitas: string | undefined, tahunLulus: string): number {
  if (!tahunAktivitas) return 0.3;
  const diff = Math.abs(parseInt(tahunAktivitas) - parseInt(tahunLulus));
  if (diff <= 2) return 1.0;
  if (diff <= 5) return 0.7;
  return 0.4;
}

function hitungKecocokanBidang(bidangTopik: string | undefined, bidangAlumni: string): number {
  if (!bidangTopik) return 0.3;
  if (bidangTopik.toLowerCase() === bidangAlumni.toLowerCase()) return 1.0;
  return 0.3;
}

// --- LANGKAH 8: Menetapkan Status Alumni ---
// --- LANGKAH 9: Verifikasi Silang Antar Sumber (Cross-Validation) ---
// --- LANGKAH 10: Menyimpan Hasil sebagai Jejak Bukti ---
export async function jalankanPelacakanSatuAlumni(alumni: DataAlumni): Promise<BuktiPelacakan | null> {
  // Langkah 1: Buat profil pencarian
  const profil = buatProfilPencarian(alumni);
  if (profil.opt_out) return null;

  // Langkah 2: Tentukan sumber prioritas
  const sumber = tentukanSumberPrioritas(profil);

  // Langkah 4: Hasilkan query pencarian
  const queries = generasiQueryPencarian(profil);

  // Langkah 5 & 6: Ambil hasil dan ekstrak sinyal
  const sinyalList = await simulasiAmbilHasilDanEkstrakSinyal(queries, sumber, profil);
  if (sinyalList.length === 0) return null;

  // Langkah 7: Disambiguasi dan scoring
  const kandidat = disambiguasi(sinyalList, profil);
  const kandidatKuat = kandidat.filter((k) => k.kelompok === "Kemungkinan Kuat");
  const kandidatVerif = kandidat.filter((k) => k.kelompok === "Perlu Verifikasi");

  // Langkah 8: Tetapkan status
  let terbaik = kandidat[0];

  if (kandidatKuat.length > 0) {
    terbaik = kandidatKuat[0];
  } else if (kandidatVerif.length > 0) {
    terbaik = kandidatVerif[0];
  } else {
    return null; // Semua "Tidak Cocok"
  }

  // Langkah 9: Verifikasi silang (cross-validation)
  // Sesuai PDF: konfirmasi >= 2 -> skor * 1.2 (max 1.0), kontradiksi -> skor * 0.8
  const konfirmasiCount = Math.random() > 0.4 ? 2 : 1; // Simulasi cross-validation
  const kontradiksiCount = Math.random() > 0.8 ? 1 : 0;

  if (konfirmasiCount >= 2) {
    terbaik.skor = Math.min(terbaik.skor * 1.2, 1.0);
  }
  if (kontradiksiCount > 0) {
    terbaik.skor = terbaik.skor * 0.8;
    terbaik.flag_review = true;
  }

  // Langkah 10: Simpan jejak bukti
  const jejak: BuktiPelacakan = {
    alumni_id: alumni.id,
    sumber_temuan: terbaik.sinyal.sumber,
    ringkasan_info: {
      jabatan: terbaik.sinyal.jabatan_role,
      instansi: terbaik.sinyal.afiliasi,
      lokasi: terbaik.sinyal.lokasi,
      bidang_topik: terbaik.sinyal.bidang_topik,
    },
    confidence_score: terbaik.skor,
    tanggal_ditemukan: new Date().toISOString(),
    bukti_pointer: {
      url: terbaik.sinyal.url_profil,
      judul: terbaik.sinyal.judul,
      snippet: terbaik.sinyal.snippet_relevan,
    },
    queries_dipakai: queries,
  };

  return jejak;
}
