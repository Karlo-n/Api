const express = require('express');
const QRCode = require('qrcode');

const router = express.Router();

router.get('/', async (req, res) => {
    const { text } = req.query;

    if (!text) {
        return res.status(400).json({ error: "Falta el parámetro 'text' en la URL" });
    }

    try {
        const qrCodeData = await QRCode.toDataURL(text);
        res.json({ qr: qrCodeData });
    } catch (error) {
        res.status(500).json({ error: "Error generando el código QR" });
    }
});

module.exports = router;
