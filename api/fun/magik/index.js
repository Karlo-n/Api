// api/utility/magik.js
const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

/**
 * API MAGIK - Aplica efectos de distorsión extrema a imágenes o GIFs
 * 
 * Parámetros:
 * - imagen: URL de la imagen o GIF a procesar
 */
router.get('/', async (req, res) => {
    try {
        const { imagen } = req.query;
        
        if (!imagen) {
            return res.status(400).json({
                error: 'Se requiere una URL de imagen o GIF',
                ejemplo: '/api/utility/magik?imagen=https://example.com/imagen.jpg'
            });
        }
        
        // Crear directorio temporal
        const tempDir = path.join(os.tmpdir(), 'magik-tmp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Nombres de archivos temporales
        const uniqueId = uuidv4();
        const inputFile = path.join(tempDir, `input-${uniqueId}`);
        const outputFile = path.join(tempDir, `output-${uniqueId}`);
        
        // Descargar el archivo
        console.log(`Descargando desde: ${imagen}`);
        const response = await fetch(imagen);
        
        if (!response.ok) {
            throw new Error(`Error al descargar: ${response.statusText}`);
        }
        
        // Obtener el tipo de contenido
        const contentType = response.headers.get('content-type');
        const isGif = contentType && contentType.includes('gif');
        
        // Extender archivos con la extensión correcta
        const inputFilePath = isGif ? `${inputFile}.gif` : `${inputFile}.jpg`;
        const outputFilePath = isGif ? `${outputFile}.gif` : `${outputFile}.jpg`;
        
        // Guardar el archivo descargado
        const fileBuffer = await response.buffer();
        fs.writeFileSync(inputFilePath, fileBuffer);
        
        // Procesar según el tipo de archivo
        if (isGif) {
            // Procesar GIF animado usando ImageMagick
            await procesarGif(inputFilePath, outputFilePath);
            
            // Establecer el tipo de contenido adecuado
            res.set('Content-Type', 'image/gif');
            
            // Enviar el GIF procesado
            const outputBuffer = fs.readFileSync(outputFilePath);
            res.send(outputBuffer);
        } else {
            // Procesar imagen estática con sharp
            const outputBuffer = await procesarImagen(inputFilePath);
            
            // Establecer el tipo de contenido adecuado
            res.set('Content-Type', 'image/jpeg');
            
            // Enviar la imagen procesada
            res.send(outputBuffer);
        }
        
        // Limpiar archivos temporales
        try {
            if (fs.existsSync(inputFilePath)) fs.unlinkSync(inputFilePath);
            if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
        } catch (cleanupErr) {
            console.error('Error al limpiar archivos temporales:', cleanupErr);
        }
        
    } catch (error) {
        console.error('Error en el procesamiento MAGIK:', error);
        res.status(500).json({ 
            error: 'Error al procesar la imagen o GIF',
            detalle: error.message
        });
    }
});

/**
 * Procesa una imagen aplicando el efecto MAGIK
 */
async function procesarImagen(inputPath) {
    try {
        // Aplicar efecto MAGIK con sharp
        return await sharp(inputPath)
            // Aplicar liquify (distorsión)
            .convolve({
                width: 3,
                height: 3,
                kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
            })
            // Aplicar más distorsiones
            .modulate({
                brightness: 1.1,
                saturation: 1.5,
                hue: 180
            })
            // Distorsionar bordes
            .sharpen(20, 3, 15)
            // Aumentar contraste
            .gamma(2.5)
            // Formato JPEG para la salida
            .jpeg({
                quality: 85
            })
            .toBuffer();
    } catch (err) {
        console.error('Error al procesar la imagen:', err);
        throw err;
    }
}

/**
 * Procesa un GIF animado aplicando el efecto MAGIK
 * Requiere ImageMagick instalado en el servidor
 */
async function procesarGif(inputPath, outputPath) {
    try {
        // Comando de ImageMagick para aplicar efecto MAGIK en GIF
        const command = `convert "${inputPath}" -coalesce -scale 800x800\\> -liquid-rescale 60%x60% -resize 160% -implode -1 -layers optimize "${outputPath}"`;
        
        // Ejecutar comando
        execSync(command);
        
        return true;
    } catch (err) {
        console.error('Error al procesar el GIF:', err);
        throw err;
    }
}

module.exports = router;
