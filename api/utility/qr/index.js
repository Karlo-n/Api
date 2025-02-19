const express = require('express');
const QRCode = require('qrcode');

const router = express.Router();

router.get('/', async (req, res) => {
    console.log("📌 Petición recibida en /api/utility/qr");

    const { text } = req.query;

    if (!text) {
        console.log("⚠️ Falta el parámetro 'text'");
        return res.status(400).json({ error: "Falta el parámetro 'text' en la URL" });
    }

    try {
        const qrCodeData = await QRCode.toDataURL(text);
        console.log("✅ QR generado correctamente");
        res.json({ qr: qrCodeData });
    } catch (error) {
        console.error("❌ Error generando el código QR:", error);
        res.status(500).json({ error: "Error generando el código QR" });
    }
});

module.exports = router;
