import { Sticker } from 'wa-sticker-formatter'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, text }) => {
    // Memastikan folder tmp ada agar tidak terjadi error ENOENT
    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true })
    }

    // Logika pengambilan teks
    if (m.quoted && m.quoted.text) {
        text = m.quoted.text
    } else if (!text) {
        return m.reply('Reply pesan atau masukkan teks setelah command. Contoh: .brat halo')
    }

    try {       
        await m.react('🕒')

        // URL API Brat
        const responseUrl = `https://aqul-brat.hf.space?text=${encodeURIComponent(text)}`
        
        // Membuat stiker menggunakan fungsi createSticker di bawah
        let stiker = await createSticker(
            false,
            responseUrl,
            global.stickpack || global.namebot || 'Sticker Pack',
            global.stickauth || global.author || 'Bot',
            20 // Menaikkan sedikit quality agar tidak terlalu buram
        )

        if (stiker) {
            await conn.sendFile(m.chat, stiker, 'brat.webp', '', m)
            await m.react('✅')
        } else {
            throw new Error('Gagal membuat stiker')
        }
    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply(`Terjadi kesalahan: ${e.message}`)
    }
}

handler.help = ['brat <text>']
handler.tags = ['sticker']
handler.command = /^(brat)$/i
handler.limit = true
handler.register = false

export default handler

/**
 * Fungsi untuk memproses gambar/URL menjadi stiker buffer
 */
async function createSticker(img, url, packName, authorName, quality) {
    let stickerMetadata = {
        type: 'crop', // Menggunakan crop agar pas di frame WhatsApp
        pack: packName,
        author: authorName,
        quality
    }
    // Jika ada buffer gambar pakai img, jika tidak pakai URL
    return (new Sticker(img ? img : url, stickerMetadata)).toBuffer()
}