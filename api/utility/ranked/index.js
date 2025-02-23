const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const path = require("path");
const router = express.Router();

// Registrar la fuente personalizada desde la raíz
const fontPath = path.resolve("Oswald-VariableFont_wght.ttf");
Canvas.registerFont(fontPath, { family: "Oswald" });

// Rutas de imágenes base según los parámetros
const backgrounds = {
    "normal": "obligatorio_api.png",
    "xpboost": "xpboostapi.png",
    "ranking": "rankingapi.png",
    "mensajes": "totalapi.png",
    "xprank": "xprankapi.png",
    "xptotal": "xptotalapi.png",
    "ranktotal": "ranktotalapi.png",
    "totalxpranking": "totalxprankingapi.png"
};

router.get("/", async (req, res) => {
    try {
        const { avatar, username, nivel, xp, xpmax, rango, xpboost, ranking, mensajes } = req.query;

        // Validación de parámetros obligatorios
        if (!avatar || !username || !nivel || !xp || !xpmax || !rango) {
            return res.status(400).json({ error: "Faltan parámetros obligatorios: avatar, username, nivel, xp, xpmax, rango" });
        }

        // Determinar la imagen base según los parámetros opcionales
        let backgroundKey = "normal";
        if (xpboost && ranking && mensajes) backgroundKey = "totalxpranking";
        else if (xpboost && ranking) backgroundKey = "xprank";
        else if (xpboost && mensajes) backgroundKey = "xptotal";
        else if (ranking && mensajes) backgroundKey = "ranktotal";
        else if (xpboost) backgroundKey = "xpboost";
        else if (ranking) backgroundKey = "ranking";
        else if (mensajes) backgroundKey = "mensajes";

        const backgroundPath = path.join(__dirname, backgrounds[backgroundKey]);

        // Crear el lienzo
        const canvas = Canvas.createCanvas(900, 400);
        const ctx = canvas.getContext("2d");

        // Función para cargar imágenes
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
        const background = await Canvas.loadImage(backgroundPath);
        const avatarImage = await loadImage(avatar);

        if (!background || !avatarImage) {
            return res.status(500).json({ error: "Error al cargar las imágenes." });
        }

        // Dibujar el fondo expandido sin márgenes blancos
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Dibujar avatar correctamente en un marco más ancho
        const avatarX = 2; // Posición X
        const avatarY = 0; // Posición Y
        const avatarWidth = 180; // Expandido solo en X
        const avatarHeight = 160; // Mantiene la altura

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(
            avatarX + avatarWidth / 2, // Centro X
            avatarY + avatarHeight / 2, // Centro Y
            avatarWidth / 2, // Radio X (más ancho)
            avatarHeight / 2, // Radio Y (altura igual)
            0, 0, Math.PI * 2
        );
        ctx.clip();
        ctx.drawImage(avatarImage, avatarX, avatarY, avatarWidth, avatarHeight);
        ctx.restore();

        // Estilos de texto
        ctx.fillStyle = "#b0b0b0";
        ctx.textAlign = "left";

        // Dibujar nombre de usuario
        ctx.font = "bold 35px Oswald";
        ctx.fillText(username, 220, 50);

        // Dibujar nivel
        ctx.font = "bold 25px Oswald";
        ctx.fillText(`Nivel: ${nivel}`, 220, 100);

        // Dibujar XP
        ctx.font = "20px Oswald";
        ctx.fillText(`XP: ${xp} / ${xpmax}`, 220, 150);

        // Dibujar barra de XP con esquinas redondeadas
        const barX = 220;
        const barY = 170;
        const barWidth = 500;
        const barHeight = 25;
        const filledWidth = (xp / xpmax) * barWidth;

        // Fondo de la barra
        ctx.fillStyle = "#777777";
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 12);
        ctx.fill();

        // Barra de progreso: Amarillo con boost, Azul sin boost
        ctx.fillStyle = xpboost ? "#FFD700" : "#3498db";
        ctx.beginPath();
        ctx.roundRect(barX, barY, filledWidth, barHeight, 12);
        ctx.fill();

        // Dibujar rango
        ctx.font = "bold 20px Oswald";
        ctx.fillText(`Rango: ${rango}`, 220, 220);

        // Parámetros opcionales
        let yOffset = 260;
        if (xpboost) {
            ctx.fillText(`XP Boost: ${xpboost}x`, 220, yOffset);
            yOffset += 40;
        }
        if (ranking) {
            ctx.fillText(`Ranking: #${ranking}`, 220, yOffset);
            yOffset += 40;
        }
        if (mensajes) {
            ctx.fillText(`Mensajes Totales: ${mensajes}`, 220, yOffset);
        }

        // Enviar imagen generada
        res.setHeader("Content-Type", "image/png");
        canvas.createPNGStream().pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al generar la imagen de la tarjeta de nivel." });
    }
});

module.exports = router;
