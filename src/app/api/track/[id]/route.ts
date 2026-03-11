import { NextResponse } from "next/server";
import { getAlumniById, saveTrackingEvidence, updateAlumniStatus } from "@/lib/db";
import { jalankanPelacakanSatuAlumni } from "@/lib/tracking_logic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alumni = await getAlumniById(id);
    if (!alumni) return NextResponse.json({ error: "Alumni Not Found" }, { status: 404 });

    // Step 1 - 10 Logic (See lib/tracking_logic.ts)
    const result = await jalankanPelacakanSatuAlumni(alumni);

    if (result) {
      // Ditemukan
      await saveTrackingEvidence(alumni.id, result);

      let statusLacak = "Teridentifikasi dari Sumber Publik";
      if (result.confidence_score < 0.75) {
        statusLacak = "Perlu Verifikasi Manual";
      }

      const updated = await updateAlumniStatus(alumni.id, {
        status_lacak: statusLacak as any,
        confidence_score: result.confidence_score,
      });

      return NextResponse.json({ success: true, result, updatedAlumni: updated });
    } else {
      // Tidak Ditemukan atau Opt-Out
      const stat = alumni.status_lacak === "Opt-Out (Privasi)" ? "Opt-Out (Privasi)" : "Belum Ditemukan di Sumber Publik";
      const updated = await updateAlumniStatus(alumni.id, {
        status_lacak: stat as any,
      });
      return NextResponse.json({ success: true, result: null, updatedAlumni: updated });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed during tracking execution" }, { status: 500 });
  }
}
