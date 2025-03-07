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
    
    res.status(400).json({
        error: "Método GET no soportado para procesamiento. Usa POST para enviar archivos."
    });
});

// Ruta para procesar archivos de audio/video
router.post("/", express.raw({
    type: ['audio/mp3', 'audio/mpeg', 'video/mp4', 'audio/*', 'video/*'],
    limit: '50mb'
}), async (req, res) => {
    try {
        // Verificar el archivo
        if (!req.body || req.body.length === 0) {
            return res.status(400).json({ error: "No se recibió ningún archivo" });
        }

        // Obtener parámetros de la visualización
        const type = req.query.type || 'waves'; // Predeterminado: waves
        const color = req.query.color || 'ff0000'; // Color predeterminado: rojo
        const bgColor = req.query.bgColor || '000000'; // Fondo predeterminado: negro

        console.log(`Procesando visualización tipo: ${type}, color: ${color}, fondo: ${bgColor}`);

        // Generar IDs únicos para archivos
        const jobId = uuidv4();
        const inputPath = path.join(TEMP_DIR, `input_${jobId}.mp3`);
        const outputPath = path.join(OUTPUT_DIR, `output_${jobId}.mp4`);
        const publicUrl = `/visualizer/output_${jobId}.mp4`;
        const isMP4 = req.headers['content-type'].includes('video/mp4');
        const tempVideoPath = isMP4 ? path.join(TEMP_DIR, `video_${jobId}.mp4`) : null;

        // Guardar el archivo recibido
        if (isMP4) {
            fs.writeFileSync(tempVideoPath, req.body);
            console.log(`Video guardado en: ${tempVideoPath}`);
            
            // Extraer audio del video
            const extractCommand = `${ffmpegPath} -i "${tempVideoPath}" -vn -acodec copy "${inputPath}"`;
            await new Promise((resolve, reject) => {
                exec(extractCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error("Error extrayendo audio:", error);
                        reject(error);
                    } else {
                        console.log("Audio extraído correctamente");
                        resolve();
                    }
                });
            });
        } else {
            fs.writeFileSync(inputPath, req.body);
            console.log(`Audio guardado en: ${inputPath}`);
        }

        // Seleccionar comando basado en el tipo de visualización
        let command;
        
        // Convertir colores a formato ffmpeg (0xRRGGBB)
        const ffmpegColor = `0x${color}`;
        const ffmpegBgColor = `0x${bgColor}`;
        
        switch (type) {
            case 'waves':
                // Visualización de ondas con color de fondo personalizado
                command = `${ffmpegPath} -i "${inputPath}" -filter_complex "[0:a]showwaves=s=640x360:mode=line:rate=25:colors=0x${color}:scale=sqrt,format=yuv420p,drawbox=width=iw:height=ih:color=0x${bgColor}@0.4:t=fill[v]" -map "[v]" -map 0:a -c:v libx264 -c:a aac -b:a 192k -shortest "${outputPath}"`;
                break;
                
            case 'spectrum':
                // Visualización del espectro con fondo personalizado
                command = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=640x360:c=#${bgColor}[bg];[0:a]showspectrum=s=640x360:mode=combined:color=intensity:slide=scroll:scale=log:gain=4:fscale=lin:saturation=1:color=0x${color}[spectrum];[bg][spectrum]overlay=shortest=1[v]" -map "[v]" -map 0:a -c:v libx264 -c:a aac -b:a 192k -shortest "${outputPath}"`;
                break;
                
            case 'circle':
                // Visualización circular (tipo bola)
                command = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=640x360:c=#${bgColor}[bg];[0:a]showcqt=fps=25:size=640x360:count=5:csp=bt709:bar_g=2:sono_g=4:bar_v=9:sono_v=17:sono_h=0:bar_h=0:tc=#${color}:tlength=lin:tlist=0-11.5k:axis_h=0:count=1:cscheme=1|0|0.5|0|1|0.5[spectrum];[bg][spectrum]overlay=shortest=1[v]" -map "[v]" -map 0:a -c:v libx264 -c:a aac -b:a 192k -shortest "${outputPath}"`;
                break;
                
            case 'bars':
            default:
                // Visualización de barras con fondo personalizado
                command = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=640x360:c=#${bgColor}[bg];[0:a]avectorscope=s=640x360:mode=lissajous:rate=25:zoom=1.5:draw=line:scale=sqrt:mirror=x:rf=0.${color.substring(0,2)}:gf=0.${color.substring(2,4)}:bf=0.${color.substring(4,6)}[scope];[bg][scope]overlay=shortest=1[v]" -map "[v]" -map 0:a -c:v libx264 -c:a aac -b:a 192k -shortest "${outputPath}"`;
                break;
        }
        
        console.log("Ejecutando comando:", command);
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Error ejecutando FFmpeg:", error);
                console.error("Detalles:", stderr);
                
                // Intentar un método de respaldo más simple
                const fallbackCommand = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=640x360:c=#${bgColor}[bg];[0:a]showwaves=s=640x360:mode=cline:colors=#${color}[waves];[bg][waves]overlay=shortest=1[v]" -map "[v]" -map 0:a -c:v libx264 -c:a aac -b:a 192k -shortest -pix_fmt yuv420p "${outputPath}"`;
                
                console.log("Intentando comando alternativo:", fallbackCommand);
                
                exec(fallbackCommand, (err2, stdout2, stderr2) => {
                    if (err2) {
                        console.error("Error en segundo intento:", err2);
                        return res.status(500).json({ 
                            error: "Error procesando archivo",
                            details: err2.message
                        });
                    }
                    
                    // Segundo intento exitoso
                    console.log("Visualización generada con método alternativo");
                    
                    // Limpiar archivos temporales
                    cleanupFiles(inputPath, tempVideoPath);
                    
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
            console.log("Visualización generada exitosamente");
            
            // Limpiar archivos temporales
            cleanupFiles(inputPath, tempVideoPath);
            
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

// Función para limpiar archivos temporales
function cleanupFiles(inputPath, tempVideoPath) {
    try {
        if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
        }
        if (tempVideoPath && fs.existsSync(tempVideoPath)) {
            fs.unlinkSync(tempVideoPath);
        }
    } catch (err) {
        console.error("Error limpiando archivos temporales:", err);
    }
}

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
