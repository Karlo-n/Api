// api/fun/encuesta/index.js
const express = require("express");
const { createCanvas } = require("canvas");
const router = express.Router();

/**
 * API de Encuestas - Genera una imagen que simula una encuesta visual de alta calidad
 * Diseño premium con efectos visuales mejorados
 */
router.get("/", async (req, res) => {
    try {
        const { titulo = "Encuesta", texto, color, porcentaje, tema = "oscuro" } = req.query;

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
        const encuestaBuffer = await generarImagenEncuesta(titulo, opciones, tema.toLowerCase());

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
        // Colores básicos con tonos mejorados
        "rojo": "#FF3B30",
        "azul": "#007AFF",
        "verde": "#34C759",
        "amarillo": "#FFCC00",
        "naranja": "#FF9500",
        "morado": "#AF52DE",
        "rosa": "#FF2D55",
        "negro": "#000000",
        "blanco": "#FFFFFF",
        "gris": "#8E8E93",
        "turquesa": "#5AC8FA",
        "violeta": "#5856D6",
        "marron": "#A2845E",
        
        // Colores específicos de redes sociales
        "twitter": "#1DA1F2",
        "facebook": "#4267B2",
        "instagram": "#E1306C",
        "youtube": "#FF0000",
        "twitch": "#9146FF",
        "tiktok": "#000000",
        "linkedin": "#0077B5",
        
        // Variantes de colores
        "azul_claro": "#5AC8FA",
        "azul_oscuro": "#0A84FF",
        "rojo_claro": "#FF6B6B",
        "rojo_oscuro": "#CC0000",
        "verde_claro": "#4CD964",
        "verde_oscuro": "#208530"
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
                color = mapaColores[colorTexto] || "#007AFF"; // Color por defecto: azul
            }
        } else {
            // Colores por defecto para cada posición - más vibrantes
            const coloresPredeterminados = ["#007AFF", "#FF3B30", "#34C759", "#FFCC00"];
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
 * Genera la imagen de la encuesta en formato PNG con diseño premium
 */
async function generarImagenEncuesta(titulo, opciones, tema) {
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
    
    // Temas de color disponibles
    const temas = {
        oscuro: {
            background: "#000000",
            cardBackground: "#1C1C1E",
            text: "#FFFFFF",
            secondaryText: "#8E8E93",
            barBackground: "#2C2C2E"
        },
        negro: {
            background: "#000000",
            cardBackground: "#000000",
            text: "#FFFFFF",
            secondaryText: "#8E8E93",
            barBackground: "#2A2A2A"
        },
        azul: {
            background: "#0A1A2F",
            cardBackground: "#0A1A2F",
            text: "#FFFFFF",
            secondaryText: "#8E8E93",
            barBackground: "#1A2A40"
        },
        gris: {
            background: "#1C1C1E",
            cardBackground: "#1C1C1E",
            text: "#FFFFFF",
            secondaryText: "#8E8E93",
            barBackground: "#2C2C2E"
        }
    };
    
    // Seleccionar tema (por defecto: oscuro)
    const colores = temas[tema] || temas.oscuro;
    
    // Dibujar fondo principal
    ctx.fillStyle = colores.background;
    ctx.fillRect(0, 0, width, height);
    
    // Añadir efecto de vignette (esquinas oscurecidas)
    const vignetteGradient = ctx.createRadialGradient(
        width/2, height/2, height * 0.5, 
        width/2, height/2, height
    );
    vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Añadir un borde más elegante
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    roundedRect(ctx, 10, 10, width - 20, height - 20, 15);
    ctx.stroke();
    
    // Añadir un segundo borde más interno para efecto de profundidad
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    roundedRect(ctx, 15, 15, width - 30, height - 30, 12);
    ctx.stroke();
    
    // Dibujar título con efecto de brillo
    ctx.fillStyle = colores.text;
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Añadir sombra al título para efecto de profundidad
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillText(titulo, width / 2, headerHeight / 2);
    
    // Resetear sombra
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Añadir línea decorativa debajo del título
    const lineGradient = ctx.createLinearGradient(width/4, 0, width*3/4, 0);
    lineGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    lineGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
    lineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width/4, headerHeight - 15);
    ctx.lineTo(width*3/4, headerHeight - 15);
    ctx.stroke();
    
    // Determinar la opción con mayor porcentaje (ganadora)
    const maxPorcentaje = Math.max(...opciones.map(opt => opt.porcentaje));
    const hayGanador = maxPorcentaje > 0;
    
    // Dibujar cada opción de la encuesta
    let currentY = headerHeight + optionGap;
    
    opciones.forEach((opcion, index) => {
        // Verificar si esta es la opción ganadora
        const esGanadora = hayGanador && opcion.porcentaje === maxPorcentaje;
        
        // Añadir sombra a las barras
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;
        
        // Dibujar el fondo de la barra de progreso
        const barX = padding;
        const barY = currentY;
        const barHeight = optionHeight;
        const barFullWidth = width - (padding * 2);
        
        // Barra de fondo con gradiente sutil
        const bgGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
        bgGradient.addColorStop(0, colores.barBackground);
        bgGradient.addColorStop(1, adjustColor(colores.barBackground, -15)); // Ligeramente más oscuro abajo
        
        ctx.fillStyle = bgGradient;
        roundedRect(ctx, barX, barY, barFullWidth, barHeight, 10);
        ctx.fill();
        
        // Resetear sombra
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        
        // Barra de progreso con color personalizado y efectos
        if (opcion.porcentaje > 0) {
            const progressWidth = (opcion.porcentaje / 100) * barFullWidth;
            
            // Crear gradiente para la barra de progreso
            const progressGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
            
            // Color base y variantes
            const baseColor = opcion.color;
            const lighterColor = adjustColor(baseColor, 15); // Ligeramente más claro
            const darkerColor = adjustColor(baseColor, -15);  // Ligeramente más oscuro
            
            progressGradient.addColorStop(0, lighterColor);
            progressGradient.addColorStop(0.5, baseColor);
            progressGradient.addColorStop(1, darkerColor);
            
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
            
            // Añadir brillo en la parte superior de la barra
            const glowGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight * 0.5);
            glowGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
            glowGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            
            ctx.fillStyle = glowGradient;
            ctx.fill();
            
            // Añadir línea de brillo muy sutil
            ctx.beginPath();
            ctx.moveTo(barX + 1, barY + 1);
            ctx.lineTo(barX + progressWidth - 1, barY + 1);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.restore();
        }
        
        // Dibujar texto de la opción con efectos de sombra
        ctx.fillStyle = colores.text;
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        const textX = barX + 15;
        const textY = barY + barHeight / 2;
        ctx.fillText(opcion.texto, textX, textY);
        
        // Dibujar porcentaje a la derecha
        ctx.textAlign = "right";
        const percentX = barX + barFullWidth - 15;
        
        // Si es la opción ganadora, dibujar primero el círculo de verificación junto al porcentaje
        if (esGanadora && opciones.length > 1) {
            // Calcular el ancho del texto del porcentaje
            const textWidth = ctx.measureText(`${Math.round(opcion.porcentaje)}%`).width;
            const checkX = percentX - textWidth - 20; // Posicionado antes del texto
            const checkY = textY;
            
            // Dibujar círculo con gradiente
            const checkGradient = ctx.createRadialGradient(
                checkX, checkY, 0,
                checkX, checkY, 10
            );
            checkGradient.addColorStop(0, "#FFFFFF");
            checkGradient.addColorStop(1, "#F0F0F0");
            
            // Sombra para el círculo
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.beginPath();
            ctx.arc(checkX, checkY, 8, 0, Math.PI * 2);
            ctx.fillStyle = checkGradient;
            ctx.fill();
            
            // Dibujar check
            ctx.beginPath();
            ctx.moveTo(checkX - 3, checkY);
            ctx.lineTo(checkX, checkY + 3);
            ctx.lineTo(checkX + 4, checkY - 3);
            
            // Crear gradiente para el check
            const checkStrokeGradient = ctx.createLinearGradient(
                checkX - 3, checkY, 
                checkX + 4, checkY - 3
            );
            checkStrokeGradient.addColorStop(0, opcion.color);
            checkStrokeGradient.addColorStop(1, lightenColor(opcion.color, 20));
            
            ctx.strokeStyle = checkStrokeGradient;
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
            
            // Sombra más ligera para el texto
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 2;
            
            // Dibujar porcentaje con estilo premium
            ctx.font = esGanadora ? "bold 18px Arial" : "bold 16px Arial";
            ctx.fillStyle = colores.text;
            ctx.fillText(`${Math.round(opcion.porcentaje)}%`, percentX, textY);
        } else {
            // Dibujar solo el porcentaje (sin verificación)
            ctx.fillStyle = colores.text;
            ctx.fillText(`${Math.round(opcion.porcentaje)}%`, percentX, textY);
        }
        
        // Resetear sombra
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Actualizar posición Y para la siguiente opción
        currentY += optionHeight + optionGap;
    });
    
    // Añadir efecto de brillo sutil en la parte superior de la imagen
    const topGlow = ctx.createLinearGradient(0, 0, 0, 120);
    topGlow.addColorStop(0, "rgba(255, 255, 255, 0.07)");
    topGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, width, 120);
    
    // Añadir firma sutil en la esquina
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.font = "10px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("encuesta.api", width - 15, height - 10);
    
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
 * Ajusta el brillo de un color
 * @param {string} color - Color en formato hexadecimal
 * @param {number} amount - Cantidad de ajuste (-255 a 255)
 * @returns {string} - Color ajustado en formato hexadecimal
 */
function adjustColor(color, amount) {
    // Extraer componentes RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Ajustar cada componente
    const newR = Math.max(0, Math.min(255, r + amount));
    const newG = Math.max(0, Math.min(255, g + amount));
    const newB = Math.max(0, Math.min(255, b + amount));
    
    // Convertir de nuevo a formato hexadecimal
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Aclara un color para efectos de brillo
 * @param {string} color - Color en formato hexadecimal
 * @param {number} percent - Porcentaje de aclarado (0-100)
 * @returns {string} - Color aclarado en formato hexadecimal
 */
function lightenColor(color, percent) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calcular componentes aclarados
    const factor = percent / 100;
    const newR = Math.min(255, r + (255 - r) * factor);
    const newG = Math.min(255, g + (255 - g) * factor);
    const newB = Math.min(255, b + (255 - b) * factor);
    
    // Convertir a hexadecimal
    return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

module.exports = router;
