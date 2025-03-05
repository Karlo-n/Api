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
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || "https://api.apikarl.com"; // Cambia esto a tu dominio
const PUBLIC_PATH = "/api/fun/pixel/output"; // Ruta pública para acceder a las imágenes

// Crear directorio de salida si no existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Constantes de configuración
const DEFAULT_SCALE = 8;
const MIN_SCALE = 4;
const MAX_SCALE = 32;

// Parámetro opcional para estilo de paleta
const PALETAS = {
    "default": null, // Usa colores originales pero pixelados
    "gameboy": ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"], // Paleta Game Boy clásico
    "nes": ["#000000", "#0000AA", "#00AA00", "#00AAAA", "#AA0000", "#AA00AA", "#AA5500", "#AAAAAA", 
            "#555555", "#5555FF", "#55FF55", "#55FFFF", "#FF5555", "#FF55FF", "#FFFF55", "#FFFFFF"], // Paleta NES
    "c64": ["#000000", "#626262", "#898989", "#adadad", "#ffffff", "#9f4e44", "#cb7e75", "#6d5412", 
            "#a1683c", "#c9d487", "#9ae29b", "#5cab5e", "#6abfc6", "#887ecb", "#50459b", "#a057a3"], // Commodore 64
    "cga": ["#000000", "#0000AA", "#00AA00", "#00AAAA", "#AA0000", "#AA00AA", "#AA5500", "#AAAAAA",
            "#555555", "#5555FF", "#55FF55", "#55FFFF", "#FF5555", "#FF55FF", "#FFFF55", "#FFFFFF"] // CGA
};

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
 * @apiParam {String} imagen URL de la imagen a convertir a pixel art
 * @apiParam {Number} [escala=8] Tamaño de los píxeles (4-32)
 * @apiParam {String} [paleta=default] Estilo de colores (default, gameboy, nes, c64, cga)
 * @apiParam {Boolean} [dithering=false] Aplicar dithering para mejorar detalles (true/false)
 * 
 * @apiSuccess {Boolean} success Indica si la operación fue exitosa
 * @apiSuccess {String} url URL de la imagen pixelada
 */
router.get("/", async (req, res) => {
    try {
        // Obtener parámetros
        const { imagen, escala = DEFAULT_SCALE, paleta = "default", dithering = "false" } = req.query;
        
        // Validar que se proporcionó una imagen
        if (!imagen) {
            return res.status(400).json({
                error: "Se requiere una URL de imagen",
                ejemplo: "/api/fun/pixel?imagen=https://ejemplo.com/imagen.jpg&escala=8"
            });
        }
        
        // Validar y ajustar la escala
        const escalaInt = parseInt(escala);
        const escalaAjustada = isNaN(escalaInt) 
            ? DEFAULT_SCALE 
            : Math.max(MIN_SCALE, Math.min(MAX_SCALE, escalaInt));
            
        // Validar paleta
        const paletaSeleccionada = PALETAS[paleta.toLowerCase()] || PALETAS["default"];
        
        // Validar dithering
        const aplicarDithering = dithering.toLowerCase() === "true";

        console.log(`Procesando imagen: ${imagen} con escala ${escalaAjustada} y paleta ${paleta}`);
        
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
        const imagenPixelada = await pixelarImagen(imagenBuffer, escalaAjustada, paletaSeleccionada, aplicarDithering);
        
        // Generar nombre único para la imagen
        const hash = crypto.createHash('md5').update(imagen + escalaAjustada + paleta + dithering + Date.now()).digest('hex');
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
            paleta: paleta,
            dithering: aplicarDithering,
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
 * Función para pixelar una imagen con opciones de estilo retro
 * @param {Buffer} imagenBuffer - Buffer de la imagen original
 * @param {Number} escala - Tamaño de los píxeles
 * @param {Array} paleta - Paleta de colores a utilizar (opcional)
 * @param {Boolean} dithering - Si se debe aplicar dithering
 * @returns {Buffer} - Buffer de la imagen procesada
 */
async function pixelarImagen(imagenBuffer, escala, paleta, dithering) {
    // Crear una instancia de Sharp con la imagen
    let imagen = sharp(imagenBuffer);
    
    // Obtener metadatos
    const metadata = await imagen.metadata();
    const { width, height } = metadata;
    
    // Calcular dimensiones reducidas para lograr el efecto pixelado
    const smallWidth = Math.max(1, Math.floor(width / escala));
    const smallHeight = Math.max(1, Math.floor(height / escala));
    
    // Reducir la imagen (esto crea el efecto de pixelación)
    imagen = imagen.resize(smallWidth, smallHeight, {
        fit: 'fill',
        kernel: 'nearest'
    });
    
    // Aplicar cuantización de colores si se especificó una paleta
    if (paleta) {
        // Transformar la paleta de códigos hex a objeto de configuración para sharp
        const colorsConfig = {
            colors: paleta.length,
            dither: dithering
        };
        
        imagen = imagen.quantize(colorsConfig);
    }
    
    // Ampliar la imagen sin interpolación para mantener píxeles cuadrados
    imagen = imagen.resize(smallWidth * escala, smallHeight * escala, {
        fit: 'fill',
        kernel: 'nearest',
        withoutEnlargement: false
    });
    
    // Agregar un borde sutil para mejorar la apariencia retro (opcional)
    // imagen = imagen.recomb([[0.95, 0, 0], [0, 0.95, 0], [0, 0, 0.95]]);
    
    // Convertir a PNG y devolver el buffer
    return await imagen.png().toBuffer();
}

/**
 * Rutas adicionales para ejemplos y estilos
 */
router.get("/estilos", (req, res) => {
    const estilos = Object.keys(PALETAS).map(key => {
        return {
            id: key,
            nombre: key.charAt(0).toUpperCase() + key.slice(1),
            colores: PALETAS[key] || "Original con pixelado",
            descripcion: getDescripcionPaleta(key)
        };
    });
    
    res.json({
        success: true,
        estilos: estilos,
        recomendaciones: {
            escala_retro: 8,
            escala_minimalista: 16,
            escala_detallada: 4
        }
    });
});

/**
 * Devuelve la descripción de cada estilo de paleta
 */
function getDescripcionPaleta(key) {
    const descripciones = {
        "default": "Usa los colores originales de la imagen pero con efecto pixelado",
        "gameboy": "Paleta de 4 tonos verdosos al estilo de la Game Boy clásica",
        "nes": "Paleta de 16 colores al estilo de Nintendo Entertainment System",
        "c64": "Paleta de 16 colores al estilo de Commodore 64",
        "cga": "Paleta de colores CGA de las primeras computadoras PC"
    };
    
    return descripciones[key] || "Estilo de paleta personalizado";
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
