import { WAMessageStubType } from 'baileys'
import PhoneNumber from 'awesome-phonenumber'
import chalk from 'chalk'
import { watchFile, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

// Konfigurasi Path & Gaji
const uangPath = path.join(process.cwd(), 'json', 'uang.json')
const GAJI_PER_CHAT = 75

/**
 * Fungsi Pengelola Database Uang
 * Langsung menambah saldo setiap kali dipanggil
 */
const updateDatabaseUang = (jid) => {
    try {
        // 1. Pastikan Folder & File Tersedia
        if (!existsSync(path.join(process.cwd(), 'json'))) {
            mkdirSync(path.join(process.cwd(), 'json'), { recursive: true })
        }
        if (!existsSync(uangPath)) {
            writeFileSync(uangPath, JSON.stringify({}, null, 2))
        }

        // 2. Normalisasi JID (Hapus :1 atau .0 dari multi-device)
        let cleanJid = jid.split('@')[0].split(':')[0] + '@s.whatsapp.net'

        // 3. Baca Data
        let data = JSON.parse(readFileSync(uangPath, 'utf-8'))

        // 4. Tambah Saldo Rp75
        if (typeof data[cleanJid] === 'undefined') {
            data[cleanJid] = GAJI_PER_CHAT
        } else {
            data[cleanJid] = (parseInt(data[cleanJid]) || 0) + GAJI_PER_CHAT
        }

        // 5. Simpan Kembali secara Sinkron (Agar Instan)
        writeFileSync(uangPath, JSON.stringify(data, null, 2), 'utf-8')

        return data[cleanJid]
    } catch (e) {
        console.error(chalk.red('❌ Error Database Uang:'), e)
        return 0
    }
}

function formatBytes(bytes = 0) {
    if (!bytes || isNaN(bytes)) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

function getTime(timestamp) {
    return new Date(
        timestamp ? 1000 * (timestamp.low || timestamp) : Date.now()
    ).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
}

export default async function (m, conn = { user: {} }) {
    // JANGAN beri gaji jika pesan berasal dari bot sendiri
    if (!m || m.fromMe) return 

    try {
        // PROSES GAJI OTOMATIS
        let currentMoney = updateDatabaseUang(m.sender)

        const name = conn.getName(m.sender)
        const sender = PhoneNumber('+' + m.sender.split('@')[0]).getNumber('international') +
            (name ? ` ~ ${name}` : '')

        const chatName = conn.getName(m.chat)
        const botNumber = PhoneNumber('+' + (conn.user?.jid || '').split('@')[0]).getNumber('international')
        const botName = conn.user?.name || 'BOT'

        const filesize =
            m.msg?.fileLength?.low ||
            m.msg?.fileLength ||
            m.msg?.vcard?.length ||
            m.msg?.axolotlSenderKeyDistributionMessage?.length ||
            m.text?.length ||
            0

        const user = global.db.data.users[m.sender] || {}
        const time = getTime(m.messageTimestamp)

        const type = m.mtype
            ? m.mtype
                .replace(/message$/i, '')
                .replace('audio', m.msg?.ptt ? '🎙️ PTT' : '🎵 Audio')
                .replace(/^./, v => v.toUpperCase())
            : '-'

        const stub = m.messageStubType
            ? WAMessageStubType[m.messageStubType]
            : '-'

        // ==== TAMPILAN LOG TERMINAL ====
        console.log(
            chalk.hex('#ffb6ff')('╭───────────── 🌸 𝙇𝙊𝙂 🌸 ─────────────'),
            '\n' + chalk.magentaBright('│ ✨ Senpai Bot  : ') + chalk.white(`${botNumber} ~ ${botName}`),
            '\n' + chalk.yellowBright('│ 🍌 Waktu       : ') + chalk.white(time),
            '\n' + chalk.cyanBright('│ 💬 Room Chat  : ') + chalk.white(`${chatName || m.chat}`),
            '\n' + chalk.greenBright('│ 🧑‍🎤 From       : ') + chalk.white(sender),
            '\n' + chalk.blueBright('│ 🎴 Type Msg   : ') + chalk.white(type),
            '\n' + chalk.redBright('│ 🪄 Event       : ') + chalk.white(stub),
            '\n' + chalk.magentaBright('│ 🎒 Size       : ') + chalk.white(formatBytes(filesize)),
            '\n' + chalk.yellowBright('│ ⭐ Status     : ') + chalk.white(
                `Lv.${user.level || 0} ✦ Rp${currentMoney.toLocaleString('id-ID')} (+${GAJI_PER_CHAT}) ✦ Limit ${user.limit || 0}`
            ),
            '\n' + chalk.hex('#ffb6ff')('╰────────────────────────────────────────')
        )

        // LOG PESAN TEKS
        if (typeof m.text === 'string' && m.text) {
            let log = m.text.replace(/\u200e+/g, '')
            if (m.isCommand) console.log(chalk.greenBright('⚡ Command: ' + log))
            else console.log(chalk.white('🚩 Chat: ' + log))
        }

    } catch (e) {
        // console.error(chalk.red('💀 Logger Crash:'), e)
    }
}

let file = global.__filename(import.meta.url)
watchFile(file, () => {
    console.log(chalk.magentaBright("✨ Senpai updated 'lib/print.js' ✨"))
})