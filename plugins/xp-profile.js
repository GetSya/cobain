import PhoneNumber from 'awesome-phonenumber'
import moment from 'moment-timezone'

let handler = async (m, { conn }) => {

  let who = m.mentionedJid?.[0] || m.quoted?.sender || m.sender

  if (!(who in global.db.data.users))
    return m.reply('User tidak ada di database.')

  let user = global.db.data.users[who]
  let name = user.registered ? user.name : await conn.getName(who)
  let number = PhoneNumber('+' + who.split('@')[0]).getNumber('international')

  let pp
  try {
    pp = await conn.profilePictureUrl(who, 'image')
  } catch {
    pp = 'https://i.ibb.co/2WzLyGk/profile.jpg'
  }

  let bio
  try {
    bio = (await conn.fetchStatus(who))?.status || 'Tidak ada bio'
  } catch {
    bio = 'Tidak ada bio'
  }

  // Waktu Real-time
  let now = Date.now()
  let week = moment().tz('Asia/Jakarta').format('dddd')
  let date = moment().tz('Asia/Jakarta').format('DD MMMM YYYY')
  let time = moment().tz('Asia/Jakarta').format('HH:mm:ss')

  // Destructuring data
  let {
    role = 'Beginner',
    level = 1,
    exp = 0,
    money = 0,
    limit = 0,
    hutang = 0,
    hutangTime = 0, // Ambil waktu pinjam
    premiumTime = 0,
    registered = false,
    age = '-'
  } = user

  // Hitung Sisa Waktu Jatuh Tempo (3 Hari)
  let statusHutang = 'Lunas ✅'
  if (hutang > 0) {
    let deadline = hutangTime + (3 * 24 * 60 * 60 * 1000)
    let sisaWaktu = deadline - now
    
    if (sisaWaktu > 0) {
      let hari = Math.floor(sisaWaktu / (24 * 60 * 60 * 1000))
      let jam = Math.floor((sisaWaktu % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
      statusHutang = `${hari}h ${jam}j lagi`
    } else {
      statusHutang = 'TELAT (Kena Denda) ⚠️'
    }
  }

  let premium = premiumTime > 0 ? 'Aktif' : 'Tidak'

  let text = `
🕰️ *USER PROFILE*

👤 *Identitas*
• Nama : *${name}*
• Umur : *${registered ? age : '-'}*
• Bio : ${bio}

📱 *Kontak*
• Tag : @${who.split('@')[0]}
• Nomor : ${number}
• Link : https://wa.me/${who.split('@')[0]}

📊 *Statistik RPG*
• Role : *${role}*
• Level : *${level}*
• Exp : *${exp.toLocaleString()}*
• Limit : *${limit.toLocaleString()}*
• Premium : *${premium}*

💰 *Ekonomi*
• Saldo : *Rp${parseInt(money).toLocaleString('id-ID')}*
• Hutang : *Rp${parseInt(hutang).toLocaleString('id-ID')}*
• Tempo : *${statusHutang}* ⏳

📅 ${week}, ${date}
⏰ ${time}
`.trim()

  let imagePayload = Buffer.isBuffer(pp)
    ? { image: pp }
    : { image: { url: pp } }

  await conn.sendMessage(m.chat, {
    ...imagePayload,
    caption: text,
    mentions: [who]
  }, { quoted: m })
}

handler.help = ['profile', 'profil', 'me']
handler.tags = ['info', 'xp']
handler.command = /^(profile|profil|me|my)$/i
handler.limit = false

export default handler