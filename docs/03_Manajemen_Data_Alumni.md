# Dokumen 03: Manajemen Basis Data dan Penyimpanan Lulusan

## Penyimpanan Data (Persistence Layer)
Aplikasi didesain untuk menyimpan siklus data tanpa mengharuskan keberlangsungan sistem basis data berbasis relasional pada peladen jarak jauh. 
Fungsi ketahanan data dibangun di atas antarmuka `localStorage` penyimpanan klien pada penjelajah web HTML5 API. Algoritma melakukan *Auto-Sync* setiap kali sub-rutin diperbarui. Seluruh perubahan tabel tidak akan lenyap meskipun terjadi muat-ulang perangkat keras manual.

## Eksplorasi Korpus 142.000 Entri CSV
Sebuah modul rute API kustom pada `api/csv-search` disematkan guna menjawab kebutuhan impor data raksasa dalam waktu singkat:
- File disederhanakan dan dibaca oleh mesin pembaca modul pustaka Node.js `fs` dan `csv-parser`.
- Mekanisme penyaringan (*Filter / Find*) dibuat peka-pencocokan parsial berdasarkan pengetikan Karakter NIM dan Nama.
- Titik batas respons dikurasi maksimal sepuluh (*Limit 10*) demi memaksimalkan laju bit muatan (Bandwidth payload).

## Parameter Pelacakan Kontak dan Karir Purna
Sesuai rancangan tugas akhir pengumpulan informasi (Daily Project 4), delapan form isian spesifik diintegrasikan di dalam panel Inspeksi (*Data Collection Form*):
1.  Alamat Surat Elektronik (*Email*)
2.  Nomor Telepon Bergerak (*WhatsApp / HP*)
3.  Profil Karier Profesional (*LinkedIn*)
4.  Jejak Gaya Hidup Piktorial (*Instagram*)
5.  Pusat Jaringan Sosial Tradisional (*Facebook*)
6.  Distribusi Video Pendek (*TikTok*)
7.  Identitas Instansi Pengkaryaan (*Tempat Bekerja*)
8.  Spesifikasi Profesi Inti (*Jabatan*)

Siklus penambahan kelengkapan ini diverifikasi secara penuh sebagai instrumen pencatatan profil alumni valid.
