# Setup Gotenberg (konversi PDF)

Tombol **Download PDF** di halaman detail invoice & slip gaji memanggil
`/api/.../generate?format=pdf`, yang mengubah `.docx`/`.xlsx` hasil isi
template menjadi PDF lewat [Gotenberg](https://gotenberg.dev/) (route
LibreOffice). Kode: `lib/pdf.ts`. Tanpa `GOTENBERG_URL`, tombol PDF akan
memunculkan toast error dan download `.docx`/`.xlsx` tetap jalan.

Gotenberg **tidak butuh database/Redis** — jauh lebih ringan dari Evolution API.
Panduan ini menaruhnya di VPS yang sama dan diexpose lewat Cloudflare Tunnel
yang sudah ada (lihat `evolution-api-setup.md` langkah 3).

## 1. Jalankan Gotenberg

```bash
mkdir ~/gotenberg && cd ~/gotenberg
```

`~/gotenberg/docker-compose.yml`:

```yaml
services:
  gotenberg:
    container_name: gotenberg
    image: gotenberg/gotenberg:8
    restart: always
    ports:
      - "127.0.0.1:3010:3000"   # localhost saja; Cloudflare Tunnel yang expose
    command:
      - "gotenberg"
      - "--api-timeout=60s"
```

> Port host `3010` dipakai supaya tidak bentrok dengan service lain di `3000`.
> Port **dalam** container tetap `3000` (default Gotenberg).

```bash
docker compose up -d
curl http://localhost:3010/health    # {"status":"up"}
```

## 2. Tambah hostname di Cloudflare Tunnel

Edit `~/.cloudflared/config.yml`, tambahkan satu entry ingress **sebelum**
baris `service: http_status:404`:

```yaml
ingress:
  - hostname: evo.domainmu.com
    service: http://localhost:8080
  - hostname: gotenberg.domainmu.com
    service: http://localhost:3010
  - service: http_status:404
```

Daftarkan DNS dan restart:

```bash
cloudflared tunnel route dns evolution gotenberg.domainmu.com
sudo systemctl restart cloudflared
```

Tes dari luar:

```bash
curl https://gotenberg.domainmu.com/health
```

## 3. Set env di aplikasi

| Variabel | Isi |
|---|---|
| `GOTENBERG_URL` | `https://gotenberg.domainmu.com` (tanpa slash di akhir) |

- **Lokal:** tambahkan di `.env.local`.
- **Vercel:** Settings → Environment Variables → `GOTENBERG_URL` (Production) →
  redeploy.

## 4. Tes end-to-end

1. Buka detail sebuah invoice / slip gaji di web.
2. Klik **Download PDF**.
   - PDF ter-download → berhasil.
   - Toast `GOTENBERG_URL belum diatur` → env belum ke-set / belum redeploy.
   - Toast `Tidak bisa menghubungi service konversi PDF` → Gotenberg mati atau
     hostname tunnel salah. Cek `docker compose ps` dan `curl .../health`.

## Catatan

- Konversi bisa makan 5–30 detik (LibreOffice cold start). Route punya timeout
  55 detik; tombol menampilkan "Membuat PDF..." selama proses.
- Layout/tanda tangan/bank di PDF mengikuti template `.docx`/`.xlsx` apa adanya
  — Gotenberg hanya me-render, tidak mengubah isi.
- Gotenberg mengeksekusi LibreOffice; jangan expose port `3010` langsung ke
  internet, biarkan hanya lewat Cloudflare Tunnel.
