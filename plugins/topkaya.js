import fs from 'fs'
import path from 'path'

let handler = async (m, { conn }) => {
    const uangPath = path.join(process.cwd(), 'json', 'uang.json')

    if (!fs.existsSync(uangPath)) throw '❌ Database uang tidak ditemukan!'

    try {
        const dataUang = JSON.parse(fs.readFileSync(uangPath, 'utf-8'))
        const botJid = conn.user.jid.split('@')[0].split(':')[0] + '@s.whatsapp.net'
        
        // Mengubah objek menjadi array dan memfilter agar bot tidak masuk list
        let daftarKaya = Object.entries(dataUang)
            .map(([jid, saldo]) => ({ jid, saldo: parseInt(saldo) }))
            .filter(user => user.jid !== botJid) // Filter akun bot

        // Urutkan dari yang paling tajir
        daftarKaya.sort((a, b) => b.saldo - a.saldo)

        // Ambil Top 10
        let top10 = daftarKaya.slice(0, 10)

        if (top10.length === 0) throw '❌ Belum ada data kekayaan selain bot.'

        let text = `👑 *TOP 10 USER TERKAYA* 👑\n`
        text += `_(Daftar ini tidak termasuk akun bot)_\n\n`
        
        text += top10.map((user, i) => {
            let name = conn.getName(user.jid) || 'User'
            let cleanJid = user.jid.split('@')[0]
            return `${i + 1}. *${name}* (@${cleanJid})\n   💰 Saldo: *Rp${user.saldo.toLocaleString('id-ID')}*`
        }).join('\n\n')

        text += `\n\n________________________\nTotal uang rakyat: *Rp${daftarKaya.reduce((a, b) => a + b.saldo, 0).toLocaleString('id-ID')}*`

        conn.reply(m.chat, text, m, {
            mentions: top10.map(v => v.jid)
        })

    } catch (e) {
        console.error(e)
        throw '❌ Terjadi kesalahan saat memproses data.'
    }
}

handler.help = ['topkaya']
handler.tags = ['ekonomi']
handler.command = /^(topkaya|leaderboard|terkaya)$/i

export default handler