const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const router = express.Router();

// Lista de GIFs con nombres de animes
const kissGifs = [
    { url: "https://usagif.com/wp-content/uploads/anime-kiss-16.gif", anime: "Usagi Drop" },
    { url: "https://pa1.narvii.com/5939/70a3e6f51aae6a89e29dce8eed68b34cd497907e_hq.gif", anime: "Kaichou wa Maid-sama!" },
    { url: "https://media.tenor.com/3E9wNPpnltUAAAAM/zerotwo-anime.gif", anime: "Darling in the FranXX" },
    { url: "https://media.tenor.com/rm3WYOj5pR0AAAAM/engage-kiss-anime-kiss.gif", anime: "Engage Kiss" },
    { url: "https://media.tenor.com/H7ElWf1bKUkAAAAM/anime-kiss-miyamura-kiss.gif", anime: "Horimiya" },
    { url: "https://media.tenor.com/vtOmnXkckscAAAAM/kiss.gif", anime: "Tonikawa: Over The Moon For You" },
    { url: "https://media.tenor.com/fXn_Vgx-92YAAAAM/yuri-kiss.gif", anime: "Citrus" },
    { url: "https://media.tenor.com/ebi-Gt7Rr_IAAAAM/funny.gif", anime: "Kaguya-sama: Love is War" },
    { url: "https://media.tenor.com/2MZgbU7fxrUAAAAM/tomo-chan-is-a-girl-kiss-anime.gif", anime: "Tomo-chan wa Onnanoko!" },
    { url: "https://media.tenor.com/rS045JX-WeoAAAAM/anime-love.gif", anime: "Toradora!" },
    { url: "https://media.tenor.com/25Rz_PwWSHgAAAAM/anime-kiss.gif", anime: "Toradora!" },
    { url: "https://media.tenor.com/cbIOD1pMlEQAAAAM/mst.gif", anime: "Kimi no Na wa" },
    { url: "https://media.tenor.com/9OV4Q-nMTxsAAAAM/yosuga-no-sora-anime-kiss.gif", anime: "Yosuga no Sora" },
    { url: "https://media.tenor.com/GoPV-W2pxMUAAAAM/kiss.gif", anime: "Ore Monogatari!!" },
    { url: "https://media.tenor.com/K6ED8Jkuw2MAAAAM/gray-gray-fullbuster.gif", anime: "Fairy Tail" },
    { url: "https://media.tenor.com/QhHQ-qyFGe0AAAAM/kiss-anime.gif", anime: "Rakudai Kishi no Cavalry" },
    { url: "https://media.tenor.com/W0jyFZxQ1iEAAAA1/anime-anime-kiss.webp", anime: "Anohana" },
    { url: "https://media.tenor.com/YeitcPAdSCYAAAAM/kyo-x-tohru-kiss.gif", anime: "Fruits Basket" },
    { url: "https://media.tenor.com/L-NTpww8HTUAAAAM/kiss-anime-anime-kiss.gif", anime: "Golden Time" },
    { url: "https://media.tenor.com/NZUQilMD3IIAAAAM/horimiya-izumi-miyamura.gif", anime: "Horimiya" },
    { url: "https://media.tenor.com/g8AeFZoe7dsAAAAM/kiss-anime-kiss.gif", anime: "Kimi no Na wa" },
    { url: "https://media.tenor.com/2-Wymg2o2iYAAAAM/oshi-no-ko-onk.gif", anime: "Oshi no Ko" },
    { url: "https://media.tenor.com/b7DWF8ecBkIAAAAM/kiss-anime-anime.gif", anime: "Nisekoi" },
    { url: "https://media.tenor.com/F02Ep3b2jJgAAAAM/cute-kawai.gif", anime: "Toradora!" },
    { url: "https://media.tenor.com/ZtBQKjC-edkAAAAM/misaki-kamiigusa.gif", anime: "Hentai Ouji to Warawanai Neko" },
    { url: "https://media.tenor.com/dn_KuOESmUYAAAAM/engage-kiss-anime-kiss.gif", anime: "Engage Kiss" },
    { url: "https://media.tenor.com/WN1SVoPkdRIAAAAM/anime-kiss.gif", anime: "Shigatsu wa Kimi no Uso" },
    { url: "https://media.tenor.com/kkBRxFGXbxYAAAAM/kiss.gif", anime: "Kaichou wa Maid-sama!" },
    { url: "https://media.tenor.com/r9ZU-Edb_NgAAAAM/kiss-anime-couple-kiss-neck-anime.gif", anime: "Kuzu no Honkai" },
    { url: "https://pa1.narvii.com/5939/70a3e6f51aae6a89e29dce8eed68b34cd497907e_hq.gif", anime: "Kaichou wa Maid-sama!" },
    { url: "https://media.tenor.com/3E9wNPpnltUAAAAM/zerotwo-anime.gif", anime: "Darling in the FranXX" },
    { url: "https://media.tenor.com/rm3WYOj5pR0AAAAM/engage-kiss-anime-kiss.gif", anime: "Engage Kiss" },
    { url: "https://media.tenor.com/H7ElWf1bKUkAAAAM/anime-kiss-miyamura-kiss.gif", anime: "Horimiya" },
    { url: "https://media.tenor.com/vtOmnXkckscAAAAM/kiss.gif", anime: "Tonikawa: Over The Moon For You" },
    { url: "https://media.tenor.com/fXn_Vgx-92YAAAAM/yuri-kiss.gif", anime: "Citrus" },
    { url: "https://media.tenor.com/ebi-Gt7Rr_IAAAAM/funny.gif", anime: "Kaguya-sama: Love is War" },
    { url: "https://media.tenor.com/WN1SVoPkdRIAAAAM/anime-kiss.gif", anime: "Shigatsu wa Kimi no Uso" },
    { url: "https://media.tenor.com/K6ED8Jkuw2MAAAAM/gray-gray-fullbuster.gif", anime: "Fairy Tail" },
    { url: "https://media.tenor.com/NoQvxyA4H0YAAAAC/engage-kiss-kisara.gif", anime: "Engage Kiss" },
    { url: "https://pa1.narvii.com/6001/1b811119db6c746925864948eb9925ca5ab63450_hq.gif", anime: "Chuunibyou demo Koi ga Shitai!" },
    { url: "https://ahegao.b-cdn.net/wp-content/uploads/2019/05/best-anime-kisses-steinsgate.gif", anime: "Steins;Gate" },
    { url: "https://img1.ak.crunchyroll.com/i/spire1/f0867433afc6aefaaa51b9cebaba8e891365107409_full.gif", anime: "Toradora!" },
    { url: "https://i.pinimg.com/originals/23/a9/a5/23a9a5be8e05bb99777b023b96f8b485.gif", anime: "Golden Time" },
    { url: "https://i.pinimg.com/originals/e6/e3/2c/e6e32c4444375147c831352f2c7f2d6d.gif", anime: "Clannad" },
    { url: "https://i.pinimg.com/originals/ea/9a/07/ea9a07318bd8400fbfbd658e9f5ecd5d.gif", anime: "Kaichou wa Maid-sama!" },
    { url: "https://media.tenor.com/XB3mEB77l7EAAAAM/kiss.gif", anime: "Kimi ni Todoke" },
    { url: "https://i.pinimg.com/originals/45/6d/27/456d27f7aa1f3fc0f8df7019823cdfb9.gif", anime: "Shakugan no Shana" },
    { url: "https://i.pinimg.com/originals/d8/16/ec/d816ec1ce2bcaa7c2871673f8fa186dd.gif", anime: "Sword Art Online" }
];

// **Ruta de la API**
router.get("/", async (req, res) => {
    try {
        // Seleccionar un GIF aleatorio
        const randomData = kissGifs[Math.floor(Math.random() * kissGifs.length)];
        const randomGif = randomData.url;
        const animeName = randomData.anime;

        // Cargar la imagen desde la URL
        const response = await axios.get(randomGif, { responseType: "arraybuffer" });
        const imgBuffer = Buffer.from(response.data);

        // Crear el lienzo
        const canvas = Canvas.createCanvas(500, 500);
        const ctx = canvas.getContext("2d");

        // Cargar la imagen en el lienzo
        const gifImage = await Canvas.loadImage(imgBuffer);
        ctx.drawImage(gifImage, 0, 0, 500, 500);

        // Agregar el nombre del anime
        ctx.font = "bold 20px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(animeName, 250, 480); // Ubicación del texto

        // Si el usuario quiere solo JSON, enviar respuesta sin imagen
        if (req.query.json === "true") {
            return res.json({
                message: "💋 Beso Anime 💋",
                anime: animeName,
                gif: randomGif
            });
        }

        // Enviar la imagen generada
        res.setHeader("Content-Type", "image/png");
        res.send(canvas.toBuffer());

    } catch (error) {
        console.error("Error al generar la imagen:", error);
        res.status(500).json({ error: "Error al generar la imagen de beso" });
    }
});

module.exports = router;
