const express = require("express");
const Canvas = require("canvas");
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

    // Cargar imágenes
    const avatarImg = await loadImage(avatar1);
    const bedImg = await loadImage('path/to/bed-image.png');

    // Dibujar fondo y cama
    ctx.fillStyle = '#121930';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bedImg, 100, 150, 300, 120);

    // Dibujar avatar en forma circular
    ctx.save();
    ctx.beginPath();
    ctx.arc(250, 170, 50, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg, 200, 120, 100, 100);
    ctx.restore();

    // Añadir texto
    if (texto) {
      ctx.font = '20px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(texto, 250, 250);
    }

    // Añadir elementos de "durmiendo" (ZZZ)
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#8BA3FF';
    ctx.fillText('Z', 320, 120);
    ctx.font = 'bold 25px Arial';
    ctx.fillText('Z', 340, 100);
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Z', 355, 80);

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
