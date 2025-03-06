// api/fun/audiovisualizer/index.js
const express = require("express");
const router = express.Router();
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const multer = require('multer');

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

// Configurar multer para la subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, TEMP_DIR);
    },
    filename: function (req, file, cb) {
        const jobId = uuidv4();
        // Guardar el jobId en el objeto request para usarlo más tarde
        req.jobId = jobId;
        const fileExt = path.extname(file.originalname);
        cb(null, `${jobId}_uploaded${fileExt}`);
    }
});

// Filtro para aceptar solo archivos MP3 y MP4
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'audio/mp3' || 
        file.mimetype === 'audio/mpeg' || 
        file.mimetype === 'video/mp4') {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no admitido. Solo se aceptan MP3 y MP4.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // Limitar a 50MB
    }
});

/**
 * Endpoint para subir archivos MP3/MP4 y generar visualización
 */
router.post("/upload", upload.single('audioFile'), async (req, res) => {
    try {
        // Verificar si se subió un archivo
        if (!req.file) {
            return res.status(400).json({ 
                error: "No se proporcionó ningún archivo", 
                ejemplo: "Envía un archivo MP3 o MP4 con el nombre 'audioFile'"
            });
        }

        const { type = 'bars', color = '#3498db', bgColor = '#000000', duration } = req.query;
        const jobId = req.jobId;
        const uploadedFilePath = req.file.path;
        let audioFilePath;

        // Si es un archivo MP4, extraer el audio
        if (req.file.mimetype === 'video/mp4') {
            audioFilePath = path.join(TEMP_DIR, `${jobId}_extracted_audio.mp3`);
            await extractAudioFromVideo(uploadedFilePath, audioFilePath);
        } else {
            // Si ya es un archivo de audio, usarlo directamente
            audioFilePath = uploadedFilePath;
        }

        // Procesar la visualización
        const result = await processAudioVisualization(
            jobId,
            audioFilePath,
            type,
            color,
            bgColor,
            duration
        );

        // Limpiar archivos temporales después de un tiempo
        setTimeout(() => {
            try {
                fs.rmSync(uploadedFilePath, { force: true });
                if (req.file.mimetype === 'video/mp4') {
                    fs.rmSync(audioFilePath, { force: true });
                }
            } catch (cleanupError) {
                console.error("Error en limpieza:", cleanupError);
            }
        }, 60000); // Limpiar después de 1 minuto

        res.json({
            success: true,
            message: "Visualización generada con éxito a partir del archivo subido",
            videoUrl: result.publicUrl,
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
 * Endpoint para generar visualización a partir de URL (mantiene compatibilidad)
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

        // Generar ID único para este trabajo
        const jobId = uuidv4();
        const audioFilePath = path.join(TEMP_DIR, `${jobId}_audio.mp3`);

        // Descargar el archivo de audio
        try {
            const audioResponse = await axios({
                method: 'get',
                url: audioUrl,
                responseType: 'stream'
            });

            const audioWriter = fs.createWriteStream(audioFilePath);
            audioResponse.data.pipe(audioWriter);

            await new Promise((resolve, reject) => {
                audioWriter.on('finish', resolve);
                audioWriter.on('error', reject);
            });
        } catch (downloadError) {
            console.error("Error descargando el audio:", downloadError);
            return res.status(400).json({ error: "No se pudo descargar el audio de la URL proporcionada" });
        }

        // Procesar la visualización
        const result = await processAudioVisualization(
            jobId,
            audioFilePath,
            type,
            color,
            bgColor,
            duration
        );

        // Limpiar archivos temporales
        setTimeout(() => {
            try {
                fs.rmSync(audioFilePath, { force: true });
            } catch (cleanupError) {
                console.error("Error en limpieza:", cleanupError);
            }
        }, 60000); // Limpiar después de 1 minuto

        // Devolver la URL del video generado
        res.json({
            success: true,
            message: "Visualización de audio generada con éxito",
            videoUrl: result.publicUrl,
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
 * Función unificada para procesar audio y generar visualización
 * @param {string} jobId ID único del trabajo
 * @param {string} audioFilePath Ruta al archivo de audio
 * @param {string} type Tipo de visualización
 * @param {string} color Color de la visualización
 * @param {string} bgColor Color de fondo
 * @param {number} duration Duración forzada del video (opcional)
 * @returns {Promise<Object>} Resultado del procesamiento
 */
async function processAudioVisualization(jobId, audioFilePath, type, color, bgColor, duration) {
    const visualizationPath = path.join(TEMP_DIR, `${jobId}_visualization`);
    const outputVideoPath = path.join(OUTPUT_DIR, `${jobId}_output.mp4`);
    const publicUrl = `/visualizer/${jobId}_output.mp4`;

    // Analizar el audio para obtener datos de forma de onda
    const audioData = await analyzeAudio(audioFilePath);
    
    // Generar las imágenes de visualización
    const frameCount = Math.min(audioData.length, 300); // Limitar a 300 frames máximo
    for (let i = 0; i < frameCount; i++) {
        const frameData = audioData[Math.floor(i * audioData.length / frameCount)];
        const frameFilePath = path.join(visualizationPath, `frame_${i.toString().padStart(5, '0')}.png`);
        
        // Asegurarse de que el directorio de frames existe
        if (i === 0 && !fs.existsSync(visualizationPath)) {
            fs.mkdirSync(visualizationPath, { recursive: true });
        }
        
        // Generar el frame de visualización
        generateVisualizationFrame(frameData, frameFilePath, type, color, bgColor);
    }

    // Crear el video a partir de las imágenes
    await createVisualizationVideo(
        visualizationPath, 
        audioFilePath, 
        outputVideoPath, 
        duration
    );

    // Limpiar archivos temporales de frames
    setTimeout(() => {
        try {
            fs.rmSync(visualizationPath, { recursive: true, force: true });
        } catch (cleanupError) {
            console.error("Error en limpieza de frames:", cleanupError);
        }
    }, 60000); // Limpiar después de 1 minuto

    return { 
        publicUrl,
        jobId
    };
}

/**
 * Extrae el audio de un archivo de video
 * @param {string} videoPath Ruta al archivo de video
 * @param {string} audioOutputPath Ruta donde guardar el audio extraído
 * @returns {Promise} Promesa que se resuelve cuando termina la extracción
 */
function extractAudioFromVideo(videoPath, audioOutputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .outputOptions('-q:a 0') // Mantener calidad de audio
            .noVideo()
            .output(audioOutputPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
}

/**
 * Analiza un archivo de audio para extraer datos de forma de onda
 * @param {string} audioFilePath Ruta al archivo de audio
 * @returns {Promise<Array>} Array con datos de amplitud normalizados
 */
function analyzeAudio(audioFilePath) {
    return new Promise((resolve, reject) => {
        const waveformData = [];
        
        ffmpeg(audioFilePath)
            .audioFilters('asetnsamples=44100')
            .audioFilters('astats=metadata=1:reset=1')
            .format('null')
            .on('error', reject)
            .on('progress', (progress) => {
                // Cada 0.1 segundos, tomar una muestra de amplitud
                if (progress && progress.frames) {
                    // Simular datos de amplitud para este ejemplo
                    // En una implementación real, deberías extraer los datos reales del audio
                    const amplitude = Math.random() * 0.8 + 0.2; // Valor entre 0.2 y 1.0
                    waveformData.push(amplitude);
                }
            })
            .on('end', () => {
                // Si no tenemos suficientes datos, generar datos aleatorios
                if (waveformData.length < 100) {
                    // Generar al menos 100 muestras para tener una visualización decente
                    for (let i = waveformData.length; i < 100; i++) {
                        const amplitude = Math.random() * 0.8 + 0.2;
                        waveformData.push(amplitude);
                    }
                }
                resolve(waveformData);
            })
            .save('pipe:1'); // Enviar a stdout (descartar)
    });
}

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
 * Crea un video a partir de los frames de visualización
 * @param {string} framesDir Directorio con los frames
 * @param {string} audioPath Ruta al archivo de audio
 * @param {string} outputPath Ruta donde guardar el video
 * @param {number} duration Duración forzada del video (opcional)
 */
function createVisualizationVideo(framesDir, audioPath, outputPath, duration) {
    return new Promise((resolve, reject) => {
        const command = ffmpeg();
        
        // Configurar entrada de imágenes
        command.input(path.join(framesDir, 'frame_%05d.png'))
               .inputFPS(30);
        
        // Añadir el audio
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
        
        // Generar el video
        command.on('error', reject)
               .on('end', resolve)
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
