import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const uangPath = path.join(process.cwd(), 'json', 'uang.json')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    conn.wordchain = conn.wordchain ? conn.wordchain : {}
    let id = m.chat

    // Memberhentikan sesi game
    if (command === 'stopwc') {
        if (!conn.wordchain[id]) throw '❌ Tidak ada sesi game di grup ini.'
        delete conn.wordchain[id]
        return m.reply('✅ Game Sambung Kata telah dihentikan.')
    }

    if (conn.wordchain[id]) throw `Game sedang berlangsung! Gunakan *${usedPrefix}stopwc* untuk berhenti.`

    conn.wordchain[id] = {
        lastWord: '',
        usedWords: [],
        player: '',
        turn: 0
    }

    m.reply(`🎮 *GAME SAMBUNG KATA DIMULAI* 🎮\n\nAturan:\n1. Balas pesan ini dengan satu kata benda/umum.\n2. Kata selanjutnya harus berawalan dari huruf terakhir kata sebelumnya.\n3. Tidak boleh mengulang kata yang sama.\n\n*Silahkan masukkan kata pertama!*`)
}

handler.before = async function (m, { conn }) {
    conn.wordchain = conn.wordchain ? conn.wordchain : {}
    let id = m.chat
    if (!conn.wordchain[id] || m.isBaileys || !m.text) return 

    let game = conn.wordchain[id]
    let input = m.text.toLowerCase().trim()
    
    // Validasi hanya satu kata
    if (input.split(/\s/).length > 1) return

    // Cek apakah kata sudah pernah digunakan dalam sesi ini
    if (game.usedWords.includes(input)) {
        return m.reply(`❌ Kata *${input.toUpperCase()}* sudah pernah digunakan! Cari kata lain.`)
    }

    // Cek huruf awal (kecuali kata pertama)
    if (game.lastWord) {
        let lastLetter = game.lastWord.slice(-1)
        if (input[0] !== lastLetter) {
            return m.reply(`❌ Kata harus berawalan dari huruf *"${lastLetter.toUpperCase()}"*!`)
        }
    }

    // Integrasi API Kamus (Opsional: Menggunakan KBBI API atau cek manual)
    // Di sini kita cek minimal 3 huruf untuk menghindari asal ketik
    if (input.length < 3) return m.reply('❌ Kata terlalu pendek! Minimal 3 huruf.')

    // Update Sesi
    game.lastWord = input
    game.usedWords.push(input)
    game.turn++
    
    // Hadiah Uang (Rp150 per kata berhasil)
    let reward = 150
    let jid = m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net'
    
    if (fs.existsSync(uangPath)) {
        let dataUang = JSON.parse(fs.readFileSync(uangPath, 'utf-8'))
        dataUang[jid] = (dataUang[jid] || 0) + reward
        fs.writeFileSync(uangPath, JSON.stringify(dataUang, null, 2))
    }

    let nextLetter = input.slice(-1).toUpperCase()
    m.reply(`✅ *BENAR!*\n\nKata: *${input.toUpperCase()}*\nHadiah: *Rp${reward}*\n\nGiliran selanjutnya, cari kata berawalan huruf: *"${nextLetter}"*`)
}

handler.help = ['wordchain', 'stopwc']
handler.tags = ['game']
handler.command = /^(wordchain|startwc|stopwc)$/i

export default handler