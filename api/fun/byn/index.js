// api/fun/byn/index.js
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
const PUBLIC_PATH = "/api/fun/byn/output"; // Ruta pública para acceder a las imágenes

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
 * API Blanco y Negro - Convierte imágenes a escala de grises
 */
router.get("/", async (req, res) => {
    try {
        const { imagen } = req.query;

        if (!imagen) {
            return res.status(400).json({ 
                error: "Se requiere una URL de imagen", 
                ejemplo: "/api/fun/byn?imagen=https://ejemplo.com/imagen.jpg" 
            });
        }

        console.log("Procesando imagen en blanco y negro:", imagen);

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
        
        // Aplicar efecto blanco y negro
        applyGrayscaleEffect(imageData);
        
        // Actualizar el canvas con la imagen procesada
        ctx.putImageData(imageData, 0, 0);
        
        // Generar nombre único para la imagen
        const hash = crypto.createHash('md5').update(imagen + Date.now()).digest('hex');
        const filename = `byn-${hash}.png`;
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
            message: "Imagen convertida a blanco y negro correctamente"
        });

    } catch (error) {
        console.error("Error en BYN:", error);
        res.status(500).json({ 
            error: "Error al convertir la imagen a blanco y negro",
            detalle: error.message
        });
    }
});

/**
 * Aplica el efecto de escala de grises a la imagen
 */
function applyGrayscaleEffect(imageData) {
    const data = imageData.data;
    
    // Para cada pixel en la imagen
    for (let i = 0; i < data.length; i += 4) {
        // Obtener valores RGB
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calcular valor de gris usando ponderación por luminosidad
        // Esta fórmula da más peso al verde porque el ojo humano es más sensible a él
        const grayValue = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Asignar el mismo valor a los tres canales
        data[i] = grayValue;     // R
        data[i + 1] = grayValue; // G
        data[i + 2] = grayValue; // B
        // El canal alpha (i+3) se mantiene igual
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
