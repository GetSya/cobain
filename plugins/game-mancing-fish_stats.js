import fs from 'fs'

let handler = async (m, { conn }) => {
    const userPath = './json/user_stats.json'
    
    // Safety check jika file tidak ada
    if (!fs.existsSync(userPath)) {
        throw '⚠️ Belum ada data pemancing. Jadilah yang pertama dengan mengetik *.mancing*!'
    }

    let dataUser = JSON.parse(fs.readFileSync(userPath, 'utf-8') || '{}')
    let jid = m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net'
    let u = dataUser[jid]

    // Cek apakah user sudah terdaftar di database stats
    if (!u) {
        throw '⚠️ Kamu belum memiliki profil pemancing. Ketik *.mancing* untuk memulai petualanganmu!'
    }

    // --- LOGIKA PROGRESS BAR EXP ---
    let xpNeeded = u.level * 500
    let persenExp = Math.min(100, Math.floor((u.exp / xpNeeded) * 100))
    let barFull = Math.floor(persenExp / 10)
    let barEmpty = 10 - barFull
    let visualBar = '▓'.repeat(barFull) + '░'.repeat(barEmpty)

    // --- LOGIKA STATUS LUCK ---
    let totalTangkap = u.total_tangkapan || 0
    let statusLuck = totalTangkap < 10 
        ? '🔥 GACOR (Newbie Buff)' 
        : (u.level > 20 ? '💎 Professional' : '✨ Normal')

    // --- LOGIKA KONDISI ALAT ---
    let rodStatus = u.rod > 70 ? '🟢 Bagus' : (u.rod > 30 ? '🟡 Aus' : '🔴 Rusak Parah')

    let txt = `
   🎣 *PROFIL PEMANCING* 🎣
━━━━━━━━━━━━━━━━━━━━
👤 *Nama:* ${conn.getName(m.sender)}
🍀 *Status Luck:* ${statusLuck}
🎣 *Total Tangkap:* ${totalTangkap} Ikan
━━━━━━━━━━━━━━━━━━━━

📊 *STATISTIK LEVEL*
🏅 *Level:* ${u.level}
✨ *Exp:* ${u.exp} / ${xpNeeded}
${visualBar} [${persenExp}%]

📍 *INFO LOKASI & ALAT*
🗺️ *Lokasi:* ${u.location || 'Sungai'}
🛠️ *Kondisi Rod:* ${u.rod}% (${rodStatus})
🪱 *Stok Umpan:* ${u.bait_count || 0}x ${u.bait || 'None'}

💡 *Tips:* ${totalTangkap < 10 
    ? '_Manfaatkan sisa Gacor-mu untuk mencari ikan mahal!_' 
    : '_Tingkatkan levelmu untuk memancing di Laut atau Abyss!_'}
━━━━━━━━━━━━━━━━━━━━
    `.trim()

    // Kirim pesan dengan mention
    conn.reply(m.chat, txt, m, { mentions: [m.sender] })
}

handler.help = ['fishstats', 'fstat']
handler.tags = ['game']
handler.command = /^(fishstats|fstat|mystat|profilmancing)$/i

export default handler