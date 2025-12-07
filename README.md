# WhatsApp Reset Password Service

Service Node.js untuk mengirim pesan reset password via WhatsApp menggunakan library Baileys.

**Production URL:** `https://wa-api.lembagabahasa.site`

---

## 🚀 Quick Start (VPS Baru)

### 1. Update System & Install Node.js

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Clone & Install

```bash
cd ~
git clone https://github.com/iMazXZ/whatsapp-service.git
cd whatsapp-service
npm install
```

### 3. Konfigurasi Environment

```bash
cp .env.example .env
API_KEY=$(openssl rand -hex 32)
echo "Your API Key: $API_KEY"
sed -i "s/your-secret-api-key-here/$API_KEY/" .env
```

### 4. Firewall (UFW)

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3001
sudo ufw enable
```

### 5. Jalankan & Scan QR

```bash
node index.js
```

Scan QR dengan WhatsApp → Menu → Linked Devices → Link a Device

### 6. Setup PM2

```bash
pm2 start index.js --name whatsapp-service
pm2 save
pm2 startup
```

---

## 🌐 Setup Nginx + SSL (Cloudflare)

### Install Nginx

```bash
sudo apt install nginx -y
```

### Buat Config

```bash
cat > /etc/nginx/sites-available/whatsapp-api << 'EOF'
server {
    listen 80;
    server_name wa-api.lembagabahasa.site;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

### Enable & Restart

```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Cloudflare DNS

1. Tambah A record: `wa-api` → IP VPS (Proxied 🟠)
2. SSL/TLS → Set ke **Flexible**

### Cloud Security Group

Buka port 80 & 443 di Security Group cloud provider.

---

## 📡 API Endpoints

**Base URL:** `https://wa-api.lembagabahasa.site`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | ❌ | Health check |
| `/status` | GET | ✅ | Status koneksi WA |
| `/send-reset` | POST | ✅ | Kirim reset password |
| `/send-message` | POST | ✅ | Kirim pesan custom |

**Header Auth:** `x-api-key: YOUR_KEY`

---

## 🔧 PM2 Commands

```bash
pm2 status                    # Status
pm2 logs whatsapp-service     # Logs
pm2 restart whatsapp-service  # Restart
```

---

## 📱 Ganti Nomor WhatsApp

Untuk logout dan scan QR dengan nomor WA baru:

```bash
pm2 stop whatsapp-service
rm -rf ~/whatsapp-service/auth_info
cd ~/whatsapp-service
node index.js
# Scan QR baru, tunggu "WhatsApp terhubung!"
# Ctrl+C, lalu:
pm2 start whatsapp-service
```

---

## ⚠️ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| QR tidak muncul | `rm -rf auth_info && node index.js` |
| API Unauthorized | Cek `.env`, restart PM2 |
| Error 521 | Cek Cloudflare SSL → Flexible |

---

## License

MIT
