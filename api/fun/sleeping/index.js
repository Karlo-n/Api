// api/fun/sleeping/index.js
const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { avatar1, texto } = req.query;

    // Validar parámetros
    if (!avatar1) {
      return res.status(400).json({ 
        error: "Se requiere una URL de avatar", 
        ejemplo: "/api/fun/sleeping?avatar1=https://ejemplo.com/avatar.jpg&texto=Buenas noches" 
      });
    }

    // Configurar canvas
    const canvas = createCanvas(500, 300);
    const ctx = canvas.getContext('2d');

    // Dibujar fondo
    ctx.fillStyle = '#121930';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibuja una cama simple
    ctx.fillStyle = '#8B4513'; // Color marrón para la base de la cama
    ctx.fillRect(150, 200, 200, 30); // Base de la cama
    
    ctx.fillStyle = '#A0522D'; // Color marrón más oscuro para la cabecera
    ctx.fillRect(150, 170, 20, 30); // Cabecera izquierda
    ctx.fillRect(330, 170, 20, 30); // Cabecera derecha
    
    ctx.fillStyle = '#DAA520'; // Color dorado para la almohada
    ctx.fillRect(175, 170, 50, 30); // Almohada
    
    ctx.fillStyle = '#4169E1'; // Color azul para la manta
    ctx.fillRect(175, 200, 150, 20); // Manta

    try {
      // Cargar avatar
      const avatarImg = await loadImage(avatar1);
      
      // Dibujar avatar en forma circular
      ctx.save();
      ctx.beginPath();
      ctx.arc(250, 170, 50, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, 200, 120, 100, 100);
      ctx.restore();
      
      // Borde del avatar
      ctx.beginPath();
      ctx.arc(250, 170, 50, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } catch (imgError) {
      console.error("Error cargando imagen:", imgError);
      // Dibujar círculo gris como fallback
      ctx.beginPath();
      ctx.arc(250, 170, 50, 0, Math.PI * 2);
      ctx.fillStyle = '#cccccc';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Añadir ZZZs para efecto "durmiendo"
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#8BA3FF';
    ctx.fillText('Z', 320, 120);
    ctx.font = 'bold 25px Arial';
    ctx.fillText('Z', 340, 100);
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Z', 355, 80);

    // Añadir texto
    if (texto) {
      ctx.font = '20px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(texto, 250, 260);
    }

    // Enviar imagen como respuesta
    res.setHeader('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error("Error generando imagen:", error);
    res.status(500).json({ 
      error: "Error al generar la imagen", 
      detalle: error.message 
    });
  }
});

module.exports = router;
