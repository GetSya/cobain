import fs from 'fs'

let handler = async (m, { conn }) => {
    // 1. Tentukan target (siapa yang mau dicek)
    let who = m.isGroup 
        ? (m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : m.sender)) 
        : (m.quoted ? m.quoted.sender : m.sender)

    // 2. NORMALISASI JID (Menghapus :1, .0, dll agar cocok dengan database)
    // Contoh: 628xxx:1@s.whatsapp.net menjadi 628xxx@s.whatsapp.net
    let cleanJid = who.split('@')[0].split(':')[0].split('.')[0] + '@s.whatsapp.net'

    const uangPath = './json/uang.json'
    let saldo = 0

    if (fs.existsSync(uangPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(uangPath, 'utf-8'))
            
            // Cari saldo dengan JID yang sudah dibersihkan
            // Kita juga lakukan pengecekan fallback jika salah satu format gagal
            saldo = data[cleanJid] || data[who] || 0
        } catch (e) {
            console.error('Gagal baca database uang:', e)
        }
    }

    let user = global.db.data.users[who] || {}
    let name = user.registered ? user.name : conn.getName(who)

    let text = `✨ *SALDO USER*

👤 *Username* : ${name}
💰 *Uang* : Rp${parseInt(saldo).toLocaleString('id-ID')}

*Note:* Gunakan bot untuk menambah saldo.`.trim()

    conn.sendMessage(m.chat, { text }, { quoted: m })
}

handler.help = ['uang [@user]']
handler.tags = ['ekonomi']
handler.command = /^(uang|money|saldo)$/i

export default handler