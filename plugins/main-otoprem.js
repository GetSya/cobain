import axios from 'axios';
import { delay } from 'baileys';

let handler = async (m, { conn, text, command, usedPrefix }) => {
    let nomor = m.sender.split('@')[0].split(':')[0]
    let who = nomor + '@s.whatsapp.net'
    
    // NOMINAL DASAR (Sebelum Pajak)
    let harganya = 2000; 
    
    // Memastikan user terdaftar di database global
    if (!global.db.data.users[who]) {
        global.db.data.users[who] = {
            name: await conn.getName(who) || 'Unknown',
            limit: 10,
            exp: 0,
            level: 0,
            register: false,
            premium: false,
            premiumTime: 0
        }
    }
    
    let user = global.db.data.users[who]

    // Validasi konfigurasi API
    if (!global.pakasir || !pakasir.slug || !pakasir.apikey) {
        return m.reply('❌ Konfigurasi `pakasir.slug` atau `pakasir.apikey` belum diisi di global settings.');
    }

    try {
        // 1. Membuat transaksi QRIS melalui API Pakasir
        const cqris = await createQris(pakasir.slug, pakasir.apikey, harganya);
        
        // 2. Menghitung Waktu Kadaluarsa QRIS
        const expiredAt = new Date(cqris.expired_at);
        expiredAt.setHours(expiredAt.getHours() - 1);
        expiredAt.setMinutes(expiredAt.getMinutes() + (global.pakasir.expired || 1));
        
        const expiredTime = expiredAt.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Jakarta',
        });

        // 3. Mengambil Total Pembayaran Akhir (Sudah termasuk pajak MDR 0.7% + Rp340)
        const totalHarusBayar = cqris.total_payment 

        const sQris = await conn.sendMessage(
            m.chat,
            {
                image: { url: `https://api.qrserver.com/v1/create-qr-code/?size=750x750&data=${encodeURIComponent(cqris.payment_number)}&qzone=4&format=gif&bgcolor=576A8F&color=FFF8DE` },
                caption:
                    `💳 *QRIS PREMIUM ${global.namebot || 'BOT'}*\n\n` +
                    `✨ *Benefit:* Premium 30 Hari\n` +
                    `🕓 *Expired:* ${expiredTime} WIB\n` +
                    `💸 *Biaya Admin:* Rp${cqris.fee.toLocaleString('id-ID')}\n` +
                    `💰 *TOTAL TAGIHAN:* Rp${totalHarusBayar.toLocaleString('id-ID')}\n` +
                    `📦 *Order ID:* #${cqris.order_id}\n\n` +
                    `*PENTING:* Silakan scan dan pastikan nominal yang muncul sama dengan *Total Tagihan* di atas agar sistem dapat mendeteksi pembayaran secara otomatis.`
            },
            { quoted: m }
        );

        // 4. Perulangan untuk mengecek status pembayaran secara real-time
        let status = '';
        while (status !== 'completed') {
            // Cek jika waktu sudah melebihi batas kadaluarsa
            if (new Date() >= expiredAt) {
                await conn.sendMessage(m.chat, { delete: sQris.key });
                return m.reply('⚠️ QRIS sudah *expired*, silakan buat ulang perintah .buyprem');
            }

            const res = await checkStatus(pakasir.slug, pakasir.apikey, cqris.order_id, harganya);
            
            if (res && res.status === 'completed') {
                status = 'completed';
                
                // --- LOGIKA UPDATE PREMIUM 30 HARI ---
                let hari = 30
                let ms = 86400000 * hari
                let now = Date.now()

                // Jika user masih punya sisa premium, maka durasi ditambah (stacking)
                if (user.premiumTime && user.premiumTime > now) {
                    user.premiumTime += ms
                } else {
                    user.premiumTime = now + ms
                }
                user.premium = true

                let tanggalBerakhir = new Date(user.premiumTime).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                })

                // Hapus pesan QRIS agar tidak discan ulang
                await conn.sendMessage(m.chat, { delete: sQris.key });
                
                let teksSuccess = `✅ *PEMBAYARAN BERHASIL*\n\n` +
                    `👤 *User:* @${who.split('@')[0]}\n` +
                    `⭐ *Status:* Premium Aktif\n` +
                    `🕒 *Durasi:* +${hari} Hari\n` +
                    `📅 *Berakhir:* ${tanggalBerakhir}\n\n` +
                    `Terima kasih sudah mendukung ${global.namebot || 'Bot'}! 🙏`

                await conn.sendMessage(m.chat, { text: teksSuccess, mentions: [who] }, { quoted: m })
                break;
            }
            
            // Jeda 5 detik sebelum cek status kembali
            await delay(5000);
        }

    } catch (e) {
        console.error(e);
        m.reply(`❌ Terjadi kesalahan: ${e.message}`);
    }
};

handler.help = ['buyprem'];
handler.tags = ['main'];
handler.command = /^(buyprem)$/i;
export default handler;

/**
 * Fungsi untuk membuat transaksi di API Pakasir
 */
async function createQris(project, apikey, amount) {
    try {
        const res = await axios.post(
            'https://app.pakasir.com/api/transactioncreate/qris',
            {
                project,
                order_id: (global.namebot || 'BOT').replace(/\s/g, '_') + '-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                amount,
                api_key: apikey,
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!res.data?.payment) throw new Error('Gagal mendapatkan data pembayaran dari API.');
        return res.data.payment;
    } catch (e) {
        throw new Error('Gagal membuat QRIS: ' + (e.response?.data?.message || e.message));
    }
}

/**
 * Fungsi untuk mengecek detail transaksi di API Pakasir
 */
async function checkStatus(project, apikey, orderId, amount) {
    try {
        const res = await axios.get(`https://app.pakasir.com/api/transactiondetail?project=${project}&amount=${amount}&order_id=${orderId}&api_key=${apikey}`);
        return res.data.transaction;
    } catch (e) {
        return null; // Mengembalikan null agar loop tetap berjalan saat ada gangguan jaringan sementara
    }
}