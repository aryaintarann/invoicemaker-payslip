# Template Invoice

Aplikasi memilih file template berdasarkan **entity**, **bahasa**, dan **jenis** invoice:

```
templates/invoice/{entity}/{language}/{kind}.docx
```

- `entity`: `cv` (dengan PPN/PPh, ada surat kop) atau `op` (individu, tanpa PPN/PPh, tanpa kop)
- `language`: `id` (Indonesia) atau `en` (Inggris)
- `kind`: `dp` (Down Payment) atau `final`

## Status saat ini

| File | Status |
|---|---|
| `cv/id/dp.docx` | ✅ Aktif — sudah diberi tag, siap pakai |
| `cv/id/final.docx` | ✅ Aktif — sudah diberi tag, siap pakai |
| `op/id/dp.docx` | ✅ Aktif — sudah diberi tag, siap pakai |
| `op/id/final.docx` | ✅ Aktif — sudah diberi tag, siap pakai |
| `cv/en/dp.doc` | ⏳ Belum aktif — masih format `.doc` lama |
| `cv/en/final.doc` | ⏳ Belum aktif — masih format `.doc` lama |
| `op/en/dp.doc` | ⏳ Belum aktif — masih format `.doc` lama |
| `op/en/final.doc` | ⏳ Belum aktif — masih format `.doc` lama |

**Untuk mengaktifkan versi Inggris:** buka tiap file `.doc` di folder `cv/en/` dan `op/en/` dengan Microsoft Word, lalu **Save As** dengan format **Word Document (.docx)**, replace nama file `.doc` menjadi `.docx` di folder yang sama (mis. `cv/en/dp.doc` → `cv/en/dp.docx`). Setelah itu beri tahu saya agar tag placeholder disisipkan ke file tersebut (sama seperti 4 file Indonesia).

## Placeholder yang dipakai (tag docxtemplater)

Semua invoice, apapun entity-nya:

| Tag | Isi |
|---|---|
| `{issue_date}` | Tanggal invoice (kota "Badung" tetap statis di template) |
| `{client_name}` | Nama client |
| `{client_attn}` | Nama kontak person (opsional, hanya dipakai template OP DP) |
| `{invoice_label}` | Teks jenis tagihan, mis. "Final", "1st DP", "50% DP (Down Payment)" |
| `{project_name}` | Nama proyek |
| `{invoice_percent}` | Persen tagihan ini (angka, tanpa "%") |
| `{contract_value}` | Nilai kontrak (format ribuan, tanpa "Rp") |
| `{billed_amount}` | Jumlah tagihan invoice ini |
| `{remaining_amount}` | Sisa (hanya dipakai template `dp`, template `final` selalu tampilkan "-" statis) |
| `{total_billed}` | Total tagihan akhir (untuk OP = billed_amount; untuk CV = billed + PPN - PPh) |
| `{terbilang}` | Total tagihan dalam kata (di-generate otomatis oleh app) |

Khusus entity `cv` saja:

| Tag | Isi |
|---|---|
| `{ppn_percent}` | Persen PPN (default 11) |
| `{pph_percent}` | Persen PPh (default 6, template menampilkan tanda minus sendiri) |
| `{ppn_amount}` | Nominal PPN |
| `{pph_amount}` | Nominal PPh |
| `{pph_deadline}` | Batas tanggal kirim bukti potong PPh |
| `{invoice_number}` | Nomor invoice (template OP tidak menampilkan nomor invoice sama sekali) |

Data pengirim (nama, no. rekening, bank, tanda tangan) bersifat **statis** di setiap file template — beda antara `cv` dan `op` — dan tidak diisi otomatis oleh aplikasi. Jika data itu berubah, edit langsung di file `.docx`-nya.
