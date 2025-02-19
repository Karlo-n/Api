const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/', async (req, res) => {
    const { text, to } = req.query;

    if (!text || !to) {
        return res.status(400).json({
            error: "Faltan parámetros. Usa ?text=Hola&to=en"
        });
    }

    try {
        const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
            params: {
                client: 'gtx',
                sl: 'auto',
                tl: to,
                dt: 't',
                q: text
            }
        });

        const translatedText = response.data[0].map(item => item[0]).join('');

        res.json({
            original: text,
            translated: translatedText,
            to
        });

    } catch (error) {
        res.status(500).json({
            error: "Hubo un error al traducir.",
            details: error.message
        });
    }
});

module.exports = router;
