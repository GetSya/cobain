import fetch from "node-fetch"

let handler = async (m, { conn, args }) => {
  const url = args[0]
  
  // Validasi format URL YouTube
  if (!url || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url)) {
    return conn.reply(m.chat, "🔗 Kirim URL YouTube yang valid!", m)
  }

  await m.react('🕒')

  try {
    // Memanggil API baru sesuai dokumentasi yang kamu berikan
    const api = `https://api-faa.my.id/faa/ytmp3?url=${encodeURIComponent(url)}`
    const res = await fetch(api)
    
    if (!res.ok) throw new Error(`API Down atau Error: ${res.statusText}`)
    
    const json = await res.json()

    // Validasi apakah status API true dan ada link mp3
    if (!json.status || !json.result?.mp3) {
      throw new Error("Gagal mendapatkan link download dari API.")
    }

    const { title, thumbnail, mp3, duration } = json.result
    const audioBuffer = await fetch(mp3).then(r => r.buffer())

    // Cek ukuran file (Limit 50MB agar tidak gagal dikirim via WhatsApp)
    if (audioBuffer.length > 50 * 1024 * 1024) {
      return conn.reply(m.chat, `📥 File terlalu besar.\n🔗 Silakan download manual: ${mp3}`, m)
    }

    // Mengirim audio dengan metadata lengkap
    await conn.sendMessage(m.chat, {
      audio: audioBuffer,
      mimetype: 'audio/mpeg',
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: title,
          body: `Duration: ${duration}s | Creator: ${json.creator}`,
          showAdAttribution: true,
          mediaType: 1,
          sourceUrl: url,
          thumbnailUrl: thumbnail 
        }
      }
    }, { quoted: m })

    await m.react('✅')

  } catch (e) {
    console.error(e)
    conn.reply(m.chat, `❌ Terjadi Kesalahan:\n${e.message}`, m)
  }
}

handler.help = ["yta <url>", "ytmp3 <url>"]
handler.tags = ["downloader"]
handler.command = /^yta|ytmp3$/i
handler.limit = true

export default handler