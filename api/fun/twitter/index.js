// api/fun/twitter/index.js
const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const router = express.Router();

/**
 * API de Tarjetas de Twitter - Genera una imagen que simula un tweet
 * Endpoint: /api/fun/twitter
 * 
 * Parámetros obligatorios:
 * - nombre: Nombre del usuario
 * - usuario: Nombre de usuario (sin @)
 * - pfp: URL de la foto de perfil
 * - texto: Contenido del tweet
 * 
 * Parámetros opcionales:
 * - verificado: "true" si la cuenta tiene insignia de verificación
 * - color: Color de fondo, "blanco" o "negro"
 * - imagen: URL de una imagen para adjuntar al tweet
 * - afilacion: Texto o URL de imagen de afiliación (YouTube, TikTok, etc.)
 * - importante: Designación especial (CEO, Presidente, etc.)
 * - likes: Número de me gusta
 * - favoritos: Número de comentarios
 * - compartidos: Número de retweets
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
            afilacion,
            importante,
            likes = "0",
            favoritos = "0",
            compartidos = "0"
        } = req.query;

        // Validar parámetros obligatorios
        if (!nombre || !usuario || !texto) {
            return res.status(400).json({ 
                error: "Faltan parámetros obligatorios",
                obligatorios: ["nombre", "usuario", "pfp", "texto"],
                ejemplo: "/api/fun/twitter?nombre=Juan%20Pérez&usuario=juanperez&pfp=https://ejemplo.com/perfil.jpg&texto=¡Hola%20Mundo!"
            });
        }

        // Generar imagen de tarjeta de Twitter
        try {
            const cardBuffer = await generarTarjetaTwitter({
                nombre,
                usuario,
                pfp: pfp || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", // Imagen predeterminada
                texto,
                verificado: verificado.toLowerCase() === "true",
                colorFondo: color.toLowerCase(),
                imagen,
                afilacion,
                importante,
                likes: parseInt(likes) || 0,
                favoritos: parseInt(favoritos) || 0,
                compartidos: parseInt(compartidos) || 0
            });

            // Devolver la imagen directamente
            res.setHeader('Content-Type', 'image/png');
            res.send(cardBuffer);
        } catch (imageError) {
            console.error("Error específico en la generación de la imagen:", imageError);
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
 * Genera una imagen de tarjeta similar a Twitter
 */
async function generarTarjetaTwitter(opciones) {
    // Establecer dimensiones
    const ancho = 600;
    const alto = opciones.imagen ? 550 : 320;
    const padding = 16;
    
    // Crear canvas
    const canvas = createCanvas(ancho, alto);
    const ctx = canvas.getContext("2d");
    
    // Establecer color de fondo
    if (opciones.colorFondo === "negro") {
        ctx.fillStyle = "#15202b"; // Modo oscuro de Twitter
    } else {
        ctx.fillStyle = "#ffffff"; // Modo claro de Twitter
    }
    ctx.fillRect(0, 0, ancho, alto);
    
    // Establecer color de texto según fondo
    const colorTexto = opciones.colorFondo === "negro" ? "#ffffff" : "#000000";
    const colorSecundario = opciones.colorFondo === "negro" ? "#8899a6" : "#536471";
    
    // Variables para posicionamiento
    const tamañoPerfil = 50;
    const perfilX = padding + tamañoPerfil/2;
    const perfilY = 40;
    const nombreX = perfilX + tamañoPerfil/2 + 15;
    const nombreY = perfilY - 10;
    
    try {
        // Cargar foto de perfil con manejo de error
        let imagenPerfil;
        try {
            imagenPerfil = await loadImage(opciones.pfp);
        } catch (error) {
            console.warn("No se pudo cargar la imagen de perfil, usando respaldo:", error.message);
            // Usar imagen genérica como respaldo
            imagenPerfil = await createDefaultProfileImage(ctx, tamañoPerfil);
        }
        
        // Dibujar foto de perfil (recorte circular)
        ctx.save();
        ctx.beginPath();
        ctx.arc(perfilX, perfilY, tamañoPerfil/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(imagenPerfil, perfilX - tamañoPerfil/2, perfilY - tamañoPerfil/2, tamañoPerfil, tamañoPerfil);
        ctx.restore();
        
        // Dibujar nombre de usuario e insignia de verificación
        ctx.fillStyle = colorTexto;
        ctx.font = "bold 18px Arial, sans-serif";
        
        ctx.fillText(opciones.nombre, nombreX, nombreY);
        
        // Dibujar insignia de verificación si está verificado
        if (opciones.verificado) {
            // Dibujar insignia verificada (círculo azul con marca de verificación blanca)
            const tamañoInsignia = 18;
            const insigniaX = nombreX + ctx.measureText(opciones.nombre).width + 5;
            const insigniaY = nombreY - tamañoInsignia/2;
            
            // Círculo azul
            ctx.fillStyle = "#1DA1F2";
            ctx.beginPath();
            ctx.arc(insigniaX + tamañoInsignia/2, insigniaY + tamañoInsignia/2, tamañoInsignia/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Marca de verificación blanca
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px Arial";
            ctx.fillText("✓", insigniaX + 4, insigniaY + 13);
        }
        
        // Dibujar nombre de usuario
        ctx.fillStyle = colorSecundario;
        ctx.font = "16px Arial, sans-serif";
        ctx.fillText(`@${opciones.usuario}`, nombreX, nombreY + 20);
        
        // Dibujar designación importante si se proporciona
        let importanteHeight = 0;
        if (opciones.importante) {
            const importanteX = nombreX;
            const importanteY = nombreY + 40;
            
            // Fondo para designación importante
            ctx.fillStyle = opciones.colorFondo === "negro" ? "#192734" : "#f7f9f9";
            const anchoImportante = ctx.measureText(opciones.importante).width + 20;
            const altoImportante = 24;
            dibujarRectanguloRedondeado(ctx, importanteX, importanteY - altoImportante + 5, anchoImportante, altoImportante, 12);
            ctx.fill();
            
            // Dibujar el texto con color especial
            ctx.fillStyle = "#1DA1F2"; // Azul de Twitter para importante
            ctx.font = "14px Arial, sans-serif";
            ctx.fillText(opciones.importante, importanteX + 10, importanteY);
            
            importanteHeight = 25;
        }
        
        // Dibujar insignia de afiliación si se proporciona
        let afilacionHeight = 0;
        let afilacionY = nombreY + 40 + importanteHeight;
        
        if (opciones.afilacion) {
            if (opciones.afilacion.startsWith("http")) {
                // Es una URL de imagen
                try {
                    const imagenAfiliacion = await loadImage(opciones.afilacion);
                    const tamañoAfiliacion = 24;
                    ctx.drawImage(imagenAfiliacion, nombreX, afilacionY - tamañoAfiliacion, tamañoAfiliacion, tamañoAfiliacion);
                    afilacionHeight = 30;
                } catch (error) {
                    console.warn("No se pudo cargar imagen de afiliación:", error.message);
                    // Simplemente no mostrar la imagen de afiliación
                }
            } else {
                // Es texto
                ctx.fillStyle = "#1DA1F2"; // Azul de Twitter
                ctx.font = "14px Arial, sans-serif";
                ctx.fillText(opciones.afilacion, nombreX, afilacionY);
                afilacionHeight = 25;
            }
        }
        
        // Dibujar texto del tweet
        ctx.fillStyle = colorTexto;
        ctx.font = "18px Arial, sans-serif";
        
        const textoX = padding;
        let textoY = nombreY + 40 + importanteHeight + afilacionHeight + 10;
        
        // Manejar ajuste de texto
        const anchoMaximo = ancho - (padding * 2);
        const textoAjustado = ajustarTexto(ctx, opciones.texto, anchoMaximo);
        
        let textoHeight = 0;
        textoAjustado.forEach(linea => {
            ctx.fillText(linea, textoX, textoY + textoHeight);
            textoHeight += 25;
        });
        
        // Dibujar imagen adjunta si se proporciona
        let imagenHeight = 0;
        let currentY = textoY + textoHeight + 15;
        
        if (opciones.imagen) {
            try {
                const imagenTweet = await loadImage(opciones.imagen);
                const altoMaximoImagen = 250;
                const anchoMaximoImagen = ancho - (padding * 2);
                
                // Calcular dimensiones manteniendo proporción de aspecto
                let anchoImg = imagenTweet.width;
                let altoImg = imagenTweet.height;
                
                if (anchoImg > anchoMaximoImagen) {
                    altoImg = (anchoMaximoImagen / anchoImg) * altoImg;
                    anchoImg = anchoMaximoImagen;
                }
                
                if (altoImg > altoMaximoImagen) {
                    anchoImg = (altoMaximoImagen / altoImg) * anchoImg;
                    altoImg = altoMaximoImagen;
                }
                
                // Dibujar la imagen con esquinas redondeadas
                const imagenX = padding;
                const imagenY = currentY;
                
                ctx.save();
                dibujarRectanguloRedondeado(ctx, imagenX, imagenY, anchoImg, altoImg, 16);
                ctx.clip();
                ctx.drawImage(imagenTweet, imagenX, imagenY, anchoImg, altoImg);
                ctx.restore();
                
                imagenHeight = altoImg + 20;
            } catch (error) {
                console.warn("No se pudo cargar imagen del tweet:", error.message);
                // Simplemente no mostrar la imagen
            }
        }
        
        // Dibujar contadores de interacción (likes, retweets, etc.)
        const iconosY = currentY + imagenHeight + 10;
        
        const espacioIconos = 150;
        
        // Icono de comentario
        ctx.fillStyle = colorSecundario;
        dibujarIconoComentario(ctx, padding, iconosY, colorSecundario);
        ctx.font = "14px Arial, sans-serif";
        ctx.fillText(formatearNumero(opciones.favoritos), padding + 30, iconosY + 5);
        
        // Icono de retweet
        dibujarIconoRetweet(ctx, padding + espacioIconos, iconosY, colorSecundario);
        ctx.fillText(formatearNumero(opciones.compartidos), padding + espacioIconos + 30, iconosY + 5);
        
        // Icono de me gusta
        dibujarIconoMeGusta(ctx, padding + (espacioIconos * 2), iconosY, colorSecundario);
        ctx.fillText(formatearNumero(opciones.likes), padding + (espacioIconos * 2) + 30, iconosY + 5);
        
        // Añadir marca de tiempo y marca de Twitter
        ctx.fillStyle = colorSecundario;
        ctx.font = "12px Arial, sans-serif";
        const ahora = new Date();
        const marcaTiempo = `${ahora.getHours()}:${ahora.getMinutes().toString().padStart(2, '0')} · ${ahora.toLocaleDateString()}`;
        ctx.fillText(marcaTiempo, ancho - 150, alto - 15);
        
        // Logo de Twitter en la esquina inferior derecha
        ctx.fillStyle = "#1DA1F2";
        dibujarIconoTwitter(ctx, ancho - 25, alto - 20, 15);
        
        // Devolver el buffer de imagen
        return canvas.toBuffer("image/png");
        
    } catch (error) {
        console.error("Error en generación de tarjeta Twitter:", error);
        throw error;
    }
}

/**
 * Crea una imagen de perfil predeterminada
 */
async function createDefaultProfileImage(ctx, size) {
    const canvas = createCanvas(size, size);
    const profileCtx = canvas.getContext('2d');
    
    // Fondo gris
    profileCtx.fillStyle = '#AAB8C2';
    profileCtx.fillRect(0, 0, size, size);
    
    // Silueta de usuario
    profileCtx.fillStyle = '#E1E8ED';
    profileCtx.beginPath();
    profileCtx.arc(size/2, size/3, size/6, 0, Math.PI * 2);
    profileCtx.fill();
    
    // Cuerpo de la silueta
    profileCtx.beginPath();
    profileCtx.arc(size/2, size + size/6, size/1.5, 0, Math.PI, true);
    profileCtx.fill();
    
    return canvas;
}

/**
 * Ajusta el texto para que quepa dentro de un ancho especificado
 */
function ajustarTexto(ctx, texto, anchoMaximo) {
    const palabras = texto.split(' ');
    const lineas = [];
    let lineaActual = palabras[0] || '';
    
    for (let i = 1; i < palabras.length; i++) {
        const palabra = palabras[i];
        const ancho = ctx.measureText(lineaActual + " " + palabra).width;
        
        if (ancho < anchoMaximo) {
            lineaActual += " " + palabra;
        } else {
            lineas.push(lineaActual);
            lineaActual = palabra;
        }
    }
    
    if (lineaActual) {
        lineas.push(lineaActual);
    }
    
    // Si no hay texto, añadir al menos una línea vacía
    if (lineas.length === 0) {
        lineas.push('');
    }
    
    return lineas;
}

/**
 * Formatea números para mostrar (ej. 1000 -> 1K)
 */
function formatearNumero(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Dibuja un rectángulo redondeado
 */
function dibujarRectanguloRedondeado(ctx, x, y, ancho, alto, radio) {
    ctx.beginPath();
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
}

/**
 * Dibuja icono de Twitter
 */
function dibujarIconoTwitter(ctx, x, y, tamaño) {
    ctx.save();
    
    // Dibujar logo básico de Twitter (pájaro simplificado)
    ctx.beginPath();
    ctx.moveTo(x - tamaño, y - tamaño/2);
    ctx.bezierCurveTo(x - tamaño*0.8, y - tamaño*0.7, x - tamaño*0.6, y - tamaño*0.5, x - tamaño*0.5, y - tamaño*0.3);
    ctx.bezierCurveTo(x - tamaño*0.7, y - tamaño*0.4, x - tamaño*0.9, y - tamaño*0.5, x - tamaño*1.1, y - tamaño*0.5);
    ctx.bezierCurveTo(x - tamaño*1, y - tamaño*0.3, x - tamaño*0.8, y - tamaño*0.1, x - tamaño*0.6, y);
    ctx.bezierCurveTo(x - tamaño*0.8, y, x - tamaño, y - tamaño*0.1, x - tamaño*1.2, y - tamaño*0.2);
    ctx.bezierCurveTo(x - tamaño*1.1, y + tamaño*0.2, x - tamaño*0.8, y + tamaño*0.5, x - tamaño*0.5, y + tamaño*0.6);
    ctx.bezierCurveTo(x - tamaño*0.2, y + tamaño*0.7, x + tamaño*0.2, y + tamaño*0.6, x + tamaño*0.4, y + tamaño*0.4);
    ctx.bezierCurveTo(x + tamaño*0.1, y + tamaño*0.6, x - tamaño*0.3, y + tamaño*0.6, x - tamaño*0.5, y + tamaño*0.5);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

/**
 * Dibuja icono de comentario
 */
function dibujarIconoComentario(ctx, x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    
    // Burbuja de comentario
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20, y);
    ctx.quadraticCurveTo(x + 24, y, x + 24, y + 4);
    ctx.lineTo(x + 24, y + 12);
    ctx.quadraticCurveTo(x + 24, y + 16, x + 20, y + 16);
    ctx.lineTo(x + 6, y + 16);
    ctx.lineTo(x, y + 22);
    ctx.lineTo(x, y);
    ctx.fill();
    
    ctx.restore();
}

/**
 * Dibuja icono de retweet
 */
function dibujarIconoRetweet(ctx, x, y, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // Flechas de retweet
    ctx.beginPath();
    // Flecha izquierda
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x + 6, y + 2);
    ctx.lineTo(x + 12, y + 8);
    // Tallo de flecha
    ctx.moveTo(x + 6, y + 2);
    ctx.lineTo(x + 6, y + 14);
    
    // Flecha derecha
    ctx.moveTo(x + 24, y + 8);
    ctx.lineTo(x + 18, y + 14);
    ctx.lineTo(x + 12, y + 8);
    // Tallo de flecha
    ctx.moveTo(x + 18, y + 14);
    ctx.lineTo(x + 18, y + 2);
    
    ctx.stroke();
    
    ctx.restore();
}

/**
 * Dibuja icono de me gusta
 */
function dibujarIconoMeGusta(ctx, x, y, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // Forma de corazón
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 16);
    ctx.bezierCurveTo(x + 6, y + 10, x, y + 8, x, y + 4);
    ctx.bezierCurveTo(x, y, x + 4, y - 2, x + 8, y + 2);
    ctx.lineTo(x + 12, y + 4);
    ctx.lineTo(x + 16, y + 2);
    ctx.bezierCurveTo(x + 20, y - 2, x + 24, y, x + 24, y + 4);
    ctx.bezierCurveTo(x + 24, y + 8, x + 18, y + 10, x + 12, y + 16);
    
    ctx.stroke();
    
    ctx.restore();
}

module.exports = router;
