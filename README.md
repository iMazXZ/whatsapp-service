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

# Verifikasi
cat .env
```

### 4. Buka Firewall

**UFW (di VPS):**
```bash
sudo ufw allow 22
sudo ufw allow 3001
sudo ufw enable
```

**Alibaba Cloud Security Group:**
- Buka Console → Instance → Security Groups
- Add Inbound Rule: TCP, Port 3001, Source 0.0.0.0/0

### 5. Jalankan & Scan QR

```bash
node index.js
```

Scan QR code dengan WhatsApp:
1. Buka WhatsApp di HP
2. Menu (⋮) → Linked Devices → Link a Device
3. Scan QR code di terminal

### 6. Setup PM2 (Production)

Setelah WhatsApp terhubung, stop dengan Ctrl+C, lalu:

```bash
pm2 start index.js --name whatsapp-service
pm2 save
pm2 startup
```

---

## 📡 API Endpoints

**Base URL:** `http://IP_VPS:3001`

### GET /health
Health check (tanpa auth)

### GET /status
```bash
curl "http://IP:3001/status" -H "x-api-key: YOUR_KEY"
```

### POST /send-reset
```bash
curl -X POST "http://IP:3001/send-reset" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{"phone":"08123456789","resetUrl":"https://...","userName":"Nama"}'
```

### POST /send-message
```bash
curl -X POST "http://IP:3001/send-message" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{"phone":"08123456789","message":"Test"}'
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

## 📱 Format Nomor

Otomatis di-normalisasi: `085xxx` → `6285xxx`

---

## 🔗 Integrasi Laravel

```env
WHATSAPP_SERVICE_URL=http://IP_VPS:3001
WHATSAPP_API_KEY=your-api-key
WHATSAPP_ENABLED=true
```

---

## ⚠️ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| QR tidak muncul | `rm -rf auth_info && node index.js` |
| Koneksi terputus | Tunggu auto-reconnect 10 detik |
| Logged out | Hapus `auth_info`, restart, scan ulang |
| API Unauthorized | Cek API key di `.env`, restart PM2 |

---

## License

MIT
