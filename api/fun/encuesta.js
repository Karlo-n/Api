// api/fun/encuesta/index.js
const express = require("express");
const { createCanvas } = require("canvas");
const router = express.Router();

/**
 * API de Encuestas - Genera una imagen que simula una encuesta visual
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
 * Genera la imagen de la encuesta en formato PNG
 */
async function generarImagenEncuesta(titulo, opciones) {
    // Configurar dimensiones del canvas
    const width = 600;
    const headerHeight = 60;
    const optionHeight = 60;
    const optionGap = 12;
    const footerHeight = 40;
    
    // Calcular altura total basada en el número de opciones
    const height = headerHeight + (opciones.length * (optionHeight + optionGap)) + footerHeight;
    
    // Crear canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // Colores de la encuesta (estilo Twitter)
    const colors = {
        background: "#000000",
        text: "#E7E9EA",
        secondaryText: "#8B98A5",
        border: "#2F3336"
    };
    
    // Dibujar fondo negro
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Dibujar título
    ctx.fillStyle = colors.text;
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(titulo, 20, headerHeight / 2);
    
    // Dibujar borde sutil arriba y abajo del título
    ctx.fillStyle = colors.border;
    ctx.fillRect(0, 0, width, 1);
    ctx.fillRect(0, headerHeight - 1, width, 1);
    
    // Determinar la opción con mayor porcentaje (ganadora)
    const maxPorcentaje = Math.max(...opciones.map(opt => opt.porcentaje));
    
    // Dibujar cada opción de la encuesta
    let currentY = headerHeight + optionGap;
    
    opciones.forEach((opcion, index) => {
        // Si el porcentaje es el máximo, destacar la opción
        const esGanadora = opcion.porcentaje === maxPorcentaje && maxPorcentaje > 0;
        
        // Dibujar el fondo de la barra de progreso
        const barX = 20;
        const barY = currentY;
        const barHeight = optionHeight;
        const barFullWidth = width - 40;
        
        // Barra de fondo (gris oscuro)
        ctx.fillStyle = "#2F3336";
        roundedRect(ctx, barX, barY, barFullWidth, barHeight, 8);
        ctx.fill();
        
        // Barra de progreso (color personalizado)
        if (opcion.porcentaje > 0) {
            const progressWidth = (opcion.porcentaje / 100) * barFullWidth;
            ctx.fillStyle = opcion.color;
            // Usar la misma función para crear esquinas redondeadas
            ctx.save();
            ctx.beginPath();
            // Ajustar el recorte para que la barra de progreso tenga esquinas redondeadas
            if (progressWidth >= barFullWidth - 16) {
                // Si la barra está casi completa, usar las mismas esquinas
                roundedRect(ctx, barX, barY, progressWidth, barHeight, 8);
            } else {
                // Si la barra es parcial, solo redondear las esquinas izquierdas
                ctx.moveTo(barX + 8, barY);
                ctx.arcTo(barX, barY, barX, barY + 8, 8);
                ctx.lineTo(barX, barY + barHeight - 8);
                ctx.arcTo(barX, barY + barHeight, barX + 8, barY + barHeight, 8);
                ctx.lineTo(barX + progressWidth, barY + barHeight);
                ctx.lineTo(barX + progressWidth, barY);
                ctx.closePath();
            }
            ctx.fill();
            ctx.restore();
        }
        
        // Dibujar texto de la opción
        ctx.fillStyle = colors.text;
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        
        // Dibujar el texto con un pequeño padding
        const textX = barX + 15;
        const textY = barY + barHeight / 2;
        ctx.fillText(opcion.texto, textX, textY);
        
        // Dibujar porcentaje a la derecha
        ctx.font = esGanadora ? "bold 16px Arial" : "16px Arial";
        ctx.textAlign = "right";
        const percentX = barX + barFullWidth - 15;
        ctx.fillText(`${Math.round(opcion.porcentaje)}%`, percentX, textY);
        
        // Añadir marca de verificación si es la opción ganadora
        if (esGanadora && opciones.length > 1) {
            const checkX = barX + barFullWidth - 45;
            const checkY = textY;
            
            // Dibujar círculo
            ctx.beginPath();
            ctx.arc(checkX, checkY, 8, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            
            // Dibujar check
            ctx.beginPath();
            ctx.moveTo(checkX - 3, checkY);
            ctx.lineTo(checkX, checkY + 3);
            ctx.lineTo(checkX + 4, checkY - 3);
            ctx.strokeStyle = opcion.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Actualizar posición Y para la siguiente opción
        currentY += optionHeight + optionGap;
    });
    
    // Dibujar borde inferior y línea de "Votos totales"
    ctx.fillStyle = colors.border;
    ctx.fillRect(0, height - footerHeight, width, 1);
    
    // Calcular total de votos (suponiendo 100 votos por cada 1% para un total ficticio)
    const totalVotos = Math.floor(Math.random() * 10000) + 1000;
    
    // Dibujar texto de votos totales
    ctx.fillStyle = colors.secondaryText;
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${totalVotos.toLocaleString()} votos`, 20, height - footerHeight / 2);
    
    // Dibujar texto de finalización de encuesta
    const minutosRestantes = Math.floor(Math.random() * 23) + 1;
    ctx.textAlign = "right";
    ctx.fillText(`${minutosRestantes} horas restantes · Encuesta`, width - 20, height - footerHeight / 2);
    
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
