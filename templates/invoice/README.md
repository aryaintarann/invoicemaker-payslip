# Template Invoice (.docx)

Taruh file template Word Anda di folder ini dengan nama **`template.docx`**.
Template harus berisi placeholder (tag) berikut agar bisa diisi otomatis oleh aplikasi.

## Placeholder scalar

| Tag | Isi |
|---|---|
| `{invoice_number}` | Nomor invoice |
| `{issue_date}` | Tanggal terbit (format: `25 Agustus 2026`) |
| `{due_date}` | Tanggal jatuh tempo |
| `{status}` | Status invoice (draft/sent/paid/overdue) |
| `{total}` | Total invoice (sudah diformat mata uang, mis. `Rp 1.500.000`) |
| `{client_name}` | Nama client |
| `{client_email}` | Email client |
| `{client_phone}` | Telepon client |
| `{client_address}` | Alamat client |

## Loop item (tabel)

Untuk daftar item/jasa, gunakan sintaks loop docxtemplater. Biasanya ini ditempatkan
di dalam satu baris tabel Word, supaya baris tersebut berulang otomatis sesuai jumlah item:

```
{#items} {description} | {qty} | {unit_price} | {subtotal} {/items}
```

Contoh di dalam tabel (1 baris template akan menjadi banyak baris hasil akhir):

| Deskripsi | Qty | Harga Satuan | Subtotal |
|---|---|---|---|
| `{#items}{description}` | `{qty}` | `{unit_price}` | `{subtotal}{/items}` |

Catatan:
- `{qty}` ditampilkan apa adanya (angka), sedangkan `{unit_price}` dan `{subtotal}` sudah diformat mata uang.
- Jika ada tag yang salah ketik, aplikasi akan menampilkan pesan error yang menyebutkan tag mana yang bermasalah saat proses "Download".
