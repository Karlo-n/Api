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
        // Verificar y proteger parámetros sensibles (variables BDFD)
        const processedParams = {...params};
        
        // Extraer parámetros con defaults
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
            effectIntensity = 0.5,
            bgColor = '1e1e2e',
            bgGradient = '',
            bgGradientDir = 'to right'
        } = processedParams;

        // Canvas setup
        const width = parseInt(processedParams.width) || 800;
        const height = parseInt(processedParams.height) || 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Crear un canvas temporal con fondo transparente para aplicar el recorte
        const tempCanvas = createCanvas(width, height);
        const tempCtx = tempCanvas.getContext('2d');

        // Dibujar el rectángulo redondeado en el canvas temporal
        tempCtx.beginPath();
        roundRect(tempCtx, 0, 0, width, height, parseInt(borderRadius));
        tempCtx.closePath();
        tempCtx.clip();

        // Background
        if (background && background !== 'placeholder.jpg') {
            try {
                const bgImage = await loadImage(background);
                tempCtx.drawImage(bgImage, 0, 0, width, height);
            } catch (err) {
                console.error('Error loading background image:', err);
                // Fallback to color
                tempCtx.fillStyle = `#${bgColor}`;
                tempCtx.fillRect(0, 0, width, height);
            }
        } else if (bgGradient) {
            const [startColor, endColor] = bgGradient.split(':');
            const gradient = tempCtx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, `#${startColor}`);
            gradient.addColorStop(1, `#${endColor}`);
            tempCtx.fillStyle = gradient;
            tempCtx.fillRect(0, 0, width, height);
        } else {
            tempCtx.fillStyle = `#${bgColor}`;
            tempCtx.fillRect(0, 0, width, height);
        }

        // Apply effects to temp canvas
        applyEffect(tempCtx, effectType, effectIntensity, width, height);

        // Copy the temp canvas to the main canvas
        ctx.drawImage(tempCanvas, 0, 0);

        // Border - dibujado después para que no sea recortado
        ctx.strokeStyle = `#${borderColor}`;
        ctx.lineWidth = borderWidth;
        ctx.beginPath();
        roundRect(ctx, borderWidth/2, borderWidth/2, width - borderWidth, height - borderWidth, parseInt(borderRadius));
        ctx.stroke();

        // Text elements con manejo de errores
        ctx.textAlign = 'center';
        
        // Main welcome text
        if (texto1) {
            const textX1 = parseInt(processedParams.textX1) || width / 2;
            const textY1 = parseInt(processedParams.textY1) || height / 2 - 50;
            const textSize1 = parseInt(processedParams.textSize1) || 40;
            const textColor1 = processedParams.textColor1 || 'ffffff';
            const textFont1 = processedParams.textFont1 || 'Arial';
            const textStyle1 = processedParams.textStyle1 || 'bold';
            
            // Configurar fuente de manera segura
            try {
                ctx.font = `${textStyle1} ${textSize1}px ${textFont1}`;
            } catch (e) {
                // Fallback a fuente segura
                console.warn('Error setting font for texto1, using fallback:', e);
                ctx.font = `bold ${textSize1}px Arial`;
            }
            
            ctx.fillStyle = `#${textColor1}`;
            
            if (processedParams.textShadow1) {
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
            const textX2 = parseInt(processedParams.textX2) || width / 2;
            const textY2 = parseInt(processedParams.textY2) || height / 2;
            const textSize2 = parseInt(processedParams.textSize2) || 30;
            const textColor2 = processedParams.textColor2 || 'ffffff';
            const textFont2 = processedParams.textFont2 || 'Arial';
            const textStyle2 = processedParams.textStyle2 || 'normal';
            
            // Configurar fuente de manera segura
            try {
                ctx.font = `${textStyle2} ${textSize2}px ${textFont2}`;
            } catch (e) {
                // Fallback a fuente segura
                console.warn('Error setting font for texto2, using fallback:', e);
                ctx.font = `normal ${textSize2}px Arial`;
            }
            
            ctx.fillStyle = `#${textColor2}`;
            
            if (processedParams.textShadow2) {
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
            const textX3 = parseInt(processedParams.textX3) || width / 2;
            const textY3 = parseInt(processedParams.textY3) || height / 2 + 50;
            const textSize3 = parseInt(processedParams.textSize3) || 20;
            const textColor3 = processedParams.textColor3 || 'aaaaaa';
            const textFont3 = processedParams.textFont3 || 'Arial';
            const textStyle3 = processedParams.textStyle3 || 'normal';
            
            // Configurar fuente de manera segura
            try {
                ctx.font = `${textStyle3} ${textSize3}px ${textFont3}`;
            } catch (e) {
                // Fallback a fuente segura
                console.warn('Error setting font for texto3, using fallback:', e);
                ctx.font = `normal ${textSize3}px Arial`;
            }
            
            ctx.fillStyle = `#${textColor3}`;
            
            if (processedParams.textShadow3) {
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

        // Avatar - con manejo de errores mejorado
        if (avatar) {
            try {
                let avatarImg;
                
                // Manejo especial para variables de BDFD (si es que llegan al servidor)
                if (avatar.startsWith('$')) {
                    // Si es una variable BDFD que llegó al servidor, intentamos proveer un fallback 
                    throw new Error('Variable BDFD detectada, usando avatar fallback');
                } else {
                    avatarImg = await loadImage(avatar);
                }
                
                const x = parseInt(processedParams.avatarX) || width / 2;
                const y = parseInt(processedParams.avatarY) || 120;
                const size = parseInt(avatarSize);
                
                // Draw avatar with shape
                ctx.save();
                createAvatarClipPath(ctx, x, y, size, avatarShape);
                ctx.clip();
                ctx.drawImage(avatarImg, x - size, y - size, size * 2, size * 2);
                ctx.restore();
                
                // Draw avatar border
                ctx.strokeStyle = processedParams.avatarBorderColor ? `#${processedParams.avatarBorderColor}` : '#ffffff';
                ctx.lineWidth = 3;
                ctx.save();
                createAvatarClipPath(ctx, x, y, size, avatarShape);
                ctx.stroke();
                ctx.restore();
                
                // Add glow effect if enabled
                if (processedParams.avatarGlow) {
                    ctx.save();
                    ctx.shadowColor = 'rgba(153, 102, 255, 0.7)';
                    ctx.shadowBlur = 15;
                    createAvatarClipPath(ctx, x, y, size, avatarShape);
                    ctx.stroke();
                    ctx.restore();
                }
            } catch (err) {
                console.error('Error loading avatar image:', err);
                // Dibujamos un avatar de fallback
                const x = parseInt(processedParams.avatarX) || width / 2;
                const y = parseInt(processedParams.avatarY) || 120;
                const size = parseInt(avatarSize);
                
                ctx.save();
                createAvatarClipPath(ctx, x, y, size, avatarShape);
                ctx.fillStyle = '#cccccc';
                ctx.fill();
                ctx.restore();
                
                // Borde para el fallback
                ctx.strokeStyle = processedParams.avatarBorderColor ? `#${processedParams.avatarBorderColor}` : '#ffffff';
                ctx.lineWidth = 3;
                ctx.save();
                createAvatarClipPath(ctx, x, y, size, avatarShape);
                ctx.stroke();
                ctx.restore();
            }
        }

        // Additional avatars - con manejo de errores
        for (let i = 1; i <= 4; i++) {
            const extraAvatar = processedParams[`extraAvatar${i}`];
            if (extraAvatar) {
                try {
                    let extraAvatarImg;
                    
                    // Manejo especial para variables de BDFD (si es que llegan al servidor)
                    if (extraAvatar.startsWith('$')) {
                        // Si es una variable BDFD que llegó al servidor, intentamos proveer un fallback 
                        throw new Error(`Variable BDFD detectada en extraAvatar${i}, usando avatar fallback`);
                    } else {
                        extraAvatarImg = await loadImage(extraAvatar);
                    }
                    
                    const x = parseInt(processedParams[`extraAvatarX${i}`]) || 200 * i;
                    const y = parseInt(processedParams[`extraAvatarY${i}`]) || 200;
                    const size = parseInt(processedParams[`extraAvatarSize${i}`]) || 50;
                    const shape = processedParams[`extraAvatarShape${i}`] || 'circle';
                    
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
                    // Dibujamos un avatar de fallback
                    const x = parseInt(processedParams[`extraAvatarX${i}`]) || 200 * i;
                    const y = parseInt(processedParams[`extraAvatarY${i}`]) || 200;
                    const size = parseInt(processedParams[`extraAvatarSize${i}`]) || 50;
                    const shape = processedParams[`extraAvatarShape${i}`] || 'circle';
                    
                    ctx.save();
                    createAvatarClipPath(ctx, x, y, size, shape);
                    ctx.fillStyle = '#cccccc';
                    ctx.fill();
                    ctx.restore();
                    
                    // Borde para el fallback
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.save();
                    createAvatarClipPath(ctx, x, y, size, shape);
                    ctx.stroke();
                    ctx.restore();
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
 * Función auxiliar para crear rectángulos redondeados para compatibilidad
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} width - Ancho
 * @param {number} height - Alto
 * @param {number} radius - Radio de las esquinas
 */
function roundRect(ctx, x, y, width, height, radius) {
    if (typeof ctx.roundRect === 'function') {
        // Usar el método nativo si está disponible
        ctx.roundRect(x, y, width, height, radius);
    } else {
        // Implementación manual para compatibilidad
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
    }
    return ctx;
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
