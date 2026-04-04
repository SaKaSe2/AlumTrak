# Dokumen 02: Logika Mesin Pelacak OSINT (Open Source Intelligence)

## Deskripsi Operasional
Algoritma pelacak merupakan jantung dari sistem ini. Eksekusi pengumpulan jejak digital dikonfigurasi melalui integrasi antarmuka program aplikasi (API) eksternal dan sistem probabilitas peninjauan (Skor Disambiguasi).

## Mekanisme Ekstraksi Multi-Filter
Proses pencarian tidak dilakukan secara asal (Brute-Force), melainkan melalui tiga tingkat lapisan verifikasi:

1.  **Tahap 0: Verifikasi Pangkalan Data Primer (PDDikti)**
    *   Sistem melakukan panggilan komunikasi awal kepada _Server_ Kementerian Pendidikan melalui jalur `api/pddikti`.
    *   Jika alumni terdaftar secara resmi di entri basis data untuk Universitas Muhammadiyah Malang, maka status internal dinaikkan nilainya, dan skor validitas pelacakan mendapatkan penambahan bonus wajib sebesar `0.15`.
2.  **Tahap 1: Ekstraksi Data Kasar (GitHub REST API)**
    *   Bermuatan tujuan legalitas, sistem tidak merekayasa metode peretasan pada pelindung *CAPTCHA* atau WAF, melainkan menggunakan API Publik GitHub untuk memindai riwayat profesi atau kepemilikan tautan eksternal.
    *   Jika informasi seperti domisili atau jabatan terekspos terbuka ke internet, maka rincian akan dipindahkan ke basis data internal.
3.  **Tahap 2: Pembobotan Kepercayaan Algoritmik (Scoring System)**
    *   Nilai kepastian divalidasi terhadap persentase batas ambang (Threshold).
    *   Akurasi diukur dari kemiripan afiliasi: **>= 0.75** (Kemungkinan Kuat/Teridentifikasi), **>= 0.45** (Perlu Verifikasi/Ambigu), dan persentase sangat rendah untuk (Belum Ditemukan).

## Penanganan Batasan (Fallback Human-in-The-Loop)
Sistem menyediakan "Alat Bantuan Pencarian Manual" berupa pengarahan koneksi cepat ke lima platform siber utama (Google, LinkedIn, Facebook, Instagram, TikTok). Hal ini disiapkan secara cerdas sebagai antarmuka kompensasi jika target menerapkan pembatasan perisai hak privasi tingkat tinggi pada jejak digital miliknya.
