// api/fun/encuesta/index.js
const express = require("express");
const { createCanvas } = require("canvas");
const router = express.Router();

/**
 * API de Encuestas - Genera una imagen que simula una encuesta visual estilizada
 * Permite especificar título, opciones, colores y porcentajes
 */
router.get("/", async (req, res) => {
    try {
        const { titulo = "Encuesta", texto, color, porcentaje } = req.query;

        // Validar que se proporcionaron los parámetros necesarios
        if (!texto || !porcentaje) {
            return res.status(400).json({ 
                error: "Faltan parámetros obligatorios",
                obligatorios: ["texto", "porcentaje"],
                ejemplo: "/api/fun/encuesta?titulo=¿Cuál prefieres?&texto=Opción 1,Opción 2,Opción 3&color=azul,rojo,verde&porcentaje=25,45,30"
            });
        }

        // Procesar los datos de la encuesta
        const opciones = procesarParametrosEncuesta(texto, color, porcentaje);

        // Generar la imagen de encuesta
        const encuestaBuffer = await generarImagenEncuesta(titulo, opciones);

        // Enviar la imagen
        res.setHeader('Content-Type', 'image/png');
        res.send(encuestaBuffer);

    } catch (error) {
        console.error("Error al generar encuesta:", error);
        res.status(500).json({ 
            error: "Error al generar la imagen de la encuesta",
            detalles: error.message
        });
    }
});

/**
 * Procesa los parámetros de la encuesta para crear las opciones
 */
function procesarParametrosEncuesta(textoParam, colorParam, porcentajeParam) {
    // Dividir los parámetros separados por comas
    const textos = textoParam.split(',');
    
    // Dividir colores (si se proporcionaron)
    const colores = colorParam ? colorParam.split(',') : [];
    
    // Dividir porcentajes
    const porcentajes = porcentajeParam.split(',').map(p => {
        const valor = parseFloat(p);
        return isNaN(valor) ? 0 : valor;
    });

    // Mapear colores a valores hexadecimales
    const mapaColores = {
        // Colores básicos
        "rojo": "#FF3040",
        "azul": "#1D9BF0",
        "verde": "#00BA7C",
        "amarillo": "#FFD700",
        "naranja": "#FF8C00",
        "morado": "#8A2BE2",
        "rosa": "#FF69B4",
        "negro": "#000000",
        "blanco": "#FFFFFF",
        "gris": "#808080",
        "turquesa": "#40E0D0",
        "violeta": "#EE82EE",
        "marron": "#A52A2A",
        
        // Variantes de azul Twitter
        "twitter": "#1D9BF0",
        "azul_twitter": "#1D9BF0",
        "azul_claro": "#7CC0FF",
        "azul_oscuro": "#0F1B2A",
        
        // Variantes de rojo
        "rojo_claro": "#FF6B6B",
        "rojo_oscuro": "#8B0000",
        
        // Variantes de verde
        "verde_claro": "#90EE90",
        "verde_oscuro": "#006400",
        
        // Grises de Twitter
        "gris_claro": "#D9D9D9",
        "gris_medio": "#8B98A5",
        "gris_oscuro": "#536471"
    };

    // Crear array de opciones
    const opciones = [];
    const numOpciones = Math.max(textos.length, porcentajes.length);
    
    for (let i = 0; i < numOpciones; i++) {
        // Obtener texto, color y porcentaje para esta opción
        const texto = i < textos.length ? textos[i].trim() : `Opción ${i+1}`;
        
        // Procesar el color
        let color;
        if (i < colores.length) {
            const colorTexto = colores[i].trim().toLowerCase();
            // Verificar si es un código hexadecimal
            if (colorTexto.startsWith('#') && (colorTexto.length === 4 || colorTexto.length === 7)) {
                color = colorTexto;
            } else {
                // Buscar en nuestro mapa de colores
                color = mapaColores[colorTexto] || "#1D9BF0"; // Color por defecto: azul Twitter
            }
        } else {
            // Colores por defecto para cada posición
            const coloresPredeterminados = ["#1D9BF0", "#00BA7C", "#FF3040", "#FFD700"];
            color = coloresPredeterminados[i % coloresPredeterminados.length];
        }
        
        const porcentaje = i < porcentajes.length ? porcentajes[i] : 0;
        
        // Añadir opción al array
        opciones.push({ texto, color, porcentaje });
    }
    
    // Normalizar porcentajes si no suman 100
    const sumaTotal = opciones.reduce((sum, opt) => sum + opt.porcentaje, 0);
    if (sumaTotal !== 100 && sumaTotal !== 0) {
        opciones.forEach(opt => {
            opt.porcentaje = (opt.porcentaje / sumaTotal) * 100;
        });
    }
    
    return opciones;
}

/**
 * Genera la imagen de la encuesta en formato PNG con diseño mejorado
 */
async function generarImagenEncuesta(titulo, opciones) {
    // Configurar dimensiones del canvas
    const width = 600;
    const headerHeight = 70;
    const optionHeight = 55;
    const optionGap = 15;
    const footerHeight = 20;
    const padding = 25;
    
    // Calcular altura total basada en el número de opciones
    const height = headerHeight + (opciones.length * (optionHeight + optionGap)) + footerHeight;
    
    // Crear canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // Colores de la encuesta (estilo mejorado)
    const colors = {
        background: "#000000",
        text: "#E7E9EA",
        secondaryText: "#8B98A5",
        border: "#2F3336",
        shadowColor: "rgba(0, 0, 0, 0.5)"
    };
    
    // Dibujar fondo con degradado sutil
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "#121212");
    bgGradient.addColorStop(1, "#000000");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Añadir efecto de vignette (oscurecer bordes)
    const vignetteGradient = ctx.createRadialGradient(
        width/2, height/2, height * 0.3, 
        width/2, height/2, height * 0.8
    );
    vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Dibujar título con efecto de brillo
    ctx.fillStyle = colors.text;
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Añadir sombra al texto del título
    ctx.shadowColor = "rgba(255, 255, 255, 0.1)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(titulo, width / 2, headerHeight / 2);
    
    // Resetear sombra
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    
    // Determinar la opción con mayor porcentaje (ganadora)
    const maxPorcentaje = Math.max(...opciones.map(opt => opt.porcentaje));
    const hayGanador = maxPorcentaje > 0;
    
    // Dibujar cada opción de la encuesta
    let currentY = headerHeight + optionGap;
    
    opciones.forEach((opcion, index) => {
        // Verificar si esta es la opción ganadora
        const esGanadora = hayGanador && opcion.porcentaje === maxPorcentaje;
        
        // Dibujar el fondo de la barra de progreso
        const barX = padding;
        const barY = currentY;
        const barHeight = optionHeight;
        const barFullWidth = width - (padding * 2);
        
        // Añadir sombra sutil a la barra
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;
        
        // Barra de fondo (gris oscuro con degradado)
        const bgBarGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
        bgBarGradient.addColorStop(0, "#2F3336");
        bgBarGradient.addColorStop(1, "#252A2D");
        ctx.fillStyle = bgBarGradient;
        roundedRect(ctx, barX, barY, barFullWidth, barHeight, 10);
        ctx.fill();
        
        // Resetear sombra para la barra de progreso
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        
        // Barra de progreso (color personalizado con degradado)
        if (opcion.porcentaje > 0) {
            const progressWidth = (opcion.porcentaje / 100) * barFullWidth;
            
            // Crear un degradado para la barra de progreso
            const progressGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
            
            // Extraer componentes RGB del color
            const hexToRgb = (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            };
            
            const rgb = hexToRgb(opcion.color);
            const colorBrighter = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)` : opcion.color;
            const colorDarker = rgb ? `rgba(${rgb.r * 0.7}, ${rgb.g * 0.7}, ${rgb.b * 0.7}, 1)` : opcion.color;
            
            progressGradient.addColorStop(0, colorBrighter);
            progressGradient.addColorStop(1, colorDarker);
            
            ctx.fillStyle = progressGradient;
            
            // Usar la misma función para crear esquinas redondeadas
            ctx.save();
            ctx.beginPath();
            
            // Ajustar el recorte para que la barra de progreso tenga esquinas redondeadas
            if (progressWidth >= barFullWidth - 20) {
                // Si la barra está casi completa, usar las mismas esquinas
                roundedRect(ctx, barX, barY, progressWidth, barHeight, 10);
            } else {
                // Si la barra es parcial, solo redondear las esquinas izquierdas
                ctx.moveTo(barX + 10, barY);
                ctx.arcTo(barX, barY, barX, barY + 10, 10);
                ctx.lineTo(barX, barY + barHeight - 10);
                ctx.arcTo(barX, barY + barHeight, barX + 10, barY + barHeight, 10);
                ctx.lineTo(barX + progressWidth, barY + barHeight);
                ctx.lineTo(barX + progressWidth, barY);
                ctx.closePath();
            }
            ctx.fill();
            
            // Añadir brillo sutil en la parte superior
            const brightness = ctx.createLinearGradient(barX, barY, barX, barY + barHeight * 0.3);
            brightness.addColorStop(0, "rgba(255, 255, 255, 0.15)");
            brightness.addColorStop(1, "rgba(255, 255, 255, 0)");
            
            ctx.fillStyle = brightness;
            // Usar el mismo path que ya recortamos
            ctx.fill();
            
            ctx.restore();
        }
        
        // Dibujar texto de la opción con sombra
        ctx.fillStyle = colors.text;
        ctx.font = esGanadora ? "bold 16px Arial" : "16px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        
        // Añadir sombra sutil al texto
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Dibujar el texto con un pequeño padding
        const textX = barX + 15;
        const textY = barY + barHeight / 2;
        ctx.fillText(opcion.texto, textX, textY);
        
        // Resetear sombra para el porcentaje
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 3;
        
        // Dibujar porcentaje a la derecha
        ctx.font = esGanadora ? "bold 18px Arial" : "16px Arial";
        ctx.textAlign = "right";
        const percentX = barX + barFullWidth - 15;
        ctx.fillText(`${Math.round(opcion.porcentaje)}%`, percentX, textY);
        
        // Resetear sombra
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        
        // Añadir badge de verificación si es la opción ganadora
        if (esGanadora && opciones.length > 1) {
            const checkX = barX + barFullWidth - 60;
            const checkY = textY;
            const checkSize = 18;
            
            // Dibujar círculo con gradiente
            const checkGradient = ctx.createRadialGradient(
                checkX, checkY, 0,
                checkX, checkY, checkSize
            );
            checkGradient.addColorStop(0, "#FFFFFF");
            checkGradient.addColorStop(1, "#F0F0F0");
            
            ctx.beginPath();
            ctx.arc(checkX, checkY, checkSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = checkGradient;
            
            // Sombra para el círculo
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fill();
            
            // Resetear sombra
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            
            // Dibujar check con estilo
            ctx.beginPath();
            ctx.moveTo(checkX - 4, checkY);
            ctx.lineTo(checkX, checkY + 4);
            ctx.lineTo(checkX + 6, checkY - 4);
            
            // Crear degradado para el check
            const strokeGradient = ctx.createLinearGradient(
                checkX - 4, checkY, 
                checkX + 6, checkY
            );
            strokeGradient.addColorStop(0, opcion.color);
            strokeGradient.addColorStop(1, colorBrighter(opcion.color, 30));
            
            ctx.strokeStyle = strokeGradient;
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        }
        
        // Actualizar posición Y para la siguiente opción
        currentY += optionHeight + optionGap;
    });
    
    // Añadir brillo sutil en la parte superior del canvas
    const topGlow = ctx.createLinearGradient(0, 0, 0, 150);
    topGlow.addColorStop(0, "rgba(255, 255, 255, 0.05)");
    topGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, width, 150);
    
    // Devolver la imagen como buffer
    return canvas.toBuffer('image/png');
}

/**
 * Dibuja un rectángulo con esquinas redondeadas
 */
function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Función para aclarar un color
 */
function colorBrighter(hexColor, percent) {
    // Convertir hex a rgb
    let r = parseInt(hexColor.substring(1, 3), 16);
    let g = parseInt(hexColor.substring(3, 5), 16);
    let b = parseInt(hexColor.substring(5, 7), 16);
    
    // Aclarar cada componente
    r = Math.min(255, r + Math.floor(r * (percent / 100)));
    g = Math.min(255, g + Math.floor(g * (percent / 100)));
    b = Math.min(255, b + Math.floor(b * (percent / 100)));
    
    // Convertir de nuevo a hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

module.exports = router;
