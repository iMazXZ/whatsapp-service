# WhatsApp Reset Password Service

Service Node.js untuk mengirim pesan reset password via WhatsApp menggunakan library Baileys.

## Requirements

- Node.js 18+ (disarankan 20 LTS)
- NPM atau Yarn
- Nomor WhatsApp untuk mengirim pesan

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/USERNAME/whatsapp-reset-service.git
cd whatsapp-reset-service
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

```bash
cp .env.example .env
nano .env
```

Isi dengan:
```env
PORT=3001
API_KEY=ganti-dengan-secret-key-aman
```

Generate API key yang aman:
```bash
openssl rand -hex 32
```

### 4. Buka Port Firewall

```bash
sudo ufw allow 3001
```

### 5. Jalankan Service

```bash
node index.js
```

### 6. Scan QR Code

Setelah service berjalan, akan muncul QR code di terminal.

1. Buka WhatsApp di HP
2. Menu (⋮) → Linked Devices → Link a Device
3. Scan QR code

### 7. Test API

```bash
# Cek status
curl http://localhost:3001/status \
  -H "x-api-key: YOUR_API_KEY"

# Kirim pesan test
curl -X POST http://localhost:3001/send-message \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"phone": "08123456789", "message": "Test pesan"}'
```

---

## Production Deployment dengan PM2

### Install PM2

```bash
npm install -g pm2
```

### Jalankan dengan PM2

```bash
pm2 start index.js --name whatsapp-service
pm2 save
pm2 startup
```

### Perintah PM2 Berguna

```bash
pm2 status              # Lihat status
pm2 logs whatsapp-service   # Lihat logs
pm2 restart whatsapp-service  # Restart
pm2 stop whatsapp-service     # Stop
```

---

## API Endpoints

### GET /health
Health check (tanpa autentikasi)

**Response:**
```json
{"status": "ok", "timestamp": "2024-01-01T00:00:00.000Z"}
```

### GET /status
Cek status koneksi WhatsApp

**Headers:** `x-api-key: YOUR_API_KEY`

**Response:**
```json
{"connected": true, "message": "WhatsApp terhubung"}
```

### POST /send-reset
Kirim pesan reset password

**Headers:** 
- `Content-Type: application/json`
- `x-api-key: YOUR_API_KEY`

**Body:**
```json
{
  "phone": "08123456789",
  "resetUrl": "https://example.com/reset/token123",
  "userName": "John Doe"
}
```

**Response:**
```json
{"success": true, "message": "Pesan berhasil dikirim"}
```

### POST /send-message
Kirim pesan custom

**Headers:** 
- `Content-Type: application/json`
- `x-api-key: YOUR_API_KEY`

**Body:**
```json
{
  "phone": "08123456789",
  "message": "Isi pesan"
}
```

---

## Format Nomor Telepon

Service ini otomatis menormalisasi berbagai format nomor:

| Input | Hasil |
|-------|-------|
| `085712345678` | `6285712345678` |
| `6285712345678` | `6285712345678` |
| `+6285712345678` | `6285712345678` |
| `0857-1234-5678` | `6285712345678` |

---

## Integrasi dengan Laravel

Tambahkan ke `.env` Laravel:

```env
WHATSAPP_SERVICE_URL=http://IP_VPS:3001
WHATSAPP_API_KEY=your-secret-api-key
WHATSAPP_ENABLED=true
```

---

## Troubleshooting

### QR Code tidak muncul
- Pastikan folder `auth_info` tidak ada atau kosongkan
- Restart service

### Koneksi terputus terus
- Cek koneksi internet VPS
- Pastikan tidak ada device WhatsApp lain yang logout

### Error "WhatsApp tidak terhubung"
- Scan ulang QR code
- Cek apakah nomor WhatsApp di-ban

---

## Security Notes

⚠️ **PENTING:**
- Jangan commit folder `auth_info/` ke Git (berisi session WhatsApp)
- Gunakan API key yang kuat dan simpan dengan aman
- Batasi akses firewall hanya dari IP Laravel server jika memungkinkan

---

## License

MIT
