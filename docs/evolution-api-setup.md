# Setup Notifikasi WhatsApp via Evolution API

Notifikasi invoice jatuh tempo (`/api/cron/notify-overdue`) sekarang mengirim
WhatsApp lewat [Evolution API](https://doc.evolution-api.com/), menggantikan
CallMeBot. Kode: `lib/whatsapp.ts`.

## 1. Siapkan Evolution API

1. Jalankan server Evolution API (self-host / VPS / Docker). Contoh cepat:
   ```bash
   docker run -d --name evolution-api -p 8080:8080 \
     -e AUTHENTICATION_API_KEY=ISI_KEY_RAHASIA \
     atendai/evolution-api:latest
   ```
2. Buat satu instance:
   ```bash
   curl -X POST https://evo.domainmu.com/instance/create \
     -H "apikey: ISI_KEY_RAHASIA" \
     -H "Content-Type: application/json" \
     -d '{"instanceName":"invoicemaker","integration":"WHATSAPP-BAILEYS"}'
   ```
3. Ambil QR dan scan pakai WhatsApp di HP sampai status `open`:
   ```bash
   curl https://evo.domainmu.com/instance/connect/invoicemaker -H "apikey: ISI_KEY_RAHASIA"
   ```

Catat: **base URL**, **apikey**, **nama instance**.

## 2. Environment variables

| Variabel | Isi |
|---|---|
| `EVOLUTION_API_URL` | Base URL instance, **tanpa** slash di akhir (`https://evo.domainmu.com`) |
| `EVOLUTION_API_KEY` | apikey global atau per-instance |
| `EVOLUTION_INSTANCE` | Nama instance (`invoicemaker`) |
| `EVOLUTION_TARGET_NUMBER` | Nomormu sendiri — kode negara, tanpa `+` / spasi (`62812xxxxxxx`) |
| `CRON_SECRET` | Secret yang dipakai scheduler sebagai `?secret=` |

Kalau salah satu dari 4 var Evolution kosong, cron cuma skip kirim (bukan error).

### Lokal
Isi di `.env.local` (lihat `.env.example`).

### Vercel
Project → Settings → Environment Variables → isi kelima var di atas →
**hapus** `CALLMEBOT_PHONE` & `CALLMEBOT_APIKEY` yang lama → redeploy.

## 3. Tes

```bash
curl "https://appmu.vercel.app/api/cron/notify-overdue?secret=CRON_SECRET"
```

Lokal: `npm run dev`, lalu buka
`http://localhost:3000/api/cron/notify-overdue?secret=...`

- Respons `{"checked":0,...}` = tidak ada invoice lewat jatuh tempo (normal).
- Ada invoice overdue → cek WhatsApp di `EVOLUTION_TARGET_NUMBER`.
- Gagal kirim → cek field `error` di respons JSON per invoice.

## Catatan

- Satu invoice dinotifikasi **maksimal sekali per hari kalender** (dicatat di
  tabel `invoice_followups`).
- Invoice berstatus `sent` yang lewat jatuh tempo otomatis jadi `overdue`.
- Pesan dikirim ke nomor admin sendiri, bukan ke klien.
