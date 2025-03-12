const express = require("express");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");
const axios = require("axios");
const router = express.Router();

// Servir el creador de imágenes HTML cuando se accede a /creator
router.get("/creator", (req, res) => {
    res.sendFile(path.join(process.cwd(), 'api', 'utility', 'bienvenida', 'index.html'));
});

// Aquí puedes incluir tu ruta original para generar la imagen
router.get("/", async (req, res) => {
    try {
        const { 
            avatar, 
            texto1, 
            texto2, 
            texto3, 
            background
        } = req.query;

        // Validar parámetros obligatorios - todos son requeridos
        if (!avatar || !background || !texto1 || !texto2 || !texto3) {
            return res.status(400).json({ 
                error: "Faltan parámetros obligatorios. Todos los parámetros son obligatorios: avatar, background, texto1, texto2, texto3", 
                ejemplo: "/bienvenida-styled?avatar=https://tu-avatar.jpg&background=https://imagen-fondo.jpg&texto1=¡Bienvenido!&texto2=Usuario&texto3=Al servidor"
            });
        }

        // Código original para generar la imagen de bienvenida
        // (Mantén intacto el código que ya tenías para generar la imagen)
        // ...

        // Puedes adaptar el código que me mostraste anteriormente aquí
        res.status(200).json({ message: "Esta ruta está en construcción. Por favor usa /api/utility/bienvenida/creator para diseñar tu imagen." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al generar la imagen de bienvenida estilizada." });
    }
});

module.exports = router;
