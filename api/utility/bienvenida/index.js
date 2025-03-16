// api/utility/ranked/index.js
const express = require("express");
const router = express.Router();
const path = require('path');
const generador = require('./generador');

// Ruta principal - Solo sirve el HTML
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para generar tarjetas ranked
router.get("/generate", generador.generateRankedImage);

module.exports = router;
