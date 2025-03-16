// api/utility/bienvenida/index.js
const express = require('express');
const router = express.Router();
const path = require('path');

// Servir archivos estáticos desde este directorio
router.use(express.static(path.join(__dirname)));

// Ruta principal que muestra el HTML
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API para generar la imagen de bienvenida
router.get('/generate', (req, res) => {
  // Esta ruta podría implementarse en el futuro para generar imágenes en el servidor
  // Por ahora, solo devuelve los parámetros recibidos
  res.json({
    message: 'API de generación de imágenes',
    params: req.query
  });
});

module.exports = router;
