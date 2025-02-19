const express = require("express");
const { createCanvas, loadImage, registerFont } = require("canvas");

const router = express.Router();

// Registrar una fuente para mejorar la compatibilidad con los nombres de usuario
registerFont("arial.ttf", { family: "Arial" });

router.get("/", async (req, res) => {
    try {
        const { avatar, username, background, usernameposicion, avatarposicion, avatartamano } = req.query;

        if (!avatar || !username || !background || !usernameposicion || !avatarposicion) {
            return res.status(400).json({ error: "Faltan parámetros requeridos" });
        }

        // Dimensiones de la tarjeta
        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext("2d");

        // Cargar imágenes
        const bgImage = await loadImage(background);
        const avatarImage = await loadImage(avatar);

        // Dibujar el fondo
        ctx.drawImage(bgImage, 0, 0, 800, 400);

        // Definir tamaño del avatar (por defecto 100x100)
        const avatarSize = avatartamano ? parseInt(avatartamano) : 100;

        // Dibujar avatar con recorte redondeado
        const [avatarX, avatarY] = avatarposicion.split(",").map(Number);
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        // Dibujar el nombre de usuario con sombra
        const [usernameX, usernameY] = usernameposicion.split(",").map(Number);
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 5;
        ctx.fillText(username, usernameX, usernameY);

        // Enviar imagen como respuesta
        res.setHeader("Content-Type", "image/png");
        canvas.createPNGStream().pipe(res);

    } catch (error) {
        console.error("Error generando la BoostCard:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;

