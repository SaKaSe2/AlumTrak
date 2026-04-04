import { DataAlumni, BuktiPelacakan } from "../types";

// In-memory mock database for deployment simplicity
let mockAlumniDB: Record<string, DataAlumni> = {
  "1": {
    id: "1",
    nama: "Muhammad Rizky",
    prodi: "Informatika",
    bidang: "IT",
    tahun_lulus: "2020",
    kota_asal: "Malang",
    status_lacak: "Belum Dilacak",
    tanggal_update: new Date().toISOString(),
    confidence_score: 0,
  },
  "2": {
    id: "2",
    nama: "Siti Aminah",
    prodi: "Biologi",
    bidang: "Penelitian",
    tahun_lulus: "2018",
    kota_asal: "Surabaya",
    status_lacak: "Belum Dilacak",
    tanggal_update: new Date().toISOString(),
    confidence_score: 0,
  },
  "3": {
    id: "3",
    nama: "Budi Santoso",
    prodi: "Manajemen",
    bidang: "Lainnya",
    tahun_lulus: "2021",
    kota_asal: "Jakarta",
    status_lacak: "Opt-Out (Privasi)",
    tanggal_update: new Date().toISOString(),
    confidence_score: 0,
  },
};

let mockTrackingHistoryDB: Record<string, BuktiPelacakan[]> = {};

export async function getAlumniList(): Promise<DataAlumni[]> {
  return Object.values(mockAlumniDB);
}

export async function getAlumniById(id: string): Promise<DataAlumni | null> {
  return mockAlumniDB[id] || null;
}

export async function updateAlumniStatus(
  id: string,
  updates: Partial<DataAlumni>
): Promise<DataAlumni> {
  if (!mockAlumniDB[id]) throw new Error("Alumni tidak ditemukan");
  
  mockAlumniDB[id] = {
    ...mockAlumniDB[id],
    ...updates,
    tanggal_update: new Date().toISOString(),
  };
  
  return mockAlumniDB[id];
}

export async function addAlumni(data: Omit<DataAlumni, "id" | "status_lacak" | "tanggal_update" | "confidence_score">): Promise<DataAlumni> {
  const newId = (Object.keys(mockAlumniDB).length + 1).toString();
  const newAlumni: DataAlumni = {
    ...data,
    id: newId,
    status_lacak: "Belum Dilacak",
    tanggal_update: new Date().toISOString(),
    confidence_score: 0
  };
  mockAlumniDB[newId] = newAlumni;
  return newAlumni;
}

// Database tracking history operations
export async function getTrackingHistory(alumniId: string): Promise<BuktiPelacakan[]> {
  return mockTrackingHistoryDB[alumniId] || [];
}

export async function saveTrackingEvidence(alumniId: string, bukti: BuktiPelacakan): Promise<void> {
  if (!mockTrackingHistoryDB[alumniId]) {
    mockTrackingHistoryDB[alumniId] = [];
  }
  mockTrackingHistoryDB[alumniId].push(bukti);
}
