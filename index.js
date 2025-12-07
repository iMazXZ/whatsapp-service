require('dotenv').config();
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
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
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    next();
};

// Fungsi untuk memulai koneksi WhatsApp
async function startWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
        const { version } = await fetchLatestBaileysVersion();

        console.log('📱 Menggunakan WA Web version:', version);

        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'warn' }),
            browser: ['Lembaga Bahasa', 'Chrome', '120.0.0'],
            version,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 30000,
            emitOwnEvents: false,
            markOnlineOnConnect: false,
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            console.log('📊 Connection update:', connection || 'waiting...');

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
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                console.log('❌ Koneksi terputus. Status:', statusCode, 'Reconnect:', shouldReconnect);

                if (shouldReconnect) {
                    console.log('⏳ Mencoba reconnect dalam 10 detik...');
                    setTimeout(startWhatsApp, 10000);
                } else {
                    console.log('🔴 Logged out. Hapus auth_info dan restart untuk scan QR ulang.');
                }
            } else if (connection === 'open') {
                isConnected = true;
                console.log('✅ WhatsApp terhubung!');
            }
        });

        sock.ev.on('creds.update', saveCreds);

    } catch (error) {
        console.error('❌ Error starting WhatsApp:', error.message);
        console.log('⏳ Retry dalam 10 detik...');
        setTimeout(startWhatsApp, 10000);
    }
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
            return res.status(400).json({ success: false, error: 'phone dan resetUrl wajib diisi' });
        }

        if (!isConnected) {
            return res.status(503).json({ success: false, error: 'WhatsApp tidak terhubung' });
        }

        // Normalisasi nomor telepon
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.substring(1);
        }

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
        res.status(500).json({ success: false, error: error.message });
    }
});

// API Endpoint: Kirim OTP verifikasi nomor
app.post('/send-otp', authenticate, async (req, res) => {
    try {
        const { phone, otp, appName } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, error: 'phone dan otp wajib diisi' });
        }

        if (!isConnected) {
            return res.status(503).json({ success: false, error: 'WhatsApp tidak terhubung' });
        }

        // Normalisasi nomor telepon
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.substring(1);
        }

        const formattedPhone = cleanPhone + '@s.whatsapp.net';

        // Pesan OTP
        const message = `🔐 *Kode Verifikasi ${appName || 'Lembaga Bahasa'}*

Kode OTP Anda adalah:

*${otp}*

⏰ Kode ini berlaku selama 5 menit.

⚠️ Jangan bagikan kode ini kepada siapapun.`;

        await sock.sendMessage(formattedPhone, { text: message });

        console.log(`✅ OTP terkirim ke ${cleanPhone}`);
        res.json({ success: true, message: 'OTP berhasil dikirim' });

    } catch (error) {
        console.error('❌ Error kirim OTP:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API Endpoint: Kirim notifikasi status (EPT, Penerjemahan, dll)
app.post('/send-notification', authenticate, async (req, res) => {
    try {
        const { phone, type, userName, status, details, actionUrl } = req.body;

        if (!phone || !type || !status) {
            return res.status(400).json({ success: false, error: 'phone, type, dan status wajib diisi' });
        }

        if (!isConnected) {
            return res.status(503).json({ success: false, error: 'WhatsApp tidak terhubung' });
        }

        // Normalisasi nomor telepon
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.substring(1);
        }

        const formattedPhone = cleanPhone + '@s.whatsapp.net';

        // Generate message based on type
        let message = '';

        if (type === 'ept_status') {
            const statusEmoji = status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳';
            const statusText = status === 'approved' ? 'DISETUJUI' : status === 'rejected' ? 'DITOLAK' : 'MENUNGGU TINJAUAN';

            message = `📄 *Status Surat Rekomendasi EPT*
━━━━━━━━━━━━━━━━━━━━━

Yth. ${userName || 'Bapak/Ibu'},

Status pengajuan Surat Rekomendasi EPT Anda:
${statusEmoji} *${statusText}*

${details || ''}

${actionUrl ? `📱 Buka Dashboard:\n${actionUrl}` : ''}

Hormat kami,
*Admin Lembaga Bahasa UM Metro*`;

        } else if (type === 'penerjemahan_status') {
            let statusEmoji = '📌';
            if (status === 'Selesai') statusEmoji = '✅';
            else if (status.includes('Ditolak')) statusEmoji = '❌';
            else if (status === 'Diproses') statusEmoji = '⏳';

            message = `📝 *Status Penerjemahan Dokumen*
━━━━━━━━━━━━━━━━━━━━━

Halo ${userName || 'Bapak/Ibu'},

Status Penerjemahan Dokumen Abstrak Anda:
${statusEmoji} *${status}*

${details || ''}

${actionUrl ? `📱 Buka Dashboard:\n${actionUrl}` : ''}

Regards,
*Admin Lembaga Bahasa*`;

        } else {
            // Generic notification
            message = `📢 *Notifikasi*
━━━━━━━━━━━━━━━━━━━━━

Halo ${userName || 'Bapak/Ibu'},

${details || status}

${actionUrl ? `📱 Selengkapnya:\n${actionUrl}` : ''}`;
        }

        await sock.sendMessage(formattedPhone, { text: message });

        console.log(`✅ Notifikasi ${type} terkirim ke ${cleanPhone}`);
        res.json({ success: true, message: 'Notifikasi berhasil dikirim' });

    } catch (error) {
        console.error('❌ Error kirim notifikasi:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API Endpoint: Kirim pesan custom (untuk testing)
app.post('/send-message', authenticate, async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ success: false, error: 'phone dan message wajib diisi' });
        }

        if (!isConnected) {
            return res.status(503).json({ success: false, error: 'WhatsApp tidak terhubung' });
        }

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
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp Service berjalan di port ${PORT}`);
    console.log(`📡 API tersedia di http://0.0.0.0:${PORT}`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);
    startWhatsApp();
});
