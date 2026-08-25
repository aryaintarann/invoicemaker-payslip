# PRD — Aplikasi Invoice & Slip Gaji

## 1. Ringkasan
Web app pribadi untuk membuat invoice, follow-up invoice via email, dan membuat slip gaji. Template invoice menggunakan format Word (.docx), sedangkan template slip gaji menggunakan format Excel (.xlsx) — keduanya disediakan sendiri oleh pengguna.

## 2. Tujuan
- Mempercepat pembuatan invoice dan slip gaji tanpa edit manual di Excel setiap saat.
- Memastikan follow-up invoice yang belum dibayar tidak terlewat (otomatis via email).
- Menyimpan histori invoice dan slip gaji secara terpusat.

## 3. Target Pengguna
Pengguna tunggal (personal use) — tidak perlu multi-tenant atau role kompleks di versi awal.

## 4. Fitur Utama

### 4.1 Invoice
- Buat invoice baru: pilih client, isi item/jasa, jumlah, harga satuan, pajak (jika ada), tanggal jatuh tempo.
- Data diisi ke template Word (.docx) yang sudah disiapkan, lalu dikonversi ke PDF.
- Simpan invoice sebagai draft, atau langsung set status `sent`.
- Lihat daftar invoice dengan status: draft / sent / paid / overdue.
- Download invoice dalam format PDF.
- Edit/hapus invoice yang masih berstatus draft.
- Tandai invoice sebagai "paid" secara manual.

### 4.2 Follow-up Invoice
- Sistem otomatis mengecek invoice yang berstatus `sent` dan sudah melewati (atau mendekati) tanggal jatuh tempo.
- Kirim email reminder ke client terkait secara otomatis (cron harian).
- Simpan histori follow-up (tanggal terkirim, ke invoice mana) agar tidak dikirim dobel dalam satu hari.
- Opsi kirim follow-up manual (tombol "kirim reminder sekarang") di luar jadwal cron.

### 4.3 Slip Gaji
- Buat slip gaji per karyawan per periode (bulan/tahun).
- Input komponen gaji: gaji pokok, tunjangan, potongan (BPJS, pajak, dll), sesuai struktur di template Excel.
- Data diisi ke template Excel slip gaji, dikonversi ke PDF.
- Lihat & download histori slip gaji per karyawan/per periode.

### 4.4 Data Master
- Manajemen data client (nama, email, alamat, kontak).
- Manajemen data karyawan (nama, posisi, data gaji dasar).
- Upload/kelola template Excel (invoice & slip gaji) — minimal via file di server, tidak perlu UI upload di versi awal.

## 5. Alur Utama (User Flow)
1. **Buat Invoice** → isi form → sistem generate PDF dari template Excel → invoice tersimpan dengan status `sent` atau `draft`.
2. **Follow-up otomatis** → cron job harian cek invoice overdue/mendekati due date → kirim email reminder → catat di log follow-up.
3. **Buat Slip Gaji** → pilih karyawan & periode → isi/ambil data komponen gaji → generate PDF dari template Excel → tersimpan di histori.

## 6. Batasan (Out of Scope — versi awal)
- Tidak ada sistem pembayaran online (invoice tidak terintegrasi payment gateway).
- Tidak ada multi-user/role/permission.
- Tidak ada editor visual untuk mengubah template — perubahan template dilakukan langsung di file Excel.
- Tidak ada aplikasi mobile terpisah.

## 7. Metrik Keberhasilan (Personal Use)
- Waktu pembuatan invoice/slip gaji berkurang dibanding manual di Excel.
- Tidak ada invoice overdue yang terlewat tanpa reminder.
- Semua histori invoice & slip gaji tersimpan rapi dan bisa diakses ulang.

## 8. Teknologi (ringkas — detail di ARCHITECTURE.md)
Next.js, TanStack Query, Neon (Postgres), Drizzle ORM, docxtemplater (fill template Word untuk invoice), ExcelJS (fill template Excel untuk slip gaji), LibreOffice headless (convert ke PDF), Resend/Nodemailer (email), Cron (Vercel Cron atau alternatif di VPS).