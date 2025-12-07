# WhatsApp Reset Password Service

Service Node.js untuk mengirim pesan reset password via WhatsApp menggunakan library Baileys.

## Requirements

- Node.js 18+ (disarankan 20 LTS)
- NPM
- Nomor WhatsApp untuk mengirim pesan

---

## 🚀 Quick Start (VPS Baru)

### 1. Update System & Install Node.js

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Clone Repository

```bash
cd ~
git clone https://github.com/iMazXZ/whatsapp-service.git
cd whatsapp-service
npm install
```

### 3. Konfigurasi Environment

```bash
cp .env.example .env

# Generate API key
API_KEY=$(openssl rand -hex 32)
echo "Your API Key: $API_KEY"
sed -i "s/your-secret-api-key-here/$API_KEY/" .env
```

### 4. Buka Firewall

```bash
sudo ufw allow 22
sudo ufw allow 3001
sudo ufw enable
```

### 5. Jalankan & Scan QR

```bash
node index.js
```

Scan QR code dengan WhatsApp:
1. Buka WhatsApp di HP
2. Menu (⋮) → Linked Devices → Link a Device
3. Scan QR code di terminal

### 6. Setup PM2 (Production)

Setelah QR berhasil di-scan dan muncul "WhatsApp terhubung":

```bash
# Stop manual run (Ctrl+C), lalu:
pm2 start index.js --name whatsapp-service
pm2 save
pm2 startup
```

---

## 📡 API Endpoints

### GET /health
Health check (tanpa auth)

### GET /status
Cek status koneksi WhatsApp

**Header:** `x-api-key: YOUR_API_KEY`

### POST /send-reset
Kirim pesan reset password

**Header:** `x-api-key: YOUR_API_KEY`

**Body:**
```json
{
  "phone": "08123456789",
  "resetUrl": "https://example.com/reset/token",
  "userName": "Nama User"
}
```

### POST /send-message
Kirim pesan custom

**Header:** `x-api-key: YOUR_API_KEY`

**Body:**
```json
{
  "phone": "08123456789",
  "message": "Isi pesan"
}
```

---

## 🔧 PM2 Commands

```bash
pm2 status                    # Lihat status
pm2 logs whatsapp-service     # Lihat logs
pm2 restart whatsapp-service  # Restart
pm2 stop whatsapp-service     # Stop
```

---

## 📱 Format Nomor Telepon

Otomatis di-normalisasi:

| Input | Hasil |
|-------|-------|
| `085712345678` | `6285712345678` |
| `6285712345678` | `6285712345678` |
| `+6285712345678` | `6285712345678` |

---

## 🔗 Integrasi Laravel

Tambahkan ke `.env` Laravel:

```env
WHATSAPP_SERVICE_URL=http://IP_VPS:3001
WHATSAPP_API_KEY=your-api-key-here
WHATSAPP_ENABLED=true
```

---

## ⚠️ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| QR tidak muncul | `rm -rf auth_info` lalu restart |
| Koneksi terputus terus | Tunggu 10 detik, akan auto-reconnect |
| Logged out | Hapus `auth_info`, restart, scan QR ulang |

---

## 🔒 Security

- Jangan commit `auth_info/` ke Git
- Gunakan API key yang kuat
- Batasi akses firewall jika memungkinkan

---

## License

MIT
