# AlumniTrace - Sistem Pelacakan Alumni Otomatis (Daily Project 3)

Sistem ini adalah prototipe dari proses pelacakan alumni secara otomatis menggunakan algoritma pencarian dari sumber publik (OSINT), berdasarkan rancangan arsitektur dan pseudocode pada **Modul 2**. Dibangun dengan **Next.js 15 (App Router)**, TailwindCSS murni untuk UI premium (Award-Winning Design), dan TypeScript.

## Tautan Akses Aplikasi & Source Code

Sesuai dengan instruksi tugas akhir Daily Project 3 (Produk Web):

- **Link Publish Web (Vercel)**: [https://alumtrak.vercel.app](https://alumtrak.vercel.app)
- **Link Github Source Code**: [https://github.com/SaKaSe2/AlumTrak](https://github.com/SaKaSe2/AlumTrak)

*(Catatan: Proyek ini dibangun sebagai aplikasi berbasis Web responsif yang dapat diakses di Desktop maupun Mobile Browser. Oleh karena itu, tidak ada terbitan APK standalone untuk versi Mobile).*

---

## Pengujian Aplikasi (Berdasarkan Aspek Kualitas Modul 2)

Sesuai yang ditetapkan dalam desain pada Daily Project 2, berikut adalah hasil uji aplikasi berdasarkan standar kualitas ISO 25010:

| ID | Aspek Kualitas (ISO 25010) | Skenario Pengujian | Kriteria Keberhasilan | Status & Hasil Pengujian |
|--- | -------------------------- | ------------------ | --------------------- | ------------------------ |
| 1  | **Functional Suitability** | Mengklik tombol eksekusi "Jalankan Pelacakan" pada OSINT Engine di halaman Tracking. | Sistem menjalankan algoritma simulasi pencarian multi-sumber dan merubah status di tabel sesuai *Confidence Score*. | **LULUS**. Algoritma berjalan dan mencetak log proses ke *console* UI secara real-time. |
| 2  | **Functional Suitability** | Memeriksa modul "Jejak Bukti OSINT" (Langkah 10 Modul 2) setelah pelacakan selesai. | Sistem menampilkan audit trail ekstraksi lengkap meliputi sumber temuan, jabatan, dan instansi. | **LULUS**. Jejak bukti tersimpan beserta skor validitasnya. |
| 3  | **Usability (Learnability)**| Navigasi halaman melalui Sidebar (*Single Page Application* navigation) dan penggunaan Modal. | Transisi halaman instan tanpa parameter *loading* (reload), animasi pergantian mulus, dan visual cues jelas. | **LULUS**. UI sangat responsif dan mudah dipahami oleh pengguna. |
| 4  | **Performance Efficiency** | Memuat aplikasi (*cold start*) dari *landing page* dan mengakses filter tabel daftar alumni. | Waktu respon render UI (DOM) di bawah 200ms, mulus tanpa *layout shift*. | **LULUS**. Aplikasi dirender secara statis dan sangat cepat berkat Next.js. |
| 5  | **Security (Data Privacy)**| Eksekusi pencarian pada alumni yang memilih pengaturan privasi "Opt-Out (Private)". | Sistem secara sadar melewati profil alumni ini, tidak melanjutkan pencarian, dan melabeli dengan status 'Opt-Out'. | **LULUS**. Sistem menghormati opsi *opt-out* privasi pengguna. |
| 6  | **Reliability**            | Scraping dengan kondisi data pendukung tidak memadai (misal: skor ambang batas tidak tercapai). | *Graceful fallback*: Sistem memberikan status "Belum Ditemukan" atau "Perlu Verifikasi" tanpa mengalami resesi fatal (crash). | **LULUS**. Penanganan ketidakpastian data tertangani dengan baik. |
| 7  | **Cross-Validation**       | Menyimulasikan pelacakan multi-sumber independen (misal: LinkedIn + Google Scholar). | Terdapat peningkatan margin skor hingga faktor 1.20x jika data konsisten. | **LULUS**. Logika bobot validasi silang (algoritma *scoring*) terbukti berjalan normal. |

---

## Panduan Instalasi Lokal

```bash
# 1. Kloning Repositori
git clone https://github.com/SaKaSe2/AlumTrak.git
cd AlumTrak (atau Folder alumni-tracker)

# 2. Pasang dependensi
npm install

# 3. Jalankan server pengembangan lokal
npm run dev
# Buka http://localhost:3000
```