import fs from 'fs'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const userPath = './json/user_stats.json'
    let dataUser = JSON.parse(fs.readFileSync(userPath, 'utf-8') || '{}')
    let jid = m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net'
    
    if (!dataUser[jid]) throw '⚠️ Kamu belum terdaftar! Ketik .mancing dulu.'
    let u = dataUser[jid]

    // Konfigurasi Syarat Pindah Lokasi
    const travelLoc = {
        'empang': { minLevel: 1, name: 'Empang' },
        'sungai': { minLevel: 1, name: 'Sungai' },
        'laut': { minLevel: 15, name: 'Laut' },
        'abyss': { minLevel: 30, name: 'Abyss' }
    }

    let target = args[0]?.toLowerCase()

    if (!target || !travelLoc[target]) {
        let txt = `📍 *DAFTAR LOKASI MEMANCING*\n\n`
        for (let key in travelLoc) {
            let lock = u.level >= travelLoc[key].minLevel ? '✅' : '🔒'
            txt += `${lock} *${travelLoc[key].name}* (Min. Lv.${travelLoc[key].minLevel})\n`
        }
        txt += `\n*Cara pindah:* ${usedPrefix}${command} sungai`
        return m.reply(txt)
    }

    let loc = travelLoc[target]

    // 1. Validasi Level
    if (u.level < loc.minLevel) {
        throw `❌ Level kamu tidak cukup! Kamu butuh *Lv.${loc.minLevel}* untuk pergi ke ${loc.name}.`
    }

    // 2. Cek jika sudah di lokasi tersebut
    if (u.location === loc.name) {
        throw `📍 Kamu sudah berada di ${loc.name}!`
    }

    // 3. Animasi Pindah (Edit Message)
    const { key } = await conn.sendMessage(m.chat, { text: `🚗 Menuju ke ${loc.name}...` }, { quoted: m })
    
    await new Promise(res => setTimeout(res, 2000))
    
    // Update Lokasi di Database
    u.location = loc.name
    dataUser[jid] = u
    fs.writeFileSync(userPath, JSON.stringify(dataUser, null, 2))

    await conn.relayMessage(m.chat, {
        protocolMessage: {
            key: key,
            type: 14,
            editedMessage: {
                conversation: `✅ *TIBA!* Kamu sekarang berada di *${loc.name}*.\nSiapkan umpanmu dan ketik *.mancing*!`
            }
        }
    }, {})
}

handler.help = ['move [lokasi]', 'pindah']
handler.tags = ['game']
handler.command = /^(move|pindah|pergi)$/i

export default handler