# Template Slip Gaji (.xlsx)

Taruh file template Excel Anda di folder ini dengan nama **`template.xlsx`**.

## Cara 1 (disarankan): Named Range

Di Excel, buat **Defined Name** (menu *Formulas > Name Manager > New*) pada sel yang ingin diisi otomatis, dengan nama persis seperti berikut:

| Nama (Defined Name) | Isi |
|---|---|
| `employee_name` | Nama karyawan |
| `position` | Posisi/jabatan |
| `period` | Periode (mis. `2026-08`) |
| `base_salary` | Gaji pokok (sudah diformat mata uang) |
| `total` | Total gaji bersih (sudah diformat mata uang) |
| `allowance_<key>` | Komponen tunjangan sesuai key yang diinput, mis. `allowance_transport`, `allowance_meal` |
| `deduction_<key>` | Komponen potongan sesuai key yang diinput, mis. `deduction_bpjs`, `deduction_tax` |

Key untuk `allowance_<key>` / `deduction_<key>` mengikuti nama field yang Anda isi di form "Buat Slip Gaji" (misalnya jika Anda menambahkan tunjangan dengan nama `transport`, maka named range yang harus dibuat adalah `allowance_transport`).

Jika sebuah nama tidak ditemukan di template, komponen tersebut akan dilewati (tidak error) — jadi template bisa dilengkapi bertahap.

## Cara 2 (fallback): Cell Map

Jika Anda tidak ingin memakai named range, buat file `templates/slip-gaji/cell-map.json` di folder ini berisi pemetaan nama ke koordinat sel pada sheet pertama, contoh:

```json
{
  "employee_name": "B3",
  "position": "B4",
  "period": "B5",
  "base_salary": "B7",
  "allowance_transport": "B8",
  "deduction_bpjs": "B12",
  "total": "B15"
}
```

Named range (Cara 1) selalu dicoba lebih dulu; `cell-map.json` hanya dipakai sebagai fallback untuk nama yang tidak ditemukan sebagai named range.
