const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { usuario, foto } = req.query;

        if (!usuario) {
            return res.status(400).json({ error: "Debes proporcionar un ID de usuario válido." });
        }

        let responseData = {};

        // 📌 Obtener datos del usuario
        const userData = await axios.get(`https://users.roblox.com/v1/users/${usuario}`);
        const avatarData = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${usuario}&size=420x420&format=Png&isCircular=false`);

        responseData = {
            "👤 Usuario": userData.data.name,
            "📛 Nombre para mostrar": userData.data.displayName,
            "🆔 ID": userData.data.id,
            "📅 Cuenta creada": new Date(userData.data.created).toLocaleDateString(),
            "🔗 Perfil": `https://www.roblox.com/users/${userData.data.id}/profile`,
            "🖼️ Avatar": avatarData.data.data[0]?.imageUrl || "No disponible",
            "📖 Descripción": userData.data.description || "No tiene descripción"
        };

        // 📸 **Captura de pantalla con `capture-website`**
        if (foto === "true") {
            const captureWebsite = await import("capture-website");

            const screenshotBuffer = await captureWebsite.buffer(`https://www.roblox.com/users/${usuario}/profile`, {
                fullPage: true,
                delay: 3, // Espera 3 segundos antes de tomar la captura
                launchOptions: {
                    args: ["--no-sandbox", "--disable-setuid-sandbox"]
                }
            });

            res.setHeader("Content-Type", "image/png");
            return res.send(screenshotBuffer);
        }

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "❌ Error al obtener datos de Roblox." });
    }
});

module.exports = router;
