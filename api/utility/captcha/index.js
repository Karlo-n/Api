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
    // Caracteres sin ambigüedades (sin 0/O, 1/l/I, etc.)
    const caracteres = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
    let codigo = '';
    
    for (let i = 0; i < longitud; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    
    // Alternar entre mayúsculas y minúsculas para mejor legibilidad
    // pero manteniendo la complejidad
    let codigoFinal = '';
    for (let i = 0; i < codigo.length; i++) {
        // 70% probabilidad de mantener el caso original, 30% de cambiarlo
        // Esto mantiene aleatoriedad pero mejora la distribución visual
        const char = codigo[i];
        if (Math.random() > 0.7) {
            if (char === char.toUpperCase()) {
                codigoFinal += char.toLowerCase();
            } else {
                codigoFinal += char.toUpperCase();
            }
        } else {
            codigoFinal += char;
        }
    }
    
    return codigoFinal;
}

/**
 * Genera una imagen CAPTCHA con el código dado, estilo Google reCAPTCHA
 */
async function generarImagenCaptcha(codigo, dificultad) {
    // Configuración del canvas según dificultad
    const config = getConfiguracionPorDificultad(dificultad, codigo.length);
    
    // Aumentar dimensiones para añadir el diseño de Google
    const captchaWidth = config.width;
    const captchaHeight = config.height;
    const paddingX = 20;
    const paddingY = 20;
    const headerHeight = 40;
    const footerHeight = 40;
    
    // Dimensiones totales del canvas
    const totalWidth = captchaWidth + (paddingX * 2);
    const totalHeight = captchaHeight + headerHeight + footerHeight + (paddingY * 2);
    
    // Crear canvas
    const canvas = Canvas.createCanvas(totalWidth, totalHeight);
    const ctx = canvas.getContext('2d');
    
    // Fondo principal (blanco)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar borde del CAPTCHA
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Header con logo y texto
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, headerHeight);
    
    // Línea divisoria del header
    ctx.strokeStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.moveTo(0, headerHeight);
    ctx.lineTo(canvas.width, headerHeight);
    ctx.stroke();
    
    // Logo de "CAPTCHA" (simulado)
    ctx.fillStyle = '#4285f4'; // Azul de Google
    ctx.font = 'bold 20px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText('CAPTCHA', paddingX, headerHeight / 2);
    
    // Área del CAPTCHA con fondo gris claro
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(paddingX, headerHeight + paddingY, captchaWidth, captchaHeight);
    
    // Guardar contexto para el área del CAPTCHA
    ctx.save();
    ctx.translate(paddingX, headerHeight + paddingY);
    
    // Agregar un borde con sombra sutil al área del CAPTCHA
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.strokeStyle = '#d8d8d8';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, captchaWidth, captchaHeight);
    ctx.shadowColor = 'transparent';
    
    // Dibujar ruido de fondo
    dibujarRuidoFondo(ctx, captchaWidth, captchaHeight, config.noiseLevel);
    
    // Dibujar grid/patrón de fondo estilo reCAPTCHA
    dibujarPatronFondo(ctx, captchaWidth, captchaHeight, dificultad);
    
    // Texto principal
    ctx.font = `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
    ctx.textBaseline = 'middle';
    
    // Dibujar cada carácter con estilo aleatorio
    let xPos = config.letterSpacing;
    for (let i = 0; i < codigo.length; i++) {
        // Color aleatorio
        ctx.fillStyle = getRandomColor(config.textColors);
        
        // Añadir sombra al texto para más profundidad
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Rotación aleatoria
        ctx.save();
        const rotacion = (Math.random() - 0.5) * config.rotationAngle;
        const charWidth = ctx.measureText(codigo[i]).width;
        
        // Posición con espacio aleatorio
        xPos += Math.random() * 5;
        const yPos = captchaHeight / 2 + (Math.random() - 0.5) * config.verticalOffset;
        
        // Transformación para rotación
        ctx.translate(xPos + charWidth / 2, yPos);
        ctx.rotate(rotacion);
        
        // Dibujar carácter con efecto 3D sutil
        if (dificultad === "alta") {
            // Efecto 3D para dificultad alta
            const shadowColor = 'rgba(0, 0, 0, 0.4)';
            for (let d = 1; d <= 2; d++) {
                ctx.fillStyle = shadowColor;
                ctx.fillText(codigo[i], -charWidth / 2 + d, d);
            }
        }
        
        // Texto principal
        ctx.fillStyle = getRandomColor(config.textColors);
        ctx.fillText(codigo[i], -charWidth / 2, 0);
        ctx.restore();
        
        // Avanzar posición
        xPos += charWidth + config.letterSpacing;
    }
    
    // Añadir líneas para mayor dificultad
    if (dificultad !== "baja") {
        dibujarLineasConfusion(ctx, captchaWidth, captchaHeight, config.lines);
    }
    
    // Restaurar contexto
    ctx.restore();
    
    // Footer con "Verificar que eres humano"
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);
    
    // Línea divisoria del footer
    ctx.strokeStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - footerHeight);
    ctx.lineTo(canvas.width, canvas.height - footerHeight);
    ctx.stroke();
    
    // Texto del footer
    ctx.fillStyle = '#555555';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText('Verificar que eres humano', paddingX, canvas.height - (footerHeight / 2));
    
    // Ícono de recarga simulado
    ctx.fillStyle = '#4285f4';
    ctx.beginPath();
    const reloadX = canvas.width - paddingX - 15;
    const reloadY = canvas.height - (footerHeight / 2);
    const reloadRadius = 8;
    ctx.arc(reloadX, reloadY, reloadRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Símbolo de recarga
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(reloadX, reloadY, reloadRadius - 3, 0, Math.PI * 1.5);
    ctx.stroke();
    
    // Flecha de recarga
    ctx.beginPath();
    ctx.moveTo(reloadX + 3, reloadY - 5);
    ctx.lineTo(reloadX + 3, reloadY);
    ctx.lineTo(reloadX, reloadY - 2);
    ctx.stroke();
    
    // Convertir canvas a buffer PNG
    return canvas.toBuffer('image/png');
}

/**
 * Devuelve configuración según nivel de dificultad
 */
function getConfiguracionPorDificultad(dificultad, longitudCodigo) {
    // Base width calculado según longitud del código (ajustado para el nuevo diseño)
    const baseWidth = 36 * longitudCodigo;
    
    const configuraciones = {
        baja: {
            width: baseWidth,
            height: 80,
            fontSize: 38,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f5f5f5',
            textColors: ['#4285f4', '#ea4335', '#fbbc05', '#34a853'], // Colores de Google
            letterSpacing: 8,
            paddingX: 15,
            rotationAngle: 0.15, // Rotación leve
            verticalOffset: 6,
            noiseLevel: 40, // Menos ruido
            lines: 2 // Pocas líneas
        },
        media: {
            width: baseWidth,
            height: 80,
            fontSize: 40,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f0f0f0',
            textColors: ['#4285f4', '#ea4335', '#fbbc05', '#34a853', '#1a73e8'], // Colores de Google expandidos
            letterSpacing: 6,
            paddingX: 15,
            rotationAngle: 0.3, // Rotación media
            verticalOffset: 10,
            noiseLevel: 80, // Ruido medio
            lines: 4 // Líneas medias
        },
        alta: {
            width: baseWidth + 20, // Un poco más ancho para mayor confusión
            height: 90,
            fontSize: 42,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#ebebeb',
            textColors: ['#4285f4', '#ea4335', '#fbbc05', '#34a853', '#1a73e8', '#185abc'], // Más variaciones
            letterSpacing: 4,
            paddingX: 20,
            rotationAngle: 0.45, // Rotación fuerte
            verticalOffset: 15,
            noiseLevel: 120, // Mucho ruido
            lines: 6 // Muchas líneas
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
    // Colores más suaves y en el estilo de Google
    const colores = [
        'rgba(66, 133, 244, 0.4)',  // Azul Google
        'rgba(234, 67, 53, 0.4)',   // Rojo Google
        'rgba(251, 188, 5, 0.4)',   // Amarillo Google
        'rgba(52, 168, 83, 0.4)'    // Verde Google
    ];
    
    for (let i = 0; i < cantidad; i++) {
        const color = colores[Math.floor(Math.random() * colores.length)];
        
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.random() * 1.5 + 0.5;
        
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
 * Dibuja patrón de fondo similar al diseño de Google reCAPTCHA
 */
function dibujarPatronFondo(ctx, width, height, dificultad) {
    // Patrón de cuadrícula sutil
    const tamañoCelda = dificultad === "alta" ? 8 : dificultad === "media" ? 10 : 12;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 0.5;
    
    // Líneas horizontales
    for (let y = 0; y <= height; y += tamañoCelda) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Líneas verticales
    for (let x = 0; x <= width; x += tamañoCelda) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Añadir algunos círculos decorativos sutiles (estilo reCAPTCHA)
    const numCirculos = dificultad === "alta" ? 5 : dificultad === "media" ? 3 : 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    
    for (let i = 0; i < numCirculos; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radio = Math.random() * 15 + 5;
        
        ctx.beginPath();
        ctx.arc(x, y, radio, 0, Math.PI * 2);
        ctx.fill();
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
