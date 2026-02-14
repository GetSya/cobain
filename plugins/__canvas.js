import { Canvas, loadImage } from 'skia-canvas';
import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, text }) => {
    let name = text ? text : (global.db.data.users[m.sender]?.name || conn.getName(m.sender));
    if (name.length > 20) name = name.substring(0, 20) + '...';

    const bgPath = path.join(process.cwd(), 'tmp', 'gambarbg.jpg');

    if (!fs.existsSync(bgPath)) {
        throw `❌ File background tidak ditemukan di: ./tmp/gambarbg.jpg`;
    }

    try {
        const canvas = new Canvas(1200, 675);
        const ctx = canvas.getContext('2d');

        const background = await loadImage(bgPath);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Overlay Gelap
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Teks Nama
        ctx.font = 'bold 100px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.toUpperCase(), canvas.width / 2, canvas.height / 2);

        // Render ke Buffer (Skia-Canvas menggunakan Promise)
        const buffer = await canvas.toBuffer('png');
        
        await conn.sendMessage(m.chat, { 
            image: buffer, 
            caption: `✅ Selesai meracik gambar secara lokal untuk *${name}*!` 
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    }
}

handler.help = ['canvas <nama>']
handler.tags = ['tools']
handler.command = /^(canvas|buatgambar)$/i

export default handler