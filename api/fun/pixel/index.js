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
const MAX_WIDTH = 1000; // Ancho máximo de imagen para procesar

// Parámetro opcional para estilo de paleta (usando valores RGB para mayor compatibilidad)
const PALETAS = {
    "default": null, // Usa colores originales pero pixelados
    "gameboy": [
        { r: 15, g: 56, b: 15 },    // #0f380f
        { r: 48, g: 98, b: 48 },    // #306230
        { r: 139, g: 172, b: 15 },  // #8bac0f
        { r: 155, g: 188, b: 15 }   // #9bbc0f
    ],
    "nes": [
        { r: 0, g: 0, b: 0 },         // Negro
        { r: 0, g: 0, b: 170 },       // Azul oscuro
        { r: 0, g: 170, b: 0 },       // Verde
        { r: 0, g: 170, b: 170 },     // Cian
        { r: 170, g: 0, b: 0 },       // Rojo
        { r: 170, g: 0, b: 170 },     // Magenta
        { r: 170, g: 85, b: 0 },      // Marrón
        { r: 170, g: 170, b: 170 },   // Gris claro
        { r: 85, g: 85, b: 85 },      // Gris
        { r: 85, g: 85, b: 255 },     // Azul claro
        { r: 85, g: 255, b: 85 },     // Verde claro
        { r: 85, g: 255, b: 255 },    // Cian claro
        { r: 255, g: 85, b: 85 },     // Rojo claro
        { r: 255, g: 85, b: 255 },    // Magenta claro
        { r: 255, g: 255, b: 85 },    // Amarillo
        { r: 255, g: 255, b: 255 }    // Blanco
    ],
    "bw": [
        { r: 0, g: 0, b: 0 },         // Negro
        { r: 255, g: 255, b: 255 }    // Blanco
    ],
    "sepia": [
        { r: 112, g: 66, b: 20 },    // Sepia oscuro
        { r: 170, g: 120, b: 70 },   // Sepia medio
        { r: 220, g: 180, b: 130 }   // Sepia claro
    ]
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
 * @apiParam {String} [paleta=default] Estilo de colores (default, gameboy, nes, bw, sepia)
 * @apiParam {String} [contraste=normal] Nivel de contraste (bajo, normal, alto)
 * 
 * @apiSuccess {Boolean} success Indica si la operación fue exitosa
 * @apiSuccess {String} url URL de la imagen pixelada
 */
router.get("/", async (req, res) => {
    try {
        // Obtener parámetros
        const { imagen, escala = DEFAULT_SCALE, paleta = "default", contraste = "normal" } = req.query;
        
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
        
        // Validar contraste
        const nivelContraste = getNivelContraste(contraste);

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
        const imagenPixelada = await pixelarImagen(imagenBuffer, escalaAjustada, paletaSeleccionada, nivelContraste);
        
        // Generar nombre único para la imagen
        const hash = crypto.createHash('md5').update(imagen + escalaAjustada + paleta + contraste + Date.now()).digest('hex');
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
 * Función mejorada para pixelar una imagen con opciones de estilo retro
 * @param {Buffer} imagenBuffer - Buffer de la imagen original
 * @param {Number} escala - Tamaño de los píxeles
 * @param {Array} paleta - Paleta de colores a utilizar (opcional)
 * @param {Number} contraste - Nivel de contraste (1.0 es normal)
 * @returns {Buffer} - Buffer de la imagen procesada
 */
async function pixelarImagen(imagenBuffer, escala, paleta, contraste) {
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
        
        // Aplicar contraste si es diferente de 1.0
        if (contraste !== 1.0) {
            img = img.modulate({ contrast: contraste });
        }
        
        // Calcular dimensiones para el efecto pixelado
        // Usamos una reducción más agresiva para mejorar el efecto
        const smallWidth = Math.max(1, Math.floor(width / (escala * 1.5)));
        const smallHeight = Math.max(1, Math.floor(height / (escala * 1.5)));
        
        // Reducir la imagen (esto crea el efecto de pixelación base)
        img = img.resize(smallWidth, smallHeight, {
            fit: 'fill',
            kernel: 'nearest'
        });
        
        // Aplicar paleta de colores si se especificó
        if (paleta) {
            if (paleta.length === 2) {
                // Para paletas de 2 colores (como blanco y negro), usamos threshold
                img = img.grayscale().threshold(128);
            } else if (paleta.length <= 4) {
                // Para paletas pequeñas (como Game Boy), usamos posterize
                img = img.grayscale().normalize().modulate({ saturation: 0 }).posterize(paleta.length);
            } else {
                // Para otras paletas, aplicamos otras técnicas
                img = img.normalize().modulate({ saturation: 0.7 }).posterize(8);
            }
        }
        
        // Si la paleta es especial, aplicamos ajustes adicionales
        if (paleta && paleta.length > 0) {
            if (paleta === PALETAS["gameboy"]) {
                img = img.tint({ r: 15, g: 56, b: 15 });
            } else if (paleta === PALETAS["sepia"]) {
                img = img.tint({ r: 112, g: 66, b: 20 }).sepia();
            }
        }
        
        // Ampliar la imagen sin interpolación para mantener píxeles cuadrados definidos
        img = img.resize(smallWidth * escala, smallHeight * escala, {
            fit: 'fill',
            kernel: 'nearest',
            withoutEnlargement: false
        });
        
        // Para un efecto de píxel más marcado, agregamos un sutil sharpen
        img = img.sharpen({ sigma: 1, m1: 0.5, m2: 0.5 });
        
        // Convertir a PNG y devolver el buffer
        return await img.png({ compressionLevel: 9 }).toBuffer();
    } catch (error) {
        console.error("Error al pixelar la imagen:", error);
        throw new Error(`Error procesando la imagen: ${error.message}`);
    }
}

/**
 * Ruta para obtener los estilos disponibles
 */
router.get("/estilos", (req, res) => {
    const estilos = Object.keys(PALETAS).map(key => {
        return {
            id: key,
            nombre: key.charAt(0).toUpperCase() + key.slice(1),
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
        },
        ejemplos: {
            gameboy: `/api/fun/pixel?imagen=URL_IMAGEN&paleta=gameboy&escala=8`,
            bw: `/api/fun/pixel?imagen=URL_IMAGEN&paleta=bw&escala=12`,
            sepia: `/api/fun/pixel?imagen=URL_IMAGEN&paleta=sepia&escala=10&contraste=alto`
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
        "bw": "Blanco y negro clásico para un estilo minimalista",
        "sepia": "Tonos sepia para un efecto vintage y nostálgico"
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
