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

## Catatan teknis: kenapa bukan ExcelJS biasa

Template ini punya kop surat berupa **text box** (bukan gambar) berisi alamat/telepon/email, terpisah dari logo (gambar). Library ExcelJS, saat baca lalu tulis ulang file (`readFile` → `writeBuffer`), tidak mendukung text box dan akan **menghilangkannya** — hanya gambar yang dipertahankan. Karena itu `lib/excel.ts` tidak memakai ExcelJS sama sekali untuk mengisi data; sebagai gantinya ia mengedit XML sheet (`xl/worksheets/sheet1.xml`) secara langsung lewat PizZip, cell per cell, sehingga bagian lain file (termasuk kop surat) tidak tersentuh sama sekali.
