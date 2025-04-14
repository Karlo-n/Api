// api/fun/jail/index.js
const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const router = express.Router();

/**
 * API JAIL - Coloca avatares detrás de barrotes de prisión ultra realistas
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

    // ===== FONDO Y ESCENA DE CELDA REALISTA =====
    
    // Fondo de pared de celda texturizado
    crearFondoParedCelda(ctx, canvas.width, canvas.height);
    
    // Dibujar suelo con sombra
    crearSueloCelda(ctx, canvas.width, canvas.height);
    
    // Crear efecto de luz dramática
    crearIluminacionCelda(ctx, canvas.width, canvas.height);

    // ===== AVATAR CENTRAL =====

    // Dibujar avatar en el centro con máscara circular
    const avatarSize = 270; // Ligeramente más pequeño para verse detrás de las barras
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
    
    // Añadir efecto de iluminación sutil para integrar con la escena
    const avatarOverlay = ctx.createRadialGradient(
      centerX - avatarSize/4, centerY - avatarSize/4, 0,
      centerX, centerY, avatarSize
    );
    avatarOverlay.addColorStop(0, "rgba(255,255,255,0)");
    avatarOverlay.addColorStop(0.8, "rgba(0,0,0,0.2)");
    avatarOverlay.addColorStop(1, "rgba(0,0,0,0.4)");
    
    ctx.fillStyle = avatarOverlay;
    ctx.fill();
    
    // Restaurar context para seguir dibujando
    ctx.restore();

    // Borde oscuro alrededor del avatar
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarSize / 2 + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // ===== BARRAS DE PRISIÓN ULTRA REALISTAS =====
    
    // Dibujar barras metálicas con efecto 3D
    dibujarBarrasPrision(ctx, canvas.width, canvas.height);
    
    // ===== TEXTO Y DETALLES FINALES =====

    // Añadir texto "PRISIONER" en la parte inferior con estilo de estampa policial
    dibujarTextoEstampaPrisioner(ctx, centerX, canvas.height - 30);

    // Añadir efecto de viñeta para un aspecto más dramático
    aplicarViñeta(ctx, canvas.width, canvas.height);

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

/**
 * Crea un fondo de pared de celda realista
 */
function crearFondoParedCelda(ctx, width, height) {
  // Color base de la pared
  ctx.fillStyle = "#232428";
  ctx.fillRect(0, 0, width, height);
  
  // Crear textura de pared de celda (bloques de concreto con juntas)
  const blockSize = 50;
  const jointSize = 5;
  
  ctx.fillStyle = "#1c1d22";
  ctx.strokeStyle = "#141518";
  ctx.lineWidth = 1;
  
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      // Variar ligeramente el color para realismo
      const shade = Math.random() * 10 - 5;
      ctx.fillStyle = adjustColor("#232428", shade);
      
      // Bloques desplazados en filas alternadas
      const offsetX = (Math.floor(y / blockSize) % 2) * (blockSize / 2);
      
      // Dibujar cada bloque con un pequeño margen para las juntas
      ctx.fillRect(
        x + offsetX + jointSize/2, 
        y + jointSize/2, 
        blockSize - jointSize, 
        blockSize - jointSize
      );
      
      // Añadir detalles de textura en los bloques (grietas, imperfecciones)
      if (Math.random() > 0.7) {
        const cracksCount = Math.floor(Math.random() * 3) + 1;
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        
        for (let i = 0; i < cracksCount; i++) {
          ctx.beginPath();
          const startX = x + offsetX + jointSize/2 + Math.random() * (blockSize - jointSize);
          const startY = y + jointSize/2 + Math.random() * (blockSize - jointSize);
          
          ctx.moveTo(startX, startY);
          ctx.lineTo(
            startX + (Math.random() * 20 - 10), 
            startY + (Math.random() * 20 - 10)
          );
          ctx.stroke();
        }
      }
    }
  }
}

/**
 * Crea un suelo realista con perspectiva simple
 */
function crearSueloCelda(ctx, width, height) {
  // Suelo en la parte inferior
  const floorHeight = height / 5;
  const floorY = height * 0.85;
  
  // Gradiente para dar sensación de profundidad
  const floorGradient = ctx.createLinearGradient(0, floorY, 0, height);
  floorGradient.addColorStop(0, "#1a1a1a");
  floorGradient.addColorStop(1, "#0e0e0e");
  
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, floorY, width, floorHeight);
  
  // Añadir líneas de juntura en el suelo para dar profundidad
  ctx.strokeStyle = "rgba(0,0,0,0.8)";
  ctx.lineWidth = 1;
  
  // Líneas verticales (con perspectiva)
  for (let x = 0; x < width; x += 50) {
    ctx.beginPath();
    // Punto de fuga aproximado
    const vanishingPoint = width / 2;
    const topX = vanishingPoint + (x - vanishingPoint) * 0.8;
    
    ctx.moveTo(topX, floorY);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // Líneas horizontales (con curvatura para simular perspectiva)
  for (let y = floorY; y < height; y += 15) {
    ctx.beginPath();
    const curveStrength = (y - floorY) / 2;
    
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(width/2, y - curveStrength, width, y);
    ctx.stroke();
  }
}

/**
 * Crea un efecto de iluminación ambiental en la celda
 */
function crearIluminacionCelda(ctx, width, height) {
  // Luz central tenue desde arriba
  const lightGradient = ctx.createRadialGradient(
    width/2, 0, 0,
    width/2, height/2, height
  );
  
  lightGradient.addColorStop(0, "rgba(255,255,255,0.1)");
  lightGradient.addColorStop(0.7, "rgba(255,255,255,0)");
  
  ctx.fillStyle = lightGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Luz lateral que entra por las barras (lado izquierdo)
  const sideLight = ctx.createRadialGradient(
    0, height/3, 0,
    width/3, height/3, width/2
  );
  
  sideLight.addColorStop(0, "rgba(255,255,230,0.07)");
  sideLight.addColorStop(1, "rgba(255,255,230,0)");
  
  ctx.fillStyle = sideLight;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Dibuja las barras de prisión con efecto 3D y metálico
 */
function dibujarBarrasPrision(ctx, width, height) {
  // Configuración de las barras
  const barrasVerticales = [45, 105, 165, 225, 285, 345, 405, 465];
  const barrasHorizontales = [90, 240, 390];
  const barGrosor = 14;
  
  // Dibujar barras horizontales primero (están detrás)
  barrasHorizontales.forEach((y) => {
    dibujarBarraHorizontal(ctx, 0, y, width, barGrosor);
  });
  
  // Dibujar barras verticales (van por encima)
  barrasVerticales.forEach((x) => {
    dibujarBarraVertical(ctx, x, 0, height, barGrosor);
  });
  
  // Añadir remaches/tornillos en las intersecciones
  barrasVerticales.forEach((x) => {
    barrasHorizontales.forEach((y) => {
      dibujarRemache(ctx, x + barGrosor/2, y + barGrosor/2);
    });
  });
}

/**
 * Dibuja una barra vertical con aspecto 3D metálico
 */
function dibujarBarraVertical(ctx, x, y, height, grosor) {
  // Calcular el centro de la barra
  const centerX = x + grosor/2;
  
  // Crear gradiente radial para el efecto de cilindro metálico
  const barGradient = ctx.createLinearGradient(x, 0, x + grosor, 0);
  barGradient.addColorStop(0, "#111111");
  barGradient.addColorStop(0.15, "#3D3D3D");
  barGradient.addColorStop(0.5, "#555555");
  barGradient.addColorStop(0.85, "#3D3D3D");
  barGradient.addColorStop(1, "#111111");
  
  // Dibujar la barra cilíndrica
  ctx.fillStyle = barGradient;
  ctx.fillRect(x, y, grosor, height);
  
  // Añadir brillo central (resalte especular)
  const shineGradient = ctx.createLinearGradient(x, 0, x + grosor, 0);
  shineGradient.addColorStop(0, "rgba(255,255,255,0)");
  shineGradient.addColorStop(0.5, "rgba(255,255,255,0.15)");
  shineGradient.addColorStop(1, "rgba(255,255,255,0)");
  
  ctx.fillStyle = shineGradient;
  ctx.fillRect(x + grosor * 0.35, y, grosor * 0.3, height);
  
  // Añadir imperfecciones y marcas de desgaste aleatorias
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  for (let i = 0; i < height; i += 50) {
    if (Math.random() > 0.7) {
      const markHeight = Math.random() * 5 + 2;
      const markWidth = Math.random() * (grosor - 2) + 1;
      ctx.fillRect(
        x + (grosor - markWidth)/2, 
        y + i + Math.random() * 40, 
        markWidth, 
        markHeight
      );
    }
  }
}

/**
 * Dibuja una barra horizontal con aspecto 3D metálico
 */
function dibujarBarraHorizontal(ctx, x, y, width, grosor) {
  // Crear gradiente para el efecto de cilindro metálico
  const barGradient = ctx.createLinearGradient(0, y, 0, y + grosor);
  barGradient.addColorStop(0, "#111111");
  barGradient.addColorStop(0.15, "#3D3D3D");
  barGradient.addColorStop(0.5, "#555555");
  barGradient.addColorStop(0.85, "#3D3D3D");
  barGradient.addColorStop(1, "#111111");
  
  // Dibujar la barra cilíndrica
  ctx.fillStyle = barGradient;
  ctx.fillRect(x, y, width, grosor);
  
  // Añadir brillo
  const shineGradient = ctx.createLinearGradient(0, y, 0, y + grosor);
  shineGradient.addColorStop(0, "rgba(255,255,255,0)");
  shineGradient.addColorStop(0.5, "rgba(255,255,255,0.15)");
  shineGradient.addColorStop(1, "rgba(255,255,255,0)");
  
  ctx.fillStyle = shineGradient;
  ctx.fillRect(x, y + grosor * 0.35, width, grosor * 0.3);
  
  // Añadir imperfecciones y marcas de desgaste aleatorias
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  for (let i = 0; i < width; i += 50) {
    if (Math.random() > 0.7) {
      const markWidth = Math.random() * 5 + 2;
      const markHeight = Math.random() * (grosor - 2) + 1;
      ctx.fillRect(
        x + i + Math.random() * 40, 
        y + (grosor - markHeight)/2, 
        markWidth, 
        markHeight
      );
    }
  }
}

/**
 * Dibuja un remache/tornillo en la intersección de las barras
 */
function dibujarRemache(ctx, x, y) {
  const radio = 5;
  
  // Crear gradiente radial para el efecto 3D
  const boltGradient = ctx.createRadialGradient(
    x + 1, y - 1, 0,
    x, y, radio
  );
  
  boltGradient.addColorStop(0, "#777777");
  boltGradient.addColorStop(0.5, "#555555");
  boltGradient.addColorStop(1, "#333333");
  
  // Dibujar círculo principal
  ctx.beginPath();
  ctx.arc(x, y, radio, 0, Math.PI * 2);
  ctx.fillStyle = boltGradient;
  ctx.fill();
  
  // Añadir borde
  ctx.strokeStyle = "#222222";
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Añadir brillo
  ctx.beginPath();
  ctx.arc(x - 1, y - 1, radio / 3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fill();
  
  // Añadir surco transversal aleatorio (tipo tornillo)
  const angle = Math.random() * Math.PI;
  ctx.beginPath();
  ctx.moveTo(
    x + Math.cos(angle) * (radio - 1),
    y + Math.sin(angle) * (radio - 1)
  );
  ctx.lineTo(
    x + Math.cos(angle + Math.PI) * (radio - 1),
    y + Math.sin(angle + Math.PI) * (radio - 1)
  );
  ctx.strokeStyle = "#222222";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * Dibuja el texto "PRISIONER" con estilo de estampa policial
 */
function dibujarTextoEstampaPrisioner(ctx, centerX, y) {
  // Configurar estilo para el texto estampado
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  // Texto principal
  ctx.font = "bold 38px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  
  // Contorno
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 5;
  ctx.strokeText("PRISONER", centerX, y);
  
  // Relleno con degradado para efecto gastado
  const textGradient = ctx.createLinearGradient(
    centerX - 100, y - 30,
    centerX + 100, y
  );
  textGradient.addColorStop(0, "#bb0000");
  textGradient.addColorStop(0.5, "#ff0000");
  textGradient.addColorStop(1, "#bb0000");
  
  ctx.fillStyle = textGradient;
  ctx.fillText("PRISONER", centerX, y);
  
  // Reiniciar sombra
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Añadir textura de estampado por encima (trazos desiguales)
  ctx.globalCompositeOperation = "source-atop";
  for (let i = -100; i <= 100; i += 3) {
    const opacity = Math.random() * 0.1;
    ctx.fillStyle = `rgba(0,0,0,${opacity})`;
    
    ctx.fillRect(
      centerX + i, 
      y - 35, 
      2, 
      35
    );
  }
  
  // Restaurar modo de composición
  ctx.globalCompositeOperation = "source-over";
}

/**
 * Aplica un efecto de viñeta (esquinas oscurecidas) para mayor dramatismo
 */
function aplicarViñeta(ctx, width, height) {
  const gradient = ctx.createRadialGradient(
    width/2, height/2, height * 0.4,
    width/2, height/2, height
  );
  
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.7)");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Ajusta el color por un valor determinado
 */
function adjustColor(color, amount) {
  // Extraer componentes RGB
  const r = parseInt(color.substr(1, 2), 16);
  const g = parseInt(color.substr(3, 2), 16);
  const b = parseInt(color.substr(5, 2), 16);
  
  // Ajustar cada componente
  const newR = Math.min(255, Math.max(0, r + amount));
  const newG = Math.min(255, Math.max(0, g + amount));
  const newB = Math.min(255, Math.max(0, b + amount));
  
  // Convertir de nuevo a formato hexadecimal
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

module.exports = router;
