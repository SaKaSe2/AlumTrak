import { NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Struktur JSON output yang diminta dari Grok
interface GrokProfileResult {
  sosmed_linkedin?: string;
  sosmed_ig?: string;
  sosmed_fb?: string;
  sosmed_tiktok?: string;
  email?: string;
  no_hp?: string;
  tempat_bekerja?: string;
  alamat_bekerja?: string;
  posisi?: string;
  jenis_pekerjaan?: 'PNS' | 'Swasta' | 'Wirausaha' | '';
  sosmed_tempat_bekerja?: string;
  confidence_note?: string;
}

// Endpoint AI profiling menggunakan Grok (xAI)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nama = searchParams.get('nama');
  const prodi = searchParams.get('prodi') || '';
  const fakultas = searchParams.get('fakultas') || '';

  if (!nama) {
    return NextResponse.json({ success: false, error: 'Parameter nama wajib diisi' });
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'XAI_API_KEY belum dikonfigurasi' });
  }

  try {
    // Prompt yang dioptimalkan untuk profiling alumni
    const systemPrompt = `Kamu adalah asisten riset alumni universitas. Tugasmu mencari informasi profesional tentang alumni berdasarkan nama, program studi, dan fakultas mereka di Universitas Muhammadiyah Malang (UMM).

ATURAN:
- Hanya berikan data yang kamu yakin benar berdasarkan pengetahuanmu
- Jika tidak yakin, kosongkan field tersebut (string kosong "")
- Jangan mengarang data
- Format nomor HP Indonesia: 08xx atau +62xx
- Untuk jenis_pekerjaan, hanya isi: "PNS", "Swasta", atau "Wirausaha"
- Untuk sosmed, berikan URL lengkap jika ada

Berikan output dalam format JSON sesuai schema yang diminta.`;

    const userPrompt = `Cari informasi profesional tentang:
- Nama: ${nama}
- Program Studi: ${prodi}
- Fakultas: ${fakultas}
- Universitas: Universitas Muhammadiyah Malang (UMM)

Berikan informasi yang kamu ketahui dalam format JSON berikut:
{
  "sosmed_linkedin": "URL profil LinkedIn",
  "sosmed_ig": "URL profil Instagram", 
  "sosmed_fb": "URL profil Facebook",
  "sosmed_tiktok": "URL profil TikTok",
  "email": "alamat email",
  "no_hp": "nomor HP",
  "tempat_bekerja": "nama perusahaan/instansi tempat bekerja",
  "alamat_bekerja": "alamat kantor/tempat bekerja",
  "posisi": "jabatan/posisi saat ini",
  "jenis_pekerjaan": "PNS/Swasta/Wirausaha",
  "sosmed_tempat_bekerja": "URL sosmed/website tempat bekerja",
  "confidence_note": "catatan singkat tentang tingkat keyakinan data"
}`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini-fast',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1, // Rendah agar hasilnya konsisten dan faktual
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Grok] API error ${response.status}:`, errText);

      if (response.status === 429) {
        return NextResponse.json({ success: false, error: 'rate-limit', blocked: true }, { status: 429 });
      }
      if (response.status === 402) {
        return NextResponse.json({ success: false, error: 'insufficient-credits', blocked: true }, { status: 402 });
      }
      return NextResponse.json({ success: false, error: `Grok API error: ${response.status}` }, { status: response.status });
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ success: false, error: 'Grok tidak mengembalikan konten' });
    }

    // Parse JSON dari respons Grok
    let profileData: GrokProfileResult;
    try {
      profileData = JSON.parse(content);
    } catch {
      console.error('[Grok] Gagal parse JSON:', content);
      return NextResponse.json({ success: false, error: 'Gagal parse respons Grok' });
    }

    // Hitung berapa field yang terisi (untuk menentukan apakah "sukses")
    const fields = [
      profileData.sosmed_linkedin, profileData.sosmed_ig, profileData.sosmed_fb,
      profileData.sosmed_tiktok, profileData.email, profileData.no_hp,
      profileData.tempat_bekerja, profileData.alamat_bekerja, profileData.posisi,
      profileData.jenis_pekerjaan, profileData.sosmed_tempat_bekerja,
    ];
    const filledCount = fields.filter(f => f && f.trim() !== '').length;

    // Log usage token untuk monitoring biaya
    const usage = json.usage;
    if (usage) {
      console.log(`[Grok] ${nama}: ${filledCount} field terisi | Tokens: in=${usage.prompt_tokens} out=${usage.completion_tokens}`);
    }

    return NextResponse.json({
      success: filledCount > 0,
      data: profileData,
      filledCount,
      usage: usage ? { input: usage.prompt_tokens, output: usage.completion_tokens } : null,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Grok] Error:', message);
    return NextResponse.json({ success: false, error: `Grok gagal: ${message}` }, { status: 500 });
  }
}
