# Setup Notifikasi WhatsApp via Evolution API

Notifikasi invoice jatuh tempo (`/api/cron/notify-overdue`) sekarang mengirim
WhatsApp lewat [Evolution API](https://doc.evolution-api.com/), menggantikan
CallMeBot. Kode: `lib/whatsapp.ts`.

Evolution API perlu jalan sebagai server sendiri (VPS/Linux). Panduan ini pakai
Docker Compose di VPS Ubuntu 22.04/24.04. Butuh VPS minimal 1 vCPU / 1 GB RAM
dan sebuah domain/subdomain yang diarahkan ke IP VPS.

## 1. Install Docker di VPS

SSH ke VPS, lalu pasang Docker Engine + plugin Compose (skrip resmi):

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # biar bisa jalan tanpa sudo
newgrp docker                   # aktifkan grup di sesi ini
docker --version
docker compose version
```

## 2. Jalankan Evolution API + Postgres + Redis

Evolution API v2 butuh Postgres dan Redis. **Tidak perlu install terpisah** —
kedua service ikut dijalankan oleh `docker-compose.yml` di bawah sebagai
container (data disimpan di volume `evolution_pgdata` / `evolution_redis`).

Buat folder kerja:

```bash
mkdir ~/evolution && cd ~/evolution
```

`~/evolution/docker-compose.yml`:

```yaml
services:
  evolution-api:
    container_name: evolution_api
    image: evoapicloud/evolution-api:v2.3.7   # image lama atendai/evolution-api sudah dipindah
    restart: always
    ports:
      - "127.0.0.1:8080:8080"   # cukup localhost; Cloudflare Tunnel yang expose ke publik
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
    volumes:
      - evolution_instances:/evolution/instances

  postgres:
    container_name: evolution_postgres
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: GANTI_PASSWORD_DB
      POSTGRES_DB: evolution
    volumes:
      - evolution_pgdata:/var/lib/postgresql/data

  redis:
    container_name: evolution_redis
    image: redis:7-alpine
    restart: always
    volumes:
      - evolution_redis:/data

volumes:
  evolution_instances:
  evolution_pgdata:
  evolution_redis:
```

`~/evolution/.env`:

```dotenv
SERVER_URL=https://evo.domainmu.com
SERVER_PORT=8080
AUTHENTICATION_API_KEY=GANTI_KEY_RAHASIA_PANJANG
LANGUAGE=en

DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://evolution:GANTI_PASSWORD_DB@postgres:5432/evolution?schema=public
DATABASE_CONNECTION_CLIENT_NAME=evolution
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=false
DATABASE_SAVE_MESSAGE_UPDATE=false
DATABASE_SAVE_DATA_CONTACTS=false
DATABASE_SAVE_DATA_CHATS=false

CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://redis:6379/6
CACHE_REDIS_PREFIX_KEY=evolution
CACHE_LOCAL_ENABLED=false
```

Nyalakan:

```bash
docker compose up -d
docker compose logs -f evolution-api   # cek tidak ada error, Ctrl+C untuk keluar
curl http://localhost:8080 -H "apikey: GANTI_KEY_RAHASIA_PANJANG"
```

## 3. Expose ke publik via Cloudflare Tunnel

Domain harus sudah dikelola di Cloudflare (nameserver-nya di Cloudflare).
Tidak perlu buka port 80/443 di VPS — tunnel yang keluar ke Cloudflare.

Install `cloudflared` di VPS:

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

Login & buat tunnel:

```bash
cloudflared tunnel login                       # buka URL yang muncul, pilih domain
cloudflared tunnel create evolution            # catat Tunnel ID / file kredensial di ~/.cloudflared/
cloudflared tunnel route dns evolution evo.domainmu.com
```

`~/.cloudflared/config.yml`:

```yaml
tunnel: evolution
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: evo.domainmu.com
    service: http://localhost:8080
  - service: http_status:404
```

Jalankan sebagai service:

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

Cek: `curl https://evo.domainmu.com -H "apikey: GANTI_KEY_RAHASIA_PANJANG"`
harus balas dari Evolution API (bukan error Cloudflare).

> `SERVER_URL` di `.env` (langkah 2) harus sama persis dengan
> `https://evo.domainmu.com`.

## 4. Buat instance WhatsApp

```bash
curl -X POST https://evo.domainmu.com/instance/create \
  -H "apikey: GANTI_KEY_RAHASIA_PANJANG" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"invoicemaker","integration":"WHATSAPP-BAILEYS"}'
```

Ambil QR lalu scan pakai WhatsApp di HP (Perangkat Tertaut) sampai status `open`:

```bash
curl https://evo.domainmu.com/instance/connect/invoicemaker \
  -H "apikey: GANTI_KEY_RAHASIA_PANJANG"
```

Respons berisi field `base64` — buka di browser (tempel sebagai
`data:image/png;base64,...` atau pakai dashboard di `https://evo.domainmu.com/manager`).

Cek status kapan saja:

```bash
curl https://evo.domainmu.com/instance/connectionState/invoicemaker \
  -H "apikey: GANTI_KEY_RAHASIA_PANJANG"
```

Catat untuk langkah berikutnya: **base URL** (`https://evo.domainmu.com`),
**apikey**, **nama instance** (`invoicemaker`).

## 5. Environment variables aplikasi

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

## 6. Tes

### 6a. Tes layer Evolution API langsung (paling cepat)

Kirim pesan manual, tidak perlu ada invoice:

```bash
curl -X POST https://evo.domainmu.com/message/sendText/invoicemaker \
  -H "apikey: EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"number":"62812xxxxxxx","text":"tes notif dari Evolution API"}'
```

- HP dapat pesan → Evolution API + instance + nomor sudah benar.
- `{"status":"ERROR",...}` / tidak sampai → cek `connectionState` instance
  (`open`?), apikey, dan format nomor (kode negara, tanpa `+`).

### 6b. Tes lewat endpoint aplikasi

```bash
curl "https://appmu.vercel.app/api/cron/notify-overdue?secret=CRON_SECRET"
```

Lokal: `npm run dev`, lalu buka
`http://localhost:3000/api/cron/notify-overdue?secret=...`

- Respons `{"checked":0,...}` = tidak ada invoice lewat jatuh tempo (normal).
- Ada invoice overdue → cek WhatsApp di `EVOLUTION_TARGET_NUMBER`,
  dan `results[].notified` harus `true`.
- Gagal kirim → cek field `error` di respons JSON per invoice.

**Bikin data uji:** lewat `npm run db:studio`, ambil satu invoice, set
`status` = `sent` dan `dueDate` ke tanggal kemarin. Panggil endpoint di atas.
Untuk mengetes ulang di hari yang sama, hapus baris invoice itu dari tabel
`invoice_followups` (notifikasi dibatasi 1x per hari).

## Catatan

- Satu invoice dinotifikasi **maksimal sekali per hari kalender** (dicatat di
  tabel `invoice_followups`).
- Invoice berstatus `sent` yang lewat jatuh tempo otomatis jadi `overdue`.
- Pesan dikirim ke nomor admin sendiri, bukan ke klien.
