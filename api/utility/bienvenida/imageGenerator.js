// api/utility/bienvenida/imageGenerator.js
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create directory for temp images if it doesn't exist
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Generate a welcome image based on provided parameters
 * @param {Object} params - Parameters for image generation
 * @returns {Promise<string>} - Path to generated image
 */
async function generateWelcomeImage(params) {
    try {
        // Extract parameters with defaults
        const {
            avatar = '',
            background = '',
            texto1 = 'Bienvenido',
            texto2 = '',
            texto3 = '',
            borderRadius = 25,
            borderColor = 'bd5dff',
            borderWidth = 3,
            avatarSize = 80,
            avatarShape = 'circle',
            effectType = 'none',
            bgColor = '1e1e2e',
            bgGradient = '',
            bgGradientDir = 'to right',
            effectIntensity = 0.5
        } = params;

        // Canvas setup
        const width = parseInt(params.width) || 800;
        const height = parseInt(params.height) || 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        if (background && background !== 'placeholder.jpg') {
            try {
                const bgImage = await loadImage(background);
                ctx.drawImage(bgImage, 0, 0, width, height);
            } catch (err) {
                console.error('Error loading background image:', err);
                // Fallback to color
                ctx.fillStyle = `#${bgColor}`;
                ctx.fillRect(0, 0, width, height);
            }
        } else if (bgGradient) {
            const [startColor, endColor] = bgGradient.split(':');
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, `#${startColor}`);
            gradient.addColorStop(1, `#${endColor}`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        } else {
            ctx.fillStyle = `#${bgColor}`;
            ctx.fillRect(0, 0, width, height);
        }

        // Border
        ctx.strokeStyle = `#${borderColor}`;
        ctx.lineWidth = borderWidth;
        ctx.beginPath();
        ctx.roundRect(borderWidth/2, borderWidth/2, width - borderWidth, height - borderWidth, borderRadius);
        ctx.stroke();

        // Apply effects
        applyEffect(ctx, effectType, effectIntensity, width, height);

        // Text elements
        ctx.textAlign = 'center';
        
        // Main welcome text
        if (texto1) {
            const textX1 = parseInt(params.textX1) || width / 2;
            const textY1 = parseInt(params.textY1) || height / 2 - 50;
            const textSize1 = parseInt(params.textSize1) || 40;
            const textColor1 = params.textColor1 || 'ffffff';
            const textFont1 = params.textFont1 || 'Arial';
            const textStyle1 = params.textStyle1 || 'bold';
            
            ctx.font = `${textStyle1} ${textSize1}px ${textFont1}`;
            ctx.fillStyle = `#${textColor1}`;
            
            if (params.textShadow1) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            
            ctx.fillText(texto1, textX1, textY1);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        // Username or secondary text
        if (texto2) {
            const textX2 = parseInt(params.textX2) || width / 2;
            const textY2 = parseInt(params.textY2) || height / 2;
            const textSize2 = parseInt(params.textSize2) || 30;
            const textColor2 = params.textColor2 || 'ffffff';
            const textFont2 = params.textFont2 || 'Arial';
            const textStyle2 = params.textStyle2 || 'normal';
            
            ctx.font = `${textStyle2} ${textSize2}px ${textFont2}`;
            ctx.fillStyle = `#${textColor2}`;
            
            if (params.textShadow2) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            
            ctx.fillText(texto2, textX2, textY2);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        // Server name or tertiary text
        if (texto3) {
            const textX3 = parseInt(params.textX3) || width / 2;
            const textY3 = parseInt(params.textY3) || height / 2 + 50;
            const textSize3 = parseInt(params.textSize3) || 20;
            const textColor3 = params.textColor3 || 'aaaaaa';
            const textFont3 = params.textFont3 || 'Arial';
            const textStyle3 = params.textStyle3 || 'normal';
            
            ctx.font = `${textStyle3} ${textSize3}px ${textFont3}`;
            ctx.fillStyle = `#${textColor3}`;
            
            if (params.textShadow3) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            
            ctx.fillText(texto3, textX3, textY3);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // Avatar
        if (avatar) {
            try {
                const avatarImg = await loadImage(avatar);
                const x = parseInt(params.avatarX) || width / 2;
                const y = parseInt(params.avatarY) || 120;
                const size = parseInt(avatarSize);
                
                // Draw avatar with shape
                ctx.save();
                createAvatarClipPath(ctx, x, y, size, avatarShape);
                ctx.clip();
                ctx.drawImage(avatarImg, x - size, y - size, size * 2, size * 2);
                ctx.restore();
                
                // Draw avatar border
                ctx.strokeStyle = params.avatarBorderColor ? `#${params.avatarBorderColor}` : '#ffffff';
                ctx.lineWidth = 3;
                ctx.save();
                createAvatarClipPath(ctx, x, y, size, avatarShape);
                ctx.stroke();
                ctx.restore();
                
                // Add glow effect if enabled
                if (params.avatarGlow) {
                    ctx.save();
                    ctx.shadowColor = 'rgba(153, 102, 255, 0.7)';
                    ctx.shadowBlur = 15;
                    createAvatarClipPath(ctx, x, y, size, avatarShape);
                    ctx.stroke();
                    ctx.restore();
                }
            } catch (err) {
                console.error('Error loading avatar image:', err);
            }
        }

        // Additional avatars
        for (let i = 1; i <= 4; i++) {
            const extraAvatar = params[`extraAvatar${i}`];
            if (extraAvatar) {
                try {
                    const extraAvatarImg = await loadImage(extraAvatar);
                    const x = parseInt(params[`extraAvatarX${i}`]) || 200 * i;
                    const y = parseInt(params[`extraAvatarY${i}`]) || 200;
                    const size = parseInt(params[`extraAvatarSize${i}`]) || 50;
                    const shape = params[`extraAvatarShape${i}`] || 'circle';
                    
                    // Draw extra avatar with shape
                    ctx.save();
                    createAvatarClipPath(ctx, x, y, size, shape);
                    ctx.clip();
                    ctx.drawImage(extraAvatarImg, x - size, y - size, size * 2, size * 2);
                    ctx.restore();
                    
                    // Draw avatar border
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.save();
                    createAvatarClipPath(ctx, x, y, size, shape);
                    ctx.stroke();
                    ctx.restore();
                } catch (err) {
                    console.error(`Error loading extra avatar ${i}:`, err);
                }
            }
        }

        // Save the image
        const fileName = `welcome_${Date.now()}.png`;
        const filePath = path.join(TEMP_DIR, fileName);
        const out = fs.createWriteStream(filePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        
        return new Promise((resolve, reject) => {
            out.on('finish', () => resolve(filePath));
            out.on('error', (err) => reject(err));
        });
    } catch (error) {
        console.error('Error generating welcome image:', error);
        throw error;
    }
}

/**
 * Create avatar clip path based on shape
 */
function createAvatarClipPath(ctx, x, y, size, shape) {
    switch (shape) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.closePath();
            break;
        case 'square':
            ctx.beginPath();
            ctx.rect(x - size, y - size, size * 2, size * 2);
            ctx.closePath();
            break;
        case 'triangle':
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.lineTo(x + size, y + size);
            ctx.closePath();
            break;
        case 'pentagon':
            drawPolygon(ctx, x, y, size, 5);
            break;
        case 'hexagon':
            drawPolygon(ctx, x, y, size, 6);
            break;
        case 'octagon':
            drawPolygon(ctx, x, y, size, 8);
            break;
        case 'star':
            drawStar(ctx, x, y, size);
            break;
        case 'heart':
            drawHeart(ctx, x, y, size);
            break;
        case 'diamond':
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - size, y);
            ctx.closePath();
            break;
        default:
            // Default to circle
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.closePath();
    }
}

/**
 * Draw a regular polygon
 */
function drawPolygon(ctx, x, y, radius, sides) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2);
        const vertexX = x + radius * Math.cos(angle);
        const vertexY = y + radius * Math.sin(angle);
        
        if (i === 0) {
            ctx.moveTo(vertexX, vertexY);
        } else {
            ctx.lineTo(vertexX, vertexY);
        }
    }
    ctx.closePath();
}

/**
 * Draw a star shape
 */
function drawStar(ctx, x, y, radius) {
    const outerRadius = radius;
    const innerRadius = radius / 2;
    const spikes = 5;
    
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI / spikes) - (Math.PI / 2);
        const vertexX = x + radius * Math.cos(angle);
        const vertexY = y + radius * Math.sin(angle);
        
        if (i === 0) {
            ctx.moveTo(vertexX, vertexY);
        } else {
            ctx.lineTo(vertexX, vertexY);
        }
    }
    ctx.closePath();
}

/**
 * Draw a heart shape
 */
function drawHeart(ctx, x, y, size) {
    const width = size * 2;
    const height = size * 2;
    
    ctx.beginPath();
    ctx.moveTo(x, y - height / 5);
    
    // Left curve
    ctx.bezierCurveTo(
        x - width / 2, y - height / 2,
        x - width / 2, y + height / 3,
        x, y + height / 2
    );
    
    // Right curve
    ctx.bezierCurveTo(
        x + width / 2, y + height / 3,
        x + width / 2, y - height / 2,
        x, y - height / 5
    );
    
    ctx.closePath();
}

/**
 * Apply effect based on type
 */
function applyEffect(ctx, effectType, intensity, width, height) {
    switch (effectType) {
        case 'glow':
            // Apply glow effect
            ctx.shadowColor = 'rgba(153, 102, 255, 0.7)';
            ctx.shadowBlur = 20 * intensity;
            break;
        
        case 'vignette':
            // Apply vignette effect
            const gradient = ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.max(width, height) / 1.5
            );
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, `rgba(0,0,0,${0.7 * intensity})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            break;
        
        case 'grid':
            // Apply grid effect
            ctx.strokeStyle = `rgba(100, 100, 255, ${0.3 * intensity})`;
            ctx.lineWidth = 1;
            
            const gridSize = Math.floor(20 / intensity);
            
            // Vertical lines
            for (let x = 0; x < width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = 0; y < height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
            break;
            
        // Additional effects could be implemented
        // ...
        
        default:
            // No effect or not implemented
            break;
    }
}

/**
 * Clean up temporary files older than the specified age
 * @param {number} maxAge - Maximum age in milliseconds
 */
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
    generateWelcomeImage
};
