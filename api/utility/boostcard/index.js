const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

const router = express.Router();

// Carga la fuente desde la carpeta correcta
registerFont(path.join(__dirname, 'Oswald-VariableFont_wght.ttf'), { family: 'Oswald' });

router.get('/', async (req, res) => {
    try {
        const { avatar, username, background, usernameposicion, avatarposicion } = req.query;
        
        // Verifica si todos los parámetros están presentes
        if (!avatar || !username || !background || !usernameposicion || !avatarposicion) {
            return res.status(400).json({ error: 'Faltan parámetros en la URL' });
        }

        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext('2d');

        // Cargar imágenes
        const bgImage = await loadImage(background);
        const avatarImage = await loadImage(avatar);

        ctx.drawImage(bgImage, 0, 0, 800, 400);
        ctx.drawImage(avatarImage, parseInt(avatarposicion.split(',')[0]), parseInt(avatarposicion.split(',')[1]), 100, 100);
        
        // Configurar fuente
        ctx.font = '30px Oswald';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(username, parseInt(usernameposicion.split(',')[0]), parseInt(usernameposicion.split(',')[1]));

        res.setHeader('Content-Type', 'image/png');
        res.end(canvas.toBuffer());
    } catch (error) {
        res.status(500).json({ error: 'Error al generar la imagen', details: error.message });
    }
});

module.exports = router; // 🚀 Exporta el router correctamente
