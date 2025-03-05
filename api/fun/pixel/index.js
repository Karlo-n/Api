// api/fun/pixel/index.js
const express = require("express");
const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();

// Configuración para guardar imágenes
const IMAGES_DIR = path.join(__dirname, "output");
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || "https://api.apikarl.com";
const PUBLIC_PATH = "/api/fun/pixel/output";

// Crear directorio de salida si no existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Ruta para servir las imágenes guardadas
router.get("/output/:filename", (req, res) => {
    const filePath = path.join(IMAGES_DIR, req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "Imagen no encontrada" });
    }
});

/**
 * API de Pixel Art - Convierte cualquier imagen en pixel art
 */
router.get("/", async (req, res) => {
    try {
        const { imagen } = req.query;
        
        // Validar que se proporcionó una imagen
        if (!imagen) {
            return res.status(400).json({
                error: "Se requiere una URL de imagen",
                ejemplo: "/api/fun/pixel?imagen=https://ejemplo.com/imagen.jpg"
            });
        }
        
        console.log(`Procesando imagen para pixel art: ${imagen}`);
        
        // Descargar la imagen
        let imagenBuffer;
        try {
            const response = await axios.get(imagen, {
                responseType: "arraybuffer",
                timeout: 15000
            });
            imagenBuffer = Buffer.from(response.data);
        } catch (error) {
            console.error("Error al descargar la imagen:", error.message);
            return res.status(400).json({
                error: "No se pudo descargar la imagen",
                detalle: error.message
            });
        }
        
        // Crear el pixel art
        const imagenPixelada = await crearPixelArt(imagenBuffer);
        
        // Generar nombre único para la imagen
        const hash = crypto.createHash('md5').update(imagen + Date.now()).digest('hex');
        const filename = `pixel-${hash}.png`;
        const filePath = path.join(IMAGES_DIR, filename);
        
        // Guardar la imagen
        await fs.promises.writeFile(filePath, imagenPixelada);
        
        // Generar URL pública
        const imageUrl = `${PUBLIC_URL_BASE}${PUBLIC_PATH}/${filename}`;
        
        // Responder con la URL
        res.json({
            success: true,
            url: imageUrl,
            mensaje: "Pixel art generado correctamente"
        });
        
    } catch (error) {
        console.error("Error en el generador de pixel art:", error);
        res.status(500).json({
            error: "Error al procesar la imagen",
            detalle: error.message
        });
    }
});

/**
 * Función que convierte una imagen en pixel art usando SOLO pixelado
 */
async function crearPixelArt(imagenBuffer) {
    try {
        // Obtener metadatos de la imagen
        const metadata = await sharp(imagenBuffer).metadata();
        
        // Reducción para efecto pixel art (más extrema)
        // Usamos un valor muy pequeño para forzar pixelado fuerte
        const targetWidth = 24; // Aún más pequeño para mayor pixelado
        
        // Calcular proporción para mantener relación de aspecto
        const aspectRatio = metadata.width / metadata.height;
        const targetHeight = Math.round(targetWidth / aspectRatio);
        
        // Proceso de pixelado simplificado al máximo
        return await sharp(imagenBuffer)
            // 1. Reducir extremadamente la imagen (esto crea píxeles grandes)
            .resize(targetWidth, targetHeight, {
                fit: 'fill',
                kernel: 'nearest'
            })
            // 2. Ampliar manteniendo los píxeles bien definidos
            .resize(targetWidth * 10, targetHeight * 10, {
                fit: 'fill',
                kernel: 'nearest'
            })
            // 3. Convertir a PNG
            .png()
            .toBuffer();
    } catch (error) {
        console.error("Error creando pixel art:", error);
        throw new Error(`Error procesando la imagen: ${error.message}`);
    }
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
