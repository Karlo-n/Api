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
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || "https://tudominio.com"; // Cambia esto a tu dominio
const PUBLIC_PATH = "/api/fun/pixel/output"; // Ruta pública para acceder a las imágenes

// Crear directorio de salida si no existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Constantes de configuración
const DEFAULT_SCALE = 8;
const MIN_SCALE = 4;
const MAX_SCALE = 32;
const MAX_WIDTH = 1000; // Ancho máximo de imagen para procesar

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
 * @api {get} /api/fun/pixel Pixelar Imagen
 * @apiName PixelarImagen
 * @apiGroup Fun
 * @apiDescription Convierte cualquier imagen en pixel art con estilo retro
 * 
 * @apiParam {String} imagen URL de la imagen a convertir a pixel art (obligatorio)
 * @apiParam {Number} [escala=8] Tamaño de los píxeles (4-32)
 * @apiParam {String} [contraste=normal] Nivel de contraste (bajo, normal, alto)
 * 
 * @apiSuccess {Boolean} success Indica si la operación fue exitosa
 * @apiSuccess {String} url URL de la imagen pixelada
 */
router.get("/", async (req, res) => {
    try {
        // Obtener parámetros
        const { imagen, escala = DEFAULT_SCALE, contraste = "normal" } = req.query;
        
        // Validar que se proporcionó una imagen
        if (!imagen) {
            return res.status(400).json({
                error: "Se requiere una URL de imagen",
                ejemplo: "/api/fun/pixel?imagen=https://ejemplo.com/imagen.jpg&escala=8&contraste=alto"
            });
        }
        
        // Validar y ajustar la escala
        const escalaInt = parseInt(escala);
        const escalaAjustada = isNaN(escalaInt) 
            ? DEFAULT_SCALE 
            : Math.max(MIN_SCALE, Math.min(MAX_SCALE, escalaInt));
        
        // Validar contraste
        const nivelContraste = getNivelContraste(contraste);

        console.log(`Procesando imagen: ${imagen} con escala ${escalaAjustada} y contraste ${contraste}`);
        
        // Descargar la imagen
        let imagenBuffer;
        try {
            const response = await axios.get(imagen, {
                responseType: "arraybuffer",
                timeout: 15000 // 15 segundos timeout
            });
            imagenBuffer = Buffer.from(response.data);
        } catch (error) {
            console.error("Error al descargar la imagen:", error.message);
            return res.status(400).json({
                error: "No se pudo descargar la imagen",
                detalle: error.message
            });
        }
        
        // Procesar la imagen para convertirla en pixel art
        const imagenPixelada = await pixelarImagen(imagenBuffer, escalaAjustada, nivelContraste);
        
        // Generar nombre único para la imagen
        const hash = crypto.createHash('md5').update(imagen + escalaAjustada + contraste + Date.now()).digest('hex');
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
            escala: escalaAjustada,
            contraste: contraste,
            mensaje: "Imagen pixelada generada correctamente"
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
 * Obtiene el valor de contraste basado en el parámetro de entrada
 * @param {String} contraste - Nivel de contraste (bajo, normal, alto)
 * @returns {Number} - Valor de contraste
 */
function getNivelContraste(contraste) {
    switch(contraste.toLowerCase()) {
        case "bajo": return 0.8;
        case "alto": return 1.5;
        default: return 1.0; // normal
    }
}

/**
 * Función simplificada para pixelar una imagen
 * @param {Buffer} imagenBuffer - Buffer de la imagen original
 * @param {Number} escala - Tamaño de los píxeles
 * @param {Number} contraste - Nivel de contraste (1.0 es normal)
 * @returns {Buffer} - Buffer de la imagen procesada
 */
async function pixelarImagen(imagenBuffer, escala, contraste) {
    try {
        // Crear una instancia de Sharp con la imagen
        let img = sharp(imagenBuffer);
        
        // Obtener metadatos de la imagen
        const metadata = await img.metadata();
        let { width, height } = metadata;
        
        // Limitar tamaño máximo para evitar problemas con imágenes muy grandes
        if (width > MAX_WIDTH) {
            const ratio = MAX_WIDTH / width;
            width = MAX_WIDTH;
            height = Math.round(height * ratio);
            
            // Redimensionar manteniendo la proporción
            img = img.resize(width, height, { fit: 'inside' });
        }
        
        // Calcular dimensiones para el efecto pixelado
        // Hacemos la reducción más agresiva para un mejor efecto
        const pixelSize = Math.max(2, escala / 2);
        const smallWidth = Math.max(4, Math.floor(width / pixelSize));
        const smallHeight = Math.max(4, Math.floor(height / pixelSize));
        
        // Paso 1: Reducir la imagen (esto crea el efecto base de pixelación)
        img = img.resize(smallWidth, smallHeight, {
            fit: 'fill',
            kernel: 'nearest'
        });
        
        // Paso 2: Aplicar ajustes de contraste si se solicitan
        if (contraste !== 1.0) {
            img = img.linear(contraste, -(128 * contraste) + 128); // Ajuste de contraste
        }
        
        // Paso 3: Ampliar la imagen sin interpolación para mantener píxeles cuadrados definidos
        const finalWidth = smallWidth * escala;
        const finalHeight = smallHeight * escala;
        
        img = img.resize(finalWidth, finalHeight, {
            fit: 'fill',
            kernel: 'nearest',
            withoutEnlargement: false
        });
        
        // Paso 4: Aplicar borde sutil a los píxeles para mejorar la apariencia
        if (escala > 8) {
            // Solo agregar bordes si los píxeles son suficientemente grandes
            img = img.convolve({
                width: 3,
                height: 3,
                kernel: [
                    0.5, 1, 0.5,
                    1, -6, 1,
                    0.5, 1, 0.5
                ]
            });
        }
        
        // Convertir a PNG y devolver el buffer con alta compresión
        return await img.png({ compressionLevel: 9 }).toBuffer();
    } catch (error) {
        console.error("Error al pixelar la imagen:", error);
        throw new Error(`Error procesando la imagen: ${error.message}`);
    }
}

// Ejemplos y ayuda
router.get("/ayuda", (req, res) => {
    res.json({
        success: true,
        descripcion: "API para convertir imágenes en pixel art con estilo retro",
        parametros: {
            imagen: "URL de la imagen a convertir (obligatorio)",
            escala: "Tamaño de los píxeles, entre 4-32 (opcional, predeterminado: 8)",
            contraste: "Nivel de contraste: bajo, normal, alto (opcional, predeterminado: normal)"
        },
        ejemplos: {
            basico: "/api/fun/pixel?imagen=https://ejemplo.com/imagen.jpg",
            avanzado: "/api/fun/pixel?imagen=https://ejemplo.com/imagen.jpg&escala=16&contraste=alto",
            miniatura: "/api/fun/pixel?imagen=https://ejemplo.com/imagen.jpg&escala=4&contraste=bajo"
        },
        recomendaciones: {
            avatar: "Escala 12-16 con contraste normal",
            icono: "Escala 8 con contraste alto",
            miniatura: "Escala 4-6 con contraste normal"
        }
    });
});

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
