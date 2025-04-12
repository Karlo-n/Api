// api/fun/twitter/index.js
const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * API de Tarjetas de Twitter - Genera una imagen que simula un tweet
 * Versión simple sin dependencias adicionales
 */
router.get("/", async (req, res) => {
    try {
        // Extraer parámetros
        const { 
            nombre = "Usuario", 
            usuario = "usuario", 
            pfp, 
            texto = "Tweet de ejemplo",
            verificado = "false",
            imagen,
            likes = "0",
            retweets = "0", 
            comentarios = "0",
            reproducciones = "43000"
        } = req.query;

        // Cargar imagen de perfil
        let profileImage = null;
        if (pfp) {
            try {
                const response = await axios.get(pfp, { 
                    responseType: 'arraybuffer',
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                profileImage = await loadImage(Buffer.from(response.data));
            } catch (error) {
                console.warn("Error cargando imagen de perfil:", error.message);
            }
        }

        // Cargar imagen adjunta si se proporciona
        let tweetImage = null;
        if (imagen) {
            try {
                const response = await axios.get(imagen, {
                    responseType: 'arraybuffer',
                    timeout: 8000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                tweetImage = await loadImage(Buffer.from(response.data));
            } catch (error) {
                console.warn("Error cargando imagen adjunta:", error.message);
            }
        }

        // Generar la imagen del tweet
        const tweetBuffer = await generarTweetExacto({
            nombre,
            usuario,
            profileImage,
            texto, 
            verificado: verificado.toLowerCase() === "true",
            tweetImage,
            likes: parseInt(likes) || 0,
            retweets: parseInt(retweets) || 0,
            comentarios: parseInt(comentarios) || 0,
            reproducciones: parseInt(reproducciones) || 43000
        });

        // Responder con la imagen
        res.setHeader('Content-Type', 'image/png');
        res.send(tweetBuffer);

    } catch (error) {
        console.error("Error al generar tweet:", error);
        res.status(500).json({ 
            error: "Error al generar la imagen del tweet",
            detalles: error.message,
            ejemplo: "/api/fun/twitter?nombre=AQUINO&usuario=AQUINOby_02&texto=Recién ando regresando a mi casa, gracias a todos los que fueron 👍&verificado=true"
        });
    }
});

/**
 * Genera una imagen de tweet idéntica a la interfaz de Twitter con fondo negro
 */
async function generarTweetExacto(opciones) {
    // Configurar dimensiones del canvas
    const width = 600;
    let height = 250; // Altura base

    // Estimar altura necesaria basada en el texto
    const textLength = opciones.texto.length;
    const textLines = Math.ceil(textLength / 50);
    height += Math.max(0, textLines - 2) * 24;

    // Añadir altura para imagen adjunta si existe
    if (opciones.tweetImage) {
        height += 300;
    }

    // Crear canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Configuración de colores exactos de Twitter con tema negro
    const colores = {
        fondo: "#000000",
        texto: "#D9D9D9",
        textoSecundario: "#8B98A5",
        separador: "#2F3336",
        verificado: "#1D9BF0",
        corazon: "#F91880",
        retweet: "#00BA7C",
        iconos: "#8B98A5",
        flechaVolver: "#1D9BF0"
    };

    // Dibujar fondo negro
    ctx.fillStyle = colores.fondo;
    ctx.fillRect(0, 0, width, height);

    // Dibujar línea divisoria superior (sutil)
    ctx.fillStyle = colores.separador;
    ctx.fillRect(0, 0, width, 1);

    // Dibujar flecha azul de volver atrás en la esquina superior izquierda
    const flechaX = 20;
    const flechaY = 20;
    ctx.strokeStyle = colores.flechaVolver;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Línea horizontal de la flecha
    ctx.moveTo(flechaX + 10, flechaY);
    ctx.lineTo(flechaX, flechaY);
    // Punta de la flecha
    ctx.lineTo(flechaX + 5, flechaY - 5);
    ctx.moveTo(flechaX, flechaY);
    ctx.lineTo(flechaX + 5, flechaY + 5);
    ctx.stroke();

    // Calcular posiciones
    const padding = 16;
    const avatarSize = 48;
    const avatarX = padding;
    const avatarY = padding + 20; // Añadir espacio para la flecha de volver
    const contentX = avatarX + avatarSize + 12;

    // Dibujar avatar
    if (opciones.profileImage) {
        // Crear máscara circular para avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(opciones.profileImage, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } else {
        // Avatar placeholder circular
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.fillStyle = "#1D9BF0";
        ctx.fill();

        // Iniciales en avatar placeholder
        const initials = getInitials(opciones.nombre);
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(initials, avatarX + avatarSize/2, avatarY + avatarSize/2);
    }

    // Dibujar nombre y usuario
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    
    // Nombre con texto más claro
    ctx.font = "bold 15px Arial";
    ctx.fillStyle = colores.texto;
    ctx.fillText(opciones.nombre, contentX, avatarY);
    
    // Badge verificado
    if (opciones.verificado) {
        const nombreWidth = ctx.measureText(opciones.nombre).width;
        const badgeX = contentX + nombreWidth + 4;
        const badgeY = avatarY + 2;
        const badgeSize = 16;
        
        // Círculo azul
        ctx.beginPath();
        ctx.arc(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2, 0, Math.PI * 2);
        ctx.fillStyle = colores.verificado;
        ctx.fill();
        
        // Check blanco dentro del círculo
        ctx.beginPath();
        ctx.moveTo(badgeX + 4, badgeY + 8);
        ctx.lineTo(badgeX + 7, badgeY + 11);
        ctx.lineTo(badgeX + 12, badgeY + 6);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Username y fecha con texto más apagado
    ctx.font = "14px Arial";
    ctx.fillStyle = colores.textoSecundario;
    ctx.fillText(`@${opciones.usuario} · 9 abr.`, contentX, avatarY + 20);
    
    // Dibujar puntos suspensivos (menú)
    const dotsX = width - padding - 20;
    const dotsY = avatarY + 10;
    ctx.fillStyle = colores.textoSecundario;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(dotsX, dotsY + i * 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Dibujar texto del tweet
    ctx.font = "16px Arial, sans-serif";
    ctx.fillStyle = colores.texto;
    const textX = contentX;
    let textY = avatarY + avatarSize + 10;
    const lineHeight = 24;
    const maxWidth = width - contentX - padding;
    
    // Dividir texto en líneas
    const lines = wrapText(ctx, opciones.texto, maxWidth);
    
    // Dibujar cada línea del tweet
    lines.forEach(line => {
        ctx.fillText(line, textX, textY);
        textY += lineHeight;
    });
    
    // Posición actual después del texto
    let currentY = textY + 12;
    
    // Dibujar imagen del tweet si existe
    if (opciones.tweetImage) {
        const imgPadding = 4;
        const imgWidth = width - (contentX + imgPadding) - padding;
        const imgHeight = 280;
        const imgX = contentX;
        const imgY = currentY;
        
        // Dibujar imagen con bordes redondeados
        ctx.save();
        roundedRect(ctx, imgX, imgY, imgWidth, imgHeight, 16);
        ctx.clip();
        
        // Calcular dimensiones manteniendo proporción
        const aspectRatio = opciones.tweetImage.width / opciones.tweetImage.height;
        let drawWidth = imgWidth;
        let drawHeight = imgWidth / aspectRatio;
        
        // Ajustar si la altura es mayor a la disponible
        if (drawHeight > imgHeight) {
            drawHeight = imgHeight;
            drawWidth = imgHeight * aspectRatio;
        }
        
        // Calcular posición para centrar la imagen
        const offsetX = imgX + (imgWidth - drawWidth) / 2;
        const offsetY = imgY + (imgHeight - drawHeight) / 2;
        
        // Dibujar la imagen
        ctx.drawImage(opciones.tweetImage, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();
        
        // Actualizar posición actual
        currentY = imgY + imgHeight + 12;
    }
    
    // Dibujar línea divisoria antes de la barra de acciones
    const actionBarY = currentY + 5;
    ctx.fillStyle = colores.separador;
    ctx.fillRect(0, actionBarY, width, 1);
    
    // Dibujar barra de acciones (íconos con sus números)
    const iconSize = 18;
    const iconY = actionBarY + 24;
    const iconSpacing = width / 5.5; // Ajustar espaciado
    
    // Íconos de interacción con sus contadores
    const iconInfo = [
        { x: padding + 5, type: 'comment', count: opciones.comentarios, align: 'left' },
        { x: padding + iconSpacing, type: 'retweet', count: opciones.retweets, align: 'left' },
        { x: padding + iconSpacing * 2, type: 'heart', count: opciones.likes, align: 'left' },
        { x: padding + iconSpacing * 3, type: 'stats', count: opciones.reproducciones, align: 'left' },
        { x: width - padding - iconSpacing + 35, type: 'bookmark', count: 0, align: 'right' },
        { x: width - padding - 28, type: 'share', count: 0, align: 'right' }
    ];
    
    // Dibujar cada icono con su contador
    iconInfo.forEach(icon => {
        drawTwitterIconWithCounter(ctx, icon.type, icon.x, iconY, iconSize, icon.count, colores, icon.align);
    });
    
    // Dibujar línea divisoria inferior
    ctx.fillStyle = colores.separador;
    ctx.fillRect(0, height - 1, width, 1);
    
    return canvas.toBuffer('image/png');
}

/**
 * Dibuja los iconos de Twitter con sus contadores
 */
function drawTwitterIconWithCounter(ctx, type, x, y, size, count, colores, align) {
    ctx.save();
    
    // Configuración por defecto para iconos
    ctx.strokeStyle = colores.iconos;
    ctx.fillStyle = colores.iconos;
    ctx.lineWidth = 1.5;
    
    // Dibujar icono
    switch (type) {
        case 'comment':
            // Dibujar icono de comentario (bocadillo)
            ctx.beginPath();
            ctx.moveTo(x + 5, y - 3);
            ctx.lineTo(x + 17, y - 3);
            ctx.quadraticCurveTo(x + 19, y - 3, x + 19, y - 1);
            ctx.lineTo(x + 19, y + 5);
            ctx.quadraticCurveTo(x + 19, y + 7, x + 17, y + 7);
            ctx.lineTo(x + 13, y + 7);
            ctx.lineTo(x + 11, y + 10);
            ctx.lineTo(x + 9, y + 7);
            ctx.lineTo(x + 5, y + 7);
            ctx.quadraticCurveTo(x + 3, y + 7, x + 3, y + 5);
            ctx.lineTo(x + 3, y - 1);
            ctx.quadraticCurveTo(x + 3, y - 3, x + 5, y - 3);
            ctx.stroke();
            break;
            
        case 'retweet':
            // Dibujar icono de retweet (flechas circulares)
            ctx.beginPath();
            // Flecha izquierda (arriba)
            ctx.moveTo(x + 5, y - 3);
            ctx.lineTo(x + 9, y - 6);
            ctx.lineTo(x + 13, y - 3);
            // Flecha derecha (abajo)
            ctx.moveTo(x + 13, y + 3);
            ctx.lineTo(x + 9, y + 6);
            ctx.lineTo(x + 5, y + 3);
            // Líneas conectoras
            ctx.moveTo(x + 9, y - 6);
            ctx.lineTo(x + 9, y - 1);
            ctx.lineTo(x + 15, y - 1);
            ctx.lineTo(x + 15, y + 6);
            ctx.moveTo(x + 9, y + 6);
            ctx.lineTo(x + 9, y + 1);
            ctx.lineTo(x + 3, y + 1);
            ctx.lineTo(x + 3, y - 6);
            ctx.stroke();
            break;
            
        case 'heart':
            // Dibujar icono de corazón
            ctx.beginPath();
            ctx.moveTo(x + 11, y + 6);
            ctx.bezierCurveTo(
                x + 6, y - 1,
                x + 1, y + 1,
                x + 5, y - 4
            );
            ctx.bezierCurveTo(
                x + 7, y - 6,
                x + 11, y - 3,
                x + 11, y - 3
            );
            ctx.bezierCurveTo(
                x + 11, y - 3,
                x + 15, y - 6,
                x + 17, y - 4
            );
            ctx.bezierCurveTo(
                x + 21, y + 1,
                x + 16, y - 1,
                x + 11, y + 6
            );
            ctx.stroke();
            break;
            
        case 'bookmark':
            // Dibujar icono de marcador
            ctx.beginPath();
            ctx.moveTo(x + 6, y - 6);
            ctx.lineTo(x + 6, y + 6);
            ctx.lineTo(x + 11, y + 3);
            ctx.lineTo(x + 16, y + 6);
            ctx.lineTo(x + 16, y - 6);
            ctx.closePath();
            ctx.stroke();
            break;
            
        case 'share':
            // Dibujar icono de compartir (flecha hacia arriba con línea)
            ctx.beginPath();
            ctx.moveTo(x + 11, y - 6);
            ctx.lineTo(x + 11, y + 4);
            ctx.moveTo(x + 6, y - 3);
            ctx.lineTo(x + 11, y - 6);
            ctx.lineTo(x + 16, y - 3);
            // Base
            ctx.moveTo(x + 5, y + 4);
            ctx.lineTo(x + 17, y + 4);
            ctx.stroke();
            break;
            
        case 'stats':
            // Dibujar icono de estadísticas
            ctx.beginPath();
            // Barras verticales de diferentes alturas
            ctx.moveTo(x + 4, y);
            ctx.lineTo(x + 4, y + 6);
            ctx.moveTo(x + 9, y - 4);
            ctx.lineTo(x + 9, y + 6);
            ctx.moveTo(x + 14, y - 2);
            ctx.lineTo(x + 14, y + 6);
            ctx.moveTo(x + 19, y - 6);
            ctx.lineTo(x + 19, y + 6);
            // Línea base
            ctx.moveTo(x + 2, y + 6);
            ctx.lineTo(x + 21, y + 6);
            ctx.stroke();
            break;
    }
    
    // Dibujar contador si hay
    if (count > 0) {
        ctx.font = "13px Arial";
        ctx.fillStyle = colores.textoSecundario;
        ctx.textAlign = align === 'right' ? "right" : "left";
        ctx.textBaseline = "middle";
        
        const textX = align === 'right' ? x - 5 : x + 22;
        ctx.fillText(formatNumber(count), textX, y);
    }
    
    ctx.restore();
}

/**
 * Obtiene las iniciales de un nombre
 */
function getInitials(name) {
    if (!name || name.trim() === '') return '??';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
        return name.substring(0, 2).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

/**
 * Divide el texto en líneas que caben en el ancho especificado
 * Versión básica que funciona con el texto y emojis nativos
 */
function wrapText(ctx, text, maxWidth) {
    // Si el texto está vacío, devolver un array vacío
    if (!text || text.trim() === '') return [''];
    
    // Versión simplificada pero efectiva para dividir el texto en líneas
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width <= maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    
    if (currentLine.length > 0) {
        lines.push(currentLine);
    }
    
    return lines;
}

/**
 * Formatea números para mostrar en formato de Twitter
 * (1.5K, 3K, 3 mil, etc.)
 */
function formatNumber(num) {
    num = parseInt(num) || 0;
    
    if (num >= 1000000) {
        const millones = (num / 1000000).toFixed(1);
        return millones.endsWith('.0') 
            ? millones.slice(0, -2) + ' M' 
            : millones + ' M';
    }
    
    if (num >= 10000) {
        // Para >= 10000, Twitter muestra "43 mil" en lugar de "43K"
        return Math.floor(num / 1000) + ' mil';
    }
    
    if (num >= 1000) {
        const miles = (num / 1000).toFixed(1);
        return miles.endsWith('.0')
            ? miles.slice(0, -2) + 'K'
            : miles + 'K';
    }
    
    return num.toString();
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
