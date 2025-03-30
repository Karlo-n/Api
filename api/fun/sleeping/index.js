// api/fun/sleeping/index.js
const express = require("express");
const { createCanvas, loadImage } = require("canvas");
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

    // Configurar canvas con mayor tamaño para más detalles
    const canvas = createCanvas(600, 400);
    const ctx = canvas.getContext('2d');

    // Dibujar fondo - gradiente azul oscuro para efecto nocturno
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#0B1437');
    bgGradient.addColorStop(1, '#162253');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar estrellas en el fondo
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * (canvas.height * 0.7);
      const size = Math.random() * 2 + 0.5;
      
      // Brillo aleatorio para las estrellas
      ctx.globalAlpha = Math.random() * 0.5 + 0.5;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    
    // Dibujar luna
    ctx.beginPath();
    ctx.arc(500, 70, 40, 0, Math.PI * 2);
    const moonGradient = ctx.createRadialGradient(500, 70, 0, 500, 70, 40);
    moonGradient.addColorStop(0, '#FFFDE7');
    moonGradient.addColorStop(1, '#FFF9C4');
    ctx.fillStyle = moonGradient;
    ctx.fill();
    
    // Dibujar sombras en la luna
    ctx.beginPath();
    ctx.arc(485, 60, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.fill();
    
    // Dibujar pared/suelo
    ctx.fillStyle = '#362A40';
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
    
    // Dibujar cama
    // Marco de la cama
    const bedX = 120;
    const bedY = 230;
    const bedWidth = 360;
    const bedHeight = 120;
    
    // Cabecera de la cama
    ctx.fillStyle = '#5D4037'; // Madera oscura
    ctx.fillRect(bedX, bedY - 80, bedWidth, 25);
    
    // Efecto 3D para la cabecera
    const headboardGradient = ctx.createLinearGradient(bedX, bedY - 80, bedX, bedY - 55);
    headboardGradient.addColorStop(0, '#5D4037');
    headboardGradient.addColorStop(1, '#3E2723');
    ctx.fillStyle = headboardGradient;
    ctx.fillRect(bedX, bedY - 80, bedWidth, 25);
    
    // Detalles de la cabecera
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(bedX + (i * bedWidth/5) + 10, bedY - 75, 30, 15);
      ctx.strokeStyle = '#3E2723';
      ctx.lineWidth = 1;
      ctx.strokeRect(bedX + (i * bedWidth/5) + 10, bedY - 75, 30, 15);
    }
    
    // Base de la cama
    ctx.fillStyle = '#5D4037'; // Madera oscura
    ctx.fillRect(bedX, bedY + bedHeight - 20, bedWidth, 20);
    
    // Colchón
    const mattressGradient = ctx.createLinearGradient(bedX, bedY, bedX, bedY + bedHeight - 20);
    mattressGradient.addColorStop(0, '#E0E0E0');
    mattressGradient.addColorStop(1, '#BDBDBD');
    ctx.fillStyle = mattressGradient;
    ctx.fillRect(bedX, bedY, bedWidth, bedHeight - 20);
    
    // Almohada
    const pillowGradient = ctx.createLinearGradient(bedX + 20, bedY + 10, bedX + 120, bedY + 40);
    pillowGradient.addColorStop(0, '#F5F5F5');
    pillowGradient.addColorStop(1, '#E0E0E0');
    ctx.fillStyle = pillowGradient;
    
    // Dibujar una almohada con curva
    ctx.beginPath();
    ctx.moveTo(bedX + 20, bedY + 20);
    ctx.bezierCurveTo(
      bedX + 30, bedY + 5, 
      bedX + 110, bedY + 5, 
      bedX + 120, bedY + 20
    );
    ctx.bezierCurveTo(
      bedX + 110, bedY + 40, 
      bedX + 30, bedY + 40, 
      bedX + 20, bedY + 20
    );
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#BDBDBD';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Sábanas
    const sheetGradient = ctx.createLinearGradient(bedX, bedY + 40, bedX, bedY + bedHeight - 20);
    sheetGradient.addColorStop(0, '#D1C4E9');
    sheetGradient.addColorStop(1, '#B39DDB');
    ctx.fillStyle = sheetGradient;
    ctx.fillRect(bedX, bedY + 40, bedWidth, (bedHeight - 20) - 40);
    
    // Cobija que cubre la mitad del cuerpo (se dibuja después para que esté por encima)
    const blanketY = bedY + 70; // Posición Y donde empieza la cobija
    
    try {
      // Cargar avatar
      const avatarImg = await loadImage(avatar1);
      
      // Dibujar avatar acostado (cabeza en la almohada)
      const avatarSize = 75;
      const avatarX = bedX + 70;
      const avatarY = bedY + 30;
      
      // Dibujar avatar en forma circular
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();
      
      // Borde del avatar
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#B39DDB';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Ahora dibujamos la cobija
      const blanketGradient = ctx.createLinearGradient(bedX, blanketY, bedX, bedY + bedHeight - 20);
      blanketGradient.addColorStop(0, '#7E57C2');
      blanketGradient.addColorStop(1, '#5E35B1');
      ctx.fillStyle = blanketGradient;
      
      // Dibujar la cobija con un borde ondulado
      ctx.beginPath();
      ctx.moveTo(bedX, blanketY);
      // Borde ondulado
      for(let x = 0; x < bedWidth; x += 20) {
        const waveHeight = Math.random() * 5 + 5;
        ctx.lineTo(bedX + x + 10, blanketY - waveHeight);
        ctx.lineTo(bedX + x + 20, blanketY);
      }
      ctx.lineTo(bedX + bedWidth, blanketY);
      ctx.lineTo(bedX + bedWidth, bedY + bedHeight - 20);
      ctx.lineTo(bedX, bedY + bedHeight - 20);
      ctx.closePath();
      ctx.fill();
      
      // Detalles de la cobija
      ctx.strokeStyle = '#4527A0';
      ctx.lineWidth = 1;
      for(let y = blanketY + 15; y < bedY + bedHeight - 20; y += 15) {
        ctx.beginPath();
        ctx.moveTo(bedX, y);
        ctx.lineTo(bedX + bedWidth, y);
        ctx.stroke();
      }
      
    } catch (imgError) {
      console.error("Error cargando imagen:", imgError);
      // Si hay error, dibujamos un círculo como fallback
      ctx.beginPath();
      ctx.arc(bedX + 70, bedY + 30, 37.5, 0, Math.PI * 2);
      ctx.fillStyle = '#cccccc';
      ctx.fill();
      ctx.strokeStyle = '#B39DDB';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Cobija fallback
      ctx.fillStyle = '#7E57C2';
      ctx.fillRect(bedX, blanketY, bedWidth, bedY + bedHeight - 20 - blanketY);
    }
    
    // Mesita de noche
    ctx.fillStyle = '#795548';
    ctx.fillRect(bedX + bedWidth + 20, bedY + 30, 80, bedHeight - 30);
    
    // Detalles de la mesita
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(bedX + bedWidth + 20, bedY + 90, 80, 10);
    
    // Lámpara sobre la mesita
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(bedX + bedWidth + 50, bedY - 30, 20, 60);
    
    ctx.beginPath();
    ctx.moveTo(bedX + bedWidth + 40, bedY - 40);
    ctx.lineTo(bedX + bedWidth + 80, bedY - 40);
    ctx.lineTo(bedX + bedWidth + 70, bedY - 10);
    ctx.lineTo(bedX + bedWidth + 50, bedY - 10);
    ctx.closePath();
    ctx.fillStyle = '#FFA000';
    ctx.fill();
    
    // Luz de la lámpara
    ctx.beginPath();
    const lampGlow = ctx.createRadialGradient(
      bedX + bedWidth + 60, bedY - 25, 0,
      bedX + bedWidth + 60, bedY - 25, 100
    );
    lampGlow.addColorStop(0, 'rgba(255, 236, 179, 0.3)');
    lampGlow.addColorStop(1, 'rgba(255, 236, 179, 0)');
    ctx.fillStyle = lampGlow;
    ctx.arc(bedX + bedWidth + 60, bedY - 25, 100, 0, Math.PI * 2);
    ctx.fill();

    // Añadir ZZZs para efecto "durmiendo"
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#B39DDB';
    ctx.fillText('Z', bedX + 120, bedY - 20);
    ctx.font = 'bold 25px Arial';
    ctx.fillText('Z', bedX + 140, bedY - 40);
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Z', bedX + 160, bedY - 55);

    // Añadir texto con sombra
    if (texto) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(texto, canvas.width / 2, canvas.height - 30);
      
      // Restaurar sombra
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
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
