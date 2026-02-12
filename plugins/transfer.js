import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, args }) => {
    const uangPath = path.join(process.cwd(), 'json', 'uang.json')
    
    // Ambil target (tag, reply, atau input nomor)
    let who = m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/[@ .+-]/g, '') + '@s.whatsapp.net' : ''))
    
    if (!who) throw '❌ Tag user, reply chat, atau masukkan nomor target!'
    
    // Ambil jumlah transfer (cari angka di dalam args)
    let amount = args.find(v => !v.includes('@') && !isNaN(v))
    if (!amount) throw '❌ Masukkan jumlah uang yang ingin ditransfer!'
    
    let count = Math.max(1, parseInt(amount))
    
    // Normalisasi JID Pengirim & Penerima
    let senderJid = m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net'
    let targetJid = who.split('@')[0].split(':')[0] + '@s.whatsapp.net'

    if (senderJid === targetJid) throw '❌ Tidak bisa transfer ke diri sendiri!'

    // Baca database uang
    if (!fs.existsSync(uangPath)) throw '❌ Database uang tidak ditemukan!'
    let dataUang = JSON.parse(fs.readFileSync(uangPath, 'utf-8'))
    
    let senderMoney = dataUang[senderJid] || 0

    if (senderMoney < count) throw `❌ Saldo kamu tidak cukup! Sisa saldo: Rp${senderMoney.toLocaleString('id-ID')}`

    // Proses Transfer
    dataUang[senderJid] -= count
    dataUang[targetJid] = (dataUang[targetJid] || 0) + count

    // Simpan ke file
    fs.writeFileSync(uangPath, JSON.stringify(dataUang, null, 2))

    let targetName = conn.getName(who)
    m.reply(`✅ *TRANSFER BERHASIL*\n\n💰 *Jumlah* : Rp${count.toLocaleString('id-ID')}\n🎯 *Ke* : ${targetName}\n\nSisa saldo kamu: Rp${dataUang[senderJid].toLocaleString('id-ID')}`)
}

handler.help = ['transfer @tag [jumlah]']
handler.tags = ['ekonomi']
handler.command = /^(transfer|tf)$/i
export default handler