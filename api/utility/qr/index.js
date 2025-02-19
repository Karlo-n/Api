const express = require('express');
const QRCode = require('qrcode');

const router = express.Router();

router.get('/', async (req, res) => {
    const { text } = req.query;

    if (!text) {
        return res.status(400).send('Falta el parámetro text en la consulta.');
    }

    try {
        res.setHeader('Content-Type', 'image/png');
        QRCode.toFileStream(res, text);
    } catch (error) {
        res.status(500).send('Error generando el código QR.');
    }
});

module.exports = router;
