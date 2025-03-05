// api/fun/magik/index.js
const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const router = express.Router();

/**
 * API MAGIK - Versión simplificada con manejo de errores mejorado
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
                timeout: 10000 // 10 segundos timeout
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
        
        // Crear canvas principal
        const canvas = Canvas.createCanvas(width, height);
        const ctx = canvas.getContext("2d");
        
        // Crear canvas temporal para la imagen original
        const tempCanvas = Canvas.createCanvas(width, height);
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(imagenOriginal, 0, 0, width, height);
        
        // Obtener datos de la imagen
        const originalPixels = tempCtx.getImageData(0, 0, width, height);
        
        // Aplicar efecto MAGIK utilizando transformaciones mosaico
        // Este método es más simple y resistente a errores
        const gridSize = 16; // Tamaño de la cuadrícula
        const cellWidth = width / gridSize;
        const cellHeight = height / gridSize;
        
        // Para cada celda en la cuadrícula
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                // Coordenadas de la celda
                const cellX = x * cellWidth;
                const cellY = y * cellHeight;
                
                // Factor de distorsión basado en la posición
                // Esto crea el efecto "bulge"/"liquid" típico de MAGIK
                const distortX = Math.sin(y / gridSize * Math.PI) * 12;
                const distortY = Math.cos(x / gridSize * Math.PI) * 12;
                
                // Dibujar la celda con distorsión
                ctx.drawImage(
                    tempCanvas, 
                    cellX, cellY, cellWidth, cellHeight,  // Fuente 
                    cellX + distortX, cellY + distortY, cellWidth, cellHeight  // Destino con distorsión
                );
            }
        }
        
        // Volver a aplicar para mayor efecto de distorsión (como multiple pasadas)
        const pass2Canvas = Canvas.createCanvas(width, height);
        const pass2Ctx = pass2Canvas.getContext("2d");
        pass2Ctx.drawImage(canvas, 0, 0);
        
        ctx.clearRect(0, 0, width, height);
        
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cellX = x * cellWidth;
                const cellY = y * cellHeight;
                
                // Distorsión diferente para segunda pasada
                const distortX = Math.cos((x + y) / gridSize * Math.PI) * 8;
                const distortY = Math.sin((x - y) / gridSize * Math.PI) * 8;
                
                ctx.drawImage(
                    pass2Canvas, 
                    cellX, cellY, cellWidth, cellHeight,
                    cellX + distortX, cellY + distortY, cellWidth, cellHeight
                );
            }
        }
        
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

module.exports = router;
