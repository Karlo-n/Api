// api/utility/bienvenida/index.js
const express = require("express");
const router = express.Router();
const path = require('path');
const { generateWelcomeImage } = require('./imageGenerator');

// Ruta al archivo HTML
const HTML_PATH = path.join(__dirname, 'index.html');

// IMPORTANTE: Primero configuramos los archivos estáticos
// Esto debe ir ANTES de las rutas para que funcione correctamente
router.use(express.static(__dirname));

// Después configuramos la ruta para servir el HTML
router.get("/", (req, res) => {
    res.sendFile(HTML_PATH);
});

// Endpoint para generar imágenes de bienvenida
router.get("/bienvenida-styled", async (req, res) => {
    try {
        // Generar imagen usando los parámetros recibidos
        const imagePath = await generateWelcomeImage(req.query);
        
        // Enviar la imagen generada
        res.sendFile(imagePath);
    } catch (error) {
        console.error('Error generando imagen:', error);
        res.status(500).json({ 
            error: 'Error al generar la imagen de bienvenida',
            message: error.message 
        });
    }
});

// Exportar el router
module.exports = router;
