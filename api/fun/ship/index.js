const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const path = require("path");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { avatar1, avatar2, json, numero } = req.query;

    // Validate required parameters
    if (!avatar1 || !avatar2 || !numero) {
      return res.status(400).json({ 
        error: "Faltan parámetros. Debes enviar avatar1, avatar2 y numero" 
      });
    }

    // Parse ship percentage (ensure it's between 0-100)
    const shipPercentage = Math.min(100, Math.max(0, parseInt(numero) || 0));
    
    // If user wants JSON response only
    if (json === "true") {
      return res.json({
        message: "❤️ Compatibilidad de pareja ❤️",
        avatar1: avatar1,
        avatar2: avatar2,
        love_percentage: `${shipPercentage}%`
      });
    }

    // Create canvas (more landscape oriented, like the reference)
    const canvas = Canvas.createCanvas(900, 430);
    const ctx = canvas.getContext("2d");

    // Load images safely with axios
    const loadImage = async (url) => {
      try {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        return await Canvas.loadImage(Buffer.from(response.data));
      } catch (error) {
        console.error(`Error cargando la imagen: ${url}`, error);
        return null;
      }
    };

    // Load avatar images
    const avatarImg1 = await loadImage(avatar1);
    const avatarImg2 = await loadImage(avatar2);

    if (!avatarImg1 || !avatarImg2) {
      return res.status(500).json({ error: "Error al cargar las imagenes de los avatares" });
    }

    // Determinar apariencia basada en el porcentaje
    let themeColors = {
      background: {
        primary: "#1e2a4a", 
        secondary: "#253760"
      },
      border: "#ff6b6b",
      heart: {
        primary: "#ff3b3b",
        secondary: "#ff0000"
      },
      title: {
        primary: "#ff6b6b",
        secondary: "#ff9d9d"
      },
      ship: {
        primary: "#ff6b6b", 
        secondary: "#ff0000"
      }
    };
    
    let heartBroken = false;
    let theme = "positive";
    let panelAlpha = 0.6;
    
    // Ajustar tema según el porcentaje
    if (shipPercentage < 10) {
      // Muy malo - corazón roto, colores oscuros
      theme = "very_negative";
      heartBroken = true;
      themeColors.background.primary = "#0d1117";
      themeColors.background.secondary = "#161b22";
      themeColors.border = "#483434";
      themeColors.heart.primary = "#3e0000";
      themeColors.heart.secondary = "#6e0000";
      themeColors.title.primary = "#6e0000";
      themeColors.title.secondary = "#8f0000";
      themeColors.ship.primary = "#6e0000";
      themeColors.ship.secondary = "#8f0000";
      panelAlpha = 0.8;
    } 
    else if (shipPercentage < 20) {
      // Malo - casi igual al anterior pero no tan dramático
      theme = "negative";
      heartBroken = true;
      themeColors.background.primary = "#151f2e";
      themeColors.background.secondary = "#1c2940";
      themeColors.border = "#5C4033";
      themeColors.heart.primary = "#5e0000";
      themeColors.heart.secondary = "#8e0000";
      themeColors.title.primary = "#8e0000";
      themeColors.title.secondary = "#a53030";
      themeColors.ship.primary = "#8e0000";
      themeColors.ship.secondary = "#a53030";
      panelAlpha = 0.7;
    } 
    else if (shipPercentage < 50) {
      // Regular - no tan feo
      theme = "neutral_negative";
      themeColors.background.primary = "#182a4a"; 
      themeColors.background.secondary = "#233760";
      themeColors.border = "#937163";
      themeColors.heart.primary = "#d06060";
      themeColors.heart.secondary = "#a54040";
      themeColors.title.primary = "#d06060";
      themeColors.title.secondary = "#e08080";
      themeColors.ship.primary = "#d06060";
      themeColors.ship.secondary = "#a54040";
    } 
    else if (shipPercentage < 70) {
      // Bueno
      theme = "neutral_positive";
      themeColors.background.primary = "#1e2a4a"; 
      themeColors.background.secondary = "#2a3a64";
      themeColors.border = "#d37a7a";
      themeColors.heart.primary = "#f06060";
      themeColors.heart.secondary = "#ff0000";
      themeColors.title.primary = "#ff6b6b";
      themeColors.title.secondary = "#ff9d9d";
      themeColors.ship.primary = "#ff6b6b";
      themeColors.ship.secondary = "#ff0000";
    }
    // Si es >= 70, se mantiene el estilo por defecto (muy bueno)

    // CREATE STYLIZED BACKGROUND
    // Create gradient background with blue stripes - similar to the reference image
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, themeColors.background.primary); 
    bgGradient.addColorStop(1, themeColors.background.secondary); 
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add vertical stripes
    ctx.globalAlpha = 0.1;
    const stripeWidth = 50;
    for (let x = 0; x < canvas.width; x += stripeWidth * 2) {
      ctx.fillStyle = "#4a69bd";
      ctx.fillRect(x, 0, stripeWidth, canvas.height);
    }
    ctx.globalAlpha = 1.0;

    // Add subtle light beams
    ctx.globalAlpha = 0.07;
    for (let i = 0; i < 5; i++) {
      const beamWidth = Math.random() * 100 + 100;
      const startX = Math.random() * canvas.width;
      
      const beamGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      beamGradient.addColorStop(0, "#8ab4f8");
      beamGradient.addColorStop(1, "#2c5ea9");
      
      ctx.fillStyle = beamGradient;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX + beamWidth, 0);
      ctx.lineTo(startX + beamWidth, canvas.height);
      ctx.lineTo(startX, canvas.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Add small particles/stars
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 1.5 + 0.5;
      
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Add decorative frame around the edge (like in reference)
    // Outer frame
    ctx.strokeStyle = themeColors.border; 
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    
    // Inner frame with white
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    // Add corner decorations like in the reference
    const cornerSize = 20;
    const corners = [
      { x: 15, y: 15 }, // Top left
      { x: canvas.width - 15, y: 15 }, // Top right
      { x: 15, y: canvas.height - 15 }, // Bottom left
      { x: canvas.width - 15, y: canvas.height - 15 } // Bottom right
    ];
    
    corners.forEach(corner => {
      ctx.beginPath();
      // Draw cross
      ctx.moveTo(corner.x - 10, corner.y);
      ctx.lineTo(corner.x + 10, corner.y);
      ctx.moveTo(corner.x, corner.y - 10);
      ctx.lineTo(corner.x, corner.y + 10);
      ctx.strokeStyle = themeColors.border;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add center circle
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    });

    // Add top banner with title
    // Simply a transparent overlay at the top
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, canvas.width, 70);

    // Draw "Medidor de Amor" title
    ctx.font = "bold 56px Arial";
    ctx.textAlign = "center";
    
    // Text shadow for depth
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Fill with gradient
    const titleGradient = ctx.createLinearGradient(
      canvas.width/2 - 150, 10, 
      canvas.width/2 + 150, 60
    );
    titleGradient.addColorStop(0, themeColors.title.primary);
    titleGradient.addColorStop(0.5, themeColors.title.secondary);
    titleGradient.addColorStop(1, themeColors.title.primary);
    ctx.fillStyle = titleGradient;
    
    ctx.fillText("Medidor de Amor:", canvas.width/2, 50);
    
    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw avatars with circular borders
    const avatarSize = 150;
    const avatarRadius = avatarSize / 2;
    const leftAvatarX = canvas.width * 0.25;
    const rightAvatarX = canvas.width * 0.75;
    const avatarY = canvas.height * 0.45;

    // Ajustar color del brillo del avatar según el tema
    let avatarGlowColor;
    if (theme === "very_negative" || theme === "negative") {
      avatarGlowColor = "rgba(100, 0, 0, 0.3)";
    } else if (theme === "neutral_negative") {
      avatarGlowColor = "rgba(150, 50, 50, 0.3)";
    } else {
      avatarGlowColor = "rgba(255, 0, 0, 0.3)";
    }

    // Function to draw circular avatar with decorative elements
    const drawAvatar = (x, y, avatarImg) => {
      // Draw glow effect behind avatar (red glow like in reference)
      const glowGradient = ctx.createRadialGradient(
        x, y, avatarRadius * 0.9,
        x, y, avatarRadius * 1.5
      );
      glowGradient.addColorStop(0, avatarGlowColor);
      glowGradient.addColorStop(0.7, avatarGlowColor.replace("0.3", "0.1"));
      glowGradient.addColorStop(1, avatarGlowColor.replace("0.3", "0"));
      
      ctx.beginPath();
      ctx.arc(x, y, avatarRadius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      
      // Circular mask for avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, avatarRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      // Si el tema es muy negativo, agregar un tono grisáceo a los avatares
      if (theme === "very_negative") {
        ctx.drawImage(avatarImg, x - avatarRadius, y - avatarRadius, avatarSize, avatarSize);
        ctx.fillStyle = "rgba(50, 50, 50, 0.4)";
        ctx.fillRect(x - avatarRadius, y - avatarRadius, avatarSize, avatarSize);
      } else if (theme === "negative") {
        ctx.drawImage(avatarImg, x - avatarRadius, y - avatarRadius, avatarSize, avatarSize);
        ctx.fillStyle = "rgba(50, 50, 50, 0.2)";
        ctx.fillRect(x - avatarRadius, y - avatarRadius, avatarSize, avatarSize);
      } else {
        ctx.drawImage(avatarImg, x - avatarRadius, y - avatarRadius, avatarSize, avatarSize);
      }
      
      ctx.restore();
      
      // Red circle border, ajustado según el tema
      ctx.strokeStyle = theme.includes("negative") ? "#800000" : "#ff0000";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, avatarRadius + 2, 0, Math.PI * 2);
      ctx.stroke();
      
      // White outer border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, avatarRadius + 7, 0, Math.PI * 2);
      ctx.stroke();
      
      // Add small white dots around avatar (like in reference)
      const dotCount = 8;
      for (let i = 0; i < dotCount; i++) {
        const angle = (i / dotCount) * Math.PI * 2;
        const dotX = x + Math.cos(angle) * (avatarRadius + 15);
        const dotY = y + Math.sin(angle) * (avatarRadius + 15);
        
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
    };

    // Draw both avatars
    drawAvatar(leftAvatarX, avatarY, avatarImg1);
    drawAvatar(rightAvatarX, avatarY, avatarImg2);

    // Draw dashed line connecting the avatars
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(leftAvatarX + avatarRadius + 15, avatarY);
    ctx.lineTo(rightAvatarX - avatarRadius - 15, avatarY);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw heart in the center - normal or broken depending on percentage
    const heartX = canvas.width / 2;
    const heartY = avatarY;
    const heartSize = 70;
    
    // Heart shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    if (heartBroken) {
      // Draw broken heart (split in two pieces with a gap)
      // Left half
      ctx.beginPath();
      ctx.moveTo(heartX - 5, heartY + heartSize/3);
      ctx.bezierCurveTo(
        heartX - heartSize/2, heartY - heartSize/3,
        heartX - heartSize, heartY + heartSize/3,
        heartX - 15, heartY + heartSize/1.5
      );
      // Break line
      ctx.lineTo(heartX - 15, heartY);
      ctx.lineTo(heartX - 5, heartY + heartSize/6);
      ctx.closePath();
      
      // Right half (shifted slightly)
      ctx.beginPath();
      ctx.moveTo(heartX + 5, heartY + heartSize/3);
      ctx.bezierCurveTo(
        heartX + heartSize/2, heartY - heartSize/3,
        heartX + heartSize, heartY + heartSize/3,
        heartX + 15, heartY + heartSize/1.5
      );
      // Break line
      ctx.lineTo(heartX + 15, heartY);
      ctx.lineTo(heartX + 5, heartY + heartSize/6);
      ctx.closePath();
      
      // Heart gradient fill (dark red for broken heart)
      const brokenHeartGradient = ctx.createLinearGradient(
        heartX - heartSize/2, heartY - heartSize/2,
        heartX + heartSize/2, heartY + heartSize/2
      );
      brokenHeartGradient.addColorStop(0, themeColors.heart.primary);
      brokenHeartGradient.addColorStop(1, themeColors.heart.secondary);
      ctx.fillStyle = brokenHeartGradient;
      ctx.fill();
      
      // Crack line in the middle
      ctx.beginPath();
      ctx.moveTo(heartX, heartY - heartSize/4);
      // Zigzag crack
      ctx.lineTo(heartX - 8, heartY - heartSize/8);
      ctx.lineTo(heartX + 5, heartY);
      ctx.lineTo(heartX - 3, heartY + heartSize/6);
      ctx.lineTo(heartX + 8, heartY + heartSize/3);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Draw regular heart
      ctx.beginPath();
      ctx.moveTo(heartX, heartY + heartSize/3);
      ctx.bezierCurveTo(
        heartX - heartSize/2, heartY - heartSize/3,
        heartX - heartSize, heartY + heartSize/3,
        heartX, heartY + heartSize/1.5
      );
      ctx.bezierCurveTo(
        heartX + heartSize, heartY + heartSize/3,
        heartX + heartSize/2, heartY - heartSize/3,
        heartX, heartY + heartSize/3
      );
      
      // Heart gradient fill
      const heartGradient = ctx.createLinearGradient(
        heartX - heartSize/2, heartY - heartSize/2,
        heartX + heartSize/2, heartY + heartSize/2
      );
      heartGradient.addColorStop(0, themeColors.heart.primary);
      heartGradient.addColorStop(1, themeColors.heart.secondary);
      ctx.fillStyle = heartGradient;
      ctx.fill();
    }
    
    // White outline for all heart versions
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Add shine to heart (small white curve) if not broken
    if (!heartBroken) {
      ctx.beginPath();
      ctx.moveTo(heartX - heartSize/3, heartY - heartSize/5);
      ctx.quadraticCurveTo(
        heartX - heartSize/6, heartY - heartSize/3,
        heartX, heartY - heartSize/4
      );
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Add small hearts above the center heart (like in reference) - only if good percentage
    if (shipPercentage >= 50) {
      const miniHearts = [
        { x: heartX - 20, y: heartY - 45, size: 15 },
        { x: heartX + 15, y: heartY - 55, size: 20 },
        { x: heartX + 40, y: heartY - 35, size: 15 }
      ];

      miniHearts.forEach(({x, y, size}) => {
        ctx.beginPath();
        ctx.moveTo(x, y + size/3);
        ctx.bezierCurveTo(
          x - size/2, y - size/3,
          x - size, y + size/3,
          x, y + size/1.5
        );
        ctx.bezierCurveTo(
          x + size, y + size/3,
          x + size/2, y - size/3,
          x, y + size/3
        );
        
        ctx.fillStyle = themeColors.heart.primary;
        ctx.fill();
        
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    } else if (theme === "neutral_negative") {
      // Agregar una pequeña lágrima en lugar de corazones para el tema neutral_negative
      ctx.beginPath();
      ctx.moveTo(heartX + 10, heartY - 20);
      ctx.bezierCurveTo(
        heartX + 10, heartY - 15,
        heartX + 15, heartY - 10,
        heartX + 15, heartY
      );
      ctx.fillStyle = "#8eacff";
      ctx.fill();
    } else if (heartBroken) {
      // Agregar lágrimas para corazones rotos
      const tears = [
        { x: heartX - 25, y: heartY - 15, size: 6 },
        { x: heartX + 25, y: heartY - 20, size: 8 }
      ];
      
      tears.forEach(({x, y, size}) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(
          x - size/2, y + size,
          x + size/2, y + size,
          x, y
        );
        ctx.fillStyle = "#8eacff";
        ctx.fill();
      });
    }

    // Create panel for percentage and SHIP text
    // Semi-transparent panel
    const panelWidth = 220;
    const panelHeight = 130;
    const panelX = canvas.width/2 - panelWidth/2;
    const panelY = avatarY + 80;
    
    // Draw panel with rounded corners
    ctx.beginPath();
    const cornerRadius = 10;
    ctx.moveTo(panelX + cornerRadius, panelY);
    ctx.lineTo(panelX + panelWidth - cornerRadius, panelY);
    ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + cornerRadius);
    ctx.lineTo(panelX + panelWidth, panelY + panelHeight - cornerRadius);
    ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - cornerRadius, panelY + panelHeight);
    ctx.lineTo(panelX + cornerRadius, panelY + panelHeight);
    ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - cornerRadius);
    ctx.lineTo(panelX, panelY + cornerRadius);
    ctx.quadraticCurveTo(panelX, panelY, panelX + cornerRadius, panelY);
    ctx.closePath();
    
    // Fill panel with semi-transparent gradient
    const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
    panelGradient.addColorStop(0, `rgba(0, 0, 0, ${panelAlpha - 0.1})`);
    panelGradient.addColorStop(1, `rgba(0, 0, 0, ${panelAlpha})`);
    ctx.fillStyle = panelGradient;
    ctx.fill();

    // Draw percentage
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    
    // Add shadow for depth
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Position in the upper part of the panel
    ctx.fillText(`${shipPercentage}%`, canvas.width/2, panelY + 65);
    
    // Draw "SHIP" text
    ctx.font = "bold 40px Arial";
    
    // Gradient text for "SHIP"
    const shipGradient = ctx.createLinearGradient(
      canvas.width/2 - 50, panelY + panelHeight - 30,
      canvas.width/2 + 50, panelY + panelHeight
    );
    shipGradient.addColorStop(0, themeColors.ship.primary);
    shipGradient.addColorStop(1, themeColors.ship.secondary);
    ctx.fillStyle = shipGradient;
    
    // Position in the lower part of the panel, but not touching the percentage
    ctx.fillText("SHIP", canvas.width/2, panelY + panelHeight - 25);
    
    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Send image as response
    res.setHeader("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating ship image" });
  }
});

module.exports = router;
