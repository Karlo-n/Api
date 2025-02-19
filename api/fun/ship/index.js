const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const path = require("path");

const router = express.Router();

// Lista de fondos de anime aleatorios
const backgrounds = [
    "https://wallpapers.com/images/hd/cute-anime-couple-holding-hands-sunset-6st7c0vnw0wffssj.jpg",
    "https://img.freepik.com/premium-photo/anime-couple-holding-hands-field-flowers-generative-ai_974533-22369.jpg",
    "https://th.bing.com/th/id/OIP.RI5mDg5pyJBQjtotMJ4YIgHaEK?rs=1&pid=ImgDetMain"
];

// Ruta del corazón en la carpeta /api/fun/ship
const heartPath = path.join(__dirname, "corazon.png");

router.get("/", async (req, res) => {
    try {
        const { avatar1, avatar2 } = req.query;

        if (!avatar1 || !avatar2) {
            return res.status(400).json({ error: "Faltan parámetros. Debes enviar avatar1 y avatar2" });
        }

        // Seleccionar un fondo aleatorio
        const backgroundUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

        // Crear el lienzo
        const canvas = Canvas.createCanvas(800, 400);
        const ctx = canvas.getContext("2d");

        // Cargar imágenes (método seguro con axios)
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

        // Dibujar los avatares con bordes circulares
        ctx.save();
        ctx.beginPath();
        ctx.arc(200, 200, 75, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg1, 125, 125, 150, 150);
        ctx.restore(); // Restaurar para evitar que el clip afecte a otros elementos

        ctx.save();
        ctx.beginPath();
        ctx.arc(600, 200, 75, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg2, 525, 125, 150, 150);
        ctx.restore(); // Restaurar contexto

        // Dibujar el corazón en el centro
        ctx.drawImage(heartImg, 350, 150, 100, 100);

        // Generar porcentaje de amor aleatorio
        const lovePercentage = Math.floor(Math.random() * 101);

        // Agregar texto con el porcentaje de amor
        ctx.font = "bold 40px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(`${lovePercentage}%`, 400, 250);

        // Enviar imagen como respuesta
        res.setHeader("Content-Type", "image/png");
        canvas.createPNGStream().pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al generar la imagen de ship" });
    }
});

module.exports = router;
