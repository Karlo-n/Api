// api/utility/bienvenida/index.js - versión completa con generación de imágenes
const express = require("express");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const router = express.Router();

// Ruta al archivo HTML
const HTML_PATH = path.join(__dirname, "welcome-card-generator.html");
const CSS_PATH = path.join(__dirname, "styles.css");
const JS_PATH = path.join(__dirname, "script.js");
const GENERADOR_PATH = path.join(__dirname, "generador.js"); // Añadida ruta al generador.js

// Ruta principal - Sirve el HTML
router.get("/", (req, res) => {
    res.sendFile(HTML_PATH);
});

// Ruta para servir el CSS
router.get("/styles.css", (req, res) => {
    res.setHeader("Content-Type", "text/css");
    res.sendFile(CSS_PATH);
});

// Ruta para servir el JavaScript
router.get("/script.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(JS_PATH);
});

// Ruta para servir el generador.js - AÑADIDA
router.get("/generador.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(GENERADOR_PATH);
});

// Función para aplicar la forma del avatar
function applyAvatarShape(ctx, x, y, width, height, shape) {
    ctx.save();
    
    switch (shape) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(x + width/2, y + height/2, width/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            break;
        case 'square':
            // No need to clip for square
            break;
        case 'triangle':
            ctx.beginPath();
            ctx.moveTo(x + width/2, y);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x + width, y + height);
            ctx.closePath();
            ctx.clip();
            break;
        case 'pentagon':
            ctx.beginPath();
            ctx.moveTo(x + width/2, y);
            ctx.lineTo(x + width, y + height * 0.38);
            ctx.lineTo(x + width * 0.82, y + height);
            ctx.lineTo(x + width * 0.18, y + height);
            ctx.lineTo(x, y + height * 0.38);
            ctx.closePath();
            ctx.clip();
            break;
        case 'hexagon':
            ctx.beginPath();
            ctx.moveTo(x + width/4, y);
            ctx.lineTo(x + width * 3/4, y);
            ctx.lineTo(x + width, y + height/2);
            ctx.lineTo(x + width * 3/4, y + height);
            ctx.lineTo(x + width/4, y + height);
            ctx.lineTo(x, y + height/2);
            ctx.closePath();
            ctx.clip();
            break;
        case 'octagon':
            ctx.beginPath();
            const octStep = 0.3;
            ctx.moveTo(x + width * octStep, y);
            ctx.lineTo(x + width * (1 - octStep), y);
            ctx.lineTo(x + width, y + height * octStep);
            ctx.lineTo(x + width, y + height * (1 - octStep));
            ctx.lineTo(x + width * (1 - octStep), y + height);
            ctx.lineTo(x + width * octStep, y + height);
            ctx.lineTo(x, y + height * (1 - octStep));
            ctx.lineTo(x, y + height * octStep);
            ctx.closePath();
            ctx.clip();
            break;
        case 'star':
            ctx.beginPath();
            const cx = x + width/2;
            const cy = y + height/2;
            const spikes = 5;
            const outerRadius = width/2;
            const innerRadius = width/4;
            
            let rot = Math.PI / 2 * 3;
            let step = Math.PI / spikes;
            
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
                rot += step;
                ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.clip();
            break;
        case 'diamond':
            ctx.beginPath();
            ctx.moveTo(x + width/2, y);
            ctx.lineTo(x + width, y + height/2);
            ctx.lineTo(x + width/2, y + height);
            ctx.lineTo(x, y + height/2);
            ctx.closePath();
            ctx.clip();
            break;
        default:
            // Default to square if shape not recognized
    }
}

// Función para cargar imagen a partir de URL (con manejo de variables BDFD)
async function loadImageFromURL(url) {
    // Si es una variable BDFD, usar una imagen de muestra
    if (url.startsWith('$')) {
        // Usar una imagen de muestra para variables BDFD
        return await loadImage(path.join(__dirname, 'assets', 'placeholder_avatar.png'));
    } else {
        try {
            return await loadImage(url);
        } catch (error) {
            // Si hay error al cargar la imagen, usar una imagen de respaldo
            console.error(`Error loading image from ${url}:`, error);
            return await loadImage(path.join(__dirname, 'assets', 'placeholder_avatar.png'));
        }
    }
}

// Función para aplicar efectos
function applyEffect(ctx, canvasWidth, canvasHeight, effect, intensity, color1, color2) {
    switch (effect) {
        case 'glow':
            ctx.shadowBlur = 30 * intensity;
            ctx.shadowColor = color1;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.shadowBlur = 0;
            break;
        case 'gradient':
            const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
            gradient.addColorStop(0, color1 + Math.floor(intensity * 80).toString(16).padStart(2, '0'));
            gradient.addColorStop(1, color2 + Math.floor(intensity * 80).toString(16).padStart(2, '0'));
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.globalCompositeOperation = 'source-over';
            break;
        case 'vignette':
            const radialGradient = ctx.createRadialGradient(
                canvasWidth / 2, canvasHeight / 2, 0,
                canvasWidth / 2, canvasHeight / 2, canvasWidth / 2
            );
            radialGradient.addColorStop(0, 'rgba(0,0,0,0)');
            radialGradient.addColorStop(1, `rgba(0,0,0,${intensity * 0.7})`);
            ctx.fillStyle = radialGradient;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            break;
        // Más efectos pueden ser implementados según sea necesario
    }
}

// Ruta para generar la tarjeta de bienvenida estilizada (responde con una imagen)
router.get("/bienvenida-styled", async (req, res) => {
    try {
        // Extraer parámetros de la URL
        const { 
            avatar, background, texto1, texto2, texto3, 
            bgColor = '1e1e2e', bgGradient, bgGradientDir = 'to right',
            borderRadius = 25, borderColor = 'bd5dff', borderWidth = 3,
            avatarSize = 80, avatarShape = 'circle', effectType = 'none', effectIntensity = 0.5,
            format = 'png', apiKey
        } = req.query;

        // Validar parámetros esenciales
        if (!avatar) {
            return res.status(400).json({
                error: "Se requiere la URL del avatar",
                ejemplo: "/api/utility/bienvenida/bienvenida-styled?avatar=https://example.com/avatar.jpg"
            });
        }

        // Validar API key si es necesario
        // if (process.env.REQUIRE_API_KEY === 'true' && apiKey !== process.env.API_KEY) {
        //     return res.status(401).json({ error: "API key inválida o faltante" });
        // }

        // Crear el canvas
        const width = parseInt(req.query.width) || 800;
        const height = parseInt(req.query.height) || 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Dibujar fondo
        if (background) {
            // Fondo de imagen
            try {
                const bgImage = await loadImageFromURL(background);
                ctx.drawImage(bgImage, 0, 0, width, height);
            } catch (error) {
                console.error("Error al cargar imagen de fondo:", error);
                // Si hay error, usar un color de respaldo
                ctx.fillStyle = `#${bgColor}`;
                ctx.fillRect(0, 0, width, height);
            }
        } else if (bgGradient) {
            // Fondo de gradiente
            const [gradientStart, gradientEnd] = bgGradient.split(':');
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, `#${gradientStart}`);
            gradient.addColorStop(1, `#${gradientEnd}`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        } else {
            // Fondo de color sólido
            ctx.fillStyle = `#${bgColor}`;
            ctx.fillRect(0, 0, width, height);
        }

        // Dibujar los textos
        if (texto1) {
            const textX1 = parseInt(req.query.textX1) || width / 2;
            const textY1 = parseInt(req.query.textY1) || 250;
            const textSize1 = parseInt(req.query.textSize1) || 30;
            const textColor1 = req.query.textColor1 || 'ffffff';
            const textFont1 = req.query.textFont1 || 'Arial';
            const textStyle1 = req.query.textStyle1 || 'normal';
            
            ctx.font = `${textStyle1.includes('bold') ? 'bold' : ''} ${textStyle1.includes('italic') ? 'italic' : ''} ${textSize1}px ${textFont1}`;
            ctx.fillStyle = `#${textColor1}`;
            ctx.textAlign = 'center';
            
            if (req.query.textShadow1 === 'true') {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            
            ctx.fillText(texto1, textX1, textY1);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // Dibujar textos adicionales (texto2, texto3)
        if (texto2) {
            const textX2 = parseInt(req.query.textX2) || width / 2;
            const textY2 = parseInt(req.query.textY2) || 300;
            const textSize2 = parseInt(req.query.textSize2) || 24;
            const textColor2 = req.query.textColor2 || 'ffffff';
            const textFont2 = req.query.textFont2 || 'Arial';
            const textStyle2 = req.query.textStyle2 || 'normal';
            
            ctx.font = `${textStyle2.includes('bold') ? 'bold' : ''} ${textStyle2.includes('italic') ? 'italic' : ''} ${textSize2}px ${textFont2}`;
            ctx.fillStyle = `#${textColor2}`;
            ctx.textAlign = 'center';
            
            if (req.query.textShadow2 === 'true') {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            
            ctx.fillText(texto2, textX2, textY2);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        if (texto3) {
            const textX3 = parseInt(req.query.textX3) || width / 2;
            const textY3 = parseInt(req.query.textY3) || 340;
            const textSize3 = parseInt(req.query.textSize3) || 20;
            const textColor3 = req.query.textColor3 || 'ffffff';
            const textFont3 = req.query.textFont3 || 'Arial';
            const textStyle3 = req.query.textStyle3 || 'normal';
            
            ctx.font = `${textStyle3.includes('bold') ? 'bold' : ''} ${textStyle3.includes('italic') ? 'italic' : ''} ${textSize3}px ${textFont3}`;
            ctx.fillStyle = `#${textColor3}`;
            ctx.textAlign = 'center';
            
            if (req.query.textShadow3 === 'true') {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            
            ctx.fillText(texto3, textX3, textY3);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // Aplicar efectos al canvas
        if (effectType !== 'none') {
            const effectColor1 = req.query.effectColor1 || '9966ff';
            const effectColor2 = req.query.effectColor2 || '66ccff';
            applyEffect(ctx, width, height, effectType, parseFloat(effectIntensity), `#${effectColor1}`, `#${effectColor2}`);
        }

        // Cargar y dibujar el avatar principal
        try {
            const avatarImage = await loadImageFromURL(avatar);
            const avSize = parseInt(avatarSize);
            const avX = parseInt(req.query.mainAvatarX) || width / 2 - avSize;
            const avY = parseInt(req.query.mainAvatarY) || 133 - avSize;
            
            // Aplicar forma al avatar
            applyAvatarShape(ctx, avX, avY, avSize * 2, avSize * 2, avatarShape);
            
            // Dibujar avatar
            ctx.drawImage(avatarImage, avX, avY, avSize * 2, avSize * 2);
            ctx.restore();
            
            // Dibujar borde del avatar
            if (req.query.mainAvatarBorderColor) {
                ctx.save();
                ctx.strokeStyle = `#${req.query.mainAvatarBorderColor || 'ffffff'}`;
                ctx.lineWidth = 3;
                
                switch (avatarShape) {
                    case 'circle':
                        ctx.beginPath();
                        ctx.arc(avX + avSize, avY + avSize, avSize, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.stroke();
                        break;
                    case 'square':
                        ctx.strokeRect(avX, avY, avSize * 2, avSize * 2);
                        break;
                    // Se pueden añadir más formas según sea necesario
                }
                
                ctx.restore();
                
                // Añadir resplandor si está habilitado
                if (req.query.mainAvatarGlow === 'true') {
                    ctx.save();
                    ctx.shadowColor = '#9966ff';
                    ctx.shadowBlur = 15;
                    
                    switch (avatarShape) {
                        case 'circle':
                            ctx.beginPath();
                            ctx.arc(avX + avSize, avY + avSize, avSize, 0, Math.PI * 2);
                            ctx.closePath();
                            ctx.stroke();
                            break;
                        case 'square':
                            ctx.strokeRect(avX, avY, avSize * 2, avSize * 2);
                            break;
                    }
                    
                    ctx.restore();
                }
            }
        } catch (error) {
            console.error("Error al cargar o dibujar el avatar:", error);
        }

        // Dibujar avatares adicionales (si existen)
        for (let i = 1; i <= 4; i++) {
            const extraAvatarUrl = req.query[`extraAvatar${i}`];
            if (extraAvatarUrl) {
                try {
                    const extraAvatarImage = await loadImageFromURL(extraAvatarUrl);
                    const extraSize = parseInt(req.query[`extraAvatarSize${i}`] || 50);
                    const extraX = parseInt(req.query[`extraAvatarX${i}`] || (200 + i * 100)) - extraSize;
                    const extraY = parseInt(req.query[`extraAvatarY${i}`] || (i % 2 === 0 ? 300 : 200)) - extraSize;
                    const extraShape = req.query[`extraAvatarShape${i}`] || 'circle';
                    
                    applyAvatarShape(ctx, extraX, extraY, extraSize * 2, extraSize * 2, extraShape);
                    ctx.drawImage(extraAvatarImage, extraX, extraY, extraSize * 2, extraSize * 2);
                    ctx.restore();
                    
                    // Borde para avatar adicional
                    ctx.save();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    
                    if (extraShape === 'circle') {
                        ctx.beginPath();
                        ctx.arc(extraX + extraSize, extraY + extraSize, extraSize, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.stroke();
                    } else if (extraShape === 'square') {
                        ctx.strokeRect(extraX, extraY, extraSize * 2, extraSize * 2);
                    }
                    
                    ctx.restore();
                } catch (error) {
                    console.error(`Error al cargar o dibujar el avatar adicional ${i}:`, error);
                }
            }
        }

        // Aplicar borde al canvas completo
        if (borderWidth > 0) {
            // Para aplicar el borde, creamos un nuevo canvas más grande
            const borderedCanvas = createCanvas(width + borderWidth * 2, height + borderWidth * 2);
            const borderedCtx = borderedCanvas.getContext('2d');
            
            // Dibujar el borde
            borderedCtx.fillStyle = `#${borderColor}`;
            
            if (borderRadius > 0) {
                // Borde redondeado
                borderedCtx.beginPath();
                borderedCtx.moveTo(borderRadius, 0);
                borderedCtx.lineTo(borderedCanvas.width - borderRadius, 0);
                borderedCtx.quadraticCurveTo(borderedCanvas.width, 0, borderedCanvas.width, borderRadius);
                borderedCtx.lineTo(borderedCanvas.width, borderedCanvas.height - borderRadius);
                borderedCtx.quadraticCurveTo(borderedCanvas.width, borderedCanvas.height, borderedCanvas.width - borderRadius, borderedCanvas.height);
                borderedCtx.lineTo(borderRadius, borderedCanvas.height);
                borderedCtx.quadraticCurveTo(0, borderedCanvas.height, 0, borderedCanvas.height - borderRadius);
                borderedCtx.lineTo(0, borderRadius);
                borderedCtx.quadraticCurveTo(0, 0, borderRadius, 0);
                borderedCtx.closePath();
                borderedCtx.fill();
                
                // Dibujar el contenido interno (con bordes redondeados)
                borderedCtx.save();
                borderedCtx.beginPath();
                const innerRadius = Math.max(0, borderRadius - borderWidth);
                borderedCtx.moveTo(borderWidth + innerRadius, borderWidth);
                borderedCtx.lineTo(borderedCanvas.width - borderWidth - innerRadius, borderWidth);
                borderedCtx.quadraticCurveTo(borderedCanvas.width - borderWidth, borderWidth, borderedCanvas.width - borderWidth, borderWidth + innerRadius);
                borderedCtx.lineTo(borderedCanvas.width - borderWidth, borderedCanvas.height - borderWidth - innerRadius);
                borderedCtx.quadraticCurveTo(borderedCanvas.width - borderWidth, borderedCanvas.height - borderWidth, borderedCanvas.width - borderWidth - innerRadius, borderedCanvas.height - borderWidth);
                borderedCtx.lineTo(borderWidth + innerRadius, borderedCanvas.height - borderWidth);
                borderedCtx.quadraticCurveTo(borderWidth, borderedCanvas.height - borderWidth, borderWidth, borderedCanvas.height - borderWidth - innerRadius);
                borderedCtx.lineTo(borderWidth, borderWidth + innerRadius);
                borderedCtx.quadraticCurveTo(borderWidth, borderWidth, borderWidth + innerRadius, borderWidth);
                borderedCtx.closePath();
                borderedCtx.clip();
                borderedCtx.drawImage(canvas, borderWidth, borderWidth, width, height);
                borderedCtx.restore();
            } else {
                // Borde sin redondear
                borderedCtx.fillRect(0, 0, borderedCanvas.width, borderedCanvas.height);
                borderedCtx.clearRect(borderWidth, borderWidth, width, height);
                borderedCtx.drawImage(canvas, borderWidth, borderWidth, width, height);
            }
            
            // Usar el canvas con borde para la respuesta
            canvas.width = borderedCanvas.width;
            canvas.height = borderedCanvas.height;
            ctx.drawImage(borderedCanvas, 0, 0);
        }

        // Configurar la respuesta según el formato solicitado
        const contentType = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        res.setHeader('Content-Type', contentType);
        
        if (format === 'jpg') {
            canvas.createJPEGStream({ quality: 0.95 }).pipe(res);
        } else if (format === 'webp') {
            canvas.createPNGStream().pipe(res); // En caso de que no soporte WebP, enviar PNG
        } else {
            canvas.createPNGStream().pipe(res);
        }
        
    } catch (error) {
        console.error("Error al generar tarjeta de bienvenida:", error);
        res.status(500).json({
            error: "Error interno al generar la tarjeta",
            detalle: error.message
        });
    }
});

// Ruta para generar una vista previa (opcional)
router.post("/preview", (req, res) => {
    try {
        // Similar a la ruta de generación pero usando los datos del cuerpo de la solicitud
        res.json({ message: "Vista previa generada (función en desarrollo)" });
    } catch (error) {
        res.status(500).json({ error: "Error al generar vista previa" });
    }
});

// Exportar el router para usarlo en el index.js principal
module.exports = router;
