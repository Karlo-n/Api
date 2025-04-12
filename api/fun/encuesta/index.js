// api/fun/encuesta/index.js
const express = require("express");
const { createCanvas } = require("canvas");
const router = express.Router();

/**
 * API de Encuestas - Genera una imagen que simula una encuesta visual
 * Diseño limpio y simple similar a Twitter/Instagram
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
        "rojo": "#E53935",
        "azul": "#2196F3",
        "verde": "#00C853",
        "amarillo": "#FFD600",
        "naranja": "#FF9100",
        "morado": "#AA00FF",
        "rosa": "#FF4081",
        "negro": "#000000",
        "blanco": "#FFFFFF",
        "gris": "#757575",
        "turquesa": "#00BCD4",
        "violeta": "#673AB7",
        "marron": "#795548",
        
        // Colores específicos de Twitter
        "twitter": "#1DA1F2",
        "azul_twitter": "#1DA1F2",
        "rojo_twitter": "#E0245E",
        
        // Opciones adicionales
        "azul_claro": "#03A9F4",
        "rojo_claro": "#FF5252",
        "verde_claro": "#00E676",
        "azul_oscuro": "#0D47A1",
        "rojo_oscuro": "#B71C1C",
        "verde_oscuro": "#1B5E20"
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
                color = mapaColores[colorTexto] || "#2196F3"; // Color por defecto: azul
            }
        } else {
            // Colores por defecto para cada posición
            const coloresPredeterminados = ["#2196F3", "#E53935", "#00C853", "#FFD600"];
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
 * Genera la imagen de la encuesta en formato PNG
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
    
    // Colores de la encuesta
    const colors = {
        background: "#000000", // Fondo negro
        text: "#FFFFFF",       // Texto blanco
        secondaryText: "#999999", // Texto secundario
        barBackground: "#2A2A2A" // Fondo de las barras de progreso
    };
    
    // Dibujar fondo negro
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Dibujar título
    ctx.fillStyle = colors.text;
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(titulo, width / 2, headerHeight / 2);
    
    // Determinar la opción con mayor porcentaje (ganadora)
    const maxPorcentaje = Math.max(...opciones.map(opt => opt.porcentaje));
    const hayGanador = maxPorcentaje > 0;
    
    // Dibujar cada opción de la encuesta
    let currentY = headerHeight + optionGap;
    
    opciones.forEach((opcion, index) => {
        // Verificar si esta es la opción ganadora
        const esGanadora = hayGanador && opcion.porcentaje === maxPorcentaje;
        
        // Dibujar el fondo de la barra de progreso (caja oscura)
        const barX = padding;
        const barY = currentY;
        const barHeight = optionHeight;
        const barFullWidth = width - (padding * 2);
        
        // Barra de fondo
        ctx.fillStyle = colors.barBackground;
        roundedRect(ctx, barX, barY, barFullWidth, barHeight, 10);
        ctx.fill();
        
        // Barra de progreso (color personalizado)
        if (opcion.porcentaje > 0) {
            const progressWidth = (opcion.porcentaje / 100) * barFullWidth;
            ctx.fillStyle = opcion.color;
            
            // Barras con esquinas redondeadas
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
            ctx.restore();
        }
        
        // Dibujar texto de la opción
        ctx.fillStyle = colors.text;
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        
        // Texto de la opción
        const textX = barX + 15;
        const textY = barY + barHeight / 2;
        ctx.fillText(opcion.texto, textX, textY);
        
        // Dibujar porcentaje a la derecha
        ctx.textAlign = "right";
        const percentX = barX + barFullWidth - 15;
        
        // Si es la opción ganadora, dibujar primero el círculo de verificación
        if (esGanadora && opciones.length > 1) {
            // Dibujar círculo de verificación justo a la izquierda del porcentaje
            const textWidth = ctx.measureText(`${Math.round(opcion.porcentaje)}%`).width;
            const checkX = percentX - textWidth - 18; // Posicionado antes del texto
            const checkY = textY;
            
            // Círculo blanco
            ctx.beginPath();
            ctx.arc(checkX, checkY, 8, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            
            // Dibujar check
            ctx.beginPath();
            ctx.moveTo(checkX - 3, checkY);
            ctx.lineTo(checkX, checkY + 3);
            ctx.lineTo(checkX + 3, checkY - 2);
            ctx.strokeStyle = opcion.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Dibujar porcentaje con el símbolo de verificación a su izquierda
            ctx.fillStyle = colors.text;
            ctx.fillText(`${Math.round(opcion.porcentaje)}%`, percentX, textY);
        } else {
            // Dibujar solo el porcentaje (sin verificación)
            ctx.fillStyle = colors.text;
            ctx.fillText(`${Math.round(opcion.porcentaje)}%`, percentX, textY);
        }
        
        // Actualizar posición Y para la siguiente opción
        currentY += optionHeight + optionGap;
    });
    
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

module.exports = router;
