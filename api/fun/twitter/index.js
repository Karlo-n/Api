// api/fun/twitter/index.js
const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * API de Tarjetas de Twitter - Genera una imagen que simula un tweet
 * Versión completamente rediseñada para imitar con precisión el diseño original
 */
router.get("/", async (req, res) => {
    try {
        // Extraer parámetros
        const { 
            nombre, 
            usuario, 
            pfp, 
            texto,
            verificado = "false",
            color = "blanco",
            imagen,
            likes = "0",
            retweets = "0", 
            comentarios = "0",
            fecha = "Ahora"
        } = req.query;

        // Validar parámetros obligatorios
        if (!nombre || !usuario || !texto) {
            return res.status(400).json({ 
                error: "Faltan parámetros obligatorios",
                obligatorios: ["nombre", "usuario", "texto"],
                ejemplo: "/api/fun/twitter?nombre=Juan%20Pérez&usuario=juanperez&pfp=https://ejemplo.com/perfil.jpg&texto=¡Hola%20Mundo!"
            });
        }

        // Cargar imagen de perfil
        let profileImageBuffer;
        if (pfp) {
            try {
                const profileResponse = await axios.get(pfp, { 
                    responseType: 'arraybuffer',
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                profileImageBuffer = Buffer.from(profileResponse.data);
            } catch (profileError) {
                console.warn("Error cargando imagen de perfil, se usará imagen predeterminada");
            }
        }

        // Cargar imagen adjunta si se proporciona
        let attachedImageBuffer;
        if (imagen) {
            try {
                const imageResponse = await axios.get(imagen, {
                    responseType: 'arraybuffer',
                    timeout: 8000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                attachedImageBuffer = Buffer.from(imageResponse.data);
            } catch (imageError) {
                console.warn("Error cargando imagen adjunta");
            }
        }

        // Cargar iconos necesarios
        const iconos = await cargarIconos();

        // Generar imagen de tarjeta de Twitter
        try {
            const cardBuffer = await generarTarjetaTwitter({
                nombre,
                usuario,
                profileImageBuffer,
                texto,
                verificado: verificado.toLowerCase() === "true",
                tema: color.toLowerCase(),
                attachedImageBuffer,
                likes: parseInt(likes) || 0,
                retweets: parseInt(retweets) || 0,
                comentarios: parseInt(comentarios) || 0,
                fecha,
                iconos
            });

            // Devolver la imagen directamente
            res.setHeader('Content-Type', 'image/png');
            res.send(cardBuffer);
        } catch (imageError) {
            console.error("Error en la generación de la imagen:", imageError);
            res.status(500).json({
                error: "Error al generar la imagen",
                detalles: imageError.message
            });
        }

    } catch (error) {
        console.error("Error al generar tarjeta de Twitter:", error);
        res.status(500).json({ 
            error: "Error al generar tarjeta de Twitter",
            detalles: error.message
        });
    }
});

/**
 * Carga los iconos necesarios para la generación del tweet
 */
async function cargarIconos() {
    const iconos = {};
    const iconsPath = path.join(__dirname);
    
    try {
        // Cargar iconos si existen
        const iconFiles = {
            verificado: 'verificado.png',
            like: 'like.png',
            retweet: 'retweet.png',
            comentario: 'comentario.png',
            compartir: 'compartir.png',
            logo: 'logo.png',
            defaultAvatar: 'default_profile.png'
        };
        
        for (const [nombre, archivo] of Object.entries(iconFiles)) {
            const iconPath = path.join(iconsPath, archivo);
            if (fs.existsSync(iconPath)) {
                iconos[nombre] = await loadImage(iconPath);
            }
        }
        
        return iconos;
    } catch (error) {
        console.error("Error al cargar iconos:", error);
        return {};
    }
}

/**
 * Genera una imagen de tarjeta de Twitter
 * Función rediseñada para imitar con precisión el diseño original
 */
async function generarTarjetaTwitter(opciones) {
    // Calcular la altura necesaria según el contenido
    const ancho = 600;
    
    // Estimar altura para texto y posibles imágenes
    const lineasEstimadas = Math.ceil(opciones.texto.length / 60);
    let altoEstimado = 200 + (lineasEstimadas * 22);
    
    // Añadir espacio para imagen si existe
    if (opciones.attachedImageBuffer) {
        altoEstimado += 300; // Espacio para imagen
    }
    
    const alto = Math.max(altoEstimado, 350); // Mínimo 350px
    
    // Crear canvas
    const canvas = createCanvas(ancho, alto);
    const ctx = canvas.getContext("2d");
    
    // Temas disponibles (colores precisos de Twitter)
    const temas = {
        blanco: {
            fondo: "#ffffff",
            texto: "#0f1419",
            textoSecundario: "#536471",
            borde: "#eff3f4",
            separador: "#eff3f4",
            iconoInactivo: "#536471",
            like: {
                inactivo: "#536471",
                activo: "#f91880"
            },
            retweet: {
                inactivo: "#536471", 
                activo: "#00ba7c"
            },
            comentario: "#536471",
            verificado: "#1d9bf0"
        },
        negro: {
            fondo: "#000000",
            texto: "#e7e9ea",
            textoSecundario: "#71767b",
            borde: "#2f3336",
            separador: "#2f3336",
            iconoInactivo: "#71767b",
            like: {
                inactivo: "#71767b",
                activo: "#f91880"
            },
            retweet: {
                inactivo: "#71767b",
                activo: "#00ba7c"
            },
            comentario: "#71767b",
            verificado: "#1d9bf0"
        },
        oscuro: {
            fondo: "#15202b",
            texto: "#f7f9f9",
            textoSecundario: "#8899a6",
            borde: "#38444d",
            separador: "#38444d",
            iconoInactivo: "#8899a6",
            like: {
                inactivo: "#8899a6",
                activo: "#f91880"
            },
            retweet: {
                inactivo: "#8899a6",
                activo: "#00ba7c"
            },
            comentario: "#8899a6",
            verificado: "#1d9bf0"
        }
    };
    
    // Seleccionar tema o usar blanco como predeterminado
    const tema = temas[opciones.tema] || temas.blanco;
    
    // Rellenar fondo
    ctx.fillStyle = tema.fondo;
    ctx.fillRect(0, 0, ancho, alto);
    
    // Dibujar línea superior de borde
    ctx.fillStyle = tema.separador;
    ctx.fillRect(0, 0, ancho, 1);
    
    // Constantes de diseño
    const padding = 16;
    const avatarSize = 48;
    const avatarX = padding;
    const avatarY = padding;
    const contentStartX = avatarX + avatarSize + 12;
    
    // Dibujar avatar
    try {
        let avatarImage;
        
        if (opciones.profileImageBuffer) {
            avatarImage = await loadImage(opciones.profileImageBuffer);
        } else if (opciones.iconos.defaultAvatar) {
            avatarImage = opciones.iconos.defaultAvatar;
        } else {
            // Si no hay imagen, dibujar círculo con iniciales
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
            ctx.fillStyle = "#1d9bf0";
            ctx.fill();
            
            // Añadir iniciales
            const iniciales = getInitials(opciones.nombre);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(iniciales, avatarX + avatarSize/2, avatarY + avatarSize/2);
        }
        
        // Si hay imagen, dibujarla en círculo
        if (avatarImage) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
        }
        
        // Dibujar nombre y usuario
        ctx.fillStyle = tema.texto;
        ctx.font = "bold 15px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(opciones.nombre, contentStartX, avatarY + 2);
        
        // Dibujar insignia verificada si aplica
        if (opciones.verificado) {
            const nombreWidth = ctx.measureText(opciones.nombre).width;
            
            if (opciones.iconos.verificado) {
                // Usar la imagen de verificación si está disponible
                const badgeSize = 18;
                ctx.drawImage(
                    opciones.iconos.verificado, 
                    contentStartX + nombreWidth + 4, 
                    avatarY + 2, 
                    badgeSize, 
                    badgeSize
                );
            } else {
                // Dibujar un círculo azul con un check blanco
                const badgeX = contentStartX + nombreWidth + 8;
                const badgeY = avatarY + 6;
                const badgeSize = 16;
                
                // Círculo azul
                ctx.beginPath();
                ctx.arc(badgeX, badgeY, badgeSize/2, 0, Math.PI * 2);
                ctx.fillStyle = tema.verificado;
                ctx.fill();
                
                // Check blanco
                ctx.beginPath();
                ctx.moveTo(badgeX - 4, badgeY);
                ctx.lineTo(badgeX - 1, badgeY + 3);
                ctx.lineTo(badgeX + 4, badgeY - 2);
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }
        
        // Dibujar @usuario
        ctx.fillStyle = tema.textoSecundario;
        ctx.font = "14px Arial";
        ctx.fillText(`@${opciones.usuario}`, contentStartX, avatarY + 22);
        
        // Dibujar fecha
        const usuarioWidth = ctx.measureText(`@${opciones.usuario}`).width;
        ctx.fillText(` · ${opciones.fecha}`, contentStartX + usuarioWidth, avatarY + 22);
        
        // Dibujar texto del tweet
        ctx.fillStyle = tema.texto;
        ctx.font = "16px Arial";
        ctx.textBaseline = "top";
        
        // Ajustar texto a múltiples líneas
        const maxWidth = ancho - contentStartX - padding;
        const lines = wrapText(ctx, opciones.texto, maxWidth);
        
        let textY = avatarY + avatarSize + 10;
        let lineHeight = 22;
        
        // Dibujar cada línea del texto
        lines.forEach((line, index) => {
            // Procesar la línea para resaltar enlaces, hashtags y menciones
            const segments = processTextForHighlighting(line);
            let currentX = contentStartX;
            
            segments.forEach(segment => {
                // Establecer el color según el tipo de texto
                ctx.fillStyle = segment.isHighlighted ? "#1d9bf0" : tema.texto;
                ctx.fillText(segment.text, currentX, textY);
                currentX += ctx.measureText(segment.text).width;
            });
            
            textY += lineHeight;
        });
        
        // Dibujar imagen adjunta si existe
        let currentY = textY + 10;
        
        if (opciones.attachedImageBuffer) {
            try {
                const tweetImage = await loadImage(opciones.attachedImageBuffer);
                
                // Calcular dimensiones manteniendo proporción
                const maxImgWidth = ancho - (padding * 2);
                const maxImgHeight = 280;
                
                // Ajustar dimensiones
                let imgWidth = maxImgWidth;
                let imgHeight = (imgWidth / tweetImage.width) * tweetImage.height;
                
                if (imgHeight > maxImgHeight) {
                    imgHeight = maxImgHeight;
                    imgWidth = (imgHeight / tweetImage.height) * tweetImage.width;
                }
                
                // Dibujar imagen con bordes redondeados
                const imgX = padding;
                const imgY = currentY;
                
                // Bordes redondeados
                ctx.save();
                roundedRect(ctx, imgX, imgY, imgWidth, imgHeight, 16);
                ctx.clip();
                ctx.drawImage(tweetImage, imgX, imgY, imgWidth, imgHeight);
                ctx.restore();
                
                // Actualizar posición actual
                currentY = imgY + imgHeight + 12;
            } catch (imgError) {
                console.warn("Error al dibujar imagen adjunta:", imgError);
            }
        }
        
        // Dibujar línea de tiempo
        const timeInfoY = currentY + 4;
        ctx.fillStyle = tema.textoSecundario;
        ctx.font = "14px Arial";
        ctx.fillText("3:42 PM · Abr 9, 2025 · ", contentStartX, timeInfoY);
        
        // Texto "Twitter Web App"
        ctx.fillStyle = "#1d9bf0";
        const timeTextWidth = ctx.measureText("3:42 PM · Abr 9, 2025 · ").width;
        ctx.fillText("Twitter Web App", contentStartX + timeTextWidth, timeInfoY);
        
        // Dibujar línea separadora antes de las estadísticas
        const statsSeparatorY = timeInfoY + 24;
        ctx.fillStyle = tema.separador;
        ctx.fillRect(padding, statsSeparatorY, ancho - (padding * 2), 1);
        
        // Dibujar estadísticas (retweets, citas, likes)
        const statsY = statsSeparatorY + 12;
        ctx.fillStyle = tema.textoSecundario;
        ctx.font = "14px Arial";
        
        // Formatear números para estadísticas
        const retweetsText = formatNumber(opciones.retweets);
        const likesText = formatNumber(opciones.likes);
        const commentsText = formatNumber(opciones.comentarios);
        
        // Dibujar estadísticas con sus valores
        if (opciones.retweets > 0) {
            ctx.fillStyle = tema.texto;
            ctx.font = "bold 14px Arial";
            ctx.fillText(retweetsText, contentStartX, statsY);
            
            ctx.fillStyle = tema.textoSecundario;
            ctx.font = "14px Arial";
            const retweetsNumWidth = ctx.measureText(retweetsText).width;
            ctx.fillText(" Retweets", contentStartX + retweetsNumWidth, statsY);
        }
        
        // Comentarios si hay
        if (opciones.comentarios > 0) {
            const commentsX = contentStartX + 100;
            ctx.fillStyle = tema.texto;
            ctx.font = "bold 14px Arial";
            ctx.fillText(commentsText, commentsX, statsY);
            
            ctx.fillStyle = tema.textoSecundario;
            ctx.font = "14px Arial";
            const commentsNumWidth = ctx.measureText(commentsText).width;
            ctx.fillText(" Comentarios", commentsX + commentsNumWidth, statsY);
        }
        
        // Likes si hay
        if (opciones.likes > 0) {
            const likesX = contentStartX + 250;
            ctx.fillStyle = tema.texto;
            ctx.font = "bold 14px Arial";
            ctx.fillText(likesText, likesX, statsY);
            
            ctx.fillStyle = tema.textoSecundario;
            ctx.font = "14px Arial";
            const likesNumWidth = ctx.measureText(likesText).width;
            ctx.fillText(" Me gusta", likesX + likesNumWidth, statsY);
        }
        
        // Dibujar línea separadora después de las estadísticas
        const actionsSeparatorY = statsY + 24;
        ctx.fillStyle = tema.separador;
        ctx.fillRect(padding, actionsSeparatorY, ancho - (padding * 2), 1);
        
        // Dibujar iconos de acciones (comentar, retweet, like, compartir)
        const actionsY = actionsSeparatorY + 12 + 12; // +12 para centrar verticalmente
        const actionIconSize = 20;
        const actionSpacing = (ancho - padding * 2) / 4;
        
        // Dibujar cada icono
        const iconPositions = [
            { x: padding + actionSpacing/2 - actionIconSize/2, icon: 'comentario' },
            { x: padding + actionSpacing*1.5 - actionIconSize/2, icon: 'retweet' },
            { x: padding + actionSpacing*2.5 - actionIconSize/2, icon: 'like' },
            { x: padding + actionSpacing*3.5 - actionIconSize/2, icon: 'compartir' }
        ];
        
        // Dibujar los iconos
        iconPositions.forEach(pos => {
            if (opciones.iconos[pos.icon]) {
                // Usar el icono cargado si está disponible
                ctx.drawImage(opciones.iconos[pos.icon], pos.x, actionsY - actionIconSize/2, actionIconSize, actionIconSize);
            } else {
                // Dibujar el icono manualmente si no está disponible
                drawActionIcon(ctx, pos.icon, pos.x, actionsY, actionIconSize, tema);
            }
        });
        
        // Dibujar línea separadora final
        ctx.fillStyle = tema.separador;
        ctx.fillRect(0, alto - 1, ancho, 1);
        
        // Devolver la imagen como buffer
        return canvas.toBuffer('image/png');
        
    } catch (error) {
        console.error("Error generando tarjeta de Twitter:", error);
        throw error;
    }
}

/**
 * Dibuja un icono de acción si no está disponible como imagen
 */
function drawActionIcon(ctx, iconType, x, y, size, tema) {
    ctx.save();
    
    switch (iconType) {
        case 'comentario':
            // Dibujar icono de comentario (bocadillo)
            ctx.beginPath();
            ctx.moveTo(x + size/2, y - size/2 + size/5);
            ctx.quadraticCurveTo(x, y - size/2 + size/5, x, y);
            ctx.quadraticCurveTo(x, y + size/2, x + size/2, y + size/2);
            ctx.lineTo(x + size - size/4, y + size/2);
            ctx.lineTo(x + size - size/4, y + size/2 + size/4);
            ctx.lineTo(x + size - size/2, y + size/2);
            ctx.lineTo(x + size - size/4, y + size/2);
            ctx.quadraticCurveTo(x + size, y + size/2, x + size, y);
            ctx.quadraticCurveTo(x + size, y - size/2 + size/5, x + size/2, y - size/2 + size/5);
            ctx.strokeStyle = tema.comentario;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            break;
            
        case 'retweet':
            // Dibujar icono de retweet
            ctx.beginPath();
            // Flecha superior
            ctx.moveTo(x + size * 0.25, y - size * 0.2);
            ctx.lineTo(x + size * 0.5, y - size * 0.4);
            ctx.lineTo(x + size * 0.75, y - size * 0.2);
            // Línea vertical superior
            ctx.moveTo(x + size * 0.5, y - size * 0.4);
            ctx.lineTo(x + size * 0.5, y + size * 0.1);
            // Flecha inferior
            ctx.moveTo(x + size * 0.75, y + size * 0.2);
            ctx.lineTo(x + size * 0.5, y + size * 0.4);
            ctx.lineTo(x + size * 0.25, y + size * 0.2);
            // Línea vertical inferior
            ctx.moveTo(x + size * 0.5, y + size * 0.4);
            ctx.lineTo(x + size * 0.5, y - size * 0.1);
            
            ctx.strokeStyle = tema.retweet.inactivo;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            break;
            
        case 'like':
            // Dibujar icono de corazón
            ctx.beginPath();
            ctx.moveTo(x + size/2, y + size/2);
            ctx.bezierCurveTo(
                x + size/2, y + size/4,
                x, y - size/4,
                x + size/4, y - size/2
            );
            ctx.bezierCurveTo(
                x + size/2, y - size/2 - size/4,
                x + size - size/4, y - size/2,
                x + size - size/2, y - size/4
            );
            ctx.bezierCurveTo(
                x + size, y,
                x + size/2, y + size/4,
                x + size/2, y + size/2
            );
            
            ctx.strokeStyle = tema.like.inactivo;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            break;
            
        case 'compartir':
            // Dibujar icono de compartir
            ctx.beginPath();
            // Caja de compartir
            ctx.rect(x + size * 0.25, y - size * 0.2, size * 0.5, size * 0.4);
            // Flecha hacia arriba
            ctx.moveTo(x + size * 0.5, y - size * 0.4);
            ctx.lineTo(x + size * 0.5, y + size * 0.4);
            ctx.moveTo(x + size * 0.3, y - size * 0.2);
            ctx.lineTo(x + size * 0.5, y - size * 0.4);
            ctx.lineTo(x + size * 0.7, y - size * 0.2);
            
            ctx.strokeStyle = tema.iconoInactivo;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            break;
    }
    
    ctx.restore();
}

/**
 * Obtiene las iniciales de un nombre
 */
function getInitials(name) {
    if (!name) return "??";
    
    const words = name.split(' ');
    if (words.length === 1) {
        return name.substring(0, 2).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

/**
 * Formatea números para mostrar con sufijos K, M
 */
function formatNumber(num) {
    num = parseInt(num) || 0;
    
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}

/**
 * Divide texto en líneas que quepan en el ancho especificado
 */
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth) {
            // Si la palabra es demasiado larga para caber en una línea
            if (!currentLine) {
                // Dividir la palabra si es necesario
                let partialWord = '';
                for (let j = 0; j < word.length; j++) {
                    const testChar = partialWord + word[j];
                    if (ctx.measureText(testChar).width <= maxWidth) {
                        partialWord = testChar;
                    } else {
                        lines.push(partialWord);
                        partialWord = word[j];
                    }
                }
                if (partialWord) {
                    currentLine = partialWord;
                }
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

/**
 * Procesa texto para resaltar enlaces, hashtags y menciones
 */
function processTextForHighlighting(text) {
    // Dividir el texto en partes normales y resaltadas
    const segments = [];
    const regex = /(@\w+|#\w+|https?:\/\/\S+|\.\w+)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Añadir texto normal antes del resaltado
        if (match.index > lastIndex) {
            segments.push({
                text: text.substring(lastIndex, match.index),
                isHighlighted: false
            });
        }

        // Añadir texto resaltado
        segments.push({
            text: match[0],
            isHighlighted: true
        });

        lastIndex = match.index + match[0].length;
    }

    // Añadir cualquier texto restante
    if (lastIndex < text.length) {
        segments.push({
            text: text.substring(lastIndex),
            isHighlighted: false
        });
    }

    return segments;
}

/**
 * Dibuja un rectángulo con bordes redondeados
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
