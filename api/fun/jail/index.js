// api/fun/jail/index.js
const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const router = express.Router();

/**
 * API JAIL - Coloca avatares detrás de barrotes de prisión
 * Endpoint: /api/fun/jail?avatar=URL_DEL_AVATAR
 */
router.get("/", async (req, res) => {
  try {
    const { avatar } = req.query;

    // Validar que se proporcionó un avatar
    if (!avatar) {
      return res.status(400).json({ 
        error: "Se requiere una URL de avatar", 
        ejemplo: "/api/fun/jail?avatar=https://ejemplo.com/avatar.jpg" 
      });
    }

    console.log(`Procesando imagen jail para avatar: ${avatar}`);

    // Cargar imagen del avatar
    let avatarImage;
    try {
      const response = await axios.get(avatar, { 
        responseType: "arraybuffer",
        timeout: 10000 // 10 segundos timeout
      });
      avatarImage = await Canvas.loadImage(Buffer.from(response.data));
    } catch (error) {
      console.error("Error cargando imagen del avatar:", error.message);
      return res.status(400).json({ 
        error: "No se pudo cargar la imagen del avatar", 
        detalle: error.message 
      });
    }

    // Crear canvas para la imagen final
    const canvas = Canvas.createCanvas(500, 500);
    const ctx = canvas.getContext("2d");

    // Configurar el fondo (gris oscuro)
    ctx.fillStyle = "#1c1c1c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar avatar en el centro, redimensionado y con máscara circular
    const avatarSize = 300;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Crear máscara circular para el avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Dibujar avatar centrado
    ctx.drawImage(
      avatarImage,
      centerX - avatarSize / 2,
      centerY - avatarSize / 2,
      avatarSize,
      avatarSize
    );

    // Añadir un efecto de sombra alrededor del avatar
    ctx.restore();
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarSize / 2 + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Añadir efecto de sepia ligero para aspecto "encarcelado"
    ctx.globalCompositeOperation = "color";
    ctx.fillStyle = "rgba(255, 226, 189, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";

    // DIBUJAR BARRAS DIRECTAMENTE EN EL CANVAS
    // Barras verticales
    const barrasVerticales = [45, 105, 165, 225, 285, 345, 405, 465];
    barrasVerticales.forEach((x, index) => {
      // Alternar colores
      ctx.fillStyle = index % 2 === 0 ? "#111111" : "#1a1a1a";
      ctx.fillRect(x, 0, 14, canvas.height);
      
      // Añadir brillo/reflejo
      ctx.fillStyle = "#444444";
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x + 2, 0, 3, canvas.height);
      ctx.globalAlpha = 1.0;
    });
    
    // Barras horizontales
    const barrasHorizontales = [90, 240, 390];
    barrasHorizontales.forEach((y, index) => {
      ctx.fillStyle = index % 2 === 0 ? "#111111" : "#1a1a1a";
      ctx.fillRect(0, y, canvas.width, 12);
      
      // Añadir brillo/reflejo
      ctx.fillStyle = "#444444";
      ctx.globalAlpha = 0.6;
      ctx.fillRect(0, y + 2, canvas.width, 3);
      ctx.globalAlpha = 1.0;
    });

    // Añadir texto "JAILED" en la parte inferior
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("JAILED", centerX, canvas.height - 30);

    // Enviar la imagen como respuesta
    res.setHeader("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error("Error generando imagen jail:", error);
    res.status(500).json({ 
      error: "Error al generar la imagen jail", 
      detalle: error.message 
    });
  }
});

module.exports = router;
