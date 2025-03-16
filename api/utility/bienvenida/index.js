// api/utility/bienvenida/index.js
const express = require('express');
const router = express.Router();
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Servir archivos estáticos desde este directorio
router.use(express.static(path.join(__dirname)));

// Ruta principal que muestra el HTML
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API para generar la imagen de bienvenida
router.get('/generate', async (req, res) => {
  try {
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

    // Crear un canvas para generar la imagen
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    
    // Dibujar el fondo
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar el borde
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    const borderOffset = borderWidth / 2;
    
    // Crear rectángulo redondeado para el borde
    ctx.beginPath();
    ctx.moveTo(borderOffset + borderRadius, borderOffset);
    ctx.lineTo(canvas.width - borderOffset - borderRadius, borderOffset);
    ctx.quadraticCurveTo(canvas.width - borderOffset, borderOffset, canvas.width - borderOffset, borderOffset + borderRadius);
    ctx.lineTo(canvas.width - borderOffset, canvas.height - borderOffset - borderRadius);
    ctx.quadraticCurveTo(canvas.width - borderOffset, canvas.height - borderOffset, canvas.width - borderOffset - borderRadius, canvas.height - borderOffset);
    ctx.lineTo(borderOffset + borderRadius, canvas.height - borderOffset);
    ctx.quadraticCurveTo(borderOffset, canvas.height - borderOffset, borderOffset, canvas.height - borderOffset - borderRadius);
    ctx.lineTo(borderOffset, borderOffset + borderRadius);
    ctx.quadraticCurveTo(borderOffset, borderOffset, borderOffset + borderRadius, borderOffset);
    ctx.closePath();
    ctx.stroke();
    
    // Dibujar avatar si se proporciona una URL
    if (avatarUrl) {
      try {
        const img = await loadImage(decodeURIComponent(avatarUrl));
        
        // Guardar el estado actual
        ctx.save();
        
        // Crear ruta de recorte para la forma del avatar
        ctx.beginPath();
        const x = avatarX;
        const y = avatarY;
        const radius = avatarSize / 2;
        
        if (avatarShape === 'circle') {
          ctx.arc(x, y, radius, 0, Math.PI * 2, false);
        } else {
          ctx.rect(x - radius, y - radius, avatarSize, avatarSize);
        }
        ctx.closePath();
        ctx.clip();
        
        // Dibujar imagen del avatar
        ctx.drawImage(
          img,
          x - radius,
          y - radius,
          avatarSize,
          avatarSize
        );
        
        // Restaurar el estado
        ctx.restore();
        
        // Dibujar efecto de resplandor si está habilitado
        if (avatarGlow) {
          ctx.save();
          ctx.shadowBlur = 20;
          ctx.shadowColor = 'rgba(189, 93, 255, 0.7)';
          
          ctx.beginPath();
          if (avatarShape === 'circle') {
            ctx.arc(x, y, radius, 0, Math.PI * 2, false);
          } else {
            ctx.rect(x - radius, y - radius, avatarSize, avatarSize);
          }
          ctx.strokeStyle = 'rgba(189, 93, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      } catch (error) {
        console.error('Error cargando la imagen del avatar:', error);
      }
    }
    
    // Devolver la imagen generada
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache');
    canvas.createPNGStream().pipe(res);
    
  } catch (error) {
    console.error('Error generando la imagen:', error);
    res.status(500).json({ error: 'Error generando la imagen' });
  }
});

module.exports = router;
