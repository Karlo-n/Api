const express = require('express');
const gTTS = require('gtts');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { text, lang = 'es' } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Falta el parámetro "text"' });
        }

        const gtts = new gTTS(text, lang);
        
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': 'inline; filename="tts-audio.mp3"'
        });

        gtts.stream().pipe(res);

    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: error.message });
    }
});

module.exports = router;
