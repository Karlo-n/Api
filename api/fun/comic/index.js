// api/fun/comic/index.js
const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();

// Configuración para guardar imágenes
const IMAGES_DIR = path.join(__dirname, "output");
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || "https://api.apikarl.com"; // Cambia esto a tu dominio
const PUBLIC_PATH = "/api/fun/comic/output"; // Ruta pública para acceder a las imágenes

// Crear directorio de salida si no existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Ruta para servir las imágenes guardadas
router.get("/output/:filename", (req, res) => {
    const filePath = path.join(IMAGES_DIR, req.params.filename);
    
    if (fs.existsSync(filePath)) {
        // Configurar headers para la imagen
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400"); // Cache por 24 horas
        
        // Enviar el archivo
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "Imagen no encontrada" });
    }
});

/**
 * API Comic Filter - Convierte imágenes en ilustraciones estilo cómic
 */
router.get("/", async (req, res) => {
    try {
        const { imagen, intensidad = 3 } = req.query;

        // Validaciones
        if (!imagen) {
            return res.status(400).json({ 
                error: "Se requiere una URL de imagen", 
                ejemplo: "/api/fun/comic?imagen=https://ejemplo.com/imagen.jpg&intensidad=3" 
            });
        }

        // Validar nivel de intensidad
        let nivelIntensidad = parseInt(intensidad);
        if (isNaN(nivelIntensidad) || nivelIntensidad < 1 || nivelIntensidad > 5) {
            nivelIntensidad = 3; // Valor predeterminado si no es válido
        }

        console.log("Procesando imagen con efecto cómic:", imagen, "Intensidad:", nivelIntensidad);

        // Cargar imagen
        let imagenOriginal;
        try {
            const response = await axios.get(imagen, { 
                responseType: "arraybuffer",
                timeout: 15000 // 15 segundos timeout
            });
            imagenOriginal = await Canvas.loadImage(Buffer.from(response.data));
        } catch (loadError) {
            console.error("Error cargando la imagen:", loadError.message);
            return res.status(400).json({ 
                error: "No se pudo cargar la imagen", 
                detalle: loadError.message 
            });
        }

        // Configurar canvas
        const width = imagenOriginal.width;
        const height = imagenOriginal.height;
        
        // Crear canvas
        const canvas = Canvas.createCanvas(width, height);
        const ctx = canvas.getContext("2d");
        
        // Dibujar imagen original
        ctx.drawImage(imagenOriginal, 0, 0);
        
        // Obtener datos de la imagen
        const imageData = ctx.getImageData(0, 0, width, height);
        
        // Aplicar efecto cómic
        applyComicEffect(imageData, nivelIntensidad);
        
        // Actualizar el canvas con la imagen procesada
        ctx.putImageData(imageData, 0, 0);
        
        // Aplicar efecto de trazos si la intensidad es alta (4-5)
        if (nivelIntensidad >= 4) {
            applyOutlineEffect(ctx, width, height, nivelIntensidad);
        }
        
        // Generar nombre único para la imagen
        const hash = crypto.createHash('md5').update(imagen + Date.now()).digest('hex');
        const filename = `comic-${hash}.png`;
        const filePath = path.join(IMAGES_DIR, filename);
        
        // Guardar la imagen
        const out = fs.createWriteStream(filePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        
        // Esperar a que termine de escribir el archivo
        await new Promise((resolve, reject) => {
            out.on('finish', resolve);
            out.on('error', reject);
        });
        
        // Generar URL pública
        const imageUrl = `${PUBLIC_URL_BASE}${PUBLIC_PATH}/${filename}`;
        
        // Devolver JSON con la URL
        res.json({
            success: true,
            url: imageUrl,
            message: "Imagen convertida a estilo cómic correctamente",
            intensidad: nivelIntensidad
        });

    } catch (error) {
        console.error("Error en Comic Filter:", error);
        res.status(500).json({ 
            error: "Error al convertir la imagen a estilo cómic",
            detalle: error.message
        });
    }
});

/**
 * Aplica el efecto de cómic a la imagen
 * @param {ImageData} imageData - Datos de la imagen a procesar
 * @param {number} intensidad - Nivel de intensidad (1-5)
 */
function applyComicEffect(imageData, intensidad) {
    const data = imageData.data;
    
    // Configurar parámetros según intensidad
    const colorReduction = 3 + intensidad * 1; // Reducción de colores (más alto = menos colores)
    const contrastBoost = 0.5 + intensidad * 0.3; // Aumento de contraste
    const saturationBoost = 0.8 + intensidad * 0.3; // Aumento de saturación
    
    // Para cada pixel en la imagen
    for (let i = 0; i < data.length; i += 4) {
        // Obtener valores RGB
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        // Convertir a HSL para ajustar saturación
        const { h, s, l } = rgbToHsl(r, g, b);
        
        // Aumentar saturación
        const newSaturation = Math.min(1, s * saturationBoost);
        
        // Convertir de nuevo a RGB
        const { r: rNew, g: gNew, b: bNew } = hslToRgb(h, newSaturation, l);
        r = rNew;
        g = gNew;
        b = bNew;
        
        // Reducir colores (posterización)
        r = Math.floor(r / colorReduction) * colorReduction;
        g = Math.floor(g / colorReduction) * colorReduction;
        b = Math.floor(b / colorReduction) * colorReduction;
        
        // Aumentar contraste
        r = 128 + (r - 128) * contrastBoost;
        g = 128 + (g - 128) * contrastBoost;
        b = 128 + (b - 128) * contrastBoost;
        
        // Limitar valores al rango 0-255
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        
        // Actualizar pixel
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        // El canal alpha (i+3) se mantiene igual
    }
}

/**
 * Aplica efecto de trazos/contornos al estilo cómic
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {number} width - Ancho de la imagen
 * @param {number} height - Alto de la imagen
 * @param {number} intensidad - Nivel de intensidad (1-5)
 */
function applyOutlineEffect(ctx, width, height, intensidad) {
    // Obtener datos de la imagen actual
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    
    // Crear una copia para aplicar el efecto de borde
    const outlineData = ctx.createImageData(width, height);
    const outlinePixels = outlineData.data;
    
    // Configurar sensibilidad de detección de bordes según intensidad
    const threshold = 30 - intensidad * 3; // Menor umbral = más bordes
    const outlineIntensity = 0.5 + intensidad * 0.1; // Mayor valor = líneas más pronunciadas
    
    // Para cada pixel (excepto bordes)
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const pos = (y * width + x) * 4;
            
            // Obtener luminosidad del pixel actual
            const rCurr = pixels[pos];
            const gCurr = pixels[pos + 1];
            const bCurr = pixels[pos + 2];
            const luminosityCurr = 0.299 * rCurr + 0.587 * gCurr + 0.114 * bCurr;
            
            // Comparar con píxeles adyacentes para detectar bordes
            let isEdge = false;
            
            // Comprobar pixel superior
            const posTop = ((y - 1) * width + x) * 4;
            const rTop = pixels[posTop];
            const gTop = pixels[posTop + 1];
            const bTop = pixels[posTop + 2];
            const luminosityTop = 0.299 * rTop + 0.587 * gTop + 0.114 * bTop;
            
            // Comprobar pixel izquierdo
            const posLeft = (y * width + (x - 1)) * 4;
            const rLeft = pixels[posLeft];
            const gLeft = pixels[posLeft + 1];
            const bLeft = pixels[posLeft + 2];
            const luminosityLeft = 0.299 * rLeft + 0.587 * gLeft + 0.114 * bLeft;
            
            // Detectar borde si hay suficiente diferencia en luminosidad
            if (Math.abs(luminosityCurr - luminosityTop) > threshold || 
                Math.abs(luminosityCurr - luminosityLeft) > threshold) {
                isEdge = true;
            }
            
            if (isEdge) {
                // Si es un borde, asignar color negro o muy oscuro
                outlinePixels[pos] = 0;     // R
                outlinePixels[pos + 1] = 0; // G
                outlinePixels[pos + 2] = 0; // B
                outlinePixels[pos + 3] = 255 * outlineIntensity; // A (semi-transparente)
            } else {
                // Si no es borde, mantener transparente
                outlinePixels[pos + 3] = 0; // A (transparente)
            }
        }
    }
    
    // Dibujar la capa de contornos sobre la imagen
    if (intensidad >= 5) {
        // Para intensidad máxima, añadir un poco de sombra para más dramatismo
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
    }
    
    ctx.putImageData(outlineData, 0, 0);
}

/**
 * Convierte color RGB a HSL
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {Object} - Objeto con valores h (0-360), s (0-1), l (0-1)
 */
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        
        h /= 6;
    }
    
    return { h: h * 360, s, l };
}

/**
 * Convierte color HSL a RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {Object} - Objeto con valores r, g, b (0-255)
 */
function hslToRgb(h, s, l) {
    h /= 360;
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

// Limpieza periódica de imágenes antiguas (cada 12 horas)
setInterval(() => {
    try {
        const files = fs.readdirSync(IMAGES_DIR);
        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(IMAGES_DIR, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtimeMs;
            
            // Eliminar archivos mayores a 24 horas
            if (fileAge > 24 * 60 * 60 * 1000) {
                fs.unlinkSync(filePath);
                console.log(`Archivo eliminado: ${file}`);
            }
        });
    } catch (error) {
        console.error("Error en limpieza de archivos:", error);
    }
}, 12 * 60 * 60 * 1000);

module.exports = router;
