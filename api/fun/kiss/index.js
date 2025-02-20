const express = require("express");
const router = express.Router();

// Lista de GIFs de besos de anime (50+ GIFs)
const kissGifs = [
    "https://usagif.com/wp-content/uploads/anime-kiss-16.gif",
    "https://pa1.narvii.com/5939/70a3e6f51aae6a89e29dce8eed68b34cd497907e_hq.gif",
    "https://media.tenor.com/3E9wNPpnltUAAAAM/zerotwo-anime.gif",
    "https://media.tenor.com/rm3WYOj5pR0AAAAM/engage-kiss-anime-kiss.gif",
    "https://media.tenor.com/H7ElWf1bKUkAAAAM/anime-kiss-miyamura-kiss.gif",
    "https://media.tenor.com/vtOmnXkckscAAAAM/kiss.gif",
    "https://media.tenor.com/fXn_Vgx-92YAAAAM/yuri-kiss.gif",
    "https://media.tenor.com/ebi-Gt7Rr_IAAAAM/funny.gif",
    "https://media.tenor.com/2MZgbU7fxrUAAAAM/tomo-chan-is-a-girl-kiss-anime.gif",
    "https://media.tenor.com/rS045JX-WeoAAAAM/anime-love.gif",
    "https://media.tenor.com/25Rz_PwWSHgAAAAM/anime-kiss.gif",
    "https://media.tenor.com/cbIOD1pMlEQAAAAM/mst.gif",
    "https://media.tenor.com/9OV4Q-nMTxsAAAAM/yosuga-no-sora-anime-kiss.gif",
    "https://media.tenor.com/GoPV-W2pxMUAAAAM/kiss.gif",
    "https://media.tenor.com/K6ED8Jkuw2MAAAAM/gray-gray-fullbuster.gif",
    "https://media.tenor.com/QhHQ-qyFGe0AAAAM/kiss-anime.gif",
    "https://media.tenor.com/W0jyFZxQ1iEAAAA1/anime-anime-kiss.webp",
    "https://media.tenor.com/YeitcPAdSCYAAAAM/kyo-x-tohru-kiss.gif",
    "https://media.tenor.com/L-NTpww8HTUAAAAM/kiss-anime-anime-kiss.gif",
    "https://media.tenor.com/lyuW54_wDU0AAAAM/kiss-anime.gif",
    "https://media.tenor.com/NZUQilMD3IIAAAAM/horimiya-izumi-miyamura.gif",
    "https://media.tenor.com/g8AeFZoe7dsAAAAM/kiss-anime-kiss.gif",
    "https://media.tenor.com/2-Wymg2o2iYAAAAM/oshi-no-ko-onk.gif",
    "https://media.tenor.com/b7DWF8ecBkIAAAAM/kiss-anime-anime.gif",
    "https://media.tenor.com/F02Ep3b2jJgAAAAM/cute-kawai.gif",
    "https://media.tenor.com/ZtBQKjC-edkAAAAM/misaki-kamiigusa.gif",
    "https://media.tenor.com/dn_KuOESmUYAAAAM/engage-kiss-anime-kiss.gif",
    "https://media.tenor.com/OByUsNZJyWcAAAAM/emre-ada.gif",
    "https://media.tenor.com/4KLQYilRM0IAAAAM/anime-val-ally.gif",
    "https://media.tenor.com/3wE3JNW0fswAAAAM/anime-kiss-love.gif",
    "https://media.tenor.com/XB3mEB77l7EAAAAM/kiss.gif",
    "https://media.tenor.com/efL3AfFZ8UIAAAAM/kiss-anime-anime-sleep.gif",
    "https://media.tenor.com/1SBrq4NinsEAAAAM/yoshikazu-kisses-kiyone-on-her-cheeks.gif",
    "https://media.tenor.com/WN1SVoPkdRIAAAAM/anime-kiss.gif",
    "https://media.tenor.com/kkBRxFGXbxYAAAAM/kiss.gif",
    "https://media.tenor.com/Gjv94meG9S0AAAAM/anime-kiss-anime.gif",
    "https://media.tenor.com/BZyWzw2d5tAAAAAM/hyakkano-100-girlfriends.gif",
    "https://media.tenor.com/r9ZU-Edb_NgAAAAM/kiss-anime-couple-kiss-neck-anime.gif",
    "https://pa1.narvii.com/6001/1b811119db6c746925864948eb9925ca5ab63450_hq.gif",
    "https://ahegao.b-cdn.net/wp-content/uploads/2019/05/best-anime-kisses-steinsgate.gif",
    "https://img1.ak.crunchyroll.com/i/spire1/f0867433afc6aefaaa51b9cebaba8e891365107409_full.gif",
    "https://i.pinimg.com/originals/23/a9/a5/23a9a5be8e05bb99777b023b96f8b485.gif",
    "https://i.pinimg.com/originals/e6/e3/2c/e6e32c4444375147c831352f2c7f2d6d.gif",
    "https://i.pinimg.com/originals/ea/9a/07/ea9a07318bd8400fbfbd658e9f5ecd5d.gif",
    "https://media.tenor.com/NoQvxyA4H0YAAAAC/engage-kiss-kisara.gif",
    "https://media.tenor.com/rm3WYOj5pR0AAAAC/engage-kiss-anime-kiss.gif",
    "https://i.pinimg.com/originals/45/6d/27/456d27f7aa1f3fc0f8df7019823cdfb9.gif",
    "https://i.pinimg.com/originals/d8/16/ec/d816ec1ce2bcaa7c2871673f8fa186dd.gif"
];

// Ruta para obtener un GIF aleatorio de beso
router.get("/", (req, res) => {
    try {
        const randomGif = kissGifs[Math.floor(Math.random() * kissGifs.length)];
        res.json({ kiss_gif: randomGif });
    } catch (error) {
        console.error("Error generando el GIF de beso:", error);
        res.status(500).json({ error: "Error al obtener el GIF de beso" });
    }
});

module.exports = router;
