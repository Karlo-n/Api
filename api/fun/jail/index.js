// api/fun/jail/index.js
const express = require("express");
const Canvas = require("canvas");
const fs = require("fs");
const path = require("path");
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

    // Cargar SVG de barrotes (ubicado en la raíz del proyecto)
    // Primero intentamos varias posibles rutas al archivo SVG
    let barsImage;
    const possiblePaths = [
      path.join(__dirname, "jail_bars.svg"),                 // En el mismo directorio
      path.join(__dirname, "../../../jail_bars.svg"),        // En la raíz del proyecto
      path.join(process.cwd(), "jail_bars.svg"),             // Ruta absoluta a la raíz
      path.join(__dirname, "../../..", "jail_bars.svg")      // Otra forma de la raíz
    ];
    
    console.log("Buscando SVG en las siguientes rutas:");
    possiblePaths.forEach(p => console.log(" - " + p));
    
    let svgLoaded = false;
    for (const svgPath of possiblePaths) {
      try {
        if (fs.existsSync(svgPath)) {
          console.log(`¡SVG encontrado en: ${svgPath}`);
          barsImage = await Canvas.loadImage(`file://${svgPath}`);
          svgLoaded = true;
          break;
        }
      } catch (err) {
        console.log(`Intento fallido en: ${svgPath}`);
      }
    }
    
    // Si no encontramos el SVG, creamos uno básico en línea
    if (!svgLoaded) {
      console.log("No se encontró el SVG, usando versión en línea");
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <g>
          <rect x="45" y="0" width="14" height="500" fill="#111111" />
          <rect x="105" y="0" width="14" height="500" fill="#1a1a1a" />
          <rect x="165" y="0" width="14" height="500" fill="#111111" />
          <rect x="225" y="0" width="14" height="500" fill="#1a1a1a" />
          <rect x="285" y="0" width="16" height="500" fill="#111111" />
          <rect x="345" y="0" width="14" height="500" fill="#1a1a1a" />
          <rect x="405" y="0" width="14" height="500" fill="#111111" />
          <rect x="465" y="0" width="14" height="500" fill="#1a1a1a" />
          <rect x="0" y="90" width="500" height="12" fill="#111111" />
          <rect x="0" y="240" width="500" height="14" fill="#1a1a1a" />
          <rect x="0" y="390" width="500" height="12" fill="#111111" />
        </g>
      </svg>`;
      
      // Creamos un Data URI con el SVG
      const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
      barsImage = await Canvas.loadImage(svgDataUri);
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

    // Dibujar las barras encima de todo
    ctx.drawImage(barsImage, 0, 0, canvas.width, canvas.height);

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
