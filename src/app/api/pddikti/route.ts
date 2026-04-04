import { NextRequest, NextResponse } from "next/server";
import PDDikti from "@x403/pddikti";

export async function GET(request: NextRequest) {
  const keywordParam = request.nextUrl.searchParams.get("keyword") || request.nextUrl.searchParams.get("nama");
  if (!keywordParam) {
    return NextResponse.json(
      { error: "Parameter 'keyword' wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const pddikti = new PDDikti({
      cacheEnabled: false,
    });

    const students = await pddikti.search.students({
      name: keywordParam,
    });

    if (!students || students.length === 0) {
      return NextResponse.json({
        status_pddikti: "TIDAK_DITEMUKAN",
        kandidat: [],
        total_kandidat: 0,
        keterangan: "Tidak ada alumni yang cocok."
      });
    }

    // Filter hanya alumni UMM 
    const ummResults = students.filter(
      (m: any) =>
        m.campusName?.toUpperCase().includes("MUHAMMADIYAH MALANG") ||
        m.campusShortName?.toUpperCase() === "UMM"
    ).map((m: any) => ({
        id: m.id,
        nama: m.name,
        nim: m.nim,
        nama_pt: m.campusName,
        sinkatan_pt: m.campusShortName || "",
        nama_prodi: m.programName,
    }));

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
