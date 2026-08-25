# Template Invoice

Aplikasi memilih file template berdasarkan **entity**, **bahasa**, dan **jenis** invoice:

```
templates/invoice/{entity}/{language}/{kind}.docx
```

- `entity`: `cv` (dengan PPN/PPh, ada surat kop) atau `op` (individu, biasanya tanpa PPN/PPh, tanpa kop)
- `language`: `id` (Indonesia) atau `en` (Inggris)
- `kind`: file template yang ada di disk, hanya `dp` (Down Payment) atau `final`

## Jenis Pembayaran (4 pilihan di form) vs `kind` (file template)

Form invoice menawarkan 4 jenis pembayaran — **DP**, **Termin I**, **Termin II**, **Final** — tapi hanya ada 2 file template per entity/bahasa. DP, Termin I, dan Termin II semuanya adalah pembayaran parsial (belum lunas) dengan struktur cetak yang identik, jadi ketiganya dirender pakai file `dp.docx` yang sama; hanya `invoiceLabel`-nya yang beda ("DP (Down Payment)", "Termin I", "Termin II"). Hanya **Final** yang dirender pakai `final.docx`. Mapping ini ada di `templateKindFor()` (`lib/docx.ts`) — kalau suatu saat Termin I/II butuh layout Word sendiri, tambahkan file `templates/invoice/{entity}/{language}/termin1.docx` / `termin2.docx` dan ubah mapping tersebut agar tidak lagi jatuh ke `dp.docx`.

## Status saat ini

Semua 8 kombinasi aktif dan sudah diberi tag:

| File | Status |
|---|---|
| `cv/id/dp.docx` | ✅ Aktif |
| `cv/id/final.docx` | ✅ Aktif |
| `op/id/dp.docx` | ✅ Aktif |
| `op/id/final.docx` | ✅ Aktif |
| `cv/en/dp.docx` | ✅ Aktif |
| `cv/en/final.docx` | ✅ Aktif |
| `op/en/dp.docx` | ✅ Aktif |
| `op/en/final.docx` | ✅ Aktif |

## Pengecualian: PPN/PPh untuk OP + Final + Inggris

Berbeda dari kombinasi OP lainnya, template **`op/en/final.docx`** tetap menampilkan PPN/PPh (mengikuti isi asli template tersebut). Aplikasi mendeteksi ini otomatis lewat `lib/invoice-tax.ts` (`invoiceHasTax`) — form invoice akan menampilkan field PPN/PPh saat kombinasi Entity=OP + Jenis=Final + Bahasa=Inggris dipilih, dengan default PPN 12% (bukan 11% seperti CV) dan PPh 6%, sesuai isi template aslinya.

## Placeholder yang dipakai (tag docxtemplater)

Semua invoice, apapun entity-nya:

| Tag | Isi |
|---|---|
| `{issue_date}` | Tanggal invoice, diformat sesuai bahasa (id-ID / en-US); kota "Badung" tetap statis di template |
| `{client_name}` | Nama client |
| `{client_attn}` | Nama kontak person (opsional, hanya dipakai beberapa template DP) |
| `{invoice_label}` | Teks jenis tagihan, mis. "Final", "1st DP", "50% DP (Down Payment)" |
| `{project_name}` | Nama proyek |
| `{invoice_percent}` | Persen tagihan ini (angka, tanpa "%") |
| `{contract_value}` | Nilai kontrak (format ribuan, tanpa "Rp") |
| `{billed_amount}` | Jumlah tagihan invoice ini |
| `{remaining_amount}` | Sisa (hanya dipakai template `dp`, template `final` selalu tampilkan "-" statis) |
| `{total_billed}` | Total tagihan akhir (tanpa pajak = billed_amount; dengan pajak = billed + PPN - PPh) |
| `{terbilang}` | Total tagihan dalam kata, otomatis dalam Bahasa Indonesia atau Inggris sesuai `language` |
| `{invoice_number}` | Nomor invoice (tidak semua template menampilkan field ini) |

Hanya saat `invoiceHasTax()` bernilai true (entity `cv`, atau OP+Final+Inggris):

| Tag | Isi |
|---|---|
| `{ppn_percent}` | Persen PPN (default 11, atau 12 untuk kombinasi Final+Inggris) |
| `{pph_percent}` | Persen PPh (default 6, template menampilkan tanda minus sendiri) |
| `{ppn_amount}` | Nominal PPN |
| `{pph_amount}` | Nominal PPh |
| `{pph_deadline}` | Batas tanggal kirim bukti potong PPh |

Data pengirim (nama, no. rekening, bank, tanda tangan) bersifat **statis** di setiap file template — beda antara `cv` dan `op` — dan tidak diisi otomatis oleh aplikasi. Jika data itu berubah, edit langsung di file `.docx`-nya.
