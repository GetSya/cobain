import fs from 'fs'
import path from 'path'

let handler = async (m, { args, conn }) => {
    const uangPath = path.join(process.cwd(), 'json', 'uang.json')
    const price = 3500 // Harga per 1 limit
    
    if (!args[0] || isNaN(args[0])) throw `Gunakan format: *.buylimit [jumlah]*\nContoh: *.buylimit 10*`
    
    let count = Math.max(1, parseInt(args[0]))
    let totalCost = price * count
    let jid = m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net'

    // Baca database uang
    let dataUang = {}
    if (fs.existsSync(uangPath)) {
        dataUang = JSON.parse(fs.readFileSync(uangPath, 'utf-8'))
    }
    
    let userMoney = dataUang[jid] || 0

    if (userMoney < totalCost) throw `❌ Uang kamu tidak cukup!\nTotal harga untuk *${count} limit* adalah *Rp${totalCost.toLocaleString('id-ID')}*\nSaldo kamu saat ini: *Rp${userMoney.toLocaleString('id-ID')}*`

    // Potong uang dan simpan
    dataUang[jid] -= totalCost
    fs.writeFileSync(uangPath, JSON.stringify(dataUang, null, 2))

    // Tambah limit ke database utama
    global.db.data.users[m.sender].limit += count

    conn.reply(m.chat, `✅ Berhasil membeli *${count}* limit seharga *Rp${totalCost.toLocaleString('id-ID')}*`, m)
}

handler.help = ['buylimit [jumlah]']
handler.tags = ['ekonomi']
handler.command = /^(buylimit|belilimit)$/i
export default handler