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

// Ruta principal: Si no hay parámetros específicos de la API, servir el HTML
router.get("/", async (req, res) => {
    // Verificar si es una solicitud para la API o para el visualizador
    const { audioUrl, type, color, bgColor, duration } = req.query;
    
    // Si no hay parámetros de API, servir el HTML
    if (!audioUrl && !req.query.json) {
        return res.sendFile(path.join(__dirname, "visualizer.html"));
    }
    
    // Si hay parámetros, continuar con la lógica de la API
    try {
        // Validar parámetros
        if (!audioUrl) {
            return res.status(400).json({ 
                error: "Debes proporcionar una URL de audio", 
                ejemplo: "/api/fun/audiovisualizer?audioUrl=https://ejemplo.com/audio.mp3&type=bars&color=3498db"
            });
        }

        // El resto del código de la API sigue igual...
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

        // Código original para procesar URL de audio...
        // [Aquí va el resto del código del endpoint GET original]

    } catch (error) {
        console.error("Error en la API de Visualizador de Audio:", error);
        res.status(500).json({ 
            error: "Error al procesar la visualización de audio", 
            detalle: error.message 
        });
    }
});

// El resto de los endpoints y funciones se mantienen igual
// Endpoint POST para subir archivos
router.post("/", express.raw({ 
    type: ['audio/mp3', 'audio/mpeg', 'video/mp4'],
    limit: '50mb'
}), async (req, res) => {
    // [Código original del endpoint POST]
});

// Endpoint para comprobar el estado
router.get("/status/:jobId", (req, res) => {
    // [Código original del endpoint status]
});

// [Resto de funciones auxiliares...]

// Exportar el router
module.exports = router;
