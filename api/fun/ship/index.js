const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const path = require("path");
const router = express.Router();

// Simplified background array - anime sunset/scenery backgrounds
const backgrounds = [
  "https://wallpaperaccess.com/full/1154341.jpg", // Anime sunset
  "https://i.pinimg.com/originals/ea/00/0c/ea000cc6fb9375b14a7b21d55dcf9745.jpg", // Night sky anime
  "https://wallpaperaccess.com/full/3137677.jpg", // Anime beach sunset
  "https://wallpapercave.com/wp/wp5986661.jpg", // Anime evening
  "https://i.pinimg.com/originals/02/ba/86/02ba867e545f953631148c89629412b1.jpg" // Purple anime sky
];

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

    // Select a random background
    const backgroundUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    // Create canvas with 16:9 ratio to match the reference image
    const canvas = Canvas.createCanvas(900, 450);
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
    const background = await loadImage(backgroundUrl);
    const avatarImg1 = await loadImage(avatar1);
    const avatarImg2 = await loadImage(avatar2);

    if (!background || !avatarImg1 || !avatarImg2) {
      return res.status(500).json({ error: "Error loading images." });
    }

    // Draw background
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Add semi-transparent overlay for better text visibility at top
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 0, canvas.width, 70); 

    // Draw "Cupido" title
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "#ff6b6b";
    ctx.textAlign = "center";
    ctx.fillText("Anny Cupido:", canvas.width / 2, 50);

    // Draw avatars with circular borders
    // Draw left avatar
    const avatarSize = 140;
    const avatarRadius = avatarSize / 2;
    const leftAvatarX = canvas.width * 0.25;
    const rightAvatarX = canvas.width * 0.75;
    const avatarY = canvas.height * 0.4;

    // Left avatar with circular mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(leftAvatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg1, leftAvatarX - avatarRadius, avatarY - avatarRadius, avatarSize, avatarSize);
    ctx.restore();

    // Left avatar red circle border
    ctx.strokeStyle = "#ff3b3b";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(leftAvatarX, avatarY, avatarRadius + 3, 0, Math.PI * 2);
    ctx.stroke();

    // Left avatar white outer border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(leftAvatarX, avatarY, avatarRadius + 10, 0, Math.PI * 2);
    ctx.stroke();

    // Right avatar with circular mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(rightAvatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg2, rightAvatarX - avatarRadius, avatarY - avatarRadius, avatarSize, avatarSize);
    ctx.restore();

    // Right avatar red circle border
    ctx.strokeStyle = "#ff3b3b";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(rightAvatarX, avatarY, avatarRadius + 3, 0, Math.PI * 2);
    ctx.stroke();

    // Right avatar white outer border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(rightAvatarX, avatarY, avatarRadius + 10, 0, Math.PI * 2);
    ctx.stroke();

    // Draw a better heart in the center
    const heartX = canvas.width / 2;
    const heartY = avatarY;
    const heartSize = 90;
    
    // Custom heart drawing with gradient fill
    ctx.beginPath();
    // Left curve of heart
    ctx.moveTo(heartX, heartY + heartSize/4);
    ctx.bezierCurveTo(
      heartX - heartSize/2, heartY - heartSize/2, 
      heartX - heartSize, heartY + heartSize/4, 
      heartX, heartY + heartSize/1.5
    );
    // Right curve of heart
    ctx.bezierCurveTo(
      heartX + heartSize, heartY + heartSize/4, 
      heartX + heartSize/2, heartY - heartSize/2, 
      heartX, heartY + heartSize/4
    );
    ctx.closePath();
    
    // Heart gradient fill
    const heartGradient = ctx.createLinearGradient(
      heartX - heartSize/2, heartY - heartSize/2,
      heartX + heartSize/2, heartY + heartSize/2
    );
    heartGradient.addColorStop(0, "#ff3b3b");
    heartGradient.addColorStop(1, "#ff0000");
    ctx.fillStyle = heartGradient;
    ctx.fill();
    
    // Heart outline
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add shine effect to heart
    ctx.beginPath();
    ctx.moveTo(heartX - heartSize/3, heartY - heartSize/4);
    ctx.quadraticCurveTo(
      heartX - heartSize/6, heartY - heartSize/3,
      heartX - heartSize/8, heartY - heartSize/8
    );
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
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
      
      // Draw mini heart
      ctx.beginPath();
      // Left curve of mini heart
      ctx.moveTo(x, y + size/4);
      ctx.bezierCurveTo(
        x - size/2, y - size/2, 
        x - size, y + size/4, 
        x, y + size/1.5
      );
      // Right curve of mini heart
      ctx.bezierCurveTo(
        x + size, y + size/4, 
        x + size/2, y - size/2, 
        x, y + size/4
      );
      ctx.closePath();
      
      // Fill mini heart
      ctx.fillStyle = "#ff3b3b";
      ctx.fill();
      
      // Mini heart outline
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Semi-transparent background for percentage
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(canvas.width/2 - 120, canvas.height * 0.68 - 50, 240, 100);

    // Draw percentage with improved styling
    ctx.font = "bold 100px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${shipPercentage}%`, canvas.width / 2, canvas.height * 0.68);

    // Add shadow to percentage
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillText(`${shipPercentage}%`, canvas.width / 2, canvas.height * 0.68);
    ctx.shadowColor = "transparent"; // Reset shadow
    
    // Add "SHIP" text below
    ctx.font = "bold 45px Arial";
    ctx.fillStyle = "#ff6b6b";
    ctx.fillText("SHIP", canvas.width / 2, canvas.height * 0.85);

    // Send image as response
    res.setHeader("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating ship image" });
  }
});

module.exports = router;
