import { NextRequest, NextResponse } from "next/server";

// Endpoint wrapper komunitas PDDikti (mirrors data resmi pddikti.kemdiktisaintek.go.id)
const PDDIKTI_BASE = "https://api-pddikti.rone.dev";

interface PddiktiMahasiswa {
  id: string;
  nama: string;
  nim: string;
  nama_pt: string;
  sinkatan_pt: string;
  nama_prodi: string;
}

interface PddiktiResponse {
  mahasiswa: PddiktiMahasiswa[];
}

export async function GET(request: NextRequest) {
  const keywordParam = request.nextUrl.searchParams.get("keyword") || request.nextUrl.searchParams.get("nama");
  if (!keywordParam) {
    return NextResponse.json(
      { error: "Parameter 'keyword' wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const keyword = encodeURIComponent(keywordParam);
    const res = await fetch(`${PDDIKTI_BASE}/search/mhs/${keyword}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000), // timeout 12 detik
    });

    if (!res.ok) {
      return NextResponse.json(
        { status_pddikti: "GAGAL", keterangan: `PDDikti HTTP ${res.status}` },
        { status: 200 }
      );
    }

    const data = await res.json();

    // API mengembalikan array langsung, bukan { mahasiswa: [...] }
    const allMhs: PddiktiMahasiswa[] = Array.isArray(data)
      ? data
      : (data.mahasiswa || []);

    // Filter hanya alumni UMM 
    const ummResults = allMhs.filter(
      (m) =>
        m.nama_pt?.toUpperCase().includes("MUHAMMADIYAH MALANG") ||
        m.sinkatan_pt?.toUpperCase() === "UMM"
    );

    return NextResponse.json({
      status_pddikti: ummResults.length > 0 ? "OK" : "TIDAK_DITEMUKAN",
      kandidat: ummResults.slice(0, 10), // Ambil top 10
      total_kandidat: ummResults.length,
      keterangan: ummResults.length === 0 ? "Tidak ada alumni UMM yang cocok." : ""
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status_pddikti: "GAGAL", keterangan: `Gagal akses PDDikti: ${message}` },
      { status: 200 }
    );
  }
}
