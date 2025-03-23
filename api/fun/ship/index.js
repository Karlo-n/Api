const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const path = require("path");
const router = express.Router();

// Background arrays for different styles
const animeBackgrounds = [
  "https://wallpapers.com/images/hd/cute-anime-couple-holding-hands-sunset-6st7c0vnw0wffssj.jpg",
  "https://img.freepik.com/premium-photo/anime-couple-holding-hands-field-flowers-generative-ai_974533-22369.jpg",
  "https://i.pinimg.com/originals/a8/63/92/a86392cee24f5fc5d332c1b20c207e3f.jpg",
  "https://i.pinimg.com/originals/a2/b2/dc/a2b2dc3d15e9d9a9db7797efe93a451f.jpg",
  "https://i.pinimg.com/originals/78/3f/be/783fbe31b8c76a7513afef166c491d99.jpg"
];

const esteticoBackgrounds = [
  "https://i.pinimg.com/originals/e0/46/75/e04675f3c7c4e3b18f4a9790d2e1d353.jpg",
  "https://i.pinimg.com/originals/9e/08/11/9e0811614f40078b7fd163c95fa77d85.jpg",
  "https://i.pinimg.com/originals/1a/c9/a9/1ac9a9e5d59062a431f8a1bcf7795376.jpg",
  "https://i.pinimg.com/originals/f2/bd/63/f2bd63ff46a690aa7f11979c97e8d79c.jpg",
  "https://i.pinimg.com/originals/9f/70/73/9f70731bf7eb6481e16e12bfbc35c624.jpg"
];

// Default backgrounds
const defaultBackgrounds = [
  "https://wallpapers.com/images/hd/cute-anime-couple-holding-hands-sunset-6st7c0vnw0wffssj.jpg",
  "https://img.freepik.com/premium-photo/anime-couple-holding-hands-field-flowers-generative-ai_974533-22369.jpg",
  "https://th.bing.com/th/id/OIP.RI5mDg5pyJBQjtotMJ4YIgHaEK?rs=1&pid=ImgDetMain"
];

// Ruta del corazón en la carpeta /api/fun/ship
const heartPath = path.join(__dirname, "corazon.png");

router.get("/", async (req, res) => {
  try {
    const { avatar1, avatar2, json, numero, estilo } = req.query;

    // Validate required parameters
    if (!avatar1 || !avatar2 || !numero) {
      return res.status(400).json({ 
        error: "Faltan parámetros. Debes enviar avatar1, avatar2 y numero" 
      });
    }

    // Parse ship percentage (ensure it's between 0-100)
    const shipPercentage = Math.min(100, Math.max(0, parseInt(numero) || 0));

    // Get backgrounds based on style
    let backgroundsArray = defaultBackgrounds;
    if (estilo === "anime") {
      backgroundsArray = animeBackgrounds;
    } else if (estilo === "estetico") {
      backgroundsArray = esteticoBackgrounds;
    }
    
    // If user wants JSON response only
    if (json === "true") {
      return res.json({
        message: "❤️ Compatibilidad de pareja ❤️",
        avatar1: avatar1,
        avatar2: avatar2,
        love_percentage: `${shipPercentage}%`,
        estilo: estilo || "default"
      });
    }

    // Select a random background
    const backgroundUrl = backgroundsArray[Math.floor(Math.random() * backgroundsArray.length)];

    // Create canvas
    const canvas = Canvas.createCanvas(800, 400);
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
    const heartImg = await Canvas.loadImage(heartPath);

    if (!background || !avatarImg1 || !avatarImg2 || !heartImg) {
      return res.status(500).json({ error: "Error loading images." });
    }

    // Draw background
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Add semi-transparent overlay for better text visibility
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, 70); // Top bar

    // Draw title
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#ff6b6b";
    ctx.textAlign = "center";
    ctx.fillText("Anny Cupido:", canvas.width / 2, 50);

    // Draw avatars with circular borders
    // Draw left avatar
    const avatarSize = 150;
    ctx.save();
    ctx.beginPath();
    ctx.arc(180, 200, avatarSize/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg1, 180 - avatarSize/2, 200 - avatarSize/2, avatarSize, avatarSize);
    ctx.restore();

    // Add red border to avatar 1
    ctx.strokeStyle = "#ff6b6b";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(180, 200, avatarSize/2 + 5, 0, Math.PI * 2);
    ctx.stroke();

    // Add white outer border to avatar 1
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(180, 200, avatarSize/2 + 10, 0, Math.PI * 2);
    ctx.stroke();

    // Draw right avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(620, 200, avatarSize/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg2, 620 - avatarSize/2, 200 - avatarSize/2, avatarSize, avatarSize);
    ctx.restore();

    // Add red border to avatar 2
    ctx.strokeStyle = "#ff6b6b";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(620, 200, avatarSize/2 + 5, 0, Math.PI * 2);
    ctx.stroke();

    // Add white outer border to avatar 2
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(620, 200, avatarSize/2 + 10, 0, Math.PI * 2);
    ctx.stroke();

    // Draw heart in the center
    const heartSize = 100;
    ctx.drawImage(heartImg, 400 - heartSize/2, 200 - heartSize/2, heartSize, heartSize);

    // Draw percentage in the center
    ctx.font = "bold 80px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${shipPercentage}%`, canvas.width / 2, 320);

    // Add "SHIP" text below
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#ff6b6b";
    ctx.fillText("SHIP", canvas.width / 2, 360);

    // Add decorative elements (small hearts, sparkles)
    // Draw small decorative hearts
    const smallHearts = [
      { x: 360, y: 150, size: 20 },
      { x: 440, y: 150, size: 15 },
      { x: 400, y: 130, size: 25 }
    ];

    for (const heart of smallHearts) {
      ctx.drawImage(heartImg, heart.x, heart.y, heart.size, heart.size);
    }

    // Add sparkles
    ctx.fillStyle = "yellow";
    const sparkles = [
      { x: 375, y: 140, size: 5 },
      { x: 425, y: 140, size: 5 },
      { x: 375, y: 180, size: 5 },
      { x: 425, y: 180, size: 5 }
    ];

    for (const sparkle of sparkles) {
      ctx.beginPath();
      // Draw a star shape
      for (let i = 0; i < 5; i++) {
        const radius = i % 2 === 0 ? sparkle.size : sparkle.size / 2;
        const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        const x = sparkle.x + radius * Math.cos(angle);
        const y = sparkle.y + radius * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    }

    // Send image as response
    res.setHeader("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating ship image" });
  }
});

module.exports = router;
