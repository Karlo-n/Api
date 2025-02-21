const express = require("express");
const axios = require("axios");
const router = express.Router();
const fs = require("fs");
const path = require("path");

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

        // 📸 **Si el usuario quiere la captura de pantalla**
        if (foto === "true") {
            const screenshotUrl = `https://api.screenshotmachine.com?key=6bec0f&url=https://www.roblox.com/users/${usuario}/profile&dimension=1024x768`;
            const imagePath = path.join(__dirname, `${usuario}_screenshot.png`);

            // Descargar la imagen desde ScreenshotMachine
            const response = await axios({
                url: screenshotUrl,
                responseType: "arraybuffer"
            });

            // Guardar la imagen temporalmente
            fs.writeFileSync(imagePath, response.data);

            // Enviar la imagen como respuesta
            res.setHeader("Content-Type", "image/png");
            res.sendFile(imagePath, () => {
                fs.unlinkSync(imagePath); // Eliminar la imagen después de enviarla
            });

            return;
        }

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "❌ Error al obtener datos de Roblox o generar la captura." });
    }
});

module.exports = router;
