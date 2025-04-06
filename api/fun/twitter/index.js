// api/fun/twitter/index.js
const express = require("express");
const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Create directory for output images if it doesn't exist
const IMAGES_DIR = path.join(__dirname, "output");
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || "https://api.apikarl.com";
const PUBLIC_PATH = "/api/fun/twitter/output";

if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Register fonts (using Arial as fallback if not available)
try {
    registerFont(path.join(__dirname, "assets", "Roboto-Regular.ttf"), { family: "Roboto" });
    registerFont(path.join(__dirname, "assets", "Roboto-Bold.ttf"), { family: "Roboto Bold" });
} catch (error) {
    console.warn("Couldn't register custom fonts, using system fonts as fallback:", error);
}

// Create assets directory and verification badge
const ASSETS_DIR = path.join(__dirname, "assets");
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Route to serve stored images
router.get("/output/:filename", (req, res) => {
    const filePath = path.join(IMAGES_DIR, req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400"); // 24 hours
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "Image not found" });
    }
});

// Main API endpoint
router.get("/", async (req, res) => {
    try {
        // Extract parameters
        const { 
            nombre, 
            usuario, 
            pfp, 
            texto,
            verificado = "false",
            color = "blanco",
            imagen,
            afilacion,
            importante,
            likes = "0",
            favoritos = "0",
            compartidos = "0"
        } = req.query;

        // Validate required parameters
        if (!nombre || !usuario || !pfp || !texto) {
            return res.status(400).json({ 
                error: "Missing required parameters",
                required: ["nombre", "usuario", "pfp", "texto"],
                example: "/api/fun/twitter?nombre=John%20Doe&usuario=johndoe&pfp=https://example.com/profile.jpg&texto=Hello%20World!"
            });
        }

        // Generate Twitter card image
        const cardBuffer = await generateTwitterCard({
            nombre,
            usuario,
            pfp,
            texto,
            verificado: verificado.toLowerCase() === "true",
            colorFondo: color.toLowerCase(),
            imagen,
            afilacion,
            importante,
            likes: parseInt(likes) || 0,
            favoritos: parseInt(favoritos) || 0,
            compartidos: parseInt(compartidos) || 0
        });

        // Generate a unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filename = `twitter_${timestamp}_${randomStr}.png`;
        const filePath = path.join(IMAGES_DIR, filename);

        // Save the image
        fs.writeFileSync(filePath, cardBuffer);

        // Generate public URL
        const imageUrl = `${PUBLIC_URL_BASE}${PUBLIC_PATH}/${filename}`;

        // Schedule deletion after 24 hours
        setTimeout(() => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted Twitter card: ${filename}`);
            }
        }, 24 * 60 * 60 * 1000);

        // Return JSON with the image URL
        res.json({
            success: true,
            url: imageUrl,
            message: "Twitter card generated successfully"
        });

    } catch (error) {
        console.error("Error generating Twitter card:", error);
        res.status(500).json({ 
            error: "Failed to generate Twitter card",
            details: error.message
        });
    }
});

/**
 * Generate a Twitter-like card image
 */
async function generateTwitterCard(options) {
    // Set dimensions (Twitter-like card)
    const width = 600;
    const height = options.imagen ? 550 : 320;
    const paddingX = 16;
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // Set background color
    if (options.colorFondo === "negro") {
        ctx.fillStyle = "#15202b"; // Twitter dark mode
    } else {
        ctx.fillStyle = "#ffffff"; // Twitter light mode
    }
    ctx.fillRect(0, 0, width, height);
    
    try {
        // Load profile picture
        const profileImage = await loadImage(options.pfp);
        
        // Draw profile picture (circular crop)
        const profileSize = 50;
        const profileX = paddingX + profileSize/2;
        const profileY = 40;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(profileX, profileY, profileSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(profileImage, profileX - profileSize/2, profileY - profileSize/2, profileSize, profileSize);
        ctx.restore();
        
        // Set text color based on background
        const textColor = options.colorFondo === "negro" ? "#ffffff" : "#000000";
        const secondaryColor = options.colorFondo === "negro" ? "#8899a6" : "#536471";
        
        // Draw user name and verification badge
        ctx.fillStyle = textColor;
        ctx.font = "bold 18px 'Roboto Bold', Arial, sans-serif";
        
        const nameX = profileX + profileSize/2 + 15;
        const nameY = profileY - 10;
        ctx.fillText(options.nombre, nameX, nameY);
        
        // Draw verification badge if verified
        if (options.verificado) {
            // Draw a verified badge (blue circle with white checkmark)
            const badgeSize = 18;
            const badgeX = nameX + ctx.measureText(options.nombre).width + 5;
            const badgeY = nameY - badgeSize/2;
            
            // Blue circle
            ctx.fillStyle = "#1DA1F2";
            ctx.beginPath();
            ctx.arc(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2, 0, Math.PI * 2);
            ctx.fill();
            
            // White checkmark
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px Arial";
            ctx.fillText("✓", badgeX + 4, badgeY + 13);
        }
        
        // Draw username
        ctx.fillStyle = secondaryColor;
        ctx.font = "16px 'Roboto', Arial, sans-serif";
        ctx.fillText(`@${options.usuario}`, nameX, nameY + 20);
        
        // Draw important designation if provided
        if (options.importante) {
            const importanteX = nameX;
            const importanteY = nameY + 40;
            
            // Background for important designation
            ctx.fillStyle = options.colorFondo === "negro" ? "#192734" : "#f7f9f9";
            const importanteWidth = ctx.measureText(options.importante).width + 20;
            const importanteHeight = 24;
            drawRoundRect(ctx, importanteX, importanteY - importanteHeight + 5, importanteWidth, importanteHeight, 12);
            ctx.fill();
            
            // Draw the text with special color
            ctx.fillStyle = "#1DA1F2"; // Twitter blue for important
            ctx.font = "14px 'Roboto Bold', Arial, sans-serif";
            ctx.fillText(options.importante, importanteX + 10, importanteY);
        }
        
        // Draw affiliation badge if provided
        let afilacionY = options.importante ? nameY + 70 : nameY + 45;
        
        if (options.afilacion) {
            if (options.afilacion.startsWith("http")) {
                // It's an image URL
                try {
                    const afilacionImage = await loadImage(options.afilacion);
                    const afilacionSize = 24;
                    ctx.drawImage(afilacionImage, nameX, afilacionY - afilacionSize, afilacionSize, afilacionSize);
                    afilacionY += 30;
                } catch (error) {
                    console.error("Failed to load affiliation image:", error);
                }
            } else {
                // It's text
                ctx.fillStyle = "#1DA1F2"; // Twitter blue
                ctx.font = "14px 'Roboto Bold', Arial, sans-serif";
                ctx.fillText(options.afilacion, nameX, afilacionY);
                afilacionY += 25;
            }
        }
        
        // Draw tweet text
        ctx.fillStyle = textColor;
        ctx.font = "18px 'Roboto', Arial, sans-serif";
        
        const textX = paddingX;
        let textY = afilacionY + 10;
        
        // Handle text wrapping
        const maxWidth = width - (paddingX * 2);
        const wrappedText = wrapText(ctx, options.texto, maxWidth);
        
        wrappedText.forEach(line => {
            ctx.fillText(line, textX, textY);
            textY += 25;
        });
        
        // Draw attached image if provided
        let currentY = textY + 15;
        
        if (options.imagen) {
            try {
                const tweetImage = await loadImage(options.imagen);
                const maxImageHeight = 250;
                const maxImageWidth = width - (paddingX * 2);
                
                // Calculate dimensions while preserving aspect ratio
                let imgWidth = tweetImage.width;
                let imgHeight = tweetImage.height;
                
                if (imgWidth > maxImageWidth) {
                    imgHeight = (maxImageWidth / imgWidth) * imgHeight;
                    imgWidth = maxImageWidth;
                }
                
                if (imgHeight > maxImageHeight) {
                    imgWidth = (maxImageHeight / imgHeight) * imgWidth;
                    imgHeight = maxImageHeight;
                }
                
                // Draw the image with rounded corners
                const imageX = paddingX;
                const imageY = currentY;
                
                ctx.save();
                drawRoundRect(ctx, imageX, imageY, imgWidth, imgHeight, 16);
                ctx.clip();
                ctx.drawImage(tweetImage, imageX, imageY, imgWidth, imgHeight);
                ctx.restore();
                
                currentY += imgHeight + 20;
            } catch (error) {
                console.error("Failed to load tweet image:", error);
            }
        }
        
        // Draw interaction counts (likes, retweets, etc.)
        currentY += 10;
        
        const iconSpacing = 150;
        const iconY = currentY;
        
        // Comment icon
        ctx.fillStyle = secondaryColor;
        drawCommentIcon(ctx, paddingX, iconY, secondaryColor);
        ctx.font = "14px 'Roboto', Arial, sans-serif";
        ctx.fillText(formatNumber(options.favoritos), paddingX + 30, iconY + 5);
        
        // Retweet icon
        drawRetweetIcon(ctx, paddingX + iconSpacing, iconY, secondaryColor);
        ctx.fillText(formatNumber(options.compartidos), paddingX + iconSpacing + 30, iconY + 5);
        
        // Like icon
        drawLikeIcon(ctx, paddingX + (iconSpacing * 2), iconY, secondaryColor);
        ctx.fillText(formatNumber(options.likes), paddingX + (iconSpacing * 2) + 30, iconY + 5);
        
        // Add timestamp and Twitter branding
        ctx.fillStyle = secondaryColor;
        ctx.font = "12px 'Roboto', Arial, sans-serif";
        const now = new Date();
        const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} · ${now.toLocaleDateString()}`;
        ctx.fillText(timestamp, width - 150, height - 15);
        
        // Twitter logo at bottom right
        ctx.fillStyle = "#1DA1F2";
        drawTwitterIcon(ctx, width - 25, height - 20, 15);
        
        // Return the image buffer
        return canvas.toBuffer("image/png");
        
    } catch (error) {
        console.error("Error in Twitter card generation:", error);
        throw error;
    }
}

/**
 * Wrap text to fit within a specified width
 */
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    
    lines.push(currentLine);
    return lines;
}

/**
 * Format numbers for display (e.g., 1000 -> 1K)
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Draw a rounded rectangle
 */
function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Draw Twitter icon
 */
function drawTwitterIcon(ctx, x, y, size) {
    ctx.save();
    
    // Scale and translate to position
    ctx.translate(x - size, y - size);
    ctx.scale(size/12, size/12);
    
    // Draw Twitter bird
    ctx.beginPath();
    ctx.moveTo(23.643, 4.937);
    ctx.bezierCurveTo(22.809, 5.307, 21.902, 5.557, 20.944, 5.67);
    ctx.bezierCurveTo(21.952, 5.043, 22.716, 4.057, 23.079, 2.896);
    ctx.bezierCurveTo(22.166, 3.477, 21.165, 3.891, 20.102, 4.103);
    ctx.bezierCurveTo(19.403, 3.364, 18.570, 2.821, 17.677, 2.531);
    ctx.bezierCurveTo(16.785, 2.241, 15.850, 2.214, 14.940, 2.454);
    ctx.bezierCurveTo(14.030, 2.694, 13.178, 3.194, 12.470, 3.900);
    ctx.bezierCurveTo(11.763, 4.606, 11.223, 5.494, 10.905, 6.473);
    ctx.bezierCurveTo(10.587, 7.452, 10.504, 8.491, 10.664, 9.504);
    ctx.bezierCurveTo(10.823, 10.517, 11.219, 11.471, 11.815, 12.274);
    ctx.bezierCurveTo(9.860, 12.175, 7.956, 11.652, 6.233, 10.742);
    ctx.bezierCurveTo(4.510, 9.832, 3.012, 8.558, 1.840, 7.015);
    ctx.bezierCurveTo(1.420, 7.778, 1.171, 8.688, 1.171, 9.645);
    ctx.bezierCurveTo(1.170, 10.520, 1.376, 11.380, 1.771, 12.142);
    ctx.bezierCurveTo(2.166, 12.904, 2.735, 13.540, 3.427, 13.996);
    ctx.bezierCurveTo(2.685, 13.972, 1.960, 13.774, 1.309, 13.419);
    ctx.lineTo(1.309, 13.482);
    ctx.bezierCurveTo(1.309, 14.644, 1.717, 15.774, 2.454, 16.668);
    ctx.bezierCurveTo(3.191, 17.561, 4.213, 18.166, 5.355, 18.373);
    ctx.bezierCurveTo(4.668, 18.553, 3.954, 18.582, 3.255, 18.457);
    ctx.bezierCurveTo(3.574, 19.464, 4.203, 20.346, 5.049, 20.982);
    ctx.bezierCurveTo(5.895, 21.618, 6.919, 21.979, 7.978, 22.015);
    ctx.bezierCurveTo(6.070, 23.505, 3.773, 24.306, 1.407, 24.304);
    ctx.bezierCurveTo(1.021, 24.304, 0.635, 24.282, 0.252, 24.237);
    ctx.bezierCurveTo(2.647, 25.802, 5.419, 26.626, 8.245, 26.623);
    ctx.bezierCurveTo(17.327, 26.623, 22.308, 18.637, 22.308, 11.699);
    ctx.bezierCurveTo(22.308, 11.495, 22.303, 11.289, 22.293, 11.086);
    ctx.bezierCurveTo(23.202, 10.380, 24.000, 9.524, 24.642, 8.556);
    ctx.bezierCurveTo(23.786, 8.942, 22.875, 9.191, 21.939, 9.293);
    ctx.bezierCurveTo(22.915, 8.708, 23.649, 7.797, 24.000, 6.725);
    ctx.bezierCurveTo(23.081, 7.261, 22.077, 7.635, 21.033, 7.833);
    ctx.bezierCurveTo(20.345, 7.092, 19.448, 6.588, 18.461, 6.392);
    ctx.bezierCurveTo(17.474, 6.197, 16.456, 6.321, 15.539, 6.748);
    ctx.bezierCurveTo(14.623, 7.175, 13.851, 7.882, 13.330, 8.770);
    ctx.bezierCurveTo(12.809, 9.659, 12.564, 10.688, 12.629, 11.721);
    ctx.bezierCurveTo(10.562, 11.623, 8.542, 11.098, 6.684, 10.177);
    ctx.bezierCurveTo(4.826, 9.256, 3.171, 7.957, 1.819, 6.361);
    ctx.bezierCurveTo(1.301, 7.326, 1.151, 8.446, 1.397, 9.517);
    ctx.bezierCurveTo(1.644, 10.589, 2.273, 11.541, 3.168, 12.200);
    ctx.bezierCurveTo(2.506, 12.177, 1.858, 11.999, 1.275, 11.680);
    ctx.bezierCurveTo(1.275, 11.700, 1.275, 11.721, 1.275, 11.743);
    ctx.bezierCurveTo(1.275, 12.784, 1.652, 13.791, 2.333, 14.582);
    ctx.bezierCurveTo(3.014, 15.373, 3.951, 15.895, 4.979, 16.058);
    ctx.bezierCurveTo(4.366, 16.225, 3.725, 16.254, 3.099, 16.143);
    ctx.bezierCurveTo(3.379, 17.040, 3.936, 17.825, 4.687, 18.385);
    ctx.bezierCurveTo(5.438, 18.944, 6.346, 19.250, 7.282, 19.260);
    ctx.bezierCurveTo(5.636, 20.558, 3.622, 21.256, 1.553, 21.253);
    ctx.bezierCurveTo(1.203, 21.253, 0.854, 21.232, 0.507, 21.190);
    ctx.bezierCurveTo(2.611, 22.558, 5.080, 23.277, 7.605, 23.273);
    ctx.bezierCurveTo(15.826, 23.273, 20.261, 16.360, 20.261, 10.375);
    ctx.lineTo(20.261, 9.768);
    ctx.bezierCurveTo(21.113, 9.165, 21.867, 8.414, 22.491, 7.547);
    ctx.bezierCurveTo(21.713, 7.900, 20.880, 8.134, 20.023, 8.243);
    ctx.bezierCurveTo(20.907, 7.705, 21.579, 6.880, 21.901, 5.909);
    ctx.bezierCurveTo(21.061, 6.395, 20.146, 6.738, 19.192, 6.923);
    ctx.bezierCurveTo(18.480, 6.152, 17.515, 5.668, 16.471, 5.563);
    ctx.bezierCurveTo(15.428, 5.458, 14.383, 5.738, 13.523, 6.352);
    ctx.bezierCurveTo(12.664, 6.966, 12.039, 7.879, 11.755, 8.929);
    ctx.bezierCurveTo(11.471, 9.979, 11.547, 11.096, 11.970, 12.096);
    ctx.bezierCurveTo(10.118, 12.004, 8.303, 11.540, 6.642, 10.734);
    ctx.bezierCurveTo(4.982, 9.927, 3.515, 8.798, 2.330, 7.419);
    ctx.stroke();
    ctx.fill();
    
    ctx.restore();
}

/**
 * Draw comment icon
 */
function drawCommentIcon(ctx, x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    
    // Comment bubble
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20, y);
    ctx.quadraticCurveTo(x + 24, y, x + 24, y + 4);
    ctx.lineTo(x + 24, y + 12);
    ctx.quadraticCurveTo(x + 24, y + 16, x + 20, y + 16);
    ctx.lineTo(x + 6, y + 16);
    ctx.lineTo(x, y + 22);
    ctx.lineTo(x, y);
    ctx.fill();
    
    ctx.restore();
}

/**
 * Draw retweet icon
 */
function drawRetweetIcon(ctx, x, y, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // Retweet arrows
    ctx.beginPath();
    // Left arrow
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x + 6, y + 2);
    ctx.lineTo(x + 12, y + 8);
    // Arrow stem
    ctx.moveTo(x + 6, y + 2);
    ctx.lineTo(x + 6, y + 14);
    
    // Right arrow
    ctx.moveTo(x + 24, y + 8);
    ctx.lineTo(x + 18, y + 14);
    ctx.lineTo(x + 12, y + 8);
    // Arrow stem
    ctx.moveTo(x + 18, y + 14);
    ctx.lineTo(x + 18, y + 2);
    
    ctx.stroke();
    
    ctx.restore();
}

/**
 * Draw like icon
 */
function drawLikeIcon(ctx, x, y, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // Heart shape
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 16);
    ctx.bezierCurveTo(x + 6, y + 10, x, y + 8, x, y + 4);
    ctx.bezierCurveTo(x, y, x + 4, y - 2, x + 8, y + 2);
    ctx.lineTo(x + 12, y + 4);
    ctx.lineTo(x + 16, y + 2);
    ctx.bezierCurveTo(x + 20, y - 2, x + 24, y, x + 24, y + 4);
    ctx.bezierCurveTo(x + 24, y + 8, x + 18, y + 10, x + 12, y + 16);
    
    ctx.stroke();
    
    ctx.restore();
}

// Clean up old images every hour
setInterval(() => {
    try {
        const files = fs.readdirSync(IMAGES_DIR);
        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(IMAGES_DIR, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtimeMs;
            
            // Delete files older than 24 hours
            if (fileAge > 24 * 60 * 60 * 1000) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old Twitter card: ${file}`);
            }
        });
    } catch (error) {
        console.error("Error cleaning up Twitter card files:", error);
    }
}, 60 * 60 * 1000);

module.exports = router;
