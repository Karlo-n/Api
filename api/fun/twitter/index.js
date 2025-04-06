// api/fun/twitter/index.js
const express = require("express");
const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Crear directorio para assets si no existe
const ASSETS_DIR = path.join(__dirname, "assets");
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Registrar fuentes (usando Arial como respaldo si no están disponibles)
try {
    registerFont(path.join(__dirname, "assets", "Roboto-Regular.ttf"), { family: "Roboto" });
    registerFont(path.join(__dirname, "assets", "Roboto-Bold.ttf"), { family: "Roboto Bold" });
} catch (error) {
    console.warn("No se pudieron registrar fuentes personalizadas, usando fuentes del sistema como respaldo:", error);
}

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
 * - favoritos: Número de favoritos/comentarios
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
        if (!nombre || !usuario || !pfp || !texto) {
            return res.status(400).json({ 
                error: "Faltan parámetros obligatorios",
                obligatorios: ["nombre", "usuario", "pfp", "texto"],
                ejemplo: "/api/fun/twitter?nombre=Juan%20Pérez&usuario=juanperez&pfp=https://ejemplo.com/perfil.jpg&texto=¡Hola%20Mundo!"
            });
        }

        // Generar imagen de tarjeta de Twitter
        const cardBuffer = await generarTarjetaTwitter({
            nombre,
            usuario,
            pfp,
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
    // Establecer dimensiones (estilo tarjeta de Twitter)
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
    
    try {
        // Cargar foto de perfil
        const imagenPerfil = await loadImage(opciones.pfp);
        
        // Dibujar foto de perfil (recorte circular)
        const tamañoPerfil = 50;
        const perfilX = padding + tamañoPerfil/2;
        const perfilY = 40;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(perfilX, perfilY, tamañoPerfil/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(imagenPerfil, perfilX - tamañoPerfil/2, perfilY - tamañoPerfil/2, tamañoPerfil, tamañoPerfil);
        ctx.restore();
        
        // Establecer color de texto según fondo
        const colorTexto = opciones.colorFondo === "negro" ? "#ffffff" : "#000000";
        const colorSecundario = opciones.colorFondo === "negro" ? "#8899a6" : "#536471";
        
        // Dibujar nombre de usuario e insignia de verificación
        ctx.fillStyle = colorTexto;
        ctx.font = "bold 18px 'Roboto Bold', Arial, sans-serif";
        
        const nombreX = perfilX + tamañoPerfil/2 + 15;
        const nombreY = perfilY - 10;
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
        ctx.font = "16px 'Roboto', Arial, sans-serif";
        ctx.fillText(`@${opciones.usuario}`, nombreX, nombreY + 20);
        
        // Dibujar designación importante si se proporciona
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
            ctx.font = "14px 'Roboto Bold', Arial, sans-serif";
            ctx.fillText(opciones.importante, importanteX + 10, importanteY);
        }
        
        // Dibujar insignia de afiliación si se proporciona
        let afilacionY = opciones.importante ? nombreY + 70 : nombreY + 45;
        
        if (opciones.afilacion) {
            if (opciones.afilacion.startsWith("http")) {
                // Es una URL de imagen
                try {
                    const imagenAfiliacion = await loadImage(opciones.afilacion);
                    const tamañoAfiliacion = 24;
                    ctx.drawImage(imagenAfiliacion, nombreX, afilacionY - tamañoAfiliacion, tamañoAfiliacion, tamañoAfiliacion);
                    afilacionY += 30;
                } catch (error) {
                    console.error("Error al cargar imagen de afiliación:", error);
                }
            } else {
                // Es texto
                ctx.fillStyle = "#1DA1F2"; // Azul de Twitter
                ctx.font = "14px 'Roboto Bold', Arial, sans-serif";
                ctx.fillText(opciones.afilacion, nombreX, afilacionY);
                afilacionY += 25;
            }
        }
        
        // Dibujar texto del tweet
        ctx.fillStyle = colorTexto;
        ctx.font = "18px 'Roboto', Arial, sans-serif";
        
        const textoX = padding;
        let textoY = afilacionY + 10;
        
        // Manejar ajuste de texto
        const anchoMaximo = ancho - (padding * 2);
        const textoAjustado = ajustarTexto(ctx, opciones.texto, anchoMaximo);
        
        textoAjustado.forEach(linea => {
            ctx.fillText(linea, textoX, textoY);
            textoY += 25;
        });
        
        // Dibujar imagen adjunta si se proporciona
        let alturaActual = textoY + 15;
        
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
                const imagenY = alturaActual;
                
                ctx.save();
                dibujarRectanguloRedondeado(ctx, imagenX, imagenY, anchoImg, altoImg, 16);
                ctx.clip();
                ctx.drawImage(imagenTweet, imagenX, imagenY, anchoImg, altoImg);
                ctx.restore();
                
                alturaActual += altoImg + 20;
            } catch (error) {
                console.error("Error al cargar imagen del tweet:", error);
            }
        }
        
        // Dibujar contadores de interacción (likes, retweets, etc.)
        alturaActual += 10;
        
        const espacioIconos = 150;
        const iconosY = alturaActual;
        
        // Icono de comentario
        ctx.fillStyle = colorSecundario;
        dibujarIconoComentario(ctx, padding, iconosY, colorSecundario);
        ctx.font = "14px 'Roboto', Arial, sans-serif";
        ctx.fillText(formatearNumero(opciones.favoritos), padding + 30, iconosY + 5);
        
        // Icono de retweet
        dibujarIconoRetweet(ctx, padding + espacioIconos, iconosY, colorSecundario);
        ctx.fillText(formatearNumero(opciones.compartidos), padding + espacioIconos + 30, iconosY + 5);
        
        // Icono de me gusta
        dibujarIconoMeGusta(ctx, padding + (espacioIconos * 2), iconosY, colorSecundario);
        ctx.fillText(formatearNumero(opciones.likes), padding + (espacioIconos * 2) + 30, iconosY + 5);
        
        // Añadir marca de tiempo y marca de Twitter
        ctx.fillStyle = colorSecundario;
        ctx.font = "12px 'Roboto', Arial, sans-serif";
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
 * Ajusta el texto para que quepa dentro de un ancho especificado
 */
function ajustarTexto(ctx, texto, anchoMaximo) {
    const palabras = texto.split(' ');
    const lineas = [];
    let lineaActual = palabras[0];
    
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
    
    lineas.push(lineaActual);
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
    
    // Escalar y trasladar a posición
    ctx.translate(x - tamaño, y - tamaño);
    ctx.scale(tamaño/12, tamaño/12);
    
    // Dibujar pájaro de Twitter
    ctx.beginPath();
    ctx.moveTo(23.643, 4.937);
    ctx.bezierCurveTo(22.809, 5.307, 21.902, 5.557, 20.944, 5.67);
    ctx.bezierCurveTo(21.952, 5.043, 22.716, 4.057, 23.079, 2.896);
    ctx.bezierCurveTo(22.166, 3.477, 21.165, 3.891, 20.102, 4.103);
    ctx.bezierCurveTo(19.403, 3.364, 18.570, 2.821, 17.677, 2.531);
    ctx.bezierCurveTo(16.785, 2.241, 15.850, 2.214, 14.940, 2.454);
    ctx.bezierCurveTo(14.030, 2.694, 13.178, 3.194, 12.470, 3.900);
    ctx.bezierCurveTo(11.763, 4.606, 11.223, 5.494, 10.905, 6.473);
    ctx.bezierCurveTo(10.587, 7.452, 10.504, 8.491, 10.664, 9.504);
    ctx.bezierCurveTo(10.823, 10.517, 11.219, 11.471, 11.815, 12.274);
    ctx.bezierCurveTo(9.860, 12.175, 7.956, 11.652, 6.233, 10.742);
    ctx.bezierCurveTo(4.510, 9.832, 3.012, 8.558, 1.840, 7.015);
    ctx.bezierCurveTo(1.420, 7.778, 1.171, 8.688, 1.171, 9.645);
    ctx.bezierCurveTo(1.170, 10.520, 1.376, 11.380, 1.771, 12.142);
    ctx.bezierCurveTo(2.166, 12.904, 2.735, 13.540, 3.427, 13.996);
    ctx.bezierCurveTo(2.685, 13.972, 1.960, 13.774, 1.309, 13.419);
    ctx.lineTo(1.309, 13.482);
    ctx.bezierCurveTo(1.309, 14.644, 1.717, 15.774, 2.454, 16.668);
    ctx.bezierCurveTo(3.191, 17.561, 4.213, 18.166, 5.355, 18.373);
    ctx.bezierCurveTo(4.668, 18.553, 3.954, 18.582, 3.255, 18.457);
    ctx.bezierCurveTo(3.574, 19.464, 4.203, 20.346, 5.049, 20.982);
    ctx.bezierCurveTo(5.895, 21.618, 6.919, 21.979, 7.978, 22.015);
    ctx.bezierCurveTo(6.070, 23.505, 3.773, 24.306, 1.407, 24.304);
    ctx.bezierCurveTo(1.021, 24.304, 0.635, 24.282, 0.252, 24.237);
    ctx.bezierCurveTo(2.647, 25.802, 5.419, 26.626, 8.245, 26.623);
    ctx.bezierCurveTo(17.327, 26.623, 22.308, 18.637, 22.308, 11.699);
    ctx.bezierCurveTo(22.308, 11.495, 22.303, 11.289, 22.293, 11.086);
    ctx.bezierCurveTo(23.202, 10.380, 24.000, 9.524, 24.642, 8.556);
    ctx.bezierCurveTo(23.786, 8.942, 22.875, 9.191, 21.939, 9.293);
    ctx.bezierCurveTo(22.915, 8.708, 23.649, 7.797, 24.000, 6.725);
    ctx.bezierCurveTo(23.081, 7.261, 22.077, 7.635, 21.033, 7.833);
    ctx.bezierCurveTo(20.345, 7.092, 19.448, 6.588, 18.461, 6.392);
    ctx.bezierCurveTo(17.474, 6.197, 16.456, 6.321, 15.539, 6.748);
    ctx.bezierCurveTo(14.623, 7.175, 13.851, 7.882, 13.330, 8.770);
    ctx.bezierCurveTo(12.809, 9.659, 12.564, 10.688, 12.629, 11.721);
    ctx.stroke();
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
