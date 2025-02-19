const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { avatar, username, background, usernameposicion, avatarposicion } = req.query;

        if (!avatar || !username || !background || !usernameposicion || !avatarposicion) {
            return res.status(400).json({ error: "Faltan parámetros. Debes incluir avatar, username, background, usernameposicion y avatarposicion." });
        }

        // Convertir posiciones a números
        const [avatarX, avatarY] = avatarposicion.split(',').map(Number);
        const [usernameX, usernameY] = usernameposicion.split(',').map(Number);

        // Crear canvas
        const width = 800, height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Cargar imágenes
        const backgroundImage = await loadImage(background);
        const avatarImage = await loadImage(avatar);

        // Dibujar fondo
        ctx.drawImage(backgroundImage, 0, 0, width, height);

        // Dibujar avatar (redondeado)
        const avatarSize = 100;
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        // Dibujar texto de username
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(username, usernameX, usernameY);

        // Enviar la imagen generada
        res.setHeader('Content-Type', 'image/png');
        canvas.createPNGStream().pipe(res);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al generar la BoostCard." });
    }
});

module.exports = router;
