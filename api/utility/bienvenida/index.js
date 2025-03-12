// api/utility/bienvenida/index.js
const express = require("express");
const router = express.Router();
const path = require('path');

// Ruta al archivo HTML
const HTML_PATH = path.join(__dirname, 'index.html');

// Ruta principal - Sirve el HTML
router.get("/", (req, res) => {
    res.sendFile(HTML_PATH);
});

// Exportar el router
module.exports = router;
