const express = require("express");
const axios = require("axios");
const { chromium } = require("playwright");
const { execSync } = require("child_process"); // Agregamos esto
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

        // 📸 **Captura de pantalla si el usuario lo solicita**
        if (foto === "true") {
            try {
                // 🔧 **Forzar instalación de Chromium si no existe**
                execSync("npx playwright install --with-deps", { stdio: "inherit" });

                // 🚀 Iniciar navegador en modo headless
                const browser = await chromium.launch({
                    headless: true,
                    args: [
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--no-first-run",
                        "--no-zygote"
                    ]
                });

                const page = await browser.newPage();
                await page.goto(`https://www.roblox.com/users/${usuario}/profile`, { waitUntil: "domcontentloaded" });

                await page.waitForTimeout(3000);

                const screenshot = await page.screenshot({ fullPage: true });

                await browser.close();
                res.setHeader("Content-Type", "image/png");
                return res.send(screenshot);

            } catch (err) {
                console.error("❌ Error al tomar la captura:", err);
                return res.status(500).json({ error: "❌ No se pudo tomar la captura de pantalla." });
            }
        }

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "❌ Error al obtener datos de Roblox." });
    }
});

module.exports = router;
