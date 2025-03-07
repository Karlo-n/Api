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
        const type = req.query.type || 'waves';
        const color = req.query.color || 'ff0000';
        const bgColor = req.query.bgColor || '000000';

        // Log detallado
        console.log(`Procesando visualización tipo: ${type}, color: #${color}, fondo: #${bgColor}`);

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
            console.log(`Video guardado en: ${tempVideoPath}, tamaño: ${req.body.length} bytes`);
            
            // Extraer audio del video
            const extractCommand = `${ffmpegPath} -i "${tempVideoPath}" -vn -acodec libmp3lame -q:a 2 "${inputPath}"`;
            
            console.log("Ejecutando extracción de audio:", extractCommand);
            
            await new Promise((resolve, reject) => {
                exec(extractCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error("Error extrayendo audio:", error);
                        console.error("Detalles:", stderr);
                        reject(error);
                    } else {
                        console.log("Audio extraído correctamente");
                        resolve();
                    }
                });
            });
        } else {
            fs.writeFileSync(inputPath, req.body);
            console.log(`Audio guardado en: ${inputPath}, tamaño: ${req.body.length} bytes`);
        }

        // Verificar que el archivo de entrada exista y tenga tamaño
        if (!fs.existsSync(inputPath) || fs.statSync(inputPath).size === 0) {
            throw new Error("Archivo de entrada inválido o vacío");
        }

        // COMANDOS BÁSICOS Y PROBADOS PARA CADA VISUALIZACIÓN
        let command;
        
        if (type === 'waves') {
            // ONDAS HORIZONTALES BÁSICAS
            command = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=1280x720:c=#${bgColor},format=rgba[bg];[0:a]showwaves=s=1280x720:mode=line:colors=#${color}[waves];[bg][waves]overlay=format=auto:shortest=1" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a copy -y "${outputPath}"`;
        } 
        else if (type === 'bars') {
            // BARRAS VERTICALES - Comando optimizado para mostrar barras verticales claramente diferenciadas
            command = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=1280x720:c=#${bgColor},format=rgba[bg];[0:a]showspectrum=s=1280x720:mode=separate:slide=1:scale=log:color=intensity:orientation=v:fscale=lin:win_func=hamming:overlap=0:saturation=5:legend=0[spectrum];[bg][spectrum]overlay=format=auto:shortest=1" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a copy -y "${outputPath}"`;
        }
        else if (type === 'sunburst') {
            // CÍRCULO CON ONDAS - Comando garantizado para mostrar visualización circular
            command = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=1280x720:c=#${bgColor},format=rgba[bg];[0:a]avectorscope=s=640x640:zoom=1.5:draw=line:mode=polar:rate=25[scope];[bg][scope]overlay=(W-w)/2:(H-h)/2:format=auto:shortest=1" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a copy -y "${outputPath}"`;
        }
        
        console.log("Ejecutando comando FFmpeg:", command);
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Error ejecutando FFmpeg:", error);
                console.error("Salida de error:", stderr);
                
                // Comando ultra básico como último recurso
                let fallbackCommand;
                
                if (type === 'waves') {
                    fallbackCommand = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=1280x720:c=#${bgColor}[bg];[0:a]showwaves=s=1280x720:mode=line:colors=white[waves];[bg][waves]overlay=shortest=1" -c:v libx264 -preset ultrafast -crf 30 -pix_fmt yuv420p -c:a aac -strict -2 -y "${outputPath}"`;
                } 
                else if (type === 'bars') {
                    fallbackCommand = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=1280x720:c=#${bgColor}[bg];[0:a]showspectrum=s=1280x720:slide=1:scale=log:orientation=v:mode=separate[eq];[bg][eq]overlay=shortest=1" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -y "${outputPath}"`;
                }
                else if (type === 'sunburst') {
                    fallbackCommand = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=1280x720:c=#${bgColor}[bg];[0:a]avectorscope=s=640x640:mode=polar:rate=25:zoom=2[scope];[bg][scope]overlay=(W-w)/2:(H-h)/2:format=auto:shortest=1" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -y "${outputPath}"`;
                }
                
                console.log("Intentando comando ultra básico:", fallbackCommand);
                
                exec(fallbackCommand, (err2, stdout2, stderr2) => {
                    if (err2) {
                        console.error("Error en comando básico:", err2);
                        console.error("Detalles:", stderr2);
                        
                        // Verificar si FFmpeg está disponible
                        exec(`${ffmpegPath} -version`, (verErr, verStdout) => {
                            if (verErr) {
                                console.error("Error verificando FFmpeg:", verErr);
                                return res.status(500).json({
                                    error: "Error de sistema: No se pudo acceder a FFmpeg",
                                    details: verErr.message
                                });
                            }
                            
                            console.log("FFmpeg disponible:", verStdout.split('\n')[0]);
                            return res.status(500).json({
                                error: "Error generando visualización",
                                ffmpegVersion: verStdout.split('\n')[0],
                                details: stderr2
                            });
                        });
                        return;
                    }
                    
                    // Verificar que el archivo se haya creado
                    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
                        console.error("Error: Archivo de salida no generado o vacío");
                        return res.status(500).json({
                            error: "Archivo de salida no generado correctamente",
                            details: "El proceso no generó errores pero el archivo no existe o está vacío"
                        });
                    }
                    
                    console.log("Visualización generada con método básico, tamaño:", fs.statSync(outputPath).size);
                    
                    // Limpiar archivos temporales
                    cleanupFiles(inputPath, tempVideoPath);
                    
                    // Responder con éxito
                    res.json({
                        success: true,
                        message: "Visualización generada (modo básico)",
                        videoUrl: publicUrl,
                        jobId: jobId
                    });
                });
                
                return;
            }
            
            // Verificar que el archivo se haya creado
            if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
                console.error("Error: Archivo de salida no generado o vacío a pesar de no haber errores");
                return res.status(500).json({
                    error: "Archivo de salida no generado correctamente",
                    details: "El proceso no generó errores pero el archivo no existe o está vacío"
                });
            }
            
            console.log("Visualización generada exitosamente, tamaño:", fs.statSync(outputPath).size);
            
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
        const fileStats = fs.statSync(outputPath);
        res.json({
            status: "completed",
            videoUrl: `/visualizer/output_${jobId}.mp4`,
            fileSize: fileStats.size,
            created: fileStats.birthtime
        });
    } else {
        res.json({
            status: "processing"
        });
    }
});

// Endpoint para obtener visualización específica (para pruebas)
router.get("/visualizacion/:jobId", (req, res) => {
    const { jobId } = req.params;
    const outputPath = path.join(OUTPUT_DIR, `output_${jobId}.mp4`);
    
    if (fs.existsSync(outputPath)) {
        res.sendFile(outputPath);
    } else {
        res.status(404).json({
            error: "Visualización no encontrada"
        });
    }
});

// Exportar el router
module.exports = router;
