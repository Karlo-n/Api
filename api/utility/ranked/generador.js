// api/utility/ranked/generador.js
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

// Create directory for temp images if it doesn't exist
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Ruta a la raíz del proyecto
const ROOT_DIR = path.join(__dirname, '../../../');

// Controller for the generate endpoint
async function generateRankedCard(req, res) {
    try {
        // Generate ranked image using the parameters
        const imagePath = await generateRankedImage(req.query);
        
        // Send the generated image
        res.sendFile(imagePath);
    } catch (error) {
        console.error('Error generating ranked image:', error);
        res.status(500).json({ 
            error: 'Error al generar la imagen ranked',
            mensaje: error.message 
        });
    }
}

// Function to generate ranked image based on parameters
async function generateRankedImage(params) {
    try {
        // Extract parameters with defaults
        const {
            username = 'Usuario',
            avatar = '',
            level = '1',
            rank = 'Novato',
            xp = '0',
            nextLevel = '100',
            background = '',
            bgColor = '1e1e2e',
            textColor = 'ffffff',
            accentColor = 'bd5dff',
            progressColor = '6633cc',
            progressBgColor = '333333',
            type = 'level', // level, classification, rank
            // Additional parameters for specific ranked types
            classification = '',
            badge = '',
            customText = '',
            // Border and style parameters
            borderRadius = '10',
            borderWidth = '0',
            borderColor = 'ffffff',
            shadowEnabled = 'false',
            shadowBlur = '10',
            shadowColor = '000000'
        } = params;

        // Canvas setup
        const width = parseInt(params.width) || 800;
        const height = parseInt(params.height) || 250;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = `#${bgColor}`;
        ctx.fillRect(0, 0, width, height);

        // Try to load background if provided
        if (background && background !== 'none') {
            try {
                let bgImage;
                // Check if it's a numbered background or custom URL
                if (!isNaN(background)) {
                    // Numbered background
                    const bgPath = path.join(ROOT_DIR, 'backgrounds', `bg${background}.png`);
                    if (fs.existsSync(bgPath)) {
                        bgImage = await loadImage(bgPath);
                    }
                } else {
                    // Custom URL
                    bgImage = await loadImage(background);
                }
                
                if (bgImage) {
                    ctx.drawImage(bgImage, 0, 0, width, height);
                }
            } catch (err) {
                console.error('Error loading background:', err);
                // Fall back to using background color (already set)
            }
        }

        // Border if enabled
        if (parseInt(borderWidth) > 0) {
            ctx.strokeStyle = `#${borderColor}`;
            ctx.lineWidth = parseInt(borderWidth);
            ctx.strokeRect(
                parseInt(borderWidth)/2, 
                parseInt(borderWidth)/2, 
                width - parseInt(borderWidth), 
                height - parseInt(borderWidth)
            );
        }

        // Add shadow if enabled
        if (shadowEnabled === 'true') {
            ctx.shadowColor = `#${shadowColor}`;
            ctx.shadowBlur = parseInt(shadowBlur);
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        // Draw avatar
        if (avatar) {
            try {
                const avatarImg = await loadImage(avatar);
                const avatarSize = 100;
                const avatarX = 75;
                const avatarY = height / 2;
                
                // Draw circular avatar
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatarImg, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
                ctx.restore();
                
                // Avatar border
                ctx.strokeStyle = `#${accentColor}`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarSize / 2 + 3, 0, Math.PI * 2);
                ctx.stroke();
            } catch (err) {
                console.error('Error loading avatar:', err);
                // Draw fallback avatar
                const avatarSize = 100;
                const avatarX = 75;
                const avatarY = height / 2;
                
                ctx.fillStyle = `#${accentColor}33`;
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = `#${accentColor}`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Reset shadow settings for content
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Content positioning
        const contentX = 150;
        const contentY = 60;
        
        // Username
        ctx.fillStyle = `#${textColor}`;
        ctx.font = 'bold 28px Arial';
        ctx.fillText(username, contentX, contentY);
        
        // Different layout based on card type
        if (type === 'level') {
            // Level
            ctx.fillStyle = `#${accentColor}`;
            ctx.font = 'bold 24px Arial';
            ctx.fillText(`Nivel ${level}`, contentX, contentY + 40);
            
            // XP Progress text
            ctx.fillStyle = `#${textColor}`;
            ctx.font = '18px Arial';
            ctx.fillText(`XP: ${xp} / ${nextLevel}`, contentX, contentY + 75);
            
            // XP Progress bar
            const progressWidth = 400;
            const progressHeight = 20;
            const progressX = contentX;
            const progressY = contentY + 90;
            const barRadius = parseInt(borderRadius) || 10;
            
            // Progress background
            ctx.fillStyle = `#${progressBgColor}`;
            if (typeof ctx.roundRect === 'function') {
                ctx.beginPath();
                ctx.roundRect(progressX, progressY, progressWidth, progressHeight, barRadius);
                ctx.fill();
            } else {
                // Fallback for environments without roundRect
                roundRect(ctx, progressX, progressY, progressWidth, progressHeight, barRadius);
                ctx.fill();
            }
            
            // Progress fill
            const progressPercentage = Math.min(1, parseFloat(xp) / parseFloat(nextLevel));
            ctx.fillStyle = `#${progressColor}`;
            if (typeof ctx.roundRect === 'function') {
                ctx.beginPath();
                ctx.roundRect(progressX, progressY, progressWidth * progressPercentage, progressHeight, barRadius);
                ctx.fill();
            } else {
                // Fallback
                roundRect(ctx, progressX, progressY, progressWidth * progressPercentage, progressHeight, barRadius);
                ctx.fill();
            }
            
            // Rank
            ctx.fillStyle = `#${textColor}`;
            ctx.font = 'bold 20px Arial';
            ctx.fillText(`Rango: ${rank}`, contentX, progressY + 50);
        } 
        else if (type === 'classification') {
            // Classification header
            ctx.fillStyle = `#${accentColor}`;
            ctx.font = 'bold 24px Arial';
            ctx.fillText(`Clasificación: ${classification || "Sin clasificar"}`, contentX, contentY + 40);
            
            // Level info
            ctx.fillStyle = `#${textColor}`;
            ctx.font = '18px Arial';
            ctx.fillText(`Nivel: ${level}`, contentX, contentY + 75);
            
            // Rank info
            ctx.fillStyle = `#${textColor}`;
            ctx.font = '18px Arial';
            ctx.fillText(`Rango: ${rank}`, contentX, contentY + 105);
            
            // Custom text if provided
            if (customText) {
                ctx.fillStyle = `#${textColor}`;
                ctx.font = 'italic 16px Arial';
                ctx.fillText(customText, contentX, contentY + 135);
            }
            
            // Try to load badge if provided
            if (badge) {
                try {
                    const badgeImg = await loadImage(badge);
                    const badgeSize = 80;
                    ctx.drawImage(badgeImg, width - 120, height / 2 - badgeSize / 2, badgeSize, badgeSize);
                } catch (err) {
                    console.error('Error loading badge:', err);
                }
            }
        }
        else if (type === 'rank') {
            // Rank header
            ctx.fillStyle = `#${accentColor}`;
            ctx.font = 'bold 28px Arial';
            ctx.fillText(`${rank}`, contentX, contentY + 40);
            
            // Level info
            ctx.fillStyle = `#${textColor}`;
            ctx.font = '20px Arial';
            ctx.fillText(`Nivel: ${level}`, contentX, contentY + 80);
            
            // Custom text if provided
            if (customText) {
                ctx.fillStyle = `#${textColor}`;
                ctx.font = 'italic 16px Arial';
                ctx.fillText(customText, contentX, contentY + 115);
            }
            
            // Draw a decorative element
            const decorY = height / 2;
            ctx.strokeStyle = `#${accentColor}`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(width - 150, decorY - 40);
            ctx.lineTo(width - 50, decorY - 40);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(width - 150, decorY + 40);
            ctx.lineTo(width - 50, decorY + 40);
            ctx.stroke();
            
            ctx.font = 'bold 36px Arial';
            ctx.fillStyle = `#${accentColor}`;
            ctx.fillText("#" + level, width - 100, decorY + 13);
        }
        
        // Save the image
        const fileName = `ranked_${Date.now()}.png`;
        const filePath = path.join(TEMP_DIR, fileName);
        const out = fs.createWriteStream(filePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        
        return new Promise((resolve, reject) => {
            out.on('finish', () => resolve(filePath));
            out.on('error', (err) => reject(err));
        });
    } catch (error) {
        console.error('Error generating ranked image:', error);
        throw error;
    }
}

// Helper function for rounded rectangles for compatibility
function roundRect(ctx, x, y, width, height, radius) {
    if (radius === 0) {
        ctx.rect(x, y, width, height);
        return;
    }
    
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

// Clean up temporary files
function cleanupTempFiles(maxAge = 3600000) { // Default: 1 hour
    fs.readdir(TEMP_DIR, (err, files) => {
        if (err) {
            console.error('Error reading temp directory:', err);
            return;
        }
        
        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(TEMP_DIR, file);
            
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Error getting stats for ${file}:`, err);
                    return;
                }
                
                // Check if file is older than maxAge
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlink(filePath, err => {
                        if (err) {
                            console.error(`Error deleting ${file}:`, err);
                        } else {
                            console.log(`Deleted old temp file: ${file}`);
                        }
                    });
                }
            });
        });
    });
}

// Schedule cleanup every hour
setInterval(cleanupTempFiles, 3600000);

module.exports = {
    generateRankedCard,
    generateRankedImage
};
