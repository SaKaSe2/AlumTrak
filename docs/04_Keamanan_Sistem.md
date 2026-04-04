# Dokumen 04: Infrastruktur Keamanan Otorisasi

## Metodologi Proteksi Enkapsulasi
Arsitektur keamanan situs diisolasi dari ruang lingkup akses pengguna umum tidak beridentitas. Laporan rekayasa menunjukkan mekanisme sebagai berikut:

### 1. Titik Intersep (Middleware)
Lalu lintas pengguna dijaga secara konsisten melalui lapisan pelindung tingkat atas menggunakan sistem _Middleware_ turunan kerangka Next.js.
Apabila pengguna yang tidak memiliki token bukti mencoba melakukan pengikisan data atau memasuki laman kontrol utama `/` (Dasbor Utama), maka mesin server akan langsung menghadang koneksi dan melempar akses rute secara hierarkis ke batas perimeter terendah `/login` secara proaktif.

### 2. Validasi Kredensial Lingkungan (Environment Variables)
Teks identitas rahasia seperti konfigurasi otentikasi operator (Admin Authentication) dikeluarkan secara spesifik dari tubuh kerangka logika internal (Hard-coded removal).
Pengamanan kredensial dilegitimasi berbasis penyuntikan `process.env`.
Metologi ini menjanjikan kelulusan perisai anti-kebocoran agar pihak kolaborator peretas pihak luar tidak mampu melihat kata sandi otentikasi melalui *Git Repository Public* mana pun.

### 3. Perlindungan Jalur Pihak Ketiga (API Masking)
Panggilan perintah pencarian eksternal untuk PDDikti serta ekstraksi pelacak Github tidak diarahkan keluar langsung oleh peramban klien (*Client-side fetching*).
Sistem secara mutlak melimpahkan interaksi OSINT pada *Backend Edge Nodes (/api/*)* guna mencegah serangan CORS palsu dan memproteksi identitas jaringan sumber daya aslinya.
