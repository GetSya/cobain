import fs from 'fs'

// Inisialisasi session di luar handler agar tidak ter-reset setiap perintah dipanggil
if (!global.fishing_session) global.fishing_session = {}

let handler = async (m, { conn, usedPrefix }) => {
    const userPath = './json/user_stats.json'
    const worldPath = './json/world_state.json'
    const uangPath = './json/uang.json'
    
    let jid = m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net'

    // ---- 1. VALIDASI SESSION (ANTI SPAM) ----
    if (global.fishing_session[jid]) {
        throw `⏳ Kamu sedang memancing, tunggu sampai tarikanmu selesai!`
    }

    // 2. Inisialisasi & Safety Check
    if (!fs.existsSync('./json')) fs.mkdirSync('./json', { recursive: true })
    if (!fs.existsSync(userPath)) fs.writeFileSync(userPath, '{}')
    if (!fs.existsSync(uangPath)) fs.writeFileSync(uangPath, '{}')
    if (!fs.existsSync(worldPath)) fs.writeFileSync(worldPath, JSON.stringify({ weather: 'Cerah', lastUpdate: Date.now() }))

    let dataUser = JSON.parse(fs.readFileSync(userPath, 'utf-8') || '{}')
    let dataWorld = JSON.parse(fs.readFileSync(worldPath, 'utf-8') || '{}')
    let dataUang = JSON.parse(fs.readFileSync(uangPath, 'utf-8') || '{}')

    if (!dataUser[jid]) dataUser[jid] = { level: 1, exp: 0, rod: 100, bait: 'None', bait_count: 0, location: 'Empang', total_tangkapan: 0 }
    let u = dataUser[jid]

    // 3. Validasi Persiapan
    if (u.bait === 'None' || (u.bait_count || 0) <= 0) {
        u.bait = 'None'; u.bait_count = 0
        fs.writeFileSync(userPath, JSON.stringify(dataUser, null, 2))
        throw `❌ Kamu tidak punya umpan! Beli dulu di *${usedPrefix}buybait*`
    }
    if (u.rod <= 0) throw `⚠️ Pancinganmu patah! Perbaiki dulu dengan *${usedPrefix}repair*`

    // ---- AKTIFKAN SESSION LOCK ----
    global.fishing_session[jid] = true

    try {
        // 4. Database Ikan
        const locations = {
            'Empang': { fish: [
                { name: 'Ikan Sepat', price: 80, weight: [0.1, 0.3], rarity: 0.8, bait: 'Lumut' },
                { name: 'Ikan Mujair', price: 500, weight: [0.5, 1.5], rarity: 0.6, bait: 'Lumut' },
                { name: 'Ikan Nila Merah', price: 1200, weight: [1, 3], rarity: 0.4, bait: 'Pelet' },
                { name: 'Ikan Lele Dumbo', price: 2500, weight: [2, 5], rarity: 0.3, bait: 'Cacing' },
                { name: 'Ikan Mas Koki', price: 3500, weight: [0.5, 2], rarity: 0.2, bait: 'Pelet' },
                { name: 'Ikan Bawal', price: 5000, weight: [1, 4], rarity: 0.15, bait: 'Cacing' },
                { name: 'Ikan Gurame Albino', price: 9000, weight: [3, 6], rarity: 0.05, bait: 'Udang' }
            ]},
            'Sungai': { fish: [
                { name: 'Ban Bekas', price: 50, weight: [5, 10], rarity: 0.9, bait: 'Cacing' },
                { name: 'Sandal Jepit', price: 20, weight: [0.2, 0.5], rarity: 0.8, bait: 'Cacing' },
                { name: 'Ikan Wader', price: 150, weight: [0.1, 0.4], rarity: 0.7, bait: 'Cacing' },
                { name: 'Ikan Baung', price: 2500, weight: [1, 5], rarity: 0.4, bait: 'Cacing' },
                { name: 'Ikan Patin Sungai', price: 9000, weight: [4, 15], rarity: 0.2, bait: 'Pelet' },
                { name: 'Ikan Gabus (Channa)', price: 12000, weight: [2, 6], rarity: 0.15, bait: 'Udang' },
                { name: 'Sidat (Moa) Purba', price: 50000, weight: [5, 15], rarity: 0.04, bait: 'Daging' },
                { name: 'Bulus Raksasa', price: 80000, weight: [10, 30], rarity: 0.02, bait: 'Daging' }
            ]},
            'Laut': { fish: [
                { name: 'Ikan Kembung', price: 3000, weight: [0.5, 2], rarity: 0.7, bait: 'Pelet' },
                { name: 'Ikan Kakap Merah', price: 12000, weight: [3, 12], rarity: 0.4, bait: 'Udang' },
                { name: 'Ikan Kerapu Cantang', price: 25000, weight: [5, 25], rarity: 0.25, bait: 'Udang' },
                { name: 'Ikan Tuna Bluefin', price: 85000, weight: [50, 300], rarity: 0.08, bait: 'Daging' },
                { name: 'Ikan Marlin Biru', price: 150000, weight: [100, 500], rarity: 0.05, bait: 'Udang' },
                { name: 'Hiu Putih Besar', price: 500000, weight: [500, 1500], rarity: 0.02, bait: 'Daging' },
                { name: 'Paus Sperma', price: 2000000, weight: [5000, 20000], rarity: 0.005, bait: 'Daging' }
            ]},
            'Abyss': { fish: [
                { name: 'Anglerfish', price: 75000, weight: [5, 20], rarity: 0.4, bait: 'Daging' },
                { name: 'Gulper Eel', price: 250000, weight: [20, 60], rarity: 0.15, bait: 'Daging' },
                { name: 'Oarfish (Raja Laut)', price: 600000, weight: [100, 500], rarity: 0.08, bait: 'Udang' },
                { name: 'Kraken Junior', price: 1500000, weight: [500, 2000], rarity: 0.04, bait: 'Daging' },
                { name: 'Ancient Megalodon', price: 5000000, weight: [2000, 8000], rarity: 0.01, bait: 'Daging' },
                { name: 'Leviathan (Guardian)', price: 25000000, weight: [15000, 50000], rarity: 0.002, bait: 'Udang' }
            ]}
        }

        // 5. Edit Message Animation
        const { key } = await conn.sendMessage(m.chat, { text: `🎣 *[${u.location}]* Menyiapkan kail...` }, { quoted: m })
        async function edit(txt) {
            await conn.relayMessage(m.chat, { protocolMessage: { key: key, type: 14, editedMessage: { conversation: txt } } }, {})
        }

        await new Promise(res => setTimeout(res, 1500))
        await edit(`🚀 *SYUUUT!* Melemparkan umpan *${u.bait}* ke tengah ${u.location}...`)

        let rand = Math.random()
        let delay = rand < 0.2 ? 2000 : (rand < 0.8 ? 8000 : 18000)
        await new Promise(res => setTimeout(res, 3000))
        await edit(`⏳ Menunggu ikan menyambar... (Cuaca: ${dataWorld.weather})`)

        if (delay > 10000) {
            await new Promise(res => setTimeout(res, 5000))
            await edit(`💤 Hening sekali... Sepertinya ikan di sini sangat waspada.`)
        }

        await new Promise(res => setTimeout(res, delay - 2000))
        await edit(`❗ *STRIKE!* Joranmu melengkung tajam!`)
        await new Promise(res => setTimeout(res, 1000))

        // 6. Logika Gacor
        let userBait = u.bait.toLowerCase()
        let currentLoc = locations[u.location] || locations['Empang']
        let pool = currentLoc.fish.filter(f => (userBait === 'udang' ? true : f.bait.toLowerCase() === userBait))
        
        let sortedPool = pool.sort((a, b) => b.price - a.price)
        let caught = null
        let totalTangkapan = u.total_tangkapan || 0

        if (totalTangkapan < 10) {
            let topFish = sortedPool.slice(0, 3)
            caught = topFish[Math.floor(Math.random() * topFish.length)]
        } else {
            if (Math.random() < 0.2) {
                let highTier = sortedPool.filter(f => f.rarity < 0.3)
                caught = highTier[Math.floor(Math.random() * highTier.length)] || sortedPool[0]
            } else {
                let lowTier = sortedPool.filter(f => f.rarity >= 0.3)
                caught = lowTier[Math.floor(Math.random() * lowTier.length)] || sortedPool[sortedPool.length - 1]
            }
        }

        u.bait_count -= 1
        if (u.bait_count <= 0) u.bait = 'None'

        if (!caught) {
            u.rod = Math.max(0, u.rod - 5)
            fs.writeFileSync(userPath, JSON.stringify(dataUser, null, 2))
            delete global.fishing_session[jid] // SELESAI
            return edit(`📉 *YAAH!* Ikannya lepas saat ditarik. Sisa pancingan: ${u.rod}%`)
        }

        let weight = (Math.random() * (caught.weight[1] - caught.weight[0]) + caught.weight[0]).toFixed(2)
        let finalPrice = Math.floor(caught.price * weight)
        
        u.rod = Math.max(0, u.rod - (weight > 20 ? 8 : 2))
        u.exp += Math.floor(weight * 5)
        u.total_tangkapan = totalTangkapan + 1
        
        let xpNeeded = u.level * 500
        let lvUp = u.exp >= xpNeeded ? `\n🎊 *LEVEL UP!* Sekarang *Lv.${++u.level}*!` : ''
        if (u.exp >= xpNeeded) u.exp -= xpNeeded

        dataUang[jid] = (dataUang[jid] || 0) + finalPrice
        dataUser[jid] = u
        fs.writeFileSync(userPath, JSON.stringify(dataUser, null, 2))
        fs.writeFileSync(uangPath, JSON.stringify(dataUang, null, 2))

        await edit(`
🎉 *BERHASIL MENGANGKAT IKAN!*
━━━━━━━━━━━━━━
🐟 *Ikan:* ${caught.name}
⚖️ *Berat:* ${weight} Kg
💰 *Harga:* Rp${finalPrice.toLocaleString('id-ID')}
🌤️ *Cuaca:* ${dataWorld.weather}

🛠️ *Rod:* ${u.rod}% | 📈 *Exp:* +${Math.floor(weight * 5)} (Lv.${u.level})${lvUp}
━━━━━━━━━━━━━━
_Sisa umpan: ${u.bait_count} ${u.bait}_
        `.trim())

    } catch (e) {
        console.error(e)
    } finally {
        // ---- 7. MELEPAS SESSION (WAJIB) ----
        delete global.fishing_session[jid]
    }
}

handler.help = ['mancing']
handler.tags = ['game']
handler.limit = true
handler.register = true
handler.command = /^(mancing|fishing)$/i
export default handler