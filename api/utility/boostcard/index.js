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

// Función para dibujar patrón de diamantes y brillos en estilo rosa/morado Discord Nitro
function dibujarFondoNitroBoost(ctx, ancho, alto) {
    // Crear degradado base rosa-morado
    const gradient = ctx.createLinearGradient(0, 0, ancho, alto);
    gradient.addColorStop(0, "#FF0080");    // Rosa intenso
    gradient.addColorStop(1, "#7928CA");    // Morado
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ancho, alto);
    
    // Añadir patrón de diamantes
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    
    const tamañoDiamante = 40;
    for (let y = -tamañoDiamante; y < alto + tamañoDiamante; y += tamañoDiamante) {
        for (let x = -tamañoDiamante; x < ancho + tamañoDiamante; x += tamañoDiamante) {
            ctx.beginPath();
            ctx.moveTo(x, y + tamañoDiamante/2);
            ctx.lineTo(x + tamañoDiamante/2, y);
            ctx.lineTo(x + tamañoDiamante, y + tamañoDiamante/2);
            ctx.lineTo(x + tamañoDiamante/2, y + tamañoDiamante);
            ctx.closePath();
            ctx.stroke();
        }
    }
    
    // Añadir brillos/partículas al estilo Discord Nitro
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * ancho;
        const y = Math.random() * alto;
        const tamaño = Math.random() * 3 + 1;
        
        // Brillo con resplandor
        const gradiente = ctx.createRadialGradient(x, y, 0, x, y, tamaño * 4);
        gradiente.addColorStop(0, "rgba(255,255,255,0.8)");
        gradiente.addColorStop(0.5, "rgba(255,255,255,0.2)");
        gradiente.addColorStop(1, "rgba(255,255,255,0)");
        
        ctx.beginPath();
        ctx.arc(x, y, tamaño * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradiente;
        ctx.fill();
        
        // Punto central brillante
        ctx.beginPath();
        ctx.arc(x, y, tamaño, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();
    }
    
    // Añadir viñeta para dar profundidad y estilo Discord
    const viñeta = ctx.createRadialGradient(
        ancho / 2, alto / 2, alto / 3,
        ancho / 2, alto / 2, alto
    );
    viñeta.addColorStop(0, "rgba(0,0,0,0)");
    viñeta.addColorStop(1, "rgba(0,0,0,0.6)");
    
    ctx.fillStyle = viñeta;
    ctx.fillRect(0, 0, ancho, alto);
    
    // Líneas decorativas estilo Discord en las esquinas
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    
    // Tamaño de las líneas decorativas
    const long = 25;
    
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

// Función para dibujar avatar con estilo Discord Nitro
function dibujarAvatarDiscord(ctx, imagen, x, y, tamaño) {
    // Guardar estado del contexto
    ctx.save();
    
    // Añadir sombra brillante estilo Discord Nitro
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(255,0,255,0.6)";
    
    // Crear máscara circular para avatar
    ctx.beginPath();
    ctx.arc(x + tamaño/2, y + tamaño/2, tamaño/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Dibujar imagen
    ctx.drawImage(imagen, x, y, tamaño, tamaño);
    
    // Restaurar contexto para dibujar borde
    ctx.restore();
    
    // Dibujar resplandor exterior (glow) estilo Discord Nitro
    ctx.beginPath();
    ctx.arc(x + tamaño/2, y + tamaño/2, tamaño/2 + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Dibujar borde
    ctx.beginPath();
    ctx.arc(x + tamaño/2, y + tamaño/2, tamaño/2, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Función para dibujar panel de texto estilo Discord
function dibujarPanelTextoDiscord(ctx, x, y, ancho, alto) {
    // Fondo del panel con esquinas redondeadas y semi-transparente
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.beginPath();
    
    const radio = 15;
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
    
    // Añadir sombra al panel
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    
    // Resetear sombra
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Añadir borde sutil
    ctx.strokeStyle = "rgba(128,0,128,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
}

// Función para dibujar texto con estilo Discord Nitro
function dibujarTextoDiscord(ctx, texto, x, y, anchoMaximo) {
    // Establecer límite de caracteres
    const LIMITE_CARACTERES = 100;
    if (texto.length > LIMITE_CARACTERES) {
        texto = texto.substring(0, LIMITE_CARACTERES) + '...';
    }
    
    // Ajustar tamaño de fuente según longitud del texto
    let tamañoFuente = 28; // Tamaño predeterminado para Discord
    if (texto.length > 60) {
        tamañoFuente = 22;
    } else if (texto.length > 40) {
        tamañoFuente = 24;
    } else if (texto.length > 20) {
        tamañoFuente = 26;
    }
    
    // Aplicar fuente
    ctx.font = `${tamañoFuente}px Oswald`;
    
    // Dividir texto en palabras
    const palabras = texto.split(' ');
    const lineas = [];
    let lineaActual = '';
    
    // Agrupar palabras en líneas que quepan
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
    
    // Dibujar texto con efectos de Discord Nitro
    lineas.forEach((linea, index) => {
        // Sombra exterior para efecto Discord Nitro
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 3;
        ctx.shadowColor = "rgba(255,0,255,0.7)";
        
        // Dibujar el texto
        ctx.fillStyle = '#ffffff';
        ctx.fillText(linea, x, y + (index * (tamañoFuente + 6)));
    });
    
    // Resetear sombra
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    
    // Devolver el alto total del texto
    return lineas.length * (tamañoFuente + 6);
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
        
        // Texto predeterminado para Discord Boost
        const mensajeTexto = texto || '¡Muchas gracias por apoyar nuestro canal con tu boost! Te lo agradecemos muchísimo.';
        
        // Dimensiones de la tarjeta (estándar Discord)
        const ANCHO = 800;
        const ALTO = 400;
        
        // Crear canvas
        const canvas = createCanvas(ANCHO, ALTO);
        const ctx = canvas.getContext('2d');
        
        // Dibujar fondo estilo Nitro/Boost de Discord
        dibujarFondoNitroBoost(ctx, ANCHO, ALTO);
        
        // Cargar imagen de avatar
        const imagenAvatar = await loadImage(avatar);
        
        // Dibujar avatar con estilo Discord Nitro
        const tamañoAvatar = 120;
        const posXAvatar = (ANCHO - tamañoAvatar) / 2;
        const posYAvatar = 80;
        dibujarAvatarDiscord(ctx, imagenAvatar, posXAvatar, posYAvatar, tamañoAvatar);
        
        // Dibujar panel para mensaje estilo Discord
        const margenTexto = 40;
        const posXTexto = margenTexto;
        const posYTexto = posYAvatar + tamañoAvatar + 50;
        const anchoTextoMax = ANCHO - (margenTexto * 2);
        const altoEstimadoTexto = 80;
        
        dibujarPanelTextoDiscord(ctx, posXTexto - 20, posYTexto - 35, anchoTextoMax + 40, altoEstimadoTexto);
        
        // Dibujar texto con estilo Discord
        dibujarTextoDiscord(ctx, mensajeTexto, posXTexto, posYTexto, anchoTextoMax);
        
        // Añadir etiqueta "Boost Card" estilo Discord
        ctx.font = '16px Oswald';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.textAlign = 'right';
        ctx.fillText('Boost Card', ANCHO - 20, ALTO - 15);
        
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
