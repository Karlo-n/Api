// api/utility/captcha/index.js
const express = require("express");
const Canvas = require("canvas");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Configuración para guardar imágenes
const IMAGES_DIR = path.join(__dirname, "output");
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || "https://api.apikarl.com";
const PUBLIC_PATH = "/api/utility/captcha/output";

// Crear directorio de salida si no existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Ruta para servir las imágenes guardadas
router.get("/output/:code", (req, res) => {
    const filePath = path.join(IMAGES_DIR, `${req.params.code}.png`);
    
    if (fs.existsSync(filePath)) {
        // Configurar headers para la imagen
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=3600"); // Cache por 1 hora
        
        // Enviar el archivo
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "CAPTCHA no encontrado o expirado" });
    }
});

/**
 * API CAPTCHA - Genera imágenes de verificación con código aleatorio
 * Siempre devuelve un JSON con la URL y el código
 */
router.get("/", async (req, res) => {
    try {
        const { dificultad = "media", longitud = 6 } = req.query;

        // Validar parámetros
        const nivelDificultad = validarDificultad(dificultad);
        const longitudCodigo = validarLongitud(longitud);

        console.log(`Generando CAPTCHA: dificultad=${nivelDificultad}, longitud=${longitudCodigo}`);

        // Generar el código aleatorio
        const codigo = generarCodigo(longitudCodigo);
        
        // Generar imagen CAPTCHA
        const captchaBuffer = await generarImagenCaptcha(codigo, nivelDificultad);
        
        // Guardar la imagen con nombre de archivo = código
        const filename = `${codigo}.png`;
        const filePath = path.join(IMAGES_DIR, filename);
        
        fs.writeFileSync(filePath, captchaBuffer);
        
        // Generar URL pública
        const captchaUrl = `${PUBLIC_URL_BASE}${PUBLIC_PATH}/${codigo}`;
        
        // Programar eliminación del archivo después de 10 minutos
        setTimeout(() => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`CAPTCHA eliminado: ${codigo}`);
            }
        }, 10 * 60 * 1000); // 10 minutos
        
        // Siempre devolver respuesta JSON
        res.json({
            success: true,
            codigo: codigo,
            url: captchaUrl,
            dificultad: nivelDificultad,
            longitud: longitudCodigo,
            expira_en: "10 minutos"
        });

    } catch (error) {
        console.error("Error generando CAPTCHA:", error);
        res.status(500).json({ 
            error: "Error al generar CAPTCHA",
            detalle: error.message
        });
    }
});

/**
 * Valida y normaliza el nivel de dificultad
 */
function validarDificultad(dificultad) {
    const niveles = ["baja", "media", "alta"];
    const nivel = dificultad.toLowerCase();
    
    return niveles.includes(nivel) ? nivel : "media";
}

/**
 * Valida y normaliza la longitud del código
 */
function validarLongitud(longitud) {
    const valor = parseInt(longitud);
    
    if (isNaN(valor) || valor < 4) {
        return 6; // Valor por defecto
    } else if (valor > 10) {
        return 10; // Máximo permitido
    }
    
    return valor;
}

/**
 * Genera un código alfanumérico aleatorio
 */
function generarCodigo(longitud) {
    const caracteres = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz'; // Sin caracteres ambiguos
    let codigo = '';
    
    for (let i = 0; i < longitud; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    
    return codigo;
}

/**
 * Genera una imagen CAPTCHA con el código dado
 */
async function generarImagenCaptcha(codigo, dificultad) {
    // Configuración del canvas según dificultad
    const config = getConfiguracionPorDificultad(dificultad, codigo.length);
    
    // Crear canvas
    const canvas = Canvas.createCanvas(config.width, config.height);
    const ctx = canvas.getContext('2d');
    
    // Fondo
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar ruido de fondo
    dibujarRuidoFondo(ctx, canvas.width, canvas.height, config.noiseLevel);
    
    // Texto principal
    ctx.font = `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
    ctx.textBaseline = 'middle';

    // Dibujar cada carácter con estilo aleatorio
    let xPos = config.paddingX;
    for (let i = 0; i < codigo.length; i++) {
        // Color aleatorio
        ctx.fillStyle = getRandomColor(config.textColors);
        
        // Rotación aleatoria
        ctx.save();
        const rotacion = (Math.random() - 0.5) * config.rotationAngle;
        const charWidth = ctx.measureText(codigo[i]).width;
        
        // Posición con espacio aleatorio
        xPos += Math.random() * 5;
        const yPos = config.height / 2 + (Math.random() - 0.5) * config.verticalOffset;
        
        // Transformación para rotación
        ctx.translate(xPos + charWidth / 2, yPos);
        ctx.rotate(rotacion);
        ctx.fillText(codigo[i], -charWidth / 2, 0);
        ctx.restore();
        
        // Avanzar posición
        xPos += charWidth + config.letterSpacing;
    }
    
    // Añadir líneas para mayor dificultad
    if (dificultad !== "baja") {
        dibujarLineasConfusion(ctx, canvas.width, canvas.height, config.lines);
    }
    
    // Convertir canvas a buffer PNG
    return canvas.toBuffer('image/png');
}

/**
 * Devuelve configuración según nivel de dificultad
 */
function getConfiguracionPorDificultad(dificultad, longitudCodigo) {
    // Base width calculado según longitud del código
    const baseWidth = 40 * longitudCodigo;
    
    const configuraciones = {
        baja: {
            width: baseWidth,
            height: 100,
            fontSize: 40,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f0f0f0',
            textColors: ['#3366CC', '#CC3366', '#66CC33', '#CC6633'],
            letterSpacing: 8,
            paddingX: 15,
            rotationAngle: 0.2, // Rotación leve
            verticalOffset: 8,
            noiseLevel: 50, // Menos ruido
            lines: 2 // Pocas líneas
        },
        media: {
            width: baseWidth,
            height: 100,
            fontSize: 42,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#e8e8e8',
            textColors: ['#2255BB', '#BB2255', '#55BB22', '#BB5522', '#22BBBB'],
            letterSpacing: 6,
            paddingX: 15,
            rotationAngle: 0.4, // Rotación media
            verticalOffset: 12,
            noiseLevel: 100, // Ruido medio
            lines: 5 // Líneas medias
        },
        alta: {
            width: baseWidth + 20, // Un poco más ancho para mayor confusión
            height: 120,
            fontSize: 44,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#e0e0e0',
            textColors: ['#114499', '#991144', '#449911', '#994411', '#119944'],
            letterSpacing: 4,
            paddingX: 20,
            rotationAngle: 0.6, // Rotación fuerte
            verticalOffset: 18,
            noiseLevel: 150, // Mucho ruido
            lines: 8 // Muchas líneas
        }
    };
    
    return configuraciones[dificultad];
}

/**
 * Dibuja puntos aleatorios en el fondo
 */
function dibujarRuidoFondo(ctx, width, height, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radio = Math.random() * 1.5;
        const color = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
        
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(x, y, radio, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Dibuja líneas para dificultar reconocimiento automatizado
 */
function dibujarLineasConfusion(ctx, width, height, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        const color = `rgba(${Math.floor(Math.random() * 100)}, 
                            ${Math.floor(Math.random() * 100)}, 
                            ${Math.floor(Math.random() * 100)}, 
                            ${Math.random() * 0.5})`;
        
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.random() * 2;
        
        // Líneas curvas aleatorias para mayor dificultad
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        const endX = Math.random() * width;
        const endY = Math.random() * height;
        const controlX1 = Math.random() * width;
        const controlY1 = Math.random() * height;
        const controlX2 = Math.random() * width;
        const controlY2 = Math.random() * height;
        
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
        ctx.stroke();
    }
}

/**
 * Devuelve un color aleatorio de la lista proporcionada
 */
function getRandomColor(colors) {
    return colors[Math.floor(Math.random() * colors.length)];
}

// Limpieza periódica de imágenes antiguas (cada hora)
setInterval(() => {
    try {
        const files = fs.readdirSync(IMAGES_DIR);
        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(IMAGES_DIR, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtimeMs;
            
            // Eliminar archivos mayores a 15 minutos
            if (fileAge > 15 * 60 * 1000) {
                fs.unlinkSync(filePath);
                console.log(`CAPTCHA eliminado: ${file}`);
            }
        });
    } catch (error) {
        console.error("Error en limpieza de archivos CAPTCHA:", error);
    }
}, 60 * 60 * 1000); // Cada hora

module.exports = router;
