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
            const extractCommand = `${ffmpegPath} -i "${tempVideoPath}" -vn -acodec libmp3lame -q:a 2 "${inputPath}"`;
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
        
        switch (type) {
            case 'waves':
                // Visualización de ondas completamente rediseñada - movimiento fluido garantizado
                command = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=1280x720:c=#${bgColor}[bg];[0:a]avectorscope=s=1280x720:mode=lissajous:rate=60:zoom=1.5:rc=0:gc=0:bc=0:rf=0:gf=0:bf=0:draw=line:scale=sqrt:mirror=x:size=hd720[scope];[scope]drawgrid=width=50:height=50:color=#${color}@0.1[grid];[grid]format=yuva444p,colorchannelmixer=aa=0.8[trans];[bg][trans]overlay=format=auto:shortest=1[v]" -map "[v]" -map 0:a -c:v libx264 -c:a aac -b:a 192k -shortest -r 60 -pix_fmt yuv420p -preset ultrafast "${outputPath}"`;
                break;
                
            case 'sunburst':
                // Visualización de círculo con explosión radial - mucho más dramática
                command = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=1280x720:c=#${bgColor}[bg];[0:a]showcqt=fps=60:size=1280x720:count=12:gamma=7:bar_g=5:sono_g=8:bar_v=25:sono_v=40:sono_h=0:axis_h=0:tc=#${color}:tlength=lin:tlist=0-20k:sono=off:bar=1:csp=bt709:mode=polar:fontcolor=#${color}[vis];[bg][vis]overlay=x=(W-w)/2:y=(H-h)/2:shortest=1[v]" -map "[v]" -map 0:a -c:v libx264 -c:a aac -b:a 192k -shortest -r 60 -pix_fmt yuv420p -preset ultrafast "${outputPath}"`;
                break;
                
            case 'bars':
            default:
                // Visualización de barras totalmente distinta - estilo ecualizador clásico
                command = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=1280x720:c=#${bgColor}[bg];[0:a]showspectrum=s=1280x720:slide=replace:mode=separate:color=intensity:scale=cbrt:orientation=v:overlap=0:saturation=5:gain=5:legend=0:fps=60:fscale=log:win_func=blackman:count=40:draw=dot[eq];[bg][eq]overlay=shortest=1[v]" -map "[v]" -map 0:a -c:v libx264 -c:a aac -b:a 192k -shortest -r 60 -pix_fmt yuv420p -preset ultrafast "${outputPath}"`;
                break;
        }
        
        console.log("Ejecutando comando:", command);
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Error ejecutando FFmpeg:", error);
                console.error("Detalles:", stderr);
                
                // Intentar un método de respaldo más simple pero mejorado
                const fallbackCommand = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=1280x720:c=#${bgColor}[bg];[0:a]showwaves=s=1280x720:mode=p2p:n=200:colors=#${color}:draw=full:scale=sqrt[waves];[bg][waves]overlay=shortest=1[v]" -map "[v]" -map 0:a -c:v libx264 -c:a aac -b:a 192k -shortest -pix_fmt yuv420p -preset ultrafast "${outputPath}"`;
                
                console.log("Intentando comando alternativo:", fallbackCommand);
                
                exec(fallbackCommand, (err2, stdout2, stderr2) => {
                    if (err2) {
                        console.error("Error en segundo intento:", err2);
                        
                        // Tercer intento con una configuración aún más simple
                        const lastResortCommand = `${ffmpegPath} -i "${inputPath}" -filter_complex "color=s=1280x720:c=#${bgColor}[bg];[0:a]showwaves=s=1280x720:mode=cline:colors=#${color}[waves];[bg][waves]overlay=shortest=1[v]" -map "[v]" -map 0:a -c:v libx264 -preset ultrafast -crf 28 -c:a aac -b:a 128k -shortest -pix_fmt yuv420p "${outputPath}"`;
                        
                        console.log("Intentando último comando de emergencia:", lastResortCommand);
                        
                        exec(lastResortCommand, (err3, stdout3, stderr3) => {
                            if (err3) {
                                console.error("Error en tercer intento:", err3);
                                return res.status(500).json({ 
                                    error: "Error procesando archivo",
                                    details: err3.message
                                });
                            }
                            
                            // Tercer intento exitoso
                            console.log("Visualización generada con método de emergencia");
                            
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
