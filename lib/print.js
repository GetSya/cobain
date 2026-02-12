import { WAMessageStubType } from 'baileys'
import PhoneNumber from 'awesome-phonenumber'
import chalk from 'chalk'
import { watchFile, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

// Konfigurasi Path
const uangPath = './json/uang.json'
const GAJI_PER_CHAT = 75

/**
 * Fungsi Pengelola Database Uang Manual
 */
const dbUang = {
    check: () => {
        if (!existsSync('./json')) mkdirSync('./json', { recursive: true })
        if (!existsSync(uangPath)) writeFileSync(uangPath, JSON.stringify({}, null, 2))
    },
    
    addGaji: (jid) => {
        dbUang.check()
        try {
            // 1. Normalisasi JID yang sangat ketat
            let cleanJid = jid.split('@')[0].split(':')[0] + '@s.whatsapp.net'
            
            // 2. Baca file secara fresh
            let data = {}
            const content = readFileSync(uangPath, 'utf-8')
            if (content) data = JSON.parse(content)
            
            // 3. Tambah Saldo (Pastikan angka, bukan string)
            let current = data[cleanJid] ? parseInt(data[cleanJid]) : 0
            data[cleanJid] = current + GAJI_PER_CHAT
            
            // 4. Tulis ulang (Pakai null, 2 agar rapi dilihat)
            writeFileSync(uangPath, JSON.stringify(data, null, 2), 'utf-8')
            
            return data[cleanJid]
        } catch (e) {
            console.error(chalk.red('❌ Gagal Update Gaji:'), e)
            return 0
        }
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
    try {
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
        
        // ==== SISTEM GAJI OTOMATIS (Rp75 per Chat) ====
        // Setiap kali user mengirim pesan (bukan bot), saldo bertambah Rp75
        let currentMoney = 0
        if (!m.fromMe) {
            currentMoney = dbUang.addGaji(m.sender)
        } else {
            // Jika bot yang bicara, cukup ambil saldo tanpa menambah gaji
            const data = JSON.parse(readFileSync(uangPath, 'utf-8'))
            let cleanJid = m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net'
            currentMoney = data[cleanJid] || 0
        }

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

        // ==== LOG TERMINAL ====
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
                `Lv.${user.level || 0} ✦ Rp${currentMoney.toLocaleString('id-ID')} (+75) ✦ Limit ${user.limit || 0}`
            ),
            '\n' + chalk.hex('#ffb6ff')('╰────────────────────────────────────────')
        )

        // ==== LOG PESAN TEKS ====
        if (typeof m.text === 'string' && m.text) {
            let log = m.text.replace(/\u200e+/g, '')

            if (m.mentionedJid) {
                for (let jid of m.mentionedJid) {
                    log = log.replace(
                        '@' + jid.split('@')[0],
                        chalk.cyanBright('@' + conn.getName(jid))
                    )
                }
            }

            if (m.error) console.log(chalk.redBright('💥 Error: ' + log))
            else if (m.isCommand) console.log(chalk.greenBright('⚡ Command: ' + log))
            else console.log(chalk.white('🚩 Chat: ' + log))
        }

        // ==== INFO MEDIA ====
        if (/document/i.test(m.mtype)) {
            console.log(chalk.blue('📘 File:'), m.msg.fileName || m.msg.displayName || '-')
        } else if (/contact/i.test(m.mtype)) {
            console.log(chalk.blue('👤 Kontak:'), m.msg.displayName || '-')
        } else if (/audio/i.test(m.mtype)) {
            const duration = m.msg.seconds || 0
            console.log(
                chalk.magenta(
                    `🎧 Durasi: ${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(
                        duration % 60
                    ).padStart(2, '0')}`
                )
            )
        }

        console.log()

    } catch (e) {
        console.error(chalk.red('💀 Logger Crash:'), e)
    }
}

let file = global.__filename(import.meta.url)
watchFile(file, () => {
    console.log(chalk.magentaBright("✨ Senpai updated 'lib/print.js' ✨"))
})