import fs from 'fs'

let handler = async (m, { conn, usedPrefix }) => {
    const userPath = './json/user_stats.json'
    
    if (!fs.existsSync(userPath)) throw '⚠️ Belum ada data pemancing.'

    let dataUser = JSON.parse(fs.readFileSync(userPath, 'utf-8') || '{}')
    
    // Mengubah objek dataUser menjadi array agar bisa disortir
    let pemancing = Object.entries(dataUser).map(([jid, stats]) => {
        return {
            jid,
            ...stats
        }
    })

    // Sortir berdasarkan Level tertinggi, jika level sama sortir berdasarkan Total Tangkapan
    pemancing.sort((a, b) => {
        if (b.level !== a.level) {
            return b.level - a.level
        }
        return (b.total_tangkapan || 0) - (a.total_tangkapan || 0)
    })

    // Ambil Top 10 saja
    let top10 = pemancing.slice(0, 10)
    
    let text = `🏆 *PAPAN PERINGKAT PEMANCING SAKTI* 🏆\n`
    text += `_Menampilkan 10 Master Angler Terbaik_\n`
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`

    top10.forEach((user, i) => {
        let name = conn.getName(user.jid)
        let badge = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : '🎗️'))
        
        text += `${badge} *RANK ${i + 1}* - ${name}\n`
        text += `   ╰  🏅 *Lv.${user.level}* | 🎣 *${user.total_tangkapan || 0} Ekor*\n\n`
    })

    text += `━━━━━━━━━━━━━━━━━━━━\n`
    text += `_Gunakan *${usedPrefix}mancing* untuk menaikkan peringkatmu!_`

    conn.reply(m.chat, text, m, {
        mentions: top10.map(v => v.jid)
    })
}

handler.help = ['leaderboardmancing', 'topmancing']
handler.tags = ['game']
handler.command = /^(leaderboardmancing|topmancing|lbman|lbfishing)$/i

export default handler