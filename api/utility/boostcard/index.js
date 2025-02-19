const { createCanvas, loadImage, registerFont } = require('canvas');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Registrar la nueva fuente
registerFont(path.join(__dirname, 'Oswald-VariableFont_wght.ttf'), { family: 'Oswald' });

app.get('/api/utility/boostcard', async (req, res) => {
    try {
        const { avatar, username, background, usernameposicion, avatarposicion } = req.query;

        if (!avatar || !username || !background || !usernameposicion || !avatarposicion) {
            return res.status(400).json({ error: 'Faltan parámetros obligatorios' });
        }

        const [xUser, yUser] = usernameposicion.split(',').map(Number);
        const [xAvatar, yAvatar] = avatarposicion.split(',').map(Number);

        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext('2d');

        // Cargar la imagen de fondo
        const bg = await loadImage(background);
        ctx.drawImage(bg, 0, 0, 800, 400);

        // Cargar el avatar
        const avatarImg = await loadImage(avatar);
        ctx.drawImage(avatarImg, xAvatar, yAvatar, 100, 100); // Ajusta tamaño según necesites

        // Estilo del texto
        ctx.font = '30px Oswald';
        ctx.fillStyle = '#fff';
        ctx.fillText(username, xUser, yUser);

        // Enviar la imagen como respuesta
        res.setHeader('Content-Type', 'image/png');
        res.send(canvas.toBuffer());
    } catch (error) {
        console.error('Error al generar la boostcard:', error);
        res.status(500).json({ error: 'Error interno al generar la boostcard' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
