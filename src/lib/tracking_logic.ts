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

  if (profil.opt_out) {
    profil.status_lacak = "Opt-Out (Privasi)";
    return profil;
  }

  if (apakahNamaUmum(alumni.nama)) {
    profil.flag_nama_umum = true;
    profil.bobot_afiliasi = "TINGGI";
  }

  return profil;
}

function generasiVariasiNama(namaLengkap: string): string[] {
  const parts = namaLengkap.split(" ");
  const variasi = [namaLengkap];
  if (parts.length > 1) {
    // e.g "Muhammad Rizky" -> "M. Rizky"
    variasi.push(`${parts[0][0]}. ${parts.slice(1).join(" ")}`);
    // "Rizky M."
    variasi.push(`${parts.slice(1).join(" ")} ${parts[0][0]}.`);
  }
  return variasi;
}

function apakahNamaUmum(nama: string): boolean {
  const umum = ["Budi", "Agus", "Muhammad", "Siti", "Ahmad", "Putra", "Putri", "-"];
  return umum.some((u) => nama.includes(u));
}

// --- LANGKAH 2: Menentukan Sumber dan Prioritas Pelacakan ---
export function tentukanSumberPrioritas(profil: ProfilPencarian): SumberPencarian[] {
  const sumberDasar: SumberPencarian[] = [
    { nama: "Google Scholar", tipe: "akademik", endpoint: "scholar.google.com", metode: "query_search" },
    { nama: "ResearchGate", tipe: "akademik", endpoint: "researchgate.net", metode: "query_search" },
    { nama: "LinkedIn", tipe: "profesional", endpoint: "linkedin.com", metode: "web_search" },
    { nama: "Instagram", tipe: "sosmed", endpoint: "instagram.com", metode: "web_search" },
    { nama: "GitHub", tipe: "teknis", endpoint: "github.com", metode: "api" },
  ];

  if (["Akademik", "Penelitian"].includes(profil.kata_kunci_konteks[0])) {
    return prioritasSumber(sumberDasar, ["Google Scholar", "ResearchGate", "LinkedIn"]);
  } else if (["IT", "Teknik"].includes(profil.kata_kunci_konteks[0])) {
    return prioritasSumber(sumberDasar, ["LinkedIn", "GitHub", "Instagram"]);
  } else {
    return prioritasSumber(sumberDasar, ["LinkedIn", "Instagram", "Google Scholar"]);
  }
}

function prioritasSumber(daftar: SumberPencarian[], utama: string[]): SumberPencarian[] {
  const sorted = [...daftar].sort((a, b) => {
    const aUtama = utama.includes(a.nama) ? 1 : 0;
    const bUtama = utama.includes(b.nama) ? 1 : 0;
    return bUtama - aUtama;
  });
  // Simplified for prototype: we just return top 3
  return sorted.slice(0, 3);
}

// --- LANGKAH 4: Menghasilkan Query Pencarian ---
export function generasiQueryPencarian(profil: ProfilPencarian): string[] {
  const queries: string[] = [];
  profil.variasi_nama.forEach((nama) => {
    queries.push(`${nama} Universitas Muhammadiyah Malang`);
    queries.push(`${nama} site:linkedin.com`);
    queries.push(`${nama} ${profil.kata_kunci_konteks[0]}`); // field
  });
  return queries;
}

// --- LANGKAH 5 & 6 (SIMULASI): Ambil Hasil & Ekstrak Sinyal ---
export async function simulasiAmbilHasilDanEkstrakSinyal(
  queries: string[],
  sumber: SumberPencarian[],
  profil: ProfilPencarian
): Promise<SinyalIdentitas[]> {
  // Simulates a tiny delay as if fetching from API
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate mock signals based on the profile
  const isFoundAtAll = Math.random() > 0.2; // 80% chance of being found somewhere
  if (!isFoundAtAll) return [];

  const mainSource = sumber[0].nama;
  const mockSinyal: SinyalIdentitas = {
    nama_ditemukan: profil.nama_lengkap,
    afiliasi: "Tech Company Inc", // Mock data
    jabatan_role: profil.kata_kunci_konteks[0] === "IT" ? "Software Engineer" : "Peneliti",
    lokasi: profil.kata_kunci_konteks[2], // Kota Asal
    bidang_topik: profil.kata_kunci_konteks[0],
    tahun_aktivitas: new Date().getFullYear().toString(),
    url_profil: `https://${mainSource.toLowerCase().replace(/ /g, "")}.com/in/${profil.nama_lengkap.replace(/ /g, "").toLowerCase()}`,
    sumber: mainSource,
    snippet_relevan: `Profile: ${profil.nama_lengkap} is a professional working at Tech Company Inc since 2022.`,
    judul: `${profil.nama_lengkap} - ${mainSource}`,
  };

  // Add a slight variance sometimes to simulate ambiguity
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

// --- LANGKAH 7: Disambiguasi dan Scoring ---
export function disambiguasi(sinyalList: SinyalIdentitas[], profil: ProfilPencarian): KandidatSkor[] {
  const hasil: KandidatSkor[] = [];

  sinyalList.forEach((sinyal) => {
    let skor = 0;
    // Mock algorithm weights
    const skorNama = sinyal.nama_ditemukan?.includes(profil.nama_lengkap.split(" ")[0]) ? 1.0 : 0.4;
    const skorAfiliasi = Math.random() > 0.5 ? 0.9 : 0.2; // Simulated matching logic
    const skorTimeline = 0.8; 
    const skorBidang = sinyal.bidang_topik === profil.kata_kunci_konteks[0] ? 1.0 : 0.3;

    skor = skorNama * 0.3 + skorAfiliasi * 0.35 + skorTimeline * 0.2 + skorBidang * 0.15;

    let kelompok: "Kemungkinan Kuat" | "Perlu Verifikasi" | "Tidak Cocok";
    if (skor >= 0.75) kelompok = "Kemungkinan Kuat";
    else if (skor >= 0.45) kelompok = "Perlu Verifikasi";
    else kelompok = "Tidak Cocok";

    hasil.push({ sinyal, skor, kelompok });
  });

  return hasil.sort((a, b) => b.skor - a.skor);
}

// --- LANGKAH 8, 9, 10 (SIMULASI): Job Tetapkan Status ---
export async function jalankanPelacakanSatuAlumni(alumni: DataAlumni): Promise<BuktiPelacakan | null> {
  const profil = buatProfilPencarian(alumni);
  if (profil.opt_out) return null;

  const sumber = tentukanSumberPrioritas(profil);
  const queries = generasiQueryPencarian(profil);
  const sinyalList = await simulasiAmbilHasilDanEkstrakSinyal(queries, sumber, profil);
  
  if (sinyalList.length === 0) return null; // Belum Ditemukan

  const kandidat = disambiguasi(sinyalList, profil);
  const kandidatKuat = kandidat.filter(k => k.kelompok === "Kemungkinan Kuat");
  const kandidatVerif = kandidat.filter(k => k.kelompok === "Perlu Verifikasi");

  let terbaik = kandidat[0];
  
  // Cross Validation Mock (Langkah 9)
  if (kandidatKuat.length > 0) {
     terbaik = kandidatKuat[0];
     // Simulate boosting score slightly for cross-validation success
     terbaik.skor = Math.min(terbaik.skor * 1.05, 1.0);
  } else if (kandidatVerif.length > 0) {
     terbaik = kandidatVerif[0];
  } else {
     return null;
  }

  // Langkah 10: Simpan Jejak
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
