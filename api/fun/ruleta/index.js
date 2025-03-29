// api/fun/ruleta/index.js
const express = require("express");
const { createCanvas } = require("canvas");
const GIFEncoder = require("gifencoder");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();

// Configuración para guardar imágenes
const IMAGES_DIR = path.join(__dirname, "output");
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || "https://api.apikarl.com";
const PUBLIC_PATH = "/api/fun/ruleta/output";

// Crear directorio de salida si no existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Ruta para servir las imágenes guardadas
router.get("/output/:filename", (req, res) => {
    const filePath = path.join(IMAGES_DIR, req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "image/gif");
        res.setHeader("Cache-Control", "public, max-age=86400"); // Cache por 24 horas
        
        // Enviar el archivo
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "Archivo no encontrado" });
    }
});

// API principal para generar ruleta
router.get("/", async (req, res) => {
    try {
        const { colores, velocidad = "normal" } = req.query;

        // Validar parámetros
        if (!colores) {
            return res.status(400).json({ 
                error: "Se requiere el parámetro 'colores'", 
                ejemplo: "/api/fun/ruleta?colores=rojo,verde,azul&velocidad=normal" 
            });
        }

        // Procesar colores
        const listaColores = procesarColores(colores);
        
        if (listaColores.length === 0) {
            return res.status(400).json({ 
                error: "No se pudieron procesar los colores proporcionados", 
                ejemplo: "/api/fun/ruleta?colores=rojo,verde,azul&velocidad=normal" 
            });
        }

        // Validar velocidad
        const velocidadValidada = validarVelocidad(velocidad);

        // Generar GIF de ruleta
        const { gifBuffer, colorResultado } = await generarRuletaGIF(listaColores, velocidadValidada);
        
        // Generar nombre único para el archivo
        const hash = crypto.randomBytes(8).toString('hex');
        const filename = `ruleta-${hash}.gif`;
        const filePath = path.join(IMAGES_DIR, filename);
        
        // Guardar el GIF
        fs.writeFileSync(filePath, gifBuffer);
        
        // Construir URL pública
        const gifUrl = `${PUBLIC_URL_BASE}${PUBLIC_PATH}/${filename}`;
        
        // Enviar respuesta
        res.json({
            success: true,
            url: gifUrl,
            resultado: {
                color: colorResultado.nombre,
                codigo_color: colorResultado.hex
            },
            colores_ingresados: listaColores.map(c => c.nombre),
            velocidad: velocidadValidada
        });

    } catch (error) {
        console.error("Error generando ruleta:", error);
        res.status(500).json({ 
            error: "Error al generar la ruleta", 
            detalle: error.message 
        });
    }
});

/**
 * Procesa la cadena de colores del parámetro
 * @param {string} colores - Cadena de colores separados por comas
 * @returns {Array} - Array de objetos con nombre y código hex de cada color
 */
function procesarColores(colores) {
    const coloresPermitidos = {
        "rojo": "#FF0000",
        "verde": "#00FF00",
        "azul": "#0000FF",
        "amarillo": "#FFFF00",
        "naranja": "#FFA500",
        "morado": "#800080",
        "rosa": "#FFC0CB",
        "negro": "#000000",
        "blanco": "#FFFFFF",
        "gris": "#808080",
        "cyan": "#00FFFF",
        "magenta": "#FF00FF",
        "marron": "#A52A2A",
        "violeta": "#8A2BE2",
        "turquesa": "#40E0D0"
    };

    // Dividir la cadena de colores por comas
    const listaNombres = colores.split(',').map(c => c.trim().toLowerCase());
    
    // Convertir a objetos con nombre y hex
    return listaNombres
        .filter(nombre => coloresPermitidos[nombre]) // Solo colores válidos
        .map(nombre => ({
            nombre: nombre,
            hex: coloresPermitidos[nombre]
        }));
}

/**
 * Valida y normaliza la velocidad de la ruleta
 * @param {string} velocidad - Velocidad (lento, normal, veloz)
 * @returns {string} - Velocidad normalizada
 */
function validarVelocidad(velocidad) {
    const velocidadesValidas = ["lento", "normal", "veloz"];
    const velocidadLower = velocidad.toLowerCase().trim();
    
    if (!velocidadesValidas.includes(velocidadLower)) {
        return "normal"; // Velocidad por defecto
    }
    
    return velocidadLower;
}

/**
 * Genera un GIF animado de una ruleta girando
 * @param {Array} colores - Array de objetos con colores (nombre y hex)
 * @param {string} velocidad - Velocidad de giro
 * @returns {Object} - Buffer del GIF y color resultado
 */
async function generarRuletaGIF(colores, velocidad) {
    // Configuración basada en velocidad
    const configuracionVelocidad = {
        "lento": { 
            frames: 120, 
            delay: 10,
            vueltas: 2.5
        },
        "normal": { 
            frames: 90, 
            delay: 8,
            vueltas: 3.5
        },
        "veloz": { 
            frames: 60, 
            delay: 5,
            vueltas: 5
        }
    };
    
    const config = configuracionVelocidad[velocidad];
    
    // Dimensiones de la ruleta
    const width = 400;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 150;
    
    // Crear encoder para GIF
    const encoder = new GIFEncoder(width, height);
    
    // Inicializar buffer para guardar datos
    const bufferStream = new require('stream').PassThrough();
    encoder.createReadStream().pipe(bufferStream);
    
    encoder.start();
    encoder.setRepeat(0);  // 0 = repetir, -1 = no repetir
    encoder.setDelay(config.delay);  // Tiempo entre frames en ms
    encoder.setQuality(10); // Calidad de imagen (menor = mejor)
    
    // Crear canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Calcular ángulo por segmento
    const segmentos = colores.length;
    const anguloPorSegmento = (2 * Math.PI) / segmentos;
    
    // Seleccionar un índice aleatorio para el resultado
    const indiceResultado = Math.floor(Math.random() * segmentos);
    const colorResultado = colores[indiceResultado];
    
    // Calcular el ángulo final para que se detenga en el resultado
    // Añadimos un pequeño offset para que caiga en el centro del segmento
    const anguloFinal = 2 * Math.PI - (indiceResultado * anguloPorSegmento + anguloPorSegmento / 2);
    
    // Calcular la rotación total (vueltas completas + ángulo final)
    const rotacionTotal = (2 * Math.PI * config.vueltas) + anguloFinal;
    
    // Generar cada frame
    for (let frame = 0; frame < config.frames; frame++) {
        // Calcular ángulo actual con desaceleración
        const progreso = frame / (config.frames - 1); // 0 a 1
        
        // Aplicar desaceleración (empieza rápido y termina lento)
        // Usamos una función de easing: cubicInOut
        const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const progresoEaseOut = 1 - easeInOut(1 - progreso);
        
        const rotacionActual = progresoEaseOut * rotacionTotal;
        
        // Limpiar canvas
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        
        // Dibujar círculo exterior
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
        ctx.fillStyle = '#333333';
        ctx.fill();
        
        // Dibujar segmentos de la ruleta
        for (let i = 0; i < segmentos; i++) {
            const startAngle = i * anguloPorSegmento - Math.PI / 2 + rotacionActual;
            const endAngle = (i + 1) * anguloPorSegmento - Math.PI / 2 + rotacionActual;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            ctx.fillStyle = colores[i].hex;
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Añadir texto del color
            const anguloTexto = startAngle + (endAngle - startAngle) / 2;
            const textoX = centerX + (radius * 0.7) * Math.cos(anguloTexto);
            const textoY = centerY + (radius * 0.7) * Math.sin(anguloTexto);
            
            ctx.save();
            ctx.translate(textoX, textoY);
            ctx.rotate(anguloTexto + Math.PI/2);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(colores[i].nombre, 0, 0);
            ctx.restore();
        }
        
        // Dibujar centro de la ruleta
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
        ctx.fillStyle = '#333333';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Dibujar flecha indicadora
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius - 10);
        ctx.lineTo(centerX - 15, centerY - radius - 30);
        ctx.lineTo(centerX + 15, centerY - radius - 30);
        ctx.closePath();
        ctx.fillStyle = '#FF0000';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Añadir frame al GIF
        encoder.addFrame(ctx);
    }
    
    // Finalizar el GIF
    encoder.finish();
    
    // Recolectar datos del stream
    return new Promise((resolve, reject) => {
        const chunks = [];
        bufferStream.on('data', chunk => chunks.push(chunk));
        bufferStream.on('end', () => {
            const gifBuffer = Buffer.concat(chunks);
            resolve({ gifBuffer, colorResultado });
        });
        bufferStream.on('error', reject);
    });
}

// Limpieza periódica de archivos (cada 12 horas)
setInterval(() => {
    try {
        const files = fs.readdirSync(IMAGES_DIR);
        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(IMAGES_DIR, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtimeMs;
            
            // Eliminar archivos mayores a 24 horas
            if (fileAge > 24 * 60 * 60 * 1000) {
                fs.unlinkSync(filePath);
                console.log(`Ruleta eliminada: ${file}`);
            }
        });
    } catch (error) {
        console.error("Error en limpieza de archivos:", error);
    }
}, 12 * 60 * 60 * 1000);

module.exports = router;
