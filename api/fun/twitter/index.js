// api/fun/twitter/index.js
const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const router = express.Router();
const axios = require("axios");

/**
 * API de Tarjetas de Twitter - Genera una imagen que simula un tweet
 * Versión mejorada con diseño más fiel y mejor manejo de imágenes
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
                obligatorios: ["nombre", "usuario", "texto"],
                ejemplo: "/api/fun/twitter?nombre=Juan%20Pérez&usuario=juanperez&pfp=https://ejemplo.com/perfil.jpg&texto=¡Hola%20Mundo!"
            });
        }

        // Cargar imagen de perfil primero, con mejor manejo de errores
        let profileImageBuffer;
        if (pfp) {
            try {
                // Intentar cargar la imagen directamente
                const profileResponse = await axios.get(pfp, { 
                    responseType: 'arraybuffer',
                    timeout: 5000, // Timeout de 5 segundos
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                profileImageBuffer = Buffer.from(profileResponse.data);
            } catch (profileError) {
                console.warn("Error cargando imagen de perfil, se usará imagen predeterminada:", profileError.message);
                // No hacer nada, se usará imagen predeterminada
            }
        }

        // Generar imagen de tarjeta de Twitter
        try {
            const cardBuffer = await generarTarjetaTwitter({
                nombre,
                usuario,
                profileImageBuffer, // Pasar el buffer directamente si existe
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
 * Genera una imagen de tarjeta similar a Twitter con diseño mejorado
 */
async function generarTarjetaTwitter(opciones) {
    // Establecer dimensiones
    const ancho = 600;
    const alto = opciones.imagen ? 580 : 340;
    const padding = 20;
    
    // Crear canvas
    const canvas = createCanvas(ancho, alto);
    const ctx = canvas.getContext("2d");
    
    // Definir colores según tema
    const colores = {
        blanco: {
            fondo: "#ffffff",
            texto: "#0f1419",
            textoSecundario: "#536471",
            borde: "#eff3f4",
            fondoInteracciones: "#f7f9f9",
            hover: "#e7e7e8",
            azulTwitter: "#1d9bf0",
            linkColor: "#1d9bf0",
            divider: "#eff3f4"
        },
        negro: {
            fondo: "#15202b",
            texto: "#ffffff",
            textoSecundario: "#8899a6",
            borde: "#38444d",
            fondoInteracciones: "#1e2732",
            hover: "#252e38",
            azulTwitter: "#1d9bf0",
            linkColor: "#1d9bf0",
            divider: "#38444d"
        }
    };
    
    const tema = colores[opciones.colorFondo];
    
    // Establecer color de fondo principal (con borde redondeado)
    ctx.fillStyle = tema.fondo;
    ctx.beginPath();
    dibujarRectanguloRedondeado(ctx, 0, 0, ancho, alto, 16);
    ctx.closePath();
    ctx.fill();
    
    // Añadir borde sutil alrededor de la tarjeta
    ctx.strokeStyle = tema.borde;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Variables para posicionamiento
    const tamañoPerfil = 60;
    const perfilX = padding + tamañoPerfil/2;
    const perfilY = padding + tamañoPerfil/2;
    const nombreX = perfilX + tamañoPerfil/2 + 15;
    const nombreY = padding + 25;
    
    // Dibujar foto de perfil (recorte circular)
    try {
        let imagenPerfil;
        
        if (opciones.profileImageBuffer) {
            // Usar la imagen proporcionada si existe
            imagenPerfil = await loadImage(opciones.profileImageBuffer);
        } else {
            // Crear avatar predeterminado más elaborado
            imagenPerfil = await crearAvatarPredeterminado(tamañoPerfil, tema.textoSecundario);
        }
        
        // Dibujar círculo de fondo para el avatar
        ctx.beginPath();
        ctx.arc(perfilX, perfilY, tamañoPerfil/2, 0, Math.PI * 2);
        ctx.fillStyle = tema.fondo;
        ctx.fill();
        
        // Dibujar borde del avatar
        ctx.strokeStyle = tema.borde;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Dibujar avatar con recorte circular
        ctx.save();
        ctx.beginPath();
        ctx.arc(perfilX, perfilY, tamañoPerfil/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(imagenPerfil, perfilX - tamañoPerfil/2, perfilY - tamañoPerfil/2, tamañoPerfil, tamañoPerfil);
        ctx.restore();
        
        // Dibujar nombre de usuario con estilo más elaborado
        ctx.fillStyle = tema.texto;
        ctx.font = "bold 20px 'Arial', sans-serif";
        ctx.fillText(opciones.nombre, nombreX, nombreY);
        
        // Dibujar insignia de verificación si está verificado
        if (opciones.verificado) {
            // Dibujar insignia verificada mejorada
            const tamañoInsignia = 20;
            const insigniaX = nombreX + ctx.measureText(opciones.nombre).width + 5;
            const insigniaY = nombreY - tamañoInsignia/2 - 2;
            
            // Círculo azul con efecto de brillo
            const gradiente = ctx.createRadialGradient(
                insigniaX + tamañoInsignia/2, 
                insigniaY + tamañoInsignia/2, 
                0,
                insigniaX + tamañoInsignia/2, 
                insigniaY + tamañoInsignia/2, 
                tamañoInsignia/2
            );
            gradiente.addColorStop(0, "#1d9bf0");
            gradiente.addColorStop(1, "#1a8cd8");
            
            ctx.fillStyle = gradiente;
            ctx.beginPath();
            ctx.arc(insigniaX + tamañoInsignia/2, insigniaY + tamañoInsignia/2, tamañoInsignia/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Marca de verificación blanca mejorada
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 13px Arial";
            ctx.fillText("✓", insigniaX + 6, insigniaY + 15);
        }
        
        // Dibujar nombre de usuario con estilo mejorado
        ctx.fillStyle = tema.textoSecundario;
        ctx.font = "16px 'Arial', sans-serif";
        ctx.fillText(`@${opciones.usuario}`, nombreX, nombreY + 22);
        
        // Dibujar designación importante si se proporciona
        let offsetY = nombreY + 45;
        if (opciones.importante) {
            const importanteX = nombreX;
            
            // Fondo para designación importante
            ctx.fillStyle = tema.fondoInteracciones;
            const anchoImportante = ctx.measureText(opciones.importante).width + 20;
            const altoImportante = 26;
            
            ctx.beginPath();
            dibujarRectanguloRedondeado(ctx, importanteX - 5, offsetY - 18, anchoImportante, altoImportante, 12);
            ctx.closePath();
            ctx.fill();
            
            // Dibujar el texto con color especial
            ctx.fillStyle = tema.azulTwitter;
            ctx.font = "14px 'Arial', sans-serif";
            ctx.fillText(opciones.importante, importanteX, offsetY);
            
            offsetY += 34;
        }
        
        // Dibujar texto del tweet con mejor formato
        ctx.fillStyle = tema.texto;
        ctx.font = "bold 18px 'Arial', sans-serif";
        
        const textoX = padding;
        let textoY = offsetY;
        
        // Manejar ajuste de texto
        const anchoMaximo = ancho - (padding * 2);
        const textoAjustado = ajustarTexto(ctx, opciones.texto, anchoMaximo);
        
        let textoHeight = 0;
        textoAjustado.forEach(linea => {
            ctx.fillText(linea, textoX, textoY + textoHeight);
            textoHeight += 27; // Mayor espacio entre líneas
        });
        
        // Línea divisoria sutil antes de la imagen o interacciones
        let currentY = textoY + textoHeight + 20;
        
        // Dibujar imagen adjunta si se proporciona
        let imagenHeight = 0;
        if (opciones.imagen) {
            try {
                const imagenTweet = await loadImage(opciones.imagen);
                const altoMaximoImagen = 280;
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
                
                // Dibujar la imagen con esquinas más redondeadas
                const imagenX = textoX;
                const imagenY = currentY;
                
                ctx.save();
                ctx.beginPath();
                dibujarRectanguloRedondeado(ctx, imagenX, imagenY, anchoImg, altoImg, 16);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(imagenTweet, imagenX, imagenY, anchoImg, altoImg);
                ctx.restore();
                
                // Añadir un sutil borde a la imagen
                ctx.strokeStyle = tema.borde;
                ctx.lineWidth = 1;
                ctx.beginPath();
                dibujarRectanguloRedondeado(ctx, imagenX, imagenY, anchoImg, altoImg, 16);
                ctx.closePath();
                ctx.stroke();
                
                imagenHeight = altoImg + 25;
            } catch (error) {
                console.warn("No se pudo cargar imagen del tweet:", error.message);
                // Simplemente no mostrar la imagen
            }
        }
        
        // Agregar línea divisoria sutil
        currentY += imagenHeight;
        ctx.strokeStyle = tema.divider;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, currentY);
        ctx.lineTo(ancho - padding, currentY);
        ctx.stroke();
        
        currentY += 15;
        
        // Sección de interacciones con mejor diseño (fondo sutil en hover)
        const iconosY = currentY;
        const espacioIconos = 150;
        
        // Generar fondos de hover para las interacciones
        const tamañoHover = 36;
        
        // Hover para comentario
        ctx.fillStyle = tema.fondoInteracciones;
        ctx.beginPath();
        ctx.arc(padding + 15, iconosY, tamañoHover/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Hover para retweet
        ctx.beginPath();
        ctx.arc(padding + espacioIconos + 15, iconosY, tamañoHover/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Hover para me gusta
        ctx.beginPath();
        ctx.arc(padding + espacioIconos*2 + 15, iconosY, tamañoHover/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Icono de comentario mejorado
        ctx.fillStyle = tema.textoSecundario;
        dibujarIconoComentarioMejorado(ctx, padding + 15, iconosY, tema.textoSecundario);
        ctx.font = "14px 'Arial', sans-serif";
        ctx.fillText(formatearNumero(opciones.favoritos), padding + 32, iconosY + 5);
        
        // Icono de retweet mejorado
        dibujarIconoRetweetMejorado(ctx, padding + espacioIconos + 15, iconosY, tema.textoSecundario);
        ctx.fillText(formatearNumero(opciones.compartidos), padding + espacioIconos + 32, iconosY + 5);
        
        // Icono de me gusta mejorado
        dibujarIconoMeGustaMejorado(ctx, padding + espacioIconos*2 + 15, iconosY, tema.textoSecundario);
        ctx.fillText(formatearNumero(opciones.likes), padding + espacioIconos*2 + 32, iconosY + 5);
        
        // Añadir marca de tiempo mejorada y logo de Twitter
        ctx.fillStyle = tema.textoSecundario;
        ctx.font = "14px 'Arial', sans-serif";
        
        // Formato fecha mejorado
        const ahora = new Date();
        const opcFecha = { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' };
        const marcaTiempo = `${ahora.getHours()}:${ahora.getMinutes().toString().padStart(2, '0')} · ${ahora.toLocaleDateString('es-ES', opcFecha)}`;
        
        ctx.fillText(marcaTiempo, ancho - ctx.measureText(marcaTiempo).width - padding, alto - 25);
        
        // Logo de Twitter en la esquina inferior derecha
        ctx.fillStyle = tema.azulTwitter;
        dibujarLogoTwitterMejorado(ctx, ancho - 30, alto - 30, 18);
        
        // Devolver el buffer de imagen
        return canvas.toBuffer("image/png");
        
    } catch (error) {
        console.error("Error en generación de tarjeta Twitter:", error);
        throw error;
    }
}

/**
 * Crea un avatar predeterminado más elaborado
 */
async function crearAvatarPredeterminado(size, color) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Fondo con degradado sutil
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#E1E8ED');
    gradient.addColorStop(1, '#AAB8C2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Dibujar silueta de usuario mejorada
    ctx.fillStyle = color;
    
    // Cabeza
    ctx.beginPath();
    ctx.arc(size/2, size/3, size/4, 0, Math.PI * 2);
    ctx.fill();
    
    // Cuerpo 
    ctx.beginPath();
    ctx.moveTo(size/3, size);
    ctx.lineTo(size*2/3, size);
    ctx.lineTo(size*2/3, size/2);
    ctx.arc(size/2, size/2, size/6, 0, Math.PI, true);
    ctx.lineTo(size/3, size);
    ctx.fill();
    
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
    ctx.moveTo(x + radio, y);
    ctx.lineTo(x + ancho - radio, y);
    ctx.quadraticCurveTo(x + ancho, y, x + ancho, y + radio);
    ctx.lineTo(x + ancho, y + alto - radio);
    ctx.quadraticCurveTo(x + ancho, y + alto, x + ancho - radio, y + alto);
    ctx.lineTo(x + radio, y + alto);
    ctx.quadraticCurveTo(x, y + alto, x, y + alto - radio);
    ctx.lineTo(x, y + radio);
    ctx.quadraticCurveTo(x, y, x + radio, y);
}

/**
 * Dibuja logo de Twitter mejorado
 */
function dibujarLogoTwitterMejorado(ctx, x, y, tamaño) {
    ctx.save();
    
    // Pájaro de Twitter (simplificado pero reconocible)
    ctx.beginPath();
    
    // Coordenadas ajustadas para el logo de Twitter
    ctx.moveTo(x - tamaño*0.9, y - tamaño*0.3);
    ctx.bezierCurveTo(
        x - tamaño*0.7, y - tamaño*0.4, 
        x - tamaño*0.5, y - tamaño*0.2, 
        x - tamaño*0.3, y - tamaño*0.3
    );
    ctx.bezierCurveTo(
        x - tamaño*0.5, y - tamaño*0.5, 
        x - tamaño*0.7, y - tamaño*0.5, 
        x - tamaño*0.9, y - tamaño*0.4
    );
    ctx.bezierCurveTo(
        x - tamaño*0.7, y - tamaño*0.2, 
        x - tamaño*0.5, y, 
        x - tamaño*0.1, y
    );
    ctx.bezierCurveTo(
        x - tamaño*0.5, y + tamaño*0.1, 
        x - tamaño, y + tamaño*0.1, 
        x - tamaño*1.2, y - tamaño*0.1
    );
    ctx.bezierCurveTo(
        x - tamaño, y - tamaño*0.3, 
        x - tamaño*0.8, y - tamaño*0.5, 
        x - tamaño*0.5, y - tamaño*0.5
    );
    ctx.bezierCurveTo(
        x - tamaño*0.5, y - tamaño*0.5, 
        x - tamaño*0.6, y - tamaño*0.7, 
        x - tamaño*0.9, y - tamaño*0.6
    );
    ctx.bezierCurveTo(
        x - tamaño*0.8, y - tamaño*0.4, 
        x - tamaño*0.7, y - tamaño*0.3, 
        x - tamaño*0.9, y - tamaño*0.3
    );
    
    ctx.fill();
    ctx.restore();
}

/**
 * Dibuja icono de comentario mejorado
 */
function dibujarIconoComentarioMejorado(ctx, x, y, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    
    // Burbuja de comentario más detallada
    ctx.beginPath();
    const radioComentario = 10;
    const anchoBurbuja = radioComentario * 2;
    const altoBurbuja = radioComentario * 1.5;
    
    // Dibujar parte superior de la burbuja
    ctx.arc(x - radioComentario, y - radioComentario/2, radioComentario/2, Math.PI, 1.5 * Math.PI);
    ctx.arc(x + radioComentario, y - radioComentario/2, radioComentario/2, 1.5 * Math.PI, 0);
    
    // Lado derecho
    ctx.lineTo(x + radioComentario + radioComentario/2, y + radioComentario/2);
    
    // Punta de flecha
    ctx.lineTo(x + radioComentario/2, y + radioComentario);
    ctx.lineTo(x + radioComentario/3, y + radioComentario/2);
    
    // Lado izquierdo
    ctx.lineTo(x - radioComentario - radioComentario/2, y + radioComentario/2);
    
    // Cerrar la forma
    ctx.arc(x - radioComentario, y - radioComentario/2, radioComentario/2, 0.5 * Math.PI, Math.PI);
    
    ctx.stroke();
    ctx.restore();
}

/**
 * Dibuja icono de retweet mejorado
 */
function dibujarIconoRetweetMejorado(ctx, x, y, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    
    // Icono de retweet más detallado
    const radioRetweet = 10;
    
    // Flecha izquierda
    ctx.beginPath();
    ctx.moveTo(x - radioRetweet, y);
    ctx.lineTo(x - radioRetweet/2, y - radioRetweet/2);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Tallo izquierdo
    ctx.beginPath();
    ctx.moveTo(x - radioRetweet/2, y - radioRetweet/2);
    ctx.lineTo(x - radioRetweet/2, y + radioRetweet/2);
    ctx.stroke();
    
    // Flecha derecha
    ctx.beginPath();
    ctx.moveTo(x + radioRetweet, y);
    ctx.lineTo(x + radioRetweet/2, y + radioRetweet/2);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Tallo derecho
    ctx.beginPath();
    ctx.moveTo(x + radioRetweet/2, y + radioRetweet/2);
    ctx.lineTo(x + radioRetweet/2, y - radioRetweet/2);
    ctx.stroke();
    
    ctx.restore();
}

/**
 * Dibuja icono de me gusta mejorado
 */
function dibujarIconoMeGustaMejorado(ctx, x, y, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    
    // Corazón más detallado
    const radioCorazon = 8;
    
    ctx.beginPath();
    // Parte superior izquierda del corazón
    ctx.moveTo(x, y + radioCorazon);
    ctx.bezierCurveTo(
        x - radioCorazon, y, 
        x - radioCorazon*1.5, y, 
        x - radioCorazon*1.5, y - radioCorazon/2
    );
    ctx.bezierCurveTo(
        x - radioCorazon*1.5, y - radioCorazon, 
        x - radioCorazon, y - radioCorazon, 
        x, y
    );
    
    // Parte superior derecha del corazón
    ctx.bezierCurveTo(
        x + radioCorazon, y - radioCorazon, 
        x + radioCorazon*1.5, y - radioCorazon, 
        x + radioCorazon*1.5, y - radioCorazon/2
    );
    ctx.bezierCurveTo(
        x + radioCorazon*1.5, y, 
        x + radioCorazon, y, 
        x, y + radioCorazon
    );
    
    ctx.stroke();
    ctx.restore();
}

module.exports = router;
