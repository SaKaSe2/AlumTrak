import { NextResponse } from 'next/server';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

const CSV_PATH = path.join(process.cwd(), 'src', 'data', 'alumni.csv');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword')?.toLowerCase() || '';

  if (!keyword || keyword.length < 3) {
    return NextResponse.json({ success: false, error: 'Keyword must be at least 3 characters' }, { status: 400 });
  }

  if (!fs.existsSync(CSV_PATH)) {
    return NextResponse.json({ success: false, error: 'Database CSV lokal tidak ditemukan!' }, { status: 500 });
  }

  try {
    const fileStream = fs.createReadStream(CSV_PATH, 'utf-8');
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    const results = [];
    let isHeader = true;

    for await (const line of rl) {
      if (isHeader) {
        isHeader = false;
        continue;
      }

      // Format: Nama Lulusan,NIM,Tahun Masuk,Tanggal Lulus,Fakultas,Program Studi
      const parts = line.split(',');
      if (parts.length >= 6) {
        const nama = (parts[0] || '').trim();
        const nim = (parts[1] || '').trim();
        
        if (nama.toLowerCase().includes(keyword) || nim.includes(keyword)) {
          results.push({
            nama: nama,
            nim: nim,
            tahun_masuk: (parts[2] || '').trim(),
            tanggal_lulus: (parts[3] || '').trim(),
            fakultas: (parts[4] || '').trim(),
            nama_prodi: (parts[5] || '').replace(/\\r$/, '').trim()
          });

          // Limit output to prevent massive payload
          if (results.length >= 15) {
            rl.close();
            break;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to process CSV search' }, { status: 500 });
  }
}
