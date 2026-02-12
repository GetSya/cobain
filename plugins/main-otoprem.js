import axios from 'axios';
import { delay } from 'baileys';

let handler = async (m, { conn, text, command, usedPrefix }) => {
    let nomor = m.sender.replace(/[^0-9]/g, '')
    let who = nomor + '@s.whatsapp.net'
    
    // NOMINAL ASLI (Misal kamu ingin user bayar 2000 pas)
    let harganya = 2000; 
    
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

    if (!global.pakasir || !pakasir.slug || !pakasir.apikey) return m.reply('`pakasir.slug` dan `pakasir.apikey` belum di isi.');

    // Membuat transaksi di Pakasir
    const cqris = await createQris(pakasir.slug, pakasir.apikey, harganya);
    
    // Menghitung Expired
    const expiredAt = new Date(cqris.expired_at);
    expiredAt.setHours(expiredAt.getHours() - 1);
    expiredAt.setMinutes(expiredAt.getMinutes() + (global.pakasir.expired || 1));
    
    const expiredTime = expiredAt.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
    });

    // PENTING: Gunakan cqris.total_payment sebagai angka mutlak yang harus dibayar user
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
                `*Note:* Pastikan nominal yang tertera saat scan sesuai dengan total di atas!`
        },
        { quoted: m }
    );

    let status = '';
    while (status !== 'completed') {
        if (new Date() >= expiredAt) {
            await conn.sendMessage(m.chat, { delete: sQris.key });
            return m.reply('⚠️ QRIS sudah *expired*, silakan buat ulang.');
        }

        // Cek status dengan harganya (nominal dasar)
        const res = await checkStatus(pakasir.slug, pakasir.apikey, cqris.order_id, harganya);
        if (res && res.status === 'completed') {
            status = 'completed';
            
            let hari = 30
            let ms = 86400000 * hari
            let now = Date.now()

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

            await conn.sendMessage(m.chat, { delete: sQris.key });
            
            let teksSuccess = `✅ *PEMBAYARAN BERHASIL*\n\n` +
                `👤 *User:* @${who.split('@')[0]}\n` +
                `⭐ *Status:* Premium Aktif (30 Hari)\n` +
                `📅 *Berakhir:* ${tanggalBerakhir}\n\n` +
                `Terima kasih sudah berlangganan 🙏`

            await conn.sendMessage(m.chat, { text: teksSuccess, mentions: [who] }, { quoted: m })
            break;
        }
        await delay(5000);
    }
};

handler.help = ['buyprem'];
handler.tags = ['main'];
handler.command = /^(buyprem)$/i;
export default handler;


// --- Fungsi createQris dan checkStatus tetap sama ---
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
        if (!res.data?.payment) throw new Error('Gagal membuat QRIS.');
        return res.data.payment;
    } catch (e) {
        throw new Error('Gagal membuat QRIS: ' + e.message);
    }
}

async function checkStatus(project, apikey, orderId, amount) {
    try {
        const res = await axios.get(`https://app.pakasir.com/api/transactiondetail?project=${project}&amount=${amount}&order_id=${orderId}&api_key=${apikey}`);
        return res.data.transaction;
    } catch (e) {
        throw new Error('Gagal mengecek status QRIS: ' + e.message);
    }
}