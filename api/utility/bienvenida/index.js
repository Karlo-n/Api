// api/utility/bienvenida/index.js
const express = require("express");
const router = express.Router();
const path = require('path');
const { generateWelcomeImage } = require('./imageGenerator');

// Ruta al archivo HTML
const HTML_PATH = path.join(__dirname, 'index.html');

// Ruta principal - Sirve el HTML
router.get("/", (req, res) => {
    res.sendFile(HTML_PATH);
});

// Rutas para archivos estáticos
router.get("/bienvenida/styles.css", (req, res) => {
    res.sendFile(path.join(__dirname, 'styles.css'));
});

router.get("/styles.css", (req, res) => {
    res.sendFile(path.join(__dirname, 'styles.css'));
});

router.get("/bienvenida/script.js", (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

router.get("/script.js", (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

// Servir imágenes generadas como recursos estáticos
router.use('/temp', express.static(path.join(__dirname, 'temp')));

// Endpoint para generar imágenes de bienvenida
router.get("/bienvenida-styled", async (req, res) => {
    try {
        console.log("Recibida solicitud para generar imagen con parámetros:", req.query);
        
        // Generar imagen usando los parámetros recibidos
        const imagePath = await generateWelcomeImage(req.query);
        
        console.log("Imagen generada en:", imagePath);
        
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

// Endpoint adicional para compatibilidad
router.get("/bienvenida", async (req, res) => {
    res.redirect(`/api/utility/bienvenida/bienvenida-styled?${new URLSearchParams(req.query).toString()}`);
});

// Endpoint para depuración
router.get("/debug-params", (req, res) => {
    res.json({
        query: req.query,
        message: "Estos son los parámetros que se están enviando a la API"
    });
});

// Exportar el router
module.exports = router;
