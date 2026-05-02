// Test Grok API key — ambil dari environment variable, jangan hardcode di sini
const API_KEY = process.env.XAI_API_KEY || '';

async function testGrok() {
  console.log('Testing Grok API...');
  
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini-fast',
      messages: [
        { role: 'system', content: 'Kamu adalah asisten riset alumni universitas. Berikan output dalam format JSON.' },
        { role: 'user', content: 'Cari info profesional tentang Yuli Ika Yanti, alumni Informatika, Fakultas Teknik, Universitas Muhammadiyah Malang. Berikan dalam JSON: {"sosmed_linkedin":"","email":"","tempat_bekerja":"","posisi":"","jenis_pekerjaan":""}' }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  console.log('HTTP Status:', res.status);
  const json = await res.json();
  
  if (json.error) {
    console.error('API Error:', json.error);
  } else {
    console.log('Response:', json.choices?.[0]?.message?.content);
    console.log('Usage:', JSON.stringify(json.usage));
  }
}

testGrok().catch(e => console.error('Fatal:', e.message));
