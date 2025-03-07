// api/fun/audiovisualizer/index.js
const express = require("express");
const router = express.Router();
const path = require('path');

// Ruta al archivo HTML
const HTML_PATH = path.join(__dirname, 'visualizer.html');

// Ruta principal - Sirve el HTML
router.get("/", (req, res) => {
    res.sendFile(HTML_PATH);
});

// Ruta de API que responde con mensaje informativo
router.post("/", (req, res) => {
    res.json({
        message: "Esta API ahora usa Web Audio API en el navegador. No es necesario enviar archivos al servidor.",
        status: "success",
        info: "La visualización se procesa directamente en tu navegador."
    });
});

// Ruta de estado para compatibilidad con código anterior
router.get("/status/:jobId", (req, res) => {
    res.json({
        status: "client_side_processing",
        message: "La visualización ahora se procesa en el navegador del cliente."
    });
});

// Exportar el router
module.exports = router;
