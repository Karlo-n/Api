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
            frames: 180, 
            delay: 8,
            vueltas: 2.5,
            framesFinales: 20
        },
        "normal": { 
            frames: 150, 
            delay: 6,
            vueltas: 3.5,
            framesFinales: 15
        },
        "veloz": { 
            frames: 120, 
            delay: 4,
            vueltas: 5,
            framesFinales: 10
        }
    };
    
    const config = configuracionVelocidad[velocidad];
    
    // Dimensiones de la ruleta
    const width = 500;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 180;
    
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
    
    // Calcular frames totales (incluyendo los frames finales para mostrar resultado)
    const framesTotal = config.frames + config.framesFinales;
    
    // Generar cada frame
    for (let frame = 0; frame < framesTotal; frame++) {
        // Calcular si estamos en los frames finales (mostrando resultado)
        const esFrameFinal = frame >= config.frames;
        
        // Calcular ángulo actual con desaceleración
        const progreso = Math.min(1, frame / (config.frames - 1)); // 0 a 1, no supera 1
        
        // Aplicar desaceleración (empieza rápido y termina lento)
        // Usamos una función de easing más suave: quintOut para mejor desaceleración
        const easeOut = t => 1 - Math.pow(1 - t, 5);
        const progresoEaseOut = easeOut(progreso);
        
        const rotacionActual = progresoEaseOut * rotacionTotal;
        
        // Limpiar canvas con un fondo oscuro estilo casino
        const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, height);
        bgGradient.addColorStop(0, '#1a1a1a');
        bgGradient.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Dibujar borde exterior lujoso (dorado)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 25, 0, 2 * Math.PI);
        ctx.fillStyle = '#2a1f0e';
        ctx.fill();
        
        // Dibujar borde dorado brillante
        const borderGradient = ctx.createRadialGradient(
            centerX, centerY, radius + 15, 
            centerX, centerY, radius + 25
        );
        borderGradient.addColorStop(0, '#d4af37');
        borderGradient.addColorStop(0.5, '#f9df7b');
        borderGradient.addColorStop(1, '#d4af37');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 20, 0, 2 * Math.PI);
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 10;
        ctx.stroke();
        
        // Fondo de la ruleta (más oscuro que el fondo general)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#0e0e0e';
        ctx.fill();
        
        // Dibujar segmentos de la ruleta estilo casino
        for (let i = 0; i < segmentos; i++) {
            const startAngle = i * anguloPorSegmento - Math.PI / 2 + rotacionActual;
            const endAngle = (i + 1) * anguloPorSegmento - Math.PI / 2 + rotacionActual;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            // Color del segmento (colores alternos para algunos diseños)
            ctx.fillStyle = colores[i].hex;
            ctx.fill();
            
            // Borde metálico de los segmentos
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Añadir números y textos como en ruleta de casino
            const anguloTexto = startAngle + (endAngle - startAngle) / 2;
            const numeroRadius = radius * 0.8; // Posición del número
            const textoRadius = radius * 0.5; // Posición del texto
            
            // Dibujar número del segmento (como en ruletas de casino)
            const numX = centerX + numeroRadius * Math.cos(anguloTexto);
            const numY = centerY + numeroRadius * Math.sin(anguloTexto);
            
            ctx.save();
            ctx.translate(numX, numY);
            ctx.rotate(anguloTexto + Math.PI/2);
            
            // Círculo blanco para el número
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Número
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((i+1).toString(), 0, 0);
            ctx.restore();
            
            // Añadir nombre del color
            const textoX = centerX + textoRadius * Math.cos(anguloTexto);
            const textoY = centerY + textoRadius * Math.sin(anguloTexto);
            
            ctx.save();
            ctx.translate(textoX, textoY);
            ctx.rotate(anguloTexto + Math.PI/2);
            
            // Texto con borde para mejor legibilidad
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';
            ctx.strokeText(colores[i].nombre, 0, 0);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(colores[i].nombre, 0, 0);
            
            ctx.restore();
            
            // Dibujar pequeños diamantes en los bordes entre segmentos
            const diamondRadius = radius + 10;
            const diamondX = centerX + diamondRadius * Math.cos(startAngle);
            const diamondY = centerY + diamondRadius * Math.sin(startAngle);
            
            ctx.save();
            ctx.translate(diamondX, diamondY);
            ctx.rotate(startAngle + Math.PI/4);
            
            // Diamante brillante
            ctx.beginPath();
            ctx.rect(-3, -3, 6, 6);
            ctx.fillStyle = '#f9df7b'; // Dorado
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.restore();
        }
        
        // Dibujar centro de la ruleta (más elaborado estilo casino)
        // Círculo exterior
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
        const centerGradient = ctx.createRadialGradient(
            centerX, centerY, 10,
            centerX, centerY, 40
        );
        centerGradient.addColorStop(0, '#d4af37');
        centerGradient.addColorStop(1, '#8b6914');
        ctx.fillStyle = centerGradient;
        ctx.fill();
        
        // Círculo interior
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        ctx.fillStyle = '#0e0e0e';
        ctx.fill();
        ctx.strokeStyle = '#f9df7b';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Logo o texto en el centro
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RULETA', centerX, centerY);
        
        // Dibujar marcador/flecha de la ruleta (más ornamentado)
        // Triángulo base
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius - 15);
        ctx.lineTo(centerX - 20, centerY - radius - 40);
        ctx.lineTo(centerX + 20, centerY - radius - 40);
        ctx.closePath();
        
        // Gradiente para el marcador
        const markerGradient = ctx.createLinearGradient(
            centerX, centerY - radius - 40,
            centerX, centerY - radius - 15
        );
        markerGradient.addColorStop(0, '#d4af37');
        markerGradient.addColorStop(0.5, '#f9df7b');
        markerGradient.addColorStop(1, '#d4af37');
        
        ctx.fillStyle = markerGradient;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Añadir brillo al marcador
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY - radius - 35);
        ctx.lineTo(centerX + 10, centerY - radius - 35);
        ctx.lineTo(centerX, centerY - radius - 25);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        
        // Mostrar texto de resultado en los frames finales
        if (esFrameFinal) {
            // Crear efecto de parpadeo/destello para llamar la atención
            const intensidadDestello = Math.sin((frame - config.frames) / 2) * 0.5 + 0.5;
            
            // Dibujar banner con resultado
            const bannerHeight = 80;
            const bannerY = height - bannerHeight - 20;
            
            // Fondo semitransparente con borde dorado
            ctx.fillStyle = `rgba(0, 0, 0, 0.8)`;
            ctx.fillRect(20, bannerY, width - 40, bannerHeight);
            
            // Borde brillante dorado
            const bannerGradient = ctx.createLinearGradient(20, bannerY, width - 20, bannerY + bannerHeight);
            bannerGradient.addColorStop(0, '#d4af37');
            bannerGradient.addColorStop(0.5, '#f9df7b');
            bannerGradient.addColorStop(1, '#d4af37');
            
            ctx.strokeStyle = bannerGradient;
            ctx.lineWidth = 4;
            ctx.strokeRect(20, bannerY, width - 40, bannerHeight);
            
            // Texto de resultado con el color correcto del resultado
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Texto con sombra
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            // Mostrar texto con destello y con el COLOR CORRECTO
            ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + intensidadDestello * 0.2})`;
            ctx.fillText(`¡TOCÓ ${colorResultado.nombre.toUpperCase()}!`, centerX, bannerY + bannerHeight/2);
            ctx.shadowColor = 'transparent';
            
            // Agregar destello alrededor del resultado
            ctx.beginPath();
            ctx.arc(centerX, bannerY + bannerHeight/2, 140, 0, 2 * Math.PI);
            const gradiente = ctx.createRadialGradient(centerX, bannerY + bannerHeight/2, 70, centerX, bannerY + bannerHeight/2, 140);
            
            // Usar color del resultado para el destello
            const colorBase = colorResultado.hex;
            gradiente.addColorStop(0, `rgba(255, 255, 255, ${0.3 * intensidadDestello})`);
            gradiente.addColorStop(0.5, `${colorBase}50`);
            gradiente.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradiente;
            ctx.fill();
        }
        
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
