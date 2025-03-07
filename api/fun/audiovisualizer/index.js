// api/fun/audiovisualizer/index.js
const express = require("express");
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

// Rutas para directorios
const TEMP_DIR = path.join(__dirname, 'temp');
const OUTPUT_DIR = path.join(__dirname, '../../../public/visualizer');
const HTML_PATH = path.join(__dirname, 'visualizer.html');

// Crear directorios si no existen
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Ruta principal - Sirve el HTML si no hay parámetros de API
router.get("/", (req, res) => {
    if (Object.keys(req.query).length === 0) {
        return res.sendFile(HTML_PATH);
    }
    
    // Procesar solicitud de API (como lo tenías antes)
    res.status(400).json({
        error: "Método GET no soportado para procesamiento. Usa POST para enviar archivos.",
        ejemplo: "POST /api/fun/audiovisualizer con un archivo MP3/MP4 en el body"
    });
});

// Ruta para procesar archivos de audio/video - Versión simplificada
router.post("/", express.raw({
    type: ['audio/mp3', 'audio/mpeg', 'video/mp4', 'audio/*', 'video/*'],
    limit: '50mb'
}), async (req, res) => {
    try {
        // Verificar el archivo
        if (!req.body || req.body.length === 0) {
            return res.status(400).json({ error: "No se recibió ningún archivo" });
        }

        console.log("Procesando archivo de audio/video...");

        // Generar IDs únicos para archivos
        const jobId = uuidv4();
        const inputPath = path.join(TEMP_DIR, `input_${jobId}.mp3`);
        const outputPath = path.join(OUTPUT_DIR, `output_${jobId}.mp4`);
        const publicUrl = `/visualizer/output_${jobId}.mp4`;

        // Guardar el archivo recibido
        fs.writeFileSync(inputPath, req.body);
        console.log(`Archivo guardado en: ${inputPath} (${req.body.length} bytes)`);

        // COMANDO CORREGIDO: Asegurar que el audio se procesa correctamente
        const command = `${ffmpegPath} -i "${inputPath}" -f lavfi -i color=c=blue:s=640x360:d=10 -filter_complex "[1:v][0:a]concat=n=1:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v libx264 -c:a aac -b:a 192k -shortest "${outputPath}"`;
        
        console.log("Ejecutando comando:", command);
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Error ejecutando FFmpeg:", error);
                console.error("Detalles:", stderr);
                
                // Intentar un comando alternativo más simple si el primer intento falla
                const simpleCommand = `${ffmpegPath} -i "${inputPath}" -f lavfi -i color=c=black:s=640x360:r=30:d=10 -c:a aac -shortest "${outputPath}"`;
                
                console.log("Intentando comando alternativo:", simpleCommand);
                
                exec(simpleCommand, (err2, stdout2, stderr2) => {
                    if (err2) {
                        console.error("Error en segundo intento:", err2);
                        return res.status(500).json({ 
                            error: "Error procesando archivo",
                            details: err2.message
                        });
                    }
                    
                    // Segundo intento exitoso
                    console.log("Video generado con método alternativo:", outputPath);
                    
                    // Limpiar archivo temporal
                    fs.unlink(inputPath, (err) => {
                        if (err) console.error("Error eliminando archivo temporal:", err);
                    });
                    
                    // Responder con éxito
                    res.json({
                        success: true,
                        message: "Visualización generada",
                        videoUrl: publicUrl,
                        jobId: jobId
                    });
                });
                
                return;
            }
            
            // Primer intento exitoso
            console.log("Video generado exitosamente:", outputPath);
            
            // Limpiar archivo temporal de entrada
            fs.unlink(inputPath, (err) => {
                if (err) console.error("Error eliminando archivo temporal:", err);
            });
            
            // Responder con éxito
            res.json({
                success: true,
                message: "Visualización generada",
                videoUrl: publicUrl,
                jobId: jobId
            });
        });
    } catch (error) {
        console.error("Error general:", error);
        res.status(500).json({
            error: "Error procesando la solicitud",
            details: error.message
        });
    }
});

// Endpoint de estado
router.get("/status/:jobId", (req, res) => {
    const { jobId } = req.params;
    const outputPath = path.join(OUTPUT_DIR, `output_${jobId}.mp4`);
    
    if (fs.existsSync(outputPath)) {
        res.json({
            status: "completed",
            videoUrl: `/visualizer/output_${jobId}.mp4`
        });
    } else {
        res.json({
            status: "processing"
        });
    }
});

// Exportar el router
module.exports = router;
