// --- IMPORT FIX ---
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Kita gunakan require seperti di main.js Anda agar 100% cocok
const { generateWAMessageFromContent, proto } = require('baileys')
// ------------------

let handler = async (m, { conn, usedPrefix, command }) => {
  // Feedback visual
  await conn.sendMessage(m.chat, { react: { text: '📝', key: m.key } })

  try {
    // Susun Pesan Button Teks
    let msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "✨ MENU BUTTON TEKS",
              hasMediaAttachment: false
            },
            body: { 
              text: "Halo! Ini adalah contoh pesan menggunakan *Native Flow Buttons* tanpa gambar.\n\nSilakan pilih tombol di bawah ini:" 
            },
            footer: { 
              text: "Simple Text Button Bot" 
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({
                    display_text: "Ping Bot 🏓",
                    id: `${usedPrefix}ping`
                  })
                },
                {
                   name: "cta_url",
                   buttonParamsJson: JSON.stringify({
                     display_text: "Link Script 🔗",
                     url: "https://github.com/rynxzyy/blue-archive-r-img"
                   })
                },
                {
                   name: "cta_copy",
                   buttonParamsJson: JSON.stringify({
                     display_text: "Salin Pesan 📋",
                     copy_code: "Ini adalah teks yang disalin",
                     id: "copy_123"
                   })
                }
              ]
            }
          }
        }
      }
    }, { userJid: m.chat, quoted: m })

    // Kirim pesan
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

  } catch (e) {
    console.error(e)
    m.reply('❌ Terjadi kesalahan: ' + e)
  }
}

handler.help = ['buttons']
handler.tags = ['main']
handler.command = /^buttons$/i
handler.limit = false

export default handler