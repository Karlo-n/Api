const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const path = require("path");
const router = express.Router();

// Fondos de anime aleatorios
const backgrounds = [
    "https://wallpapers.com/images/hd/cute-anime-couple-holding-hands-sunset-6st7c0vnw0wffssj.jpg",
    "https://img.freepik.com/premium-photo/anime-couple-holding-hands-field-flowers-generative-ai_974533-22369.jpg",
    "https://th.bing.com/th/id/OIP.RI5mDg5pyJBQjtotMJ4YIgHaEK?rs=1&pid=ImgDetMain"
];

// **Ruta correcta de la fuente (desde la raíz del proyecto)**
const fontPath = path.join(__dirname, "../../Oswald-VariableFont_wght.ttf");
Canvas.registerFont(fontPath, { family: "Oswald" });

// Ruta del corazón en /api/fun/ship
const heartPath = path.join(__dirname, "corazon.png");

router.get("/", async (req, res) => {
    try {
        const { avatar1, avatar2, json, user1, user2 } = req.query;

        if (!avatar1 || !avatar2) {
            return res.status(400).json({ error: "Faltan parámetros: avatar1 y avatar2" });
        }

        // Generar porcentaje aleatorio (1 - 100)
        const lovePercentage = Math.floor(Math.random() * 101);

        // Si el usuario quiere JSON, enviamos solo la info
        if (json === "true") {
            return res.json({
                message: "❤️ Compatibilidad de pareja ❤️",
                avatar1: avatar1,
                avatar2: avatar2,
                love_percentage: `${lovePercentage}%`
            });
        }

        // Seleccionar un fondo aleatorio
        const backgroundUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

        // Crear lienzo
        const canvas = Canvas.createCanvas(800, 400);
        const ctx = canvas.getContext("2d");

        // Cargar imágenes
        const loadImage = async (url) => {
            try {
                const response = await axios.get(url, { responseType: "arraybuffer" });
                return await Canvas.loadImage(Buffer.from(response.data));
            } catch (error) {
                console.error(`Error cargando la imagen: ${url}`, error);
                return null;
            }
        };

        // Cargar imágenes correctamente
        const background = await loadImage(backgroundUrl);
        const avatarImg1 = await loadImage(avatar1);
        const avatarImg2 = await loadImage(avatar2);
        const heartImg = await Canvas.loadImage(heartPath);

        if (!background || !avatarImg1 || !avatarImg2 || !heartImg) {
            return res.status(500).json({ error: "Error al cargar las imágenes." });
        }

        // Dibujar el fondo
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Dibujar avatares con bordes
        ctx.save();
        ctx.beginPath();
        ctx.arc(200, 200, 75, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg1, 125, 125, 150, 150);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(600, 200, 75, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg2, 525, 125, 150, 150);
        ctx.restore();

        // Dibujar corazón en el centro
        ctx.drawImage(heartImg, 350, 150, 100, 100);

        // Configurar color según el porcentaje
        let color = "white";
        if (lovePercentage <= 30) color = "black";
        else if (lovePercentage <= 60) color = "yellow";
        else if (lovePercentage <= 90) color = "pink";
        else color = "red";

        // **Dibujar el porcentaje con fuente Oswald**
        ctx.font = "bold 45px Oswald";
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.fillText(`${lovePercentage}%`, 403, 210); // Posición en el corazón

        // **Agregar nombres debajo de los avatares**
        ctx.font = "bold 30px Oswald";
        ctx.fillStyle = "white";
        ctx.fillText(user1 || "User 1", 200, 320);
        ctx.fillText(user2 || "User 2", 600, 320);

        // **Establecer cabeceras JSON en la URL**
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Love-Percentage", `${lovePercentage}%`);

        // **Enviar imagen como respuesta**
        res.setHeader("Content-Type", "image/png");
        canvas.createPNGStream().pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al generar la imagen de ship" });
    }
});

module.exports = router;
