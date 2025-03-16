// api/utility/bienvenida/index.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Servir archivos estáticos desde este directorio
router.use(express.static(path.join(__dirname)));

// Ruta principal que muestra el HTML
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API para generar la imagen de bienvenida
router.get('/generate', (req, res) => {
  // Obtener los parámetros
  const bgColor = req.query.bg ? `#${req.query.bg}` : '#1e1e2e';
  const avatarUrl = req.query.avatar || '';
  const avatarX = parseInt(req.query.x) || 400;
  const avatarY = parseInt(req.query.y) || 150;
  const avatarSize = parseInt(req.query.size) || 80;
  const avatarShape = req.query.shape || 'circle';
  const avatarGlow = req.query.glow === '1';
  const borderRadius = parseInt(req.query.radius) || 25;
  const borderColor = req.query.color ? `#${req.query.color}` : '#bd5dff';
  const borderWidth = parseInt(req.query.width) || 3;

  // Crear una respuesta de imagen (en este caso solo devolvemos los parámetros)
  // En una implementación real, aquí se generaría la imagen en el servidor
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: 'success',
    message: 'Parámetros de generación de imagen recibidos',
    parameters: {
      background: { color: bgColor },
      avatar: {
        url: avatarUrl,
        x: avatarX,
        y: avatarY,
        size: avatarSize,
        shape: avatarShape,
        glow: avatarGlow
      },
      border: {
        radius: borderRadius,
        color: borderColor,
        width: borderWidth
      }
    }
  });
});

module.exports = router;
