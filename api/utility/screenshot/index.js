const express = require("express");
const axios = require("axios");
const router = express.Router();

// Clave de ScreenshotMachine (cámbiala si usas otra API)
const SCREENSHOT_API_KEY = "6bec0f";
const SCREENSHOT_API_URL = "https://api.screenshotmachine.com/";

router.get("/", async (req, res) => {
    try {
        const { url, dimension } = req.query;

        if (!url) {
            return res.status(400).json({ error: "Debes proporcionar un URL válido." });
        }

        const imageUrl = `${SCREENSHOT_API_URL}?key=${SCREENSHOT_API_KEY}&url=${encodeURIComponent(url)}&dimension=${dimension || "1024x768"}`;

        // 🔄 **Descargar la imagen y enviarla directamente**
        const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

        res.setHeader("Content-Type", "image/png");
        res.send(Buffer.from(response.data));

    } catch (error) {
        console.error("❌ Error al capturar la pantalla:", error);
        res.status(500).json({ error: "No se pudo capturar la pantalla." });
    }
});

module.exports = router;
