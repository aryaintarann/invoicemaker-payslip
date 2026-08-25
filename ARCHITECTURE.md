# ARCHITECTURE.md — Aplikasi Invoice & Slip Gaji

## 1. Overview Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Frontend/Framework | Next.js (App Router) | Full-stack, render UI + API routes |
| Data fetching/state | TanStack Query | Caching & sinkronisasi data client-server |
| Database | Neon (Postgres, serverless) | Driver `@neondatabase/serverless` |
| ORM | Drizzle ORM | Type-safe, ringan, native support Neon |
| Template invoice | File `.docx` (disediakan user) | Diisi via docxtemplater saat runtime |
| Template slip gaji | File `.xlsx` (disediakan user) | Diisi via ExcelJS saat runtime |
| Fill Word | docxtemplater (+ pizzip) | Isi placeholder di .docx sesuai data, simpan file sementara |
| Fill Excel | ExcelJS | Isi cell sesuai data, simpan file sementara |
| Convert ke PDF | LibreOffice headless (`soffice --headless --convert-to pdf`) | Satu tool sama menangani konversi .docx maupun .xlsx → PDF; tetap butuh environment non-serverless |
| Kirim email | Resend (atau Nodemailer + SMTP) | Untuk follow-up invoice |
| Scheduler | Cron (di VPS) atau Vercel Cron (jika split deployment) | Cek invoice overdue harian |
| Hosting | VPS kecil (Hetzner/DigitalOcean) — direkomendasikan | LibreOffice tidak jalan di Vercel serverless |

## 2. Kenapa Bukan Full-Vercel

LibreOffice headless dibutuhkan untuk convert `.docx` maupun `.xlsx` → PDF dan tidak bisa dijalankan di Vercel serverless functions (butuh binary besar & proses long-running). Karena ini aplikasi personal, direkomendasikan deploy seluruh app (Next.js + LibreOffice) di satu VPS kecil menggunakan Docker, agar tidak perlu split infrastruktur.

Alternatif jika tetap ingin pakai Vercel untuk frontend: pisahkan endpoint generate-PDF ke service kecil terpisah (VPS/Fly.io/Railway) yang dipanggil via HTTP dari Next.js API route di Vercel.

## 3. Struktur Project

```
/app
  /invoices
    page.tsx              → list invoice
    [id]/page.tsx          → detail invoice
    new/page.tsx            → form buat invoice
  /payslips
    page.tsx
    [id]/page.tsx
    new/page.tsx
  /clients
  /employees
  /api
    /invoices
      route.ts                    → CRUD invoice
      [id]/generate/route.ts      → ExcelJS fill + convert PDF
      [id]/followup/route.ts      → kirim email manual
    /payslips
      route.ts
      [id]/generate/route.ts
    /cron
      followup-check/route.ts     → dipanggil scheduler harian
/templates
  /invoice/template.docx
  /slip-gaji/template.xlsx
/db
  schema.ts               → Drizzle schema
  index.ts                → koneksi Neon
/lib
  docx.ts                  → helper docxtemplater (fill template Word)
  excel.ts                → helper ExcelJS (fill template Excel)
  pdf.ts                   → helper convert docx/xlsx → pdf (LibreOffice)
  email.ts                 → helper kirim email (Resend)
```

## 4. Skema Database (Drizzle)

```
clients
  id, name, email, phone, address, created_at

employees
  id, name, position, base_salary, created_at

invoices
  id, client_id (FK), invoice_number, issue_date, due_date,
  status (draft | sent | paid | overdue), total, created_at

invoice_items
  id, invoice_id (FK), description, qty, unit_price, subtotal

invoice_followups
  id, invoice_id (FK), sent_at, method (auto | manual)

payslips
  id, employee_id (FK), period (e.g. "2026-08"), base_salary,
  allowances (jsonb), deductions (jsonb), total, created_at, pdf_path
```

## 5. Alur Teknis: Generate PDF dari Template

1. User submit form invoice/slip gaji → data masuk ke Postgres via Drizzle.
2. API route `/generate` dipanggil, alurnya beda tergantung jenis dokumen:

   **Invoice (Word)**
   - Load file template `.docx` dari `/templates/invoice`.
   - Isi placeholder (misal `{nama_client}`, `{total}`) pakai **docxtemplater**.
   - Simpan hasil isi sebagai file `.docx` sementara (misal di `/tmp`).
   - Jalankan `soffice --headless --convert-to pdf` terhadap file tsb via `child_process`.

   **Slip Gaji (Excel)**
   - Load file template `.xlsx` dari `/templates/slip-gaji`.
   - Isi cell sesuai mapping data (pakai ExcelJS, akses cell by koordinat atau named range).
   - Simpan hasil isi sebagai file `.xlsx` sementara.
   - Jalankan `soffice --headless --convert-to pdf` terhadap file tsb via `child_process`.

   - Simpan PDF hasil (misal ke storage lokal VPS, atau upload ke object storage seperti Cloudflare R2/S3 jika ingin lebih robust).
   - Return path/URL PDF ke frontend.
3. File sementara dibersihkan setelah proses selesai.

## 6. Alur Teknis: Follow-up Otomatis

1. Cron job jalan tiap hari (misal jam 9 pagi) memanggil endpoint `/api/cron/followup-check`.
2. Query invoice dengan `status = 'sent'` dan `due_date <= today` (atau mendekati, sesuai aturan bisnis, misal H-3).
3. Untuk tiap invoice yang lolos filter dan belum ada follow-up hari itu (cek tabel `invoice_followups`):
   - Kirim email reminder ke `client.email` via Resend, lampirkan PDF invoice jika perlu.
   - Insert record baru ke `invoice_followups`.
4. Endpoint ini diamankan dengan secret/token sederhana agar tidak bisa dipanggil sembarangan dari luar.

## 7. Keamanan (Personal Use — tetap minimal tapi perlu)

- Autentikasi sederhana (single-user): bisa pakai NextAuth dengan 1 akun, atau basic auth di level middleware Next.js.
- Endpoint cron dilindungi dengan header secret (`CRON_SECRET`) agar tidak bisa dipicu publik.
- File PDF hasil generate disimpan di lokasi yang tidak publicly accessible tanpa autentikasi.

## 8. Environment Variables (perkiraan)

```
DATABASE_URL=            # Neon connection string
RESEND_API_KEY=
CRON_SECRET=
AUTH_SECRET=
TEMPLATE_INVOICE_PATH=./templates/invoice/template.docx
TEMPLATE_SLIP_GAJI_PATH=./templates/slip-gaji/template.xlsx
```

## 9. Deployment (Ringkas)

1. Provision VPS kecil (misal 1-2GB RAM cukup untuk kebutuhan personal).
2. Install Docker, buat image berisi Node.js + LibreOffice.
3. Deploy Next.js app via Docker Compose (app + cron runner, misal pakai `node-cron` internal atau system cron memanggil endpoint).
4. Setup reverse proxy (Caddy/Nginx) + HTTPS (Let's Encrypt).
5. Hubungkan ke Neon (tidak perlu database lokal di VPS).