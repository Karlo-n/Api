// api/fun/magik/index.js
const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const router = express.Router();

/**
 * API MAGIK - Aplica el efecto de distorsión líquida a imágenes
 * Manteniendo los colores originales pero con distorsión espacial
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

        // Cargar imagen con axios
        const loadImage = async (url) => {
            try {
                const response = await axios.get(url, { responseType: "arraybuffer" });
                return await Canvas.loadImage(Buffer.from(response.data));
            } catch (error) {
                console.error(`Error cargando la imagen: ${url}`, error);
                return null;
            }
        };

        // Cargar la imagen de entrada
        const imagenOriginal = await loadImage(imagen);

        if (!imagenOriginal) {
            return res.status(500).json({ error: "Error al cargar la imagen. Verifica que la URL sea válida." });
        }

        // Crear canvas con las dimensiones originales
        const width = imagenOriginal.width;
        const height = imagenOriginal.height;
        const canvas = Canvas.createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        // Dibujar la imagen original
        ctx.drawImage(imagenOriginal, 0, 0, width, height);
        
        // Obtener datos de la imagen original
        const imageDataOriginal = ctx.getImageData(0, 0, width, height);
        
        // Aplicar efecto MAGIK (distorsión líquida)
        const imageDataMagik = aplicarDistorsionLiquida(imageDataOriginal, width, height);
        
        // Dibujar el resultado
        ctx.putImageData(imageDataMagik, 0, 0);

        // Enviar imagen como respuesta
        res.setHeader("Content-Type", "image/png");
        canvas.createPNGStream().pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al aplicar MAGIK a la imagen" });
    }
});

/**
 * Aplica distorsión líquida a la imagen (verdadero efecto MAGIK)
 */
function aplicarDistorsionLiquida(imageData, width, height) {
    const data = imageData.data;
    const result = new Uint8ClampedArray(data.length);
    
    // Parámetros de distorsión
    const frequency = 0.1;     // Frecuencia de ondas
    const amplitude = 10;      // Amplitud de la distorsión
    const turbulence = 0.08;   // Turbulencia adicional
    
    // Para cada pixel en la imagen destino
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Aplicar distorsión no lineal (tipo "liquid")
            
            // Componente de distorsión basado en seno/coseno para efecto de onda
            const distX = Math.sin(y * frequency) * amplitude;
            const distY = Math.cos(x * frequency) * amplitude;
            
            // Añadir turbulencia (para que no sea solo ondas regulares)
            const turbX = Math.sin(x * turbulence * y * turbulence) * amplitude * 1.5;
            const turbY = Math.cos(y * turbulence * x * turbulence) * amplitude * 1.5;
            
            // Calcular coordenadas de origen con la distorsión aplicada
            let srcX = x + distX + turbX;
            let srcY = y + distY + turbY;
            
            // Asegurar que las coordenadas estén dentro de los límites
            srcX = Math.min(Math.max(Math.floor(srcX), 0), width - 1);
            srcY = Math.min(Math.max(Math.floor(srcY), 0), height - 1);
            
            // Índices en los arrays de datos
            const destIdx = (y * width + x) * 4;
            const srcIdx = (srcY * width + srcX) * 4;
            
            // Copiar colores de origen a destino (mantener colores pero con distorsión espacial)
            result[destIdx] = data[srcIdx];         // R
            result[destIdx + 1] = data[srcIdx + 1]; // G
            result[destIdx + 2] = data[srcIdx + 2]; // B
            result[destIdx + 3] = data[srcIdx + 3]; // A
        }
    }
    
    // Aplicar una segunda pasada para más distorsión (similar a multiple pasadas de ImageMagick)
    const secondPass = new Uint8ClampedArray(result.length);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Diferentes parámetros para la segunda pasada
            const freq2 = 0.15;
            const ampl2 = 6;
            
            // Distorsión basada en tangente para mayor efecto "bulge"
            const angle = Math.atan2(y - height/2, x - width/2);
            const dist = Math.sqrt((y - height/2)**2 + (x - width/2)**2) / Math.sqrt(width*width + height*height) * 2;
            
            // Aplicar distorsión circular/radial
            const distX = Math.sin(angle) * (1-dist) * ampl2;
            const distY = Math.cos(angle) * (1-dist) * ampl2;
            
            // Calcular coordenadas de origen
            let srcX = x + distX;
            let srcY = y + distY;
            
            // Asegurar que las coordenadas estén dentro de los límites
            srcX = Math.min(Math.max(Math.floor(srcX), 0), width - 1);
            srcY = Math.min(Math.max(Math.floor(srcY), 0), height - 1);
            
            // Índices en los arrays de datos
            const destIdx = (y * width + x) * 4;
            const srcIdx = (srcY * width + srcX) * 4;
            
            // Copiar colores manteniendo la información de color
            secondPass[destIdx] = result[srcIdx];         // R
            secondPass[destIdx + 1] = result[srcIdx + 1]; // G
            secondPass[destIdx + 2] = result[srcIdx + 2]; // B
            secondPass[destIdx + 3] = result[srcIdx + 3]; // A
        }
    }
    
    // Crear un nuevo ImageData con el resultado
    return new ImageData(secondPass, width, height);
}

module.exports = router;
