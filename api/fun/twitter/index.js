// api/fun/twitter/index.js
const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * API de Tarjetas de Twitter - Genera una imagen que simula un tweet
 * Versión rediseñada para replicar exactamente la interfaz de Twitter/X con fondo negro
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
            comentarios = "0"
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
            comentarios: parseInt(comentarios) || 0
        });

        // Responder con la imagen
        res.setHeader('Content-Type', 'image/png');
        res.send(tweetBuffer);

    } catch (error) {
        console.error("Error al generar tweet:", error);
        res.status(500).json({ 
            error: "Error al generar la imagen del tweet",
            detalles: error.message
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
    const textLines = Math.ceil(opciones.texto.length / 50);
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
        iconos: "#8B98A5"
    };

    // Dibujar fondo negro
    ctx.fillStyle = colores.fondo;
    ctx.fillRect(0, 0, width, height);

    // Dibujar línea divisoria superior (sutil)
    ctx.fillStyle = colores.separador;
    ctx.fillRect(0, 0, width, 1);

    // Calcular posiciones
    const padding = 16;
    const avatarSize = 48;
    const avatarX = padding;
    const avatarY = padding;
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
    ctx.font = "16px Arial";
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
    
    // Dibujar información de interacciones
    const statsY = currentY;
    ctx.font = "13px Arial";
    ctx.fillStyle = colores.textoSecundario;
    
    // Formato: "36 respuestas · 144 Retweets · 3 mil Me gusta · 43 mil reproducciones"
    const statsText = [
        opciones.comentarios > 0 ? `${formatNumber(opciones.comentarios)} ${opciones.comentarios === 1 ? 'respuesta' : 'respuestas'}` : null,
        opciones.retweets > 0 ? `${formatNumber(opciones.retweets)} Retweets` : null,
        opciones.likes > 0 ? `${formatNumber(opciones.likes)} Me gusta` : null,
        "43 mil reproducciones"
    ].filter(Boolean).join(" · ");
    
    ctx.fillText(statsText, contentX, statsY);
    
    // Dibujar línea divisoria antes de la barra de acciones
    const actionBarY = statsY + 24;
    ctx.fillStyle = colores.separador;
    ctx.fillRect(0, actionBarY, width, 1);
    
    // Dibujar barra de acciones (íconos)
    const iconSize = 18;
    const iconY = actionBarY + 20;
    const iconSpacing = (width - padding * 2) / 5;
    
    // Íconos y posiciones
    const icons = [
        { x: padding + iconSpacing/2 - 10, type: 'comment' },
        { x: padding + iconSpacing*1.5 - 10, type: 'retweet' },
        { x: padding + iconSpacing*2.5 - 10, type: 'heart' },
        { x: padding + iconSpacing*3.5 - 10, type: 'bookmark' },
        { x: padding + iconSpacing*4.5 - 10, type: 'share' }
    ];
    
    // Dibujar cada icono
    icons.forEach(icon => {
        drawTwitterIcon(ctx, icon.type, icon.x, iconY, iconSize, colores);
    });
    
    // Dibujar línea divisoria inferior
    ctx.fillStyle = colores.separador;
    ctx.fillRect(0, height - 1, width, 1);
    
    return canvas.toBuffer('image/png');
}

/**
 * Dibuja los iconos de Twitter con alta fidelidad
 */
function drawTwitterIcon(ctx, type, x, y, size, colores) {
    ctx.save();
    ctx.strokeStyle = colores.iconos;
    ctx.fillStyle = colores.iconos;
    ctx.lineWidth = 1.5;
    
    // La posición y es el centro del icono
    const halfSize = size / 2;
    
    switch (type) {
        case 'comment':
            // Dibujar icono de comentario (bocadillo)
            ctx.beginPath();
            // Forma de bocadillo
            ctx.moveTo(x + halfSize - 8, y - 6);
            ctx.lineTo(x + halfSize + 8, y - 6);
            ctx.quadraticCurveTo(x + halfSize + 10, y - 6, x + halfSize + 10, y - 4);
            ctx.lineTo(x + halfSize + 10, y + 2);
            ctx.quadraticCurveTo(x + halfSize + 10, y + 4, x + halfSize + 8, y + 4);
            ctx.lineTo(x + halfSize + 2, y + 4);
            ctx.lineTo(x + halfSize, y + 8);
            ctx.lineTo(x + halfSize - 2, y + 4);
            ctx.lineTo(x + halfSize - 8, y + 4);
            ctx.quadraticCurveTo(x + halfSize - 10, y + 4, x + halfSize - 10, y + 2);
            ctx.lineTo(x + halfSize - 10, y - 4);
            ctx.quadraticCurveTo(x + halfSize - 10, y - 6, x + halfSize - 8, y - 6);
            ctx.stroke();
            break;
            
        case 'retweet':
            // Dibujar icono de retweet (flechas circulares)
            ctx.beginPath();
            // Flecha izquierda
            ctx.moveTo(x + halfSize - 7, y - 1);
            ctx.lineTo(x + halfSize - 3, y - 5);
            ctx.lineTo(x + halfSize + 1, y - 1);
            // Flecha derecha
            ctx.moveTo(x + halfSize + 7, y + 1);
            ctx.lineTo(x + halfSize + 3, y + 5);
            ctx.lineTo(x + halfSize - 1, y + 1);
            // Líneas conectoras
            ctx.moveTo(x + halfSize - 3, y - 5);
            ctx.lineTo(x + halfSize - 3, y);
            ctx.lineTo(x + halfSize + 3, y);
            ctx.lineTo(x + halfSize + 3, y + 5);
            ctx.stroke();
            break;
            
        case 'heart':
            // Dibujar icono de corazón
            ctx.beginPath();
            ctx.moveTo(x + halfSize, y + 5);
            ctx.bezierCurveTo(
                x + halfSize - 8, y - 3,
                x + halfSize - 8, y - 8,
                x + halfSize, y - 3
            );
            ctx.bezierCurveTo(
                x + halfSize + 8, y - 8,
                x + halfSize + 8, y - 3,
                x + halfSize, y + 5
            );
            ctx.stroke();
            break;
            
        case 'bookmark':
            // Dibujar icono de marcador
            ctx.beginPath();
            ctx.moveTo(x + halfSize - 5, y - 7);
            ctx.lineTo(x + halfSize - 5, y + 7);
            ctx.lineTo(x + halfSize, y + 4);
            ctx.lineTo(x + halfSize + 5, y + 7);
            ctx.lineTo(x + halfSize + 5, y - 7);
            ctx.closePath();
            ctx.stroke();
            break;
            
        case 'share':
            // Dibujar icono de compartir (flecha hacia arriba con línea)
            ctx.beginPath();
            ctx.moveTo(x + halfSize, y - 7);
            ctx.lineTo(x + halfSize, y + 5);
            ctx.moveTo(x + halfSize - 5, y - 2);
            ctx.lineTo(x + halfSize, y - 7);
            ctx.lineTo(x + halfSize + 5, y - 2);
            // Base
            ctx.moveTo(x + halfSize - 6, y + 5);
            ctx.lineTo(x + halfSize + 6, y + 5);
            ctx.stroke();
            break;
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
 */
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
        const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    
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
