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

// Cargar la fuente personalizada
const fontPath = path.join(__dirname, "Oswald-VariableFont_wght.ttf");
Canvas.registerFont(fontPath, { family: "Oswald" });

// Ruta del corazón
const heartPath = path.join(__dirname, "corazon.png");

router.get("/", async (req, res) => {
    try {
        let { avatar1, avatar2, love_percentage, user1, user2 } = req.query;

        if (!avatar1 || !avatar2) {
            return res.status(400).json({ error: "Faltan parámetros: avatar1 y avatar2" });
        }

        // Si no hay porcentaje en la URL, generarlo y redirigir con él
        if (!love_percentage) {
            const randomLove = Math.floor(Math.random() * 101);
            return res.redirect(
                `${req.protocol}://${req.get("host")}${req.path}?avatar1=${encodeURIComponent(avatar1)}&avatar2=${encodeURIComponent(avatar2)}&user1=${user1 || "User 1"}&user2=${user2 || "User 2"}&love_percentage=${randomLove}`
            );
        }

        // Seleccionar fondo aleatorio
        const backgroundUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

        // Crear el lienzo
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

        const background = await loadImage(backgroundUrl);
        const avatarImg1 = await loadImage(avatar1);
        const avatarImg2 = await loadImage(avatar2);
        const heartImg = await Canvas.loadImage(heartPath);

        if (!background || !avatarImg1 || !avatarImg2 || !heartImg) {
            return res.status(500).json({ error: "Error al cargar las imágenes." });
        }

        // Dibujar el fondo
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Agregar sombras a los avatares para que resalten
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 15;

        // Dibujar avatares con borde blanco
        ctx.save();
        ctx.beginPath();
        ctx.arc(200, 200, 75, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg1, 125, 125, 150, 150);
        ctx.restore();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.arc(600, 200, 75, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg2, 525, 125, 150, 150);
        ctx.restore();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 5;
        ctx.stroke();

        // Dibujar corazón en el centro
        ctx.drawImage(heartImg, 350, 150, 100, 100);

        // Establecer color del texto según el porcentaje
        let color = "white";
        if (love_percentage <= 30) color = "black";
        else if (love_percentage <= 60) color = "yellow";
        else if (love_percentage <= 90) color = "pink";
        else color = "red";

        // Agregar texto con el porcentaje de amor
        ctx.font = "bold 45px Oswald";
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.fillText(`${love_percentage}%`, 400, 210); // Posición centrada en el corazón

        // Agregar nombres debajo de los avatares
        ctx.font = "bold 30px Oswald";
        ctx.fillStyle = "white";
        ctx.fillText(user1 || "User 1", 200, 320);
        ctx.fillText(user2 || "User 2", 600, 320);

        // Enviar imagen como respuesta
        res.setHeader("Content-Type", "image/png");
        canvas.createPNGStream().pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al generar la imagen de ship" });
    }
});

module.exports = router;
