if (!global.fishing_session) global.fishing_session = {}

let handler = async (m, { conn, usedPrefix }) => {
    let u = global.db.data.users[m.sender]
    
    // Inisialisasi properti jika baru pertama main
    if (u.rod === undefined) u.rod = 100
    if (u.bait === undefined) u.bait = 'None'
    if (u.bait_count === undefined) u.bait_count = 0
    if (u.location === undefined) u.location = 'Empang'
    if (u.total_tangkapan === undefined) u.total_tangkapan = 0

    if (global.fishing_session[m.sender]) throw `⏳ Kamu sedang memancing, tunggu sampai tarikanmu selesai!`

    if (u.bait === 'None' || u.bait_count <= 0) {
        u.bait = 'None'; u.bait_count = 0
        throw `❌ Kamu tidak punya umpan! Beli dulu di *${usedPrefix}buybait*`
    }
    if (u.rod <= 0) throw `⚠️ Pancinganmu patah! Perbaiki dulu dengan *${usedPrefix}repair*`

    global.fishing_session[m.sender] = true

    try {
        const locations = {
            'Empang': { fish: [{ name: 'Ikan Sepat', price: 80, weight: [0.1, 0.3], rarity: 0.8, bait: 'Lumut' }, { name: 'Ikan Mujair', price: 500, weight: [0.5, 1.5], rarity: 0.6, bait: 'Lumut' }, { name: 'Ikan Bawal', price: 5000, weight: [1, 4], rarity: 0.15, bait: 'Cacing' }] },
            'Sungai': { fish: [{ name: 'Ikan Wader', price: 150, weight: [0.1, 0.4], rarity: 0.7, bait: 'Cacing' }, { name: 'Ikan Patin', price: 9000, weight: [4, 15], rarity: 0.2, bait: 'Pelet' }] },
            'Laut': { fish: [{ name: 'Ikan Kakap', price: 12000, weight: [3, 12], rarity: 0.4, bait: 'Udang' }, { name: 'Hiu Putih', price: 500000, weight: [500, 1500], rarity: 0.02, bait: 'Daging' }] }
        }

        const { key } = await conn.sendMessage(m.chat, { text: `🎣 *[${u.location}]* Menyiapkan kail...` }, { quoted: m })
        
        await new Promise(res => setTimeout(res, 1500))
        await conn.sendMessage(m.chat, { text: `🚀 *SYUUUT!* Melemparkan umpan *${u.bait}*...`, edit: key })

        let rand = Math.random()
        let delay = rand < 0.8 ? 5000 : 10000
        await new Promise(res => setTimeout(res, delay))

        // Logika Tangkapan
        let pool = (locations[u.location] || locations['Empang']).fish.filter(f => f.bait.toLowerCase() === u.bait.toLowerCase() || u.bait.toLowerCase() === 'udang')
        let caught = pool[Math.floor(Math.random() * pool.length)]

        u.bait_count -= 1
        if (u.bait_count <= 0) u.bait = 'None'

        if (!caught || Math.random() < 0.2) {
            u.rod -= 5
            return conn.sendMessage(m.chat, { text: `📉 *YAAH!* Ikannya lepas. Sisa pancingan: ${u.rod}%`, edit: key })
        }

        let weight = (Math.random() * (caught.weight[1] - caught.weight[0]) + caught.weight[0]).toFixed(2)
        let finalPrice = Math.floor(caught.price * weight)
        
        u.money += finalPrice
        u.exp += Math.floor(weight * 5)
        u.total_tangkapan += 1
        u.rod -= (weight > 20 ? 10 : 2)

        await conn.sendMessage(m.chat, { text: `🎉 *STRIKE!* Berhasil mengangkat *${caught.name}* (${weight}kg)! \n💰 +Rp${finalPrice.toLocaleString()} | 📈 Exp +${Math.floor(weight * 5)}`, edit: key })

    } catch (e) {
        console.error(e)
    } finally {
        delete global.fishing_session[m.sender]
    }
}

handler.help = ['mancing']
handler.tags = ['game']
handler.command = /^(mancing|fishing)$/i
handler.register = true
export default handler