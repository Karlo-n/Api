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
        
        console.log(`Procesando imagen: ${imagen}`);
        
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
 * Función que convierte una imagen en pixel art
 */
async function crearPixelArt(imagenBuffer) {
    try {
        // Obtener metadatos de la imagen
        const metadata = await sharp(imagenBuffer).metadata();
        let { width, height } = metadata;
        
        // Calcular dimensiones para un buen efecto pixel art
        const pixelSize = 8; // Valor fijo para un buen efecto pixel art
        
        // Aplicar el efecto pixel art
        const img = sharp(imagenBuffer)
            // Paso 1: Reducir a tamaño pequeño (esto crea el efecto pixelado)
            .resize(Math.max(1, Math.floor(width / pixelSize)), 
                   Math.max(1, Math.floor(height / pixelSize)), {
                fit: 'fill',
                kernel: 'nearest'
            })
            // Paso 2: Ampliar sin interpolación para mantener los píxeles
            .resize(Math.max(1, Math.floor(width / pixelSize)) * pixelSize, 
                   Math.max(1, Math.floor(height / pixelSize)) * pixelSize, {
                fit: 'fill',
                kernel: 'nearest'
            });
        
        // Convertir a PNG y devolver el buffer
        return await img.png().toBuffer();
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
