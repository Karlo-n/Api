const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

const router = express.Router();

// Registrar fuente Oswald
registerFont(path.join(__dirname, 'Oswald-VariableFont_wght.ttf'), { family: 'Oswald' });

// Función para validar URL
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

// Paletas de colores para los fondos generados
const COLOR_PALETTES = [
    // Azul/Púrpura vibrante
    ["#1A2980", "#26D0CE"],
    // Atardecer
    ["#FF416C", "#FF4B2B"],
    // Verde/Azul
    ["#134E5E", "#71B280"],
    // Púrpura profundo
    ["#6A3093", "#A044FF"],
    // Azul eléctrico
    ["#0F0C29", "#302B63", "#24243E"],
    // Rojo/Naranja
    ["#8E2DE2", "#4A00E0"],
    // Azul claro/Verde
    ["#43C6AC", "#191654"],
    // Naranja/Amarillo
    ["#FFB75E", "#ED8F03"],
    // Neo verde
    ["#00c3ff", "#00ff8f"],
    // Rosa/Púrpura
    ["#bc4e9c", "#f80759"]
];

// Función para crear un fondo con degradado
function crearFondoDegradado(ctx, ancho, alto) {
    const paleta = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
    const gradient = ctx.createLinearGradient(0, 0, ancho, alto);
    
    paleta.forEach((color, index) => {
        gradient.addColorStop(index / (paleta.length - 1), color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ancho, alto);
    
    return paleta; // Devuelve la paleta usada para posibles usos posteriores
}

// Función para dibujar un patrón de ondas
function dibujarPatronOndas(ctx, ancho, alto, numOndas = 5, color = "rgba(255,255,255,0.1)") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < numOndas; i++) {
        const y = i * (alto / numOndas);
        const amplitud = Math.random() * 20 + 10;
        const frecuencia = Math.random() * 0.02 + 0.01;
        
        ctx.beginPath();
        for (let x = 0; x < ancho; x += 5) {
            const yOffset = Math.sin(x * frecuencia) * amplitud;
            if (x === 0) {
                ctx.moveTo(x, y + yOffset);
            } else {
                ctx.lineTo(x, y + yOffset);
            }
        }
        ctx.stroke();
    }
}

// Función para dibujar un patrón de partículas
function dibujarParticulas(ctx, ancho, alto, numParticulas = 50, color = "rgba(255,255,255,0.5)") {
    for (let i = 0; i < numParticulas; i++) {
        const x = Math.random() * ancho;
        const y = Math.random() * alto;
        const radio = Math.random() * 3 + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, radio, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }
}

// Función para dibujar un patrón de líneas
function dibujarPatronLineas(ctx, ancho, alto, numLineas = 15, color = "rgba(255,255,255,0.1)") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // Líneas horizontales
    for (let i = 0; i < numLineas; i++) {
        const y = Math.random() * alto;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(ancho, y);
        ctx.stroke();
    }
    
    // Líneas verticales
    for (let i = 0; i < numLineas / 2; i++) {
        const x = Math.random() * ancho;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, alto);
        ctx.stroke();
    }
}

// Función para dibujar un patrón hexagonal
function dibujarPatronHexagonal(ctx, ancho, alto, tamaño = 40, color = "rgba(255,255,255,0.1)") {
    const h = tamaño * Math.sqrt(3);
    
    for (let y = -h; y < alto + h; y += h) {
        for (let x = -tamaño * 3; x < ancho + tamaño * 3; x += tamaño * 3) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angulo = i * Math.PI / 3;
                const desplazado = y % (2 * h) === 0;
                const xPos = x + (desplazado ? tamaño * 1.5 : 0) + tamaño * Math.cos(angulo);
                const yPos = y + tamaño * Math.sin(angulo);
                if (i === 0) {
                    ctx.moveTo(xPos, yPos);
                } else {
                    ctx.lineTo(xPos, yPos);
                }
            }
            ctx.closePath();
            ctx.strokeStyle = color;
            ctx.stroke();
        }
    }
}

// Función para crear un fondo con efecto de resplandor
function crearEfectoResplandor(ctx, ancho, alto, x, y, radio, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radio);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ancho, alto);
}

// Función para crear un fondo estilizado
function crearFondoEstilizado(ctx, ancho, alto) {
    // Seleccionar un estilo aleatorio entre varios disponibles
    const estilos = [
        "degradado-con-ondas",
        "degradado-con-particulas",
        "degradado-con-lineas", 
        "degradado-con-hexagonos",
        "degradado-con-resplandor",
        "degradado-con-circulos",
        "degradado-con-rayas-diagonales"
    ];
    
    const estiloElegido = estilos[Math.floor(Math.random() * estilos.length)];
    
    // Crear el degradado base
    const paleta = crearFondoDegradado(ctx, ancho, alto);
    const colorTransparente = "rgba(255,255,255,0.1)";
    
    // Aplicar elementos adicionales según el estilo
    switch (estiloElegido) {
        case "degradado-con-ondas":
            dibujarPatronOndas(ctx, ancho, alto, 8, colorTransparente);
            break;
            
        case "degradado-con-particulas":
            dibujarParticulas(ctx, ancho, alto, 100, "rgba(255,255,255,0.3)");
            break;
            
        case "degradado-con-lineas":
            dibujarPatronLineas(ctx, ancho, alto, 20, colorTransparente);
            break;
            
        case "degradado-con-hexagonos":
            dibujarPatronHexagonal(ctx, ancho, alto, 30, colorTransparente);
            break;
            
        case "degradado-con-resplandor":
            crearEfectoResplandor(
                ctx, 
                ancho, 
                alto, 
                ancho * 0.7, 
                alto * 0.3, 
                ancho * 0.6, 
                "rgba(255,255,255,0.2)"
            );
            break;
            
        case "degradado-con-circulos":
            // Dibujar varios círculos translúcidos
            for (let i = 0; i < 5; i++) {
                const radio = Math.random() * 150 + 50;
                const x = Math.random() * ancho;
                const y = Math.random() * alto;
                
                ctx.beginPath();
                ctx.arc(x, y, radio, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255,255,255,0.05)";
                ctx.fill();
            }
            break;
            
        case "degradado-con-rayas-diagonales":
            // Dibujar rayas diagonales
            ctx.lineWidth = 10;
            ctx.strokeStyle = "rgba(255,255,255,0.07)";
            
            for (let i = -ancho; i < ancho * 2; i += 30) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i + alto, alto);
                ctx.stroke();
            }
            break;
    }
    
    // Añadir viñeta para dar profundidad
    const gradient = ctx.createRadialGradient(
        ancho / 2, alto / 2, alto / 3,
        ancho / 2, alto / 2, alto
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.6)");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ancho, alto);
    
    return estiloElegido;
}

// Función para dibujar avatar con efectos
function dibujarAvatar(ctx, imagen, x, y, tamaño) {
    // Guardar estado del contexto
    ctx.save();
    
    // Añadir sombra
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    
    // Crear máscara para bordes redondeados
    ctx.beginPath();
    ctx.arc(x + tamaño/2, y + tamaño/2, tamaño/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Dibujar imagen
    ctx.drawImage(imagen, x, y, tamaño, tamaño);
    
    // Dibujar borde
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Restaurar estado del contexto
    ctx.restore();
}

// Función para dibujar texto con ajuste automático de tamaño
function dibujarTextoAjustado(ctx, texto, x, y, anchoMaximo) {
    // Tamaño inicial de la fuente
    let tamañoFuente = 36;
    
    // Establecer límite de caracteres
    const LIMITE_CARACTERES = 100;
    if (texto.length > LIMITE_CARACTERES) {
        texto = texto.substring(0, LIMITE_CARACTERES) + '...';
    }
    
    // Ajustar tamaño de fuente según longitud del texto
    if (texto.length > 60) {
        tamañoFuente = 24;
    } else if (texto.length > 40) {
        tamañoFuente = 28;
    } else if (texto.length > 20) {
        tamañoFuente = 32;
    }
    
    // Dividir el texto en líneas para que quepa en el ancho
    ctx.font = `${tamañoFuente}px Oswald`;
    
    // Dividir texto en palabras
    const palabras = texto.split(' ');
    const lineas = [];
    let lineaActual = '';
    
    // Agrupar palabras en líneas que quepan en el ancho máximo
    for (const palabra of palabras) {
        const lineaTentativa = lineaActual.length === 0 ? palabra : `${lineaActual} ${palabra}`;
        const medidaTexto = ctx.measureText(lineaTentativa).width;
        
        if (medidaTexto <= anchoMaximo) {
            lineaActual = lineaTentativa;
        } else {
            lineas.push(lineaActual);
            lineaActual = palabra;
        }
    }
    
    // Añadir la última línea
    if (lineaActual.length > 0) {
        lineas.push(lineaActual);
    }
    
    // Limitar a 3 líneas máximo
    if (lineas.length > 3) {
        lineas.splice(3);
        lineas[2] += '...';
    }
    
    // Dibujar cada línea con efectos
    lineas.forEach((linea, index) => {
        // Añadir sombra al texto
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        
        // Dibujar un contorno
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(linea, x, y + (index * (tamañoFuente + 8)));
        
        // Dibujar el texto
        ctx.fillStyle = '#ffffff';
        ctx.fillText(linea, x, y + (index * (tamañoFuente + 8)));
    });
    
    // Devolver el alto total del texto
    return lineas.length * (tamañoFuente + 8);
}

// Función para dibujar fondo de texto para mejor legibilidad
function dibujarFondoTexto(ctx, x, y, ancho, alto) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    const radio = 15;
    
    // Dibujar rectángulo con esquinas redondeadas
    ctx.moveTo(x + radio, y);
    ctx.lineTo(x + ancho - radio, y);
    ctx.quadraticCurveTo(x + ancho, y, x + ancho, y + radio);
    ctx.lineTo(x + ancho, y + alto - radio);
    ctx.quadraticCurveTo(x + ancho, y + alto, x + ancho - radio, y + alto);
    ctx.lineTo(x + radio, y + alto);
    ctx.quadraticCurveTo(x, y + alto, x, y + alto - radio);
    ctx.lineTo(x, y + radio);
    ctx.quadraticCurveTo(x, y, x + radio, y);
    ctx.closePath();
    
    ctx.fill();
}

// Función para añadir elementos decorativos
function añadirElementosDecorativos(ctx, ancho, alto) {
    // Líneas decorativas en las esquinas
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    
    // Longitud de las líneas decorativas
    const long = 30;
    
    // Esquina superior izquierda
    ctx.beginPath();
    ctx.moveTo(0, long);
    ctx.lineTo(0, 0);
    ctx.lineTo(long, 0);
    ctx.stroke();
    
    // Esquina superior derecha
    ctx.beginPath();
    ctx.moveTo(ancho - long, 0);
    ctx.lineTo(ancho, 0);
    ctx.lineTo(ancho, long);
    ctx.stroke();
    
    // Esquina inferior izquierda
    ctx.beginPath();
    ctx.moveTo(0, alto - long);
    ctx.lineTo(0, alto);
    ctx.lineTo(long, alto);
    ctx.stroke();
    
    // Esquina inferior derecha
    ctx.beginPath();
    ctx.moveTo(ancho - long, alto);
    ctx.lineTo(ancho, alto);
    ctx.lineTo(ancho, alto - long);
    ctx.stroke();
}

router.get('/', async (req, res) => {
    try {
        // Extraer parámetros
        const { avatar, texto } = req.query;
        
        // Verificar parámetros mínimos
        if (!avatar) {
            return res.status(400).json({ 
                error: 'Falta el parámetro avatar en la URL',
                ejemplo: '/boostcard?avatar=https://tu-avatar.jpg&texto=¡Gracias por el boost!' 
            });
        }
        
        // Validar URL de avatar
        if (!isValidUrl(avatar)) {
            return res.status(400).json({ error: 'La URL del avatar no es válida' });
        }
        
        // Texto predeterminado
        const mensajeTexto = texto || '¡Gracias por el boost!';
        
        // Dimensiones de la tarjeta
        const ANCHO = 800;
        const ALTO = 400;
        
        // Crear canvas
        const canvas = createCanvas(ANCHO, ALTO);
        const ctx = canvas.getContext('2d');
        
        // Crear fondo estilizado generado automáticamente
        crearFondoEstilizado(ctx, ANCHO, ALTO);
        
        // Añadir elementos decorativos
        añadirElementosDecorativos(ctx, ANCHO, ALTO);
        
        // Cargar imagen de avatar
        const imagenAvatar = await loadImage(avatar);
        
        // Dibujar avatar (centrado horizontalmente en la parte superior)
        const tamañoAvatar = 150;
        const posXAvatar = (ANCHO - tamañoAvatar) / 2;
        const posYAvatar = 60;
        dibujarAvatar(ctx, imagenAvatar, posXAvatar, posYAvatar, tamañoAvatar);
        
        // Dibujar texto de agradecimiento
        // Primero dibujamos el fondo del texto
        const margenTexto = 40;
        const posXTexto = margenTexto;
        const posYTexto = posYAvatar + tamañoAvatar + 50;
        const anchoTextoMax = ANCHO - (margenTexto * 2);
        
        // Medir texto para crear fondo
        ctx.font = '36px Oswald';
        const altoTextoEstimado = Math.min(dibujarTextoAjustado(ctx, '', posXTexto, posYTexto, anchoTextoMax) + 40, 150);
        
        // Dibujar fondo para el texto
        dibujarFondoTexto(ctx, posXTexto - 20, posYTexto - 35, anchoTextoMax + 40, altoTextoEstimado);
        
        // Dibujar texto real
        dibujarTextoAjustado(ctx, mensajeTexto, posXTexto, posYTexto, anchoTextoMax);
        
        // Firma discreta en la esquina
        ctx.font = '16px Oswald';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('Boost Card', ANCHO - 80, ALTO - 20);
        
        // Enviar imagen
        res.setHeader('Content-Type', 'image/png');
        res.end(canvas.toBuffer());
    } catch (error) {
        console.error('Error en la generación de la tarjeta:', error);
        res.status(500).json({ 
            error: 'Error al generar la imagen', 
            details: error.message
        });
    }
});

module.exports = router;
