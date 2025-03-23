const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const path = require("path");
const router = express.Router();

// Single beautiful background for all ships
const BACKGROUND_URL = "https://wallpaperaccess.com/full/2825704.jpg"; // Beautiful countryside sunset

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

    // Create canvas with 16:9 ratio to match the reference image
    const canvas = Canvas.createCanvas(900, 500);
    const ctx = canvas.getContext("2d");

    // Load images safely with axios
    const loadImage = async (url) => {
      try {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        return await Canvas.loadImage(Buffer.from(response.data));
      } catch (error) {
        console.error(`Error loading image: ${url}`, error);
        return null;
      }
    };

    // Load all required images
    const background = await loadImage(BACKGROUND_URL);
    const avatarImg1 = await loadImage(avatar1);
    const avatarImg2 = await loadImage(avatar2);

    if (!background || !avatarImg1 || !avatarImg2) {
      return res.status(500).json({ error: "Error loading images." });
    }

    // Draw background
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Add overall overlay for better contrast
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add decorative frame around the whole image
    const frameWidth = 15;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = frameWidth;
    ctx.strokeRect(frameWidth/2, frameWidth/2, canvas.width - frameWidth, canvas.height - frameWidth);
    
    // Add inner frame with gradient
    const innerFrameWidth = 3;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#ff6b6b");
    gradient.addColorStop(0.5, "#ffb8b8");
    gradient.addColorStop(1, "#ff6b6b");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = innerFrameWidth;
    ctx.strokeRect(frameWidth + 5, frameWidth + 5, canvas.width - (frameWidth + 10) * 2, canvas.height - (frameWidth + 10) * 2);

    // Add top banner with gradient
    const bannerHeight = 80;
    const bannerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    bannerGradient.addColorStop(0, "rgba(0, 0, 0, 0.7)");
    bannerGradient.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");
    bannerGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
    ctx.fillStyle = bannerGradient;
    ctx.fillRect(0, 0, canvas.width, bannerHeight);

    // Draw "Anny Cupido:" title with effects
    ctx.font = "bold 56px Arial";
    
    // Text shadow effect
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Gradient text
    const textGradient = ctx.createLinearGradient(
      canvas.width/2 - 150, 20, 
      canvas.width/2 + 150, 70
    );
    textGradient.addColorStop(0, "#ff6b6b");
    textGradient.addColorStop(0.5, "#ff9d9d");
    textGradient.addColorStop(1, "#ff6b6b");
    ctx.fillStyle = textGradient;
    
    ctx.textAlign = "center";
    ctx.fillText("Anny Cupido:", canvas.width / 2, 55);
    
    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw avatars with circular borders
    const avatarSize = 160;
    const avatarRadius = avatarSize / 2;
    const leftAvatarX = canvas.width * 0.25;
    const rightAvatarX = canvas.width * 0.75;
    const avatarY = canvas.height * 0.4;

    // Function to draw circular avatar with decorative elements
    const drawAvatar = (x, y, avatarImg) => {
      // Draw glow effect behind avatar
      const glowGradient = ctx.createRadialGradient(
        x, y, avatarRadius * 0.9,
        x, y, avatarRadius * 1.6
      );
      glowGradient.addColorStop(0, "rgba(255, 107, 107, 0.8)");
      glowGradient.addColorStop(0.5, "rgba(255, 107, 107, 0.3)");
      glowGradient.addColorStop(1, "rgba(255, 107, 107, 0)");
      
      ctx.beginPath();
      ctx.arc(x, y, avatarRadius * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      
      // Circular mask for avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, avatarRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, x - avatarRadius, y - avatarRadius, avatarSize, avatarSize);
      ctx.restore();
      
      // Red circle border (gradient)
      const borderGradient = ctx.createLinearGradient(
        x - avatarRadius, y - avatarRadius,
        x + avatarRadius, y + avatarRadius
      );
      borderGradient.addColorStop(0, "#ff3b3b");
      borderGradient.addColorStop(1, "#ff7777");
      
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(x, y, avatarRadius + 3, 0, Math.PI * 2);
      ctx.stroke();
      
      // White outer border with shadow
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 15;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, avatarRadius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowColor = "transparent";
      
      // Add decorative dots around avatar
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const dotX = x + (avatarRadius + 20) * Math.cos(angle);
        const dotY = y + (avatarRadius + 20) * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? "#ff3b3b" : "#ffffff";
        ctx.fill();
      }
    };

    // Draw both avatars
    drawAvatar(leftAvatarX, avatarY, avatarImg1);
    drawAvatar(rightAvatarX, avatarY, avatarImg2);

    // Draw a connection line between avatars
    ctx.beginPath();
    ctx.moveTo(leftAvatarX + avatarRadius + 15, avatarY);
    ctx.lineTo(rightAvatarX - avatarRadius - 15, avatarY);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw a better heart in the center
    const heartX = canvas.width / 2;
    const heartY = avatarY;
    const heartSize = 100;
    
    // Heart shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    // Custom heart drawing with complex gradient fill
    ctx.beginPath();
    ctx.moveTo(heartX, heartY + heartSize/4);
    ctx.bezierCurveTo(
      heartX - heartSize/2, heartY - heartSize/2, 
      heartX - heartSize, heartY + heartSize/4, 
      heartX, heartY + heartSize/1.5
    );
    ctx.bezierCurveTo(
      heartX + heartSize, heartY + heartSize/4, 
      heartX + heartSize/2, heartY - heartSize/2, 
      heartX, heartY + heartSize/4
    );
    ctx.closePath();
    
    // Heart gradient fill
    const heartGradient = ctx.createRadialGradient(
      heartX, heartY, heartSize/4,
      heartX, heartY, heartSize
    );
    heartGradient.addColorStop(0, "#ff5252");
    heartGradient.addColorStop(0.7, "#ff0000");
    heartGradient.addColorStop(1, "#b30000");
    ctx.fillStyle = heartGradient;
    ctx.fill();
    
    // Heart outline
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Add shine effect to heart
    ctx.beginPath();
    ctx.moveTo(heartX - heartSize/3, heartY - heartSize/4);
    ctx.quadraticCurveTo(
      heartX - heartSize/6, heartY - heartSize/3,
      heartX - heartSize/8, heartY - heartSize/8
    );
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Add small hearts around the main heart
    const miniHearts = [
      { x: heartX - heartSize/2, y: heartY - heartSize/2, size: heartSize/4 },
      { x: heartX + heartSize/3, y: heartY - heartSize/2.5, size: heartSize/3 },
      { x: heartX, y: heartY - heartSize/1.8, size: heartSize/5 }
    ];

    miniHearts.forEach(miniHeart => {
      const { x, y, size } = miniHeart;
      
      // Draw mini heart with shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 5;
      
      ctx.beginPath();
      ctx.moveTo(x, y + size/4);
      ctx.bezierCurveTo(
        x - size/2, y - size/2, 
        x - size, y + size/4, 
        x, y + size/1.5
      );
      ctx.bezierCurveTo(
        x + size, y + size/4, 
        x + size/2, y - size/2, 
        x, y + size/4
      );
      ctx.closePath();
      
      // Fill mini heart with gradient
      const miniHeartGradient = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
      miniHeartGradient.addColorStop(0, "#ff5252");
      miniHeartGradient.addColorStop(1, "#ff0000");
      ctx.fillStyle = miniHeartGradient;
      ctx.fill();
      
      // Mini heart outline
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    });

    // Create glass-effect panel for percentage
    ctx.save();
    const panelWidth = 240;
    const panelHeight = 150;
    const panelX = canvas.width/2 - panelWidth/2;
    const panelY = canvas.height * 0.68 - 40;
    
    // Panel background with gradient
    const panelGradient = ctx.createLinearGradient(
      panelX, panelY,
      panelX + panelWidth, panelY + panelHeight
    );
    panelGradient.addColorStop(0, "rgba(0, 0, 0, 0.5)");
    panelGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
    
    // Draw rounded rectangle
    const radius = 15;
    ctx.beginPath();
    ctx.moveTo(panelX + radius, panelY);
    ctx.lineTo(panelX + panelWidth - radius, panelY);
    ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + radius);
    ctx.lineTo(panelX + panelWidth, panelY + panelHeight - radius);
    ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - radius, panelY + panelHeight);
    ctx.lineTo(panelX + radius, panelY + panelHeight);
    ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - radius);
    ctx.lineTo(panelX, panelY + radius);
    ctx.quadraticCurveTo(panelX, panelY, panelX + radius, panelY);
    ctx.closePath();
    
    ctx.fillStyle = panelGradient;
    ctx.fill();
    
    // Panel border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw decorative lines inside panel
    ctx.beginPath();
    ctx.moveTo(panelX + 15, panelY + 15);
    ctx.lineTo(panelX + panelWidth - 15, panelY + 15);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(panelX + 15, panelY + panelHeight - 15);
    ctx.lineTo(panelX + panelWidth - 15, panelY + panelHeight - 15);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw percentage with 3D effect
    ctx.font = "bold 100px Arial";
    
    // Draw shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${shipPercentage}%`, canvas.width / 2 + 4, canvas.height * 0.68 + 4);
    
    // Draw text with gradient
    const percentGradient = ctx.createLinearGradient(
      canvas.width/2 - 80, panelY + 20,
      canvas.width/2 + 80, panelY + panelHeight - 20
    );
    percentGradient.addColorStop(0, "#ffffff");
    percentGradient.addColorStop(0.5, "#f0f0f0");
    percentGradient.addColorStop(1, "#e0e0e0");
    ctx.fillStyle = percentGradient;
    ctx.fillText(`${shipPercentage}%`, canvas.width / 2, canvas.height * 0.68);
    
    // Add "SHIP" text with special effects
    ctx.font = "bold 45px Arial";
    
    // Text shadow for depth
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Text gradient
    const shipGradient = ctx.createLinearGradient(
      canvas.width/2 - 60, canvas.height * 0.85 - 20,
      canvas.width/2 + 60, canvas.height * 0.85 + 20
    );
    shipGradient.addColorStop(0, "#ff6b6b");
    shipGradient.addColorStop(0.5, "#ff9d9d");
    shipGradient.addColorStop(1, "#ff6b6b");
    ctx.fillStyle = shipGradient;
    
    ctx.fillText("SHIP", canvas.width / 2, canvas.height * 0.88);
    
    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.restore();

    // Add decorative corner elements
    const cornerSize = 30;
    const cornerOffset = 30;
    const corners = [
      { x: cornerOffset, y: cornerOffset }, // Top left
      { x: canvas.width - cornerOffset, y: cornerOffset }, // Top right
      { x: cornerOffset, y: canvas.height - cornerOffset }, // Bottom left
      { x: canvas.width - cornerOffset, y: canvas.height - cornerOffset } // Bottom right
    ];
    
    corners.forEach(corner => {
      // Draw decorative corner
      ctx.beginPath();
      if (corner.x < canvas.width / 2) {
        // Left corners
        ctx.moveTo(corner.x, corner.y - cornerSize / 2);
        ctx.lineTo(corner.x, corner.y + cornerSize / 2);
        ctx.moveTo(corner.x - cornerSize / 2, corner.y);
        ctx.lineTo(corner.x + cornerSize / 2, corner.y);
      } else {
        // Right corners
        ctx.moveTo(corner.x, corner.y - cornerSize / 2);
        ctx.lineTo(corner.x, corner.y + cornerSize / 2);
        ctx.moveTo(corner.x - cornerSize / 2, corner.y);
        ctx.lineTo(corner.x + cornerSize / 2, corner.y);
      }
      
      ctx.strokeStyle = "#ff6b6b";
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Add decorative dot
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#ff6b6b";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Send image as response
    res.setHeader("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating ship image" });
  }
});

module.exports = router;
