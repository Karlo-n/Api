const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const path = require("path");
const router = express.Router();

// Registrar la fuente desde la raíz
const fontPath = path.join(__dirname, "Nexa-Heavy.ttf");
Canvas.registerFont(fontPath, { family: "Nexa" });

router.get("/", async (req, res) => {
    try {
        const { avatar, texto1, texto2, texto3, background, texto1posicion, texto2posicion, texto3posicion, avatarposicion, color } = req.query;

        if (!avatar || !texto1 || !texto2 || !texto3 || !background) {
            return res.status(400).json({ error: "Faltan parámetros obligatorios. Debes enviar avatar, texto1, texto2, texto3 y background." });
        }

        // Crear el lienzo (Tamaño 800x400)
        const canvas = Canvas.createCanvas(800, 400);
        const ctx = canvas.getContext("2d");

        // Función para cargar imágenes de forma segura
        const loadImage = async (url) => {
            try {
                const response = await axios.get(url, { responseType: "arraybuffer" });
                return await Canvas.loadImage(Buffer.from(response.data));
            } catch (error) {
                console.error(`Error al cargar la imagen: ${url}`, error);
                return null;
            }
        };

        // Cargar imágenes
        const backgroundImage = await loadImage(background);
        const avatarImage = await loadImage(avatar);

        if (!backgroundImage || !avatarImage) {
            return res.status(500).json({ error: "Error al cargar las imágenes." });
        }

        // Dibujar el fondo
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        // **Posiciones por defecto**
        const avatarPos = avatarposicion ? avatarposicion.split(",").map(Number) : [50, 100]; // [x, y]
        const texto1Pos = texto1posicion ? texto1posicion.split(",").map(Number) : [250, 100];
        const texto2Pos = texto2posicion ? texto2posicion.split(",").map(Number) : [250, 180];
        const texto3Pos = texto3posicion ? texto3posicion.split(",").map(Number) : [250, 260];

        // **Dibujar el avatar con borde negro muy delgado**
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarPos[0] + 50, avatarPos[1] + 50, 50, 0, Math.PI * 2); // Círculo de avatar
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImage, avatarPos[0], avatarPos[1], 100, 100);
        ctx.restore();

        // **Borde negro delgado**
        ctx.lineWidth = 2; // Muy delgado
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.arc(avatarPos[0] + 50, avatarPos[1] + 50, 50, 0, Math.PI * 2);
        ctx.stroke();

        // **Color de texto (por defecto blanco)**
        const textColor = color || "white";

        // **Dibujar los textos con la fuente Nexa**
        ctx.font = "bold 30px Nexa";
        ctx.fillStyle = textColor;
        ctx.textAlign = "left";
        ctx.fillText(texto1, texto1Pos[0], texto1Pos[1]);
        ctx.fillText(texto2, texto2Pos[0], texto2Pos[1]);
        ctx.fillText(texto3, texto3Pos[0], texto3Pos[1]);

        // Enviar la imagen generada
        res.setHeader("Content-Type", "image/png");
        canvas.createPNGStream().pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al generar la imagen de bienvenida." });
    }
});

module.exports = router;


module.exports = router;
