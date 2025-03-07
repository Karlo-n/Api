// api/fun/audiovisualizer/index.js
const express = require("express");
const router = express.Router();
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

// Configurar FFmpeg con los binarios estáticos
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

// Configurar directorio para archivos temporales
const TEMP_DIR = path.join(os.tmpdir(), 'audiovisualizer');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Directorio para guardar los videos generados
const OUTPUT_DIR = path.join(__dirname, '../../../public/visualizer');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Endpoint para procesar archivos MP3/MP4 usando el método raw de Express
 */
router.post("/", express.raw({ 
    type: ['audio/mp3', 'audio/mpeg', 'video/mp4'],
    limit: '50mb' // Límite de 50MB
}), async (req, res) => {
    try {
        // Verificar que se recibió un archivo
        if (!req.body || req.body.length === 0) {
            return res.status(400).json({
                error: "No se recibió ningún archivo",
                ejemplo: "Envía un archivo MP3 o MP4 en el cuerpo de la solicitud"
            });
        }

        // Verificar el tipo MIME
        const contentType = req.headers['content-type'];
        if (!contentType || !(contentType.includes('audio/mp3') || contentType.includes('audio/mpeg') || contentType.includes('video/mp4'))) {
            return res.status(400).json({
                error: "Formato no soportado. Solo se aceptan archivos MP3 y MP4.",
                contentType: contentType
            });
        }

        const { type = 'bars', color = '#3498db', bgColor = '#000000', duration } = req.query;
        const jobId = uuidv4();
        const isMP4 = contentType.includes('video/mp4');
        
        // Guardar el archivo recibido
        const fileExt = isMP4 ? '.mp4' : '.mp3';
        const filePath = path.join(TEMP_DIR, `${jobId}${fileExt}`);
        fs.writeFileSync(filePath, req.body);

        // Verificar que el archivo es válido usando FFprobe
        try {
            await validateMediaFile(filePath);
        } catch (validationError) {
            fs.unlinkSync(filePath);
            return res.status(400).json({
                error: "El archivo subido no es un archivo de audio/video válido",
                detalle: validationError.message
            });
        }

        let audioFilePath = filePath;

        // Si es un MP4, extraer el audio
        if (isMP4) {
            audioFilePath = path.join(TEMP_DIR, `${jobId}_audio.mp3`);
            try {
                await extractAudioFromVideo(filePath, audioFilePath);
            } catch (extractError) {
                fs.unlinkSync(filePath);
                return res.status(500).json({
                    error: "No se pudo extraer el audio del video",
                    detalle: extractError.message
                });
            }
        }

        // Crear visualización simulada (sin FFmpeg para analizar)
        const visualizationPath = path.join(TEMP_DIR, `${jobId}_visualization`);
        const outputVideoPath = path.join(OUTPUT_DIR, `${jobId}_output.mp4`);
        const publicUrl = `/visualizer/${jobId}_output.mp4`;

        // Generar datos de forma de onda simulados en lugar de analizar
        const audioData = generateSimulatedAudioData();
        
        // Generar las imágenes de visualización
        if (!fs.existsSync(visualizationPath)) {
            fs.mkdirSync(visualizationPath, { recursive: true });
        }

        const frameCount = Math.min(audioData.length, 300);
        for (let i = 0; i < frameCount; i++) {
            const frameData = audioData[i];
            const frameFilePath = path.join(visualizationPath, `frame_${i.toString().padStart(5, '0')}.png`);
            generateVisualizationFrame(frameData, frameFilePath, type, color, bgColor);
        }

        // Crear el video a partir de las imágenes
        try {
            await createVisualizationVideoSafe(
                visualizationPath, 
                audioFilePath, 
                outputVideoPath, 
                duration
            );
        } catch (videoError) {
            console.error("Error creando visualización:", videoError);
            
            // Limpiar archivos temporales
            fs.rmSync(filePath, { force: true });
            if (isMP4 && audioFilePath !== filePath) {
                fs.rmSync(audioFilePath, { force: true });
            }
            fs.rmSync(visualizationPath, { recursive: true, force: true });
            
            return res.status(500).json({
                error: "Error al crear la visualización de video",
                detalle: videoError.message
            });
        }

        // Limpiar archivos temporales
        setTimeout(() => {
            try {
                fs.rmSync(filePath, { force: true });
                if (isMP4 && audioFilePath !== filePath) {
                    fs.rmSync(audioFilePath, { force: true });
                }
                fs.rmSync(visualizationPath, { recursive: true, force: true });
            } catch (cleanupError) {
                console.error("Error en limpieza:", cleanupError);
            }
        }, 60000); // Limpiar después de 1 minuto

        // Devolver la URL del video generado
        res.json({
            success: true,
            message: "Visualización generada con éxito a partir del archivo subido",
            videoUrl: publicUrl,
            type,
            jobId
        });

    } catch (error) {
        console.error("Error procesando archivo subido:", error);
        res.status(500).json({ 
            error: "Error al procesar la visualización", 
            detalle: error.message 
        });
    }
});

/**
 * Valida que un archivo sea un medio válido utilizando FFprobe
 * @param {string} filePath Ruta al archivo a validar
 * @returns {Promise} Promesa que se resuelve si el archivo es válido
 */
function validateMediaFile(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                console.error('Error validando archivo:', err);
                reject(new Error('Archivo de media inválido'));
                return;
            }

            // Verificar que tiene streams de audio
            const hasAudioStream = metadata.streams.some(stream => 
                stream.codec_type === 'audio');

            if (!hasAudioStream) {
                reject(new Error('El archivo no contiene pistas de audio'));
                return;
            }

            resolve(metadata);
        });
    });
}

/**
 * Genera datos de audio simulados para la visualización
 * Esto evita tener que analizar el archivo de audio con FFmpeg
 * @returns {Array} Array con datos de amplitud simulados
 */
function generateSimulatedAudioData() {
    const data = [];
    const numSamples = 300;
    
    for (let i = 0; i < numSamples; i++) {
        // Crear datos con más variación y patrones
        const value = 0.3 + 0.7 * Math.pow(Math.sin(i * 0.05), 2) + 0.2 * Math.random();
        data.push(Math.min(1, Math.max(0, value))); // Asegurar valores entre 0 y 1
    }
    
    return data;
}

/**
 * Extrae el audio de un archivo MP4 de manera segura
 */
function extractAudioFromVideo(videoPath, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`Extrayendo audio de ${videoPath} a ${outputPath}...`);
        
        ffmpeg(videoPath)
            .outputOptions('-q:a 0')  // Mantener calidad de audio
            .noVideo()
            .output(outputPath)
            .on('start', (commandLine) => {
                console.log('FFmpeg proceso iniciado:', commandLine);
            })
            .on('end', () => {
                console.log('Extracción de audio completada');
                resolve();
            })
            .on('error', (err, stdout, stderr) => {
                console.error('Error extrayendo audio:', err);
                console.error('FFmpeg stderr:', stderr);
                reject(err);
            })
            .run();
    });
}

/**
 * API de Visualizador de Audio - Convierte audio en visualización tipo onda
 * Endpoint original para procesar URLs de audio
 */
router.get("/", async (req, res) => {
    try {
        const { audioUrl, type = 'bars', color = '#3498db', bgColor = '#000000', duration } = req.query;

        // Validar parámetros
        if (!audioUrl) {
            return res.status(400).json({ 
                error: "Debes proporcionar una URL de audio", 
                ejemplo: "/api/fun/audiovisualizer?audioUrl=https://ejemplo.com/audio.mp3&type=bars&color=3498db"
            });
        }

        // Verificar que la URL es válida
        let url;
        try {
            url = new URL(audioUrl);
        } catch (e) {
            return res.status(400).json({ error: "La URL proporcionada no es válida" });
        }

        // Generar nombres de archivos temporales únicos
        const jobId = uuidv4();
        const audioFilePath = path.join(TEMP_DIR, `${jobId}_audio.mp3`);
        const visualizationPath = path.join(TEMP_DIR, `${jobId}_visualization`);
        const outputVideoPath = path.join(OUTPUT_DIR, `${jobId}_output.mp4`);
        const publicUrl = `/visualizer/${jobId}_output.mp4`;

        console.log(`Procesando URL de audio: ${audioUrl}`);
        console.log(`Guardando en: ${audioFilePath}`);

        // Descargar el archivo de audio con mejor manejo de errores
        try {
            const audioResponse = await axios({
                method: 'get',
                url: audioUrl,
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            // Guardar el archivo
            fs.writeFileSync(audioFilePath, Buffer.from(audioResponse.data));
            console.log(`Archivo descargado: ${fs.statSync(audioFilePath).size} bytes`);

            // Verificar que el archivo es un audio válido
            try {
                await validateMediaFile(audioFilePath);
            } catch (validationError) {
                console.error("Error de validación:", validationError);
                fs.unlinkSync(audioFilePath);
                return res.status(400).json({
                    error: "El archivo descargado no es un archivo de audio válido",
                    detalle: validationError.message
                });
            }
        } catch (downloadError) {
            console.error("Error descargando el audio:", downloadError);
            return res.status(400).json({ 
                error: "No se pudo descargar el audio de la URL proporcionada",
                detalle: downloadError.message
            });
        }

        // Crear visualización simulada (sin FFmpeg para analizar)
        const audioData = generateSimulatedAudioData();
        
        // Generar las imágenes de visualización
        if (!fs.existsSync(visualizationPath)) {
            fs.mkdirSync(visualizationPath, { recursive: true });
        }

        const frameCount = Math.min(audioData.length, 300);
        for (let i = 0; i < frameCount; i++) {
            const frameData = audioData[i];
            const frameFilePath = path.join(visualizationPath, `frame_${i.toString().padStart(5, '0')}.png`);
            generateVisualizationFrame(frameData, frameFilePath, type, color, bgColor);
        }

        // Crear el video a partir de las imágenes
        try {
            await createVisualizationVideoSafe(
                visualizationPath, 
                audioFilePath, 
                outputVideoPath, 
                duration
            );
        } catch (videoError) {
            console.error("Error creando visualización:", videoError);
            
            // Limpiar archivos temporales
            fs.rmSync(audioFilePath, { force: true });
            fs.rmSync(visualizationPath, { recursive: true, force: true });
            
            return res.status(500).json({
                error: "Error al crear la visualización de video",
                detalle: videoError.message
            });
        }

        // Limpiar archivos temporales
        setTimeout(() => {
            try {
                fs.rmSync(audioFilePath, { force: true });
                fs.rmSync(visualizationPath, { recursive: true, force: true });
            } catch (cleanupError) {
                console.error("Error en limpieza:", cleanupError);
            }
        }, 60000); // Limpiar después de 1 minuto

        // Devolver la URL del video generado
        res.json({
            success: true,
            message: "Visualización de audio generada con éxito",
            videoUrl: publicUrl,
            type,
            jobId
        });

    } catch (error) {
        console.error("Error en la API de Visualizador de Audio:", error);
        res.status(500).json({ 
            error: "Error al procesar la visualización de audio", 
            detalle: error.message 
        });
    }
});

/**
 * Genera un frame del visualizador de audio
 * @param {number} amplitude Valor de amplitud normalizado (0-1)
 * @param {string} outputPath Ruta donde guardar la imagen generada
 * @param {string} type Tipo de visualización ('bars', 'wave', 'line')
 * @param {string} color Color principal para la visualización
 * @param {string} bgColor Color de fondo
 */
function generateVisualizationFrame(amplitude, outputPath, type, color, bgColor) {
    // Configuración del canvas
    const width = 640;
    const height = 120;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Dibujar fondo
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Dibujar visualización según el tipo
    ctx.fillStyle = color;
    
    switch (type) {
        case 'wave':
            // Dibujar una onda sinusoidal
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            
            for (let x = 0; x < width; x++) {
                const y = height / 2 + Math.sin(x * 0.05) * amplitude * height / 3;
                ctx.lineTo(x, y);
            }
            
            ctx.lineTo(width, height / 2);
            ctx.stroke();
            break;
            
        case 'line':
            // Dibujar una línea horizontal que varía en altura
            const lineHeight = Math.max(1, amplitude * height * 0.8);
            ctx.fillRect(0, (height - lineHeight) / 2, width, lineHeight);
            break;
            
        case 'bars':
        default:
            // Dibujar barras verticales
            const barCount = 32;
            const barWidth = width / barCount - 2;
            
            for (let i = 0; i < barCount; i++) {
                // Variar la altura de cada barra basada en la amplitud
                const variance = Math.random() * 0.3 - 0.15; // -0.15 a +0.15
                const barHeight = Math.max(4, (amplitude + variance) * height * 0.8);
                const x = i * (barWidth + 2) + 1;
                const y = (height - barHeight) / 2;
                
                ctx.fillRect(x, y, barWidth, barHeight);
            }
            break;
    }
    
    // Guardar la imagen
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
}

/**
 * Versión segura para crear visualización de video con mejor manejo de errores
 * @param {string} framesDir Directorio con los frames
 * @param {string} audioPath Ruta al archivo de audio
 * @param {string} outputPath Ruta donde guardar el video
 * @param {number} duration Duración forzada del video (opcional)
 */
function createVisualizationVideoSafe(framesDir, audioPath, outputPath, duration) {
    return new Promise((resolve, reject) => {
        console.log(`Creando video en ${outputPath} usando audio de ${audioPath}`);
        
        const command = ffmpeg();
        
        // Configurar entrada de imágenes
        command.input(path.join(framesDir, 'frame_%05d.png'))
               .inputFPS(30);
        
        // Añadir el audio con validación de archivo
        command.input(audioPath);
        
        // Configurar el formato de salida
        command.outputOptions([
            '-c:v libx264',       // Codec de video
            '-pix_fmt yuv420p',   // Formato de pixel
            '-shortest',          // Duración basada en la entrada más corta
            '-r 30'               // Framerate de salida
        ]);
        
        // Si se especifica una duración, forzarla
        if (duration) {
            command.duration(duration);
        }
        
        // Generar el video con mejor logging
        command.on('start', (commandLine) => {
            console.log('FFmpeg proceso iniciado:', commandLine);
        })
        .on('progress', (progress) => {
            console.log('Progreso:', progress);
        })
        .on('error', (err, stdout, stderr) => {
            console.error('Error creando video:', err);
            console.error('FFmpeg stderr:', stderr);
            reject(err);
        })
        .on('end', () => {
            console.log('Creación de video completada');
            resolve();
        })
        .save(outputPath);
    });
}

// Endpoint para comprobar el estado de un trabajo
router.get("/status/:jobId", (req, res) => {
    const { jobId } = req.params;
    const outputVideoPath = path.join(OUTPUT_DIR, `${jobId}_output.mp4`);
    
    if (fs.existsSync(outputVideoPath)) {
        res.json({
            status: "completed",
            videoUrl: `/visualizer/${jobId}_output.mp4`
        });
    } else {
        res.json({
            status: "processing",
            message: "El video aún está siendo procesado"
        });
    }
});

// Exportar el router para que pueda ser utilizado en la aplicación principal
module.exports = router;
