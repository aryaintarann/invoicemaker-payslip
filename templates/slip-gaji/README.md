# Template Slip Gaji

File: `templates/slip-gaji/template.xlsx` (sudah terpasang, sheet `Sheet1`).

Aplikasi mengisi cell berikut secara langsung berdasarkan koordinat (bukan named range), sesuai layout template Anda:

| Cell | Isi |
|---|---|
| `A3` (merge `A3:G3`) | Tanggal, format "Badung, {tanggal}" |
| `C5` | Nama Pegawai |
| `C6` | Jumlah Hari Kerja |
| `C9` | Gaji Pokok |
| `C10` | Transport + Makan (dihitung: rate per hari × jumlah hari kerja) |
| `C11` | Tambahan BPJS Tenagakerja |
| `C12` | Total Pendapatan (dihitung: Gaji Pokok + Transport&Makan + Biaya BPJS) |
| `C14` | Potongan BPJS Tenagakerjaan JHT |
| `C16` | Total Gaji (dihitung: Total Pendapatan − Potongan BPJS JHT) |
| `F17` (merge `F17:G17`) | Tanggal tanda tangan, sama seperti `A3` |
| `F21` (merge `F21:G21`) | Nama Pegawai (tanda tangan) |

Jika Anda mengganti template dengan layout baru, cell mapping di atas perlu disesuaikan langsung di `lib/excel.ts` (fungsi `fillPayslipTemplate`) — beri tahu saya posisi cell yang baru.
