// api/utility/bienvenida/index.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Ruta al archivo HTML
const HTML_PATH = path.join(__dirname, "welcome-card-generator.html");
const CSS_PATH = path.join(__dirname, "styles.css");
const JS_PATH = path.join(__dirname, "script.js");

// Ruta principal - Sirve el HTML
router.get("/", (req, res) => {
    res.sendFile(HTML_PATH);
});

// Ruta para servir el CSS
router.get("/styles.css", (req, res) => {
    res.setHeader("Content-Type", "text/css");
    res.sendFile(CSS_PATH);
});

// Ruta para servir el JavaScript
router.get("/script.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(JS_PATH);
});

// Ruta para generar la tarjeta de bienvenida estilizada (responde con una imagen)
router.get("/bienvenida-styled", async (req, res) => {
    try {
        // Extraer parámetros de la URL
        const { 
            avatar, background, texto1, texto2, texto3, 
            bgColor, bgGradient, bgGradientDir,
            borderRadius, borderColor, borderWidth,
            avatarSize, avatarShape, effectType, effectIntensity,
            // Más parámetros para posiciones de texto, colores, etc.
        } = req.query;

        // Validar parámetros esenciales
        if (!avatar) {
            return res.status(400).json({
                error: "Se requiere la URL del avatar",
                ejemplo: "/api/utility/bienvenida/bienvenida-styled?avatar=https://example.com/avatar.jpg"
            });
        }

        // Aquí iría el código para generar la imagen de bienvenida
        // Por ahora, simplemente devolvemos un mensaje JSON
        res.json({
            message: "La API para generar la imagen está en desarrollo",
            parametros_recibidos: req.query,
            // En una implementación completa, en lugar de devolver un JSON
            // se generaría una imagen con Canvas o una biblioteca similar
            // y se enviaría como respuesta
        });
    } catch (error) {
        console.error("Error al generar tarjeta de bienvenida:", error);
        res.status(500).json({
            error: "Error interno al generar la tarjeta",
            detalle: error.message
        });
    }
});

// Ruta para generar una vista previa (opcional)
router.post("/preview", (req, res) => {
    try {
        // Similar a la ruta de generación pero usando los datos del cuerpo de la solicitud
        res.json({ message: "Vista previa generada (función en desarrollo)" });
    } catch (error) {
        res.status(500).json({ error: "Error al generar vista previa" });
    }
});

// Exportar el router para usarlo en el index.js principal
module.exports = router;
