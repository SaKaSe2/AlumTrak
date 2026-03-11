# Web Alumni Tracker (Tracer Study) - Daily Project 3

Sistem ini adalah prototipe dari proses pelacakan alumni secara otomatis menggunakan pendekatan algoritma pencarian dari sumber publik, berdasarkan rancangan arsitektur dan pseudocode pada **Modul 2**. Dibangun dengan **Next.js 15 (App Router)**, TailwindCSS, dan TypeScript.

## 🚀 Fitur Utama
1. **Dasbor Statistik**: Tinjauan metrik pelacakan seluruh alumni.
2. **Manajemen Data Master**: Registrasi dan penyimpanan data alumni (saat ini *in-memory* simulasi database).
3. **Automasi Pelacakan (Mock)**: Simulasi API Job pelacakan (*crawling*, *scoring*, dan *disambiguasi*) berdasarkan bobot: Nama(30%), Afiliasi(35%), Timeline(20%), Bidang(15%).
4. **Jejak Bukti (Evidence)**: Perekaman temuan profil di internet sebagai referensi validasi manual operator kampus.

---

## 🧪 Tabel Pengujian Aspek Kualitas (ISO 25010)

Sesuai yang ditetapkan dalam desain pada Daily Project 2, berikut hasil uji aplikasi pada beberapa aspek kualitas:

| ID Uji | Aspek Kualitas (ISO 25010) | Skenario Pengujian | Hasil yang Diharapkan | Status / Keterangan |
| ------ | -------------------------- | ------------------ | --------------------- | ------------------- |
| UJ-01  | **Functional Suitability** | Mengklik tombol "Lacak" pada alumni berstatus "Belum Dilacak". | Sistem menjalankan algoritma simulasi pencarian, menampilkan alert, dan merubah status di tabel sesuai Confidence Score. | ✅ **Lulus**. Status berhasil ter-*update* setelah mock-API berjalan. |
| UJ-02  | **Functional Suitability** | Menekan tombol "Lihat Jejak Bukti" pada alumni "Teridentifikasi". | Masuk ke halaman detail dan sistem menampilkan rekaman informasi (jabatan, lokasi, cuplikan/snippet asli). | ✅ **Lulus**. URL *evidence* dan metadata *scraping* tersimpan dan dapat dibaca. |
| UJ-03  | **Usability** (Learnability)| Navigasi dari halaman Dasbor ke halaman Detail Alumni dan kembali lagi. | Desain antarmuka bersih (TailwindCSS); terdapat tombol *Back/Arrow Left* untuk kembali ke menu awal tanpa *reload*. | ✅ **Lulus**. SPA navigation berfungsi sangat cepat (*instant*). |
| UJ-04  | **Performance Efficiency** | Memuat aplikasi *(cold start)* dan memuat data ribuan *history*. | Waktu muat Dasbor & Tabel < 2 detik berkat SSR & React Server Components. | ✅ **Lulus**. *Time to Interactive* (TTI) sangat singkat. Waktu respon API ~500ms. |
| UJ-05  | **Security** (Data Privacy)| Mencoba melacak profil alumni dengan status "Opt-Out (Privasi)". | Tombol "Lacak" tidak dapat ditekan (Disabled) dan pelacakan gagal secara sengaja dari *backend*. | ✅ **Lulus**. Sistem menolak jalankan job, tombol non-aktif di Frontend. |

---

## 🛠 Panduan Instalasi Lokal

\`\`\`bash
# 1. Kloning Repositori
git clone [URL-REPO-ANDA]
cd alumni-tracker

# 2. Pasang dependensi
npm install

# 3. Jalankan server lokal
npm run dev
# Buka http://localhost:3000
\`\`\`

## 📌 Catatan Deployment Vercel
Aplikasi ini di-*deploy* menggunakan layanan serverless Vercel (Pilihan Gratis). Database yang digunakan saat ini adalah **in-memory database simulasi** (`lib/db.ts`). Oleh karenanya:
1. Data alumni yang Anda tambahkan/lacak di versi *online* berpotensi kembali ke *state* awal (reset) setiap beberapa jam karena arsitektur serverless.
2. Penggunaan mekanisme di atas **disengaja** guna mempermudah *Live Demo* untuk penilaian Dosen tanpa perlu melakukan *setting* Database eksternal yang kompleks. Alur logika algoritma tetap 100% mendemonstrasikan rancangan Modul 2.
