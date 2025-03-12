// api/utility/bienvenida/index.js
const express = require("express");
const router = express.Router();
const path = require('path');

// Paths to files
const HTML_PATH = path.join(__dirname, 'index.html');
const CSS_PATH = path.join(__dirname, 'styles.css');
const JS_PATH = path.join(__dirname, 'script.js');

// Main route - Serves the HTML
router.get("/", (req, res) => {
    res.sendFile(HTML_PATH);
});

// Serve CSS file
router.get("/styles.css", (req, res) => {
    res.sendFile(CSS_PATH);
});

// Serve JavaScript file
router.get("/script.js", (req, res) => {
    res.sendFile(JS_PATH);
});

// API endpoint for generating welcome images
router.get("/bienvenida-styled", (req, res) => {
    // Here you'll implement the actual image generation logic
    // For now, just return a JSON response with the parameters
    const params = req.query;
    res.json({
        message: "Esta ruta generará una imagen de bienvenida basada en estos parámetros",
        params: params
    });
});

// Export the router
module.exports = router;
