// api/fun/magik/index.js
const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const router = express.Router();

/**
 * API MAGIK - Versión auténtica que expande y distorsiona partes aleatorias
 */
router.get("/", async (req, res) => {
    try {
        const { imagen } = req.query;

        if (!imagen) {
            return res.status(400).json({ 
                error: "Se requiere una URL de imagen", 
                ejemplo: "/api/fun/magik?imagen=https://ejemplo.com/imagen.jpg" 
            });
        }

        console.log("Procesando imagen:", imagen);

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
        const originalData = ctx.getImageData(0, 0, width, height);
        const resultData = ctx.createImageData(width, height);
        
        // Generar mapa de distorsión
        // Este mapa determina dónde y cuánto se distorsiona cada parte de la imagen
        const distortionMap = generateDistortionMap(width, height);
        
        // Aplicar distorsión
        applyMagikEffect(originalData, resultData, distortionMap, width, height);
        
        // Actualizar el canvas con la imagen distorsionada
        ctx.putImageData(resultData, 0, 0);
        
        // Enviar imagen como respuesta
        res.setHeader("Content-Type", "image/png");
        canvas.createPNGStream().pipe(res);

    } catch (error) {
        console.error("Error en MAGIK:", error);
        res.status(500).json({ 
            error: "Error al aplicar MAGIK a la imagen",
            detalle: error.message
        });
    }
});

/**
 * Genera un mapa de distorsión aleatorio para el efecto MAGIK
 */
function generateDistortionMap(width, height) {
    // Este mapa controla la distorsión en cada punto de la imagen
    const map = { xMap: [], yMap: [] };
    
    // Crear campos de distorsión para X e Y
    // Estos campos crean "centros de expansión" aleatorios
    const numCenters = 10; // Número de centros de distorsión
    const centers = [];
    
    // Generar centros aleatorios de expansión
    for (let i = 0; i < numCenters; i++) {
        centers.push({
            x: Math.random() * width,
            y: Math.random() * height,
            power: (Math.random() * 20) + 15, // Fuerza de la distorsión (15-35)
            radius: (Math.random() * 0.3 + 0.2) * Math.min(width, height) // Radio de influencia
        });
    }
    
    // Generar matrices de desplazamiento
    for (let y = 0; y < height; y++) {
        map.xMap[y] = [];
        map.yMap[y] = [];
        
        for (let x = 0; x < width; x++) {
            // Valores iniciales sin distorsión
            let xOffset = 0;
            let yOffset = 0;
            
            // Aplicar influencia de cada centro de distorsión
            for (const center of centers) {
                // Calcular distancia al centro de distorsión
                const dx = x - center.x;
                const dy = y - center.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Si el punto está dentro del radio de influencia
                if (distance < center.radius) {
                    // Calcular fuerza de distorsión basada en la distancia
                    // Más intenso cerca del centro, se atenúa hacia los bordes
                    const power = center.power * (1 - distance / center.radius);
                    
                    // Calcular dirección de la distorsión (hacia afuera desde el centro)
                    const angle = Math.atan2(dy, dx);
                    
                    // Acumular distorsión de este centro
                    xOffset += Math.cos(angle) * power;
                    yOffset += Math.sin(angle) * power;
                }
            }
            
            // Guardar los valores de desplazamiento
            map.xMap[y][x] = xOffset;
            map.yMap[y][x] = yOffset;
        }
    }
    
    return map;
}

/**
 * Aplica el efecto MAGIK usando el mapa de distorsión
 */
function applyMagikEffect(srcData, dstData, distortionMap, width, height) {
    const src = srcData.data;
    const dst = dstData.data;
    
    // Para cada pixel en la imagen
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Obtener desplazamiento del mapa
            const xOffset = distortionMap.xMap[y][x];
            const yOffset = distortionMap.yMap[y][x];
            
            // Calcular coordenadas de origen
            let srcX = x - xOffset; // Restamos para que el pixel se mueva "hacia" los centros
            let srcY = y - yOffset;
            
            // Asegurar que las coordenadas están dentro de los límites
            srcX = Math.min(Math.max(Math.round(srcX), 0), width - 1);
            srcY = Math.min(Math.max(Math.round(srcY), 0), height - 1);
            
            // Calcular índices en los arrays de datos
            const dstIdx = (y * width + x) * 4;
            const srcIdx = (srcY * width + srcX) * 4;
            
            // Copiar el color del pixel origen al destino
            dst[dstIdx] = src[srcIdx];         // R
            dst[dstIdx + 1] = src[srcIdx + 1]; // G
            dst[dstIdx + 2] = src[srcIdx + 2]; // B
            dst[dstIdx + 3] = src[srcIdx + 3]; // A
        }
    }
}

module.exports = router;
