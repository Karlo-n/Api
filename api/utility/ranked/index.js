// api/utility/ranked/index.js
const express = require("express");
const router = express.Router();
const path = require('path');
const generador = require('./generador');

// Ruta a la raíz del proyecto
const ROOT_DIR = path.join(__dirname, '../../../');

// Main route - Serves the HTML interface
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Routes for CSS and JS files (located in ROOT)
router.get("/styles.css", (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'styles.css'));
});

router.get("/script.js", (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'script.js'));
});

// Serve backgrounds from ROOT
router.use('/backgrounds', express.static(path.join(ROOT_DIR, 'backgrounds')));

// API endpoint to generate ranked cards
router.get("/generate", generador.generateRankedCard);

module.exports = router;
