const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'your-secret-api-key-here';

let sock = null;
let isConnected = false;

// Middleware: API Key Authentication
const authenticate = (req, res, next) => {
    const authHeader = req.headers['x-api-key'];
    if (!authHeader || authHeader !== API_KEY) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid API Key'
        });
    }
    next();
};

// Fungsi untuk memulai koneksi WhatsApp
async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['WhatsApp Service', 'Chrome', '120.0.0'],
    });

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n========================================');
            console.log('📱 SCAN QR CODE INI DENGAN WHATSAPP:');
            console.log('========================================\n');
            qrcode.generate(qr, { small: true });
            console.log('\n========================================');
            console.log('Buka WhatsApp > Menu > Linked Devices > Link a Device');
            console.log('========================================\n');
        }

        if (connection === 'close') {
            isConnected = false;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Koneksi terputus. Reconnect:', shouldReconnect);
            if (shouldReconnect) {
                setTimeout(startWhatsApp, 5000);
            }
        } else if (connection === 'open') {
            isConnected = true;
            console.log('✅ WhatsApp terhubung!');
        }
    });

    // Simpan credentials
    sock.ev.on('creds.update', saveCreds);
}

// API Endpoint: Health check (tanpa auth)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Endpoint: Cek status koneksi
app.get('/status', authenticate, (req, res) => {
    res.json({
        connected: isConnected,
        message: isConnected ? 'WhatsApp terhubung' : 'WhatsApp tidak terhubung'
    });
});

// API Endpoint: Kirim pesan reset password
app.post('/send-reset', authenticate, async (req, res) => {
    try {
        const { phone, resetUrl, userName } = req.body;

        if (!phone || !resetUrl) {
            return res.status(400).json({
                success: false,
                error: 'phone dan resetUrl wajib diisi'
            });
        }

        if (!isConnected) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp tidak terhubung'
            });
        }

        // Normalisasi nomor telepon
        let cleanPhone = phone.replace(/\D/g, '');

        // Jika mulai dengan 0, ganti dengan 62
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.substring(1);
        }

        // Format ke WhatsApp JID
        const formattedPhone = cleanPhone + '@s.whatsapp.net';

        // Pesan reset password
        const message = `🔐 *Reset Password - Lembaga Bahasa UM Metro*

Hai${userName ? ' ' + userName : ''},

Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda.

Klik tautan berikut untuk mengubah kata sandi:
${resetUrl}

⏰ Tautan ini berlaku selama 60 menit.

⚠️ Jika Anda tidak meminta reset password, abaikan pesan ini.

Terima kasih,
Lembaga Bahasa UM Metro`;

        await sock.sendMessage(formattedPhone, { text: message });

        console.log(`✅ Pesan reset terkirim ke ${cleanPhone}`);
        res.json({ success: true, message: 'Pesan berhasil dikirim' });

    } catch (error) {
        console.error('❌ Error kirim pesan:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API Endpoint: Kirim pesan custom (untuk testing)
app.post('/send-message', authenticate, async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                error: 'phone dan message wajib diisi'
            });
        }

        if (!isConnected) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp tidak terhubung'
            });
        }

        // Normalisasi nomor telepon
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.substring(1);
        }

        const formattedPhone = cleanPhone + '@s.whatsapp.net';
        await sock.sendMessage(formattedPhone, { text: message });

        console.log(`✅ Pesan terkirim ke ${cleanPhone}`);
        res.json({ success: true, message: 'Pesan berhasil dikirim' });

    } catch (error) {
        console.error('❌ Error kirim pesan:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp Service berjalan di port ${PORT}`);
    console.log(`📡 API tersedia di http://0.0.0.0:${PORT}`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);
    startWhatsApp();
});
