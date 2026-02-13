import fs from 'fs'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const userPath = './json/user_stats.json'
    const uangPath = './json/uang.json'

    if (!fs.existsSync(userPath)) fs.writeFileSync(userPath, '{}')
    let dataUser = JSON.parse(fs.readFileSync(userPath, 'utf-8') || '{}')
    let dataUang = JSON.parse(fs.readFileSync(uangPath, 'utf-8') || '{}')

    let jid = m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net'
    if (!dataUser[jid]) dataUser[jid] = { level: 1, exp: 0, rod: 100, bait: 'None', bait_count: 0, location: 'Empang' }
    
    let u = dataUser[jid]
    let saldo = dataUang[jid] || 0

    if (command === 'buybait' || command === 'beliumpan') {
        const listBait = {
            'lumut': 150,
            'cacing': 500,
            'pelet': 1500,
            'udang': 7500,
            'daging': 20000
        }

        let type = args[0]?.toLowerCase()
        let count = Math.max(1, parseInt(args[1]) || 1)

        if (!type || !listBait[type]) {
            let txt = `🛒 *TOKO UMPAN SENPAI*\n\n`
            for (let b in listBait) txt += `🪱 *${b.toUpperCase()}* - Rp${listBait[b].toLocaleString()}/pcs\n`
            return m.reply(txt + `\n*Format:* ${usedPrefix}${command} [jenis] [jumlah]`)
        }

        let totalHarga = listBait[type] * count
        if (saldo < totalHarga) throw `❌ Duit kurang Rp${(totalHarga - saldo).toLocaleString()}`

        dataUang[jid] -= totalHarga
        let namaBait = type.charAt(0).toUpperCase() + type.slice(1)
        
        if (u.bait === namaBait) u.bait_count += count
        else { u.bait = namaBait; u.bait_count = count }
        
        fs.writeFileSync(userPath, JSON.stringify(dataUser, null, 2))
        fs.writeFileSync(uangPath, JSON.stringify(dataUang, null, 2))
        return m.reply(`✅ Berhasil beli *${count} ${u.bait}* seharga Rp${totalHarga.toLocaleString()}!`)
    }

    if (command === 'repair') {
        if (u.rod >= 100) throw '🛠️ Pancinganmu masih bagus!'
        let cost = (100 - u.rod) * 200
        if (saldo < cost) throw `❌ Butuh Rp${cost.toLocaleString()} untuk repair.`

        dataUang[jid] -= cost
        u.rod = 100
        fs.writeFileSync(userPath, JSON.stringify(dataUser, null, 2))
        fs.writeFileSync(uangPath, JSON.stringify(dataUang, null, 2))
        return m.reply(`🛠️ *REPAIR SUKSES*\nBiaya: *Rp${cost.toLocaleString()}*`)
    }
}
handler.help = ['beliumpan']
handler.command = /^(buybait|beliumpan|repair)$/i
handler.register = true
export default handler