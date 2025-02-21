const express = require("express");
const axios = require("axios");
const { chromium } = require("playwright");
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

        // 📸 **Captura de pantalla con Playwright**
        if (foto === "true") {
            const browser = await chromium.launch({
                headless: true, // Usa modo sin interfaz gráfica
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });

            const page = await browser.newPage();
            await page.goto(`https://www.roblox.com/users/${usuario}/profile`, { waitUntil: "load", timeout: 10000 });
            
            await page.waitForTimeout(3000); // Esperar 3 segundos para cargar contenido dinámico

            const screenshotBuffer = await page.screenshot({ fullPage: true });

            await browser.close();

            res.setHeader("Content-Type", "image/png");
            return res.send(screenshotBuffer);
        }

        res.json(responseData);
    } catch (error) {
        console.error("❌ Error en la API:", error);
        res.status(500).json({ error: "❌ Error al obtener datos de Roblox o tomar la captura." });
    }
});

module.exports = router;
