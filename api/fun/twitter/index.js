// api/fun/twitter/index.js
const express = require("express");
const { createCanvas, loadImage, registerFont } = require("canvas");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * API de Tarjetas de Twitter - Genera una imagen que simula un tweet
 * Versión mejorada con diseño más cercano a Twitter actual
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
            afiliacion,
            importante,
            likes = "0",
            replies = "0", 
            retweets = "0",
            fecha = "",
            idioma = "es"
        } = req.query;

        // Validar parámetros obligatorios
        if (!nombre || !usuario || !texto) {
            return res.status(400).json({ 
                error: "Faltan parámetros obligatorios",
                obligatorios: ["nombre", "usuario", "texto"],
                ejemplo: "/api/fun/twitter?nombre=Juan%20Pérez&usuario=juanperez&pfp=https://ejemplo.com/perfil.jpg&texto=¡Hola%20Mundo!"
            });
        }

        // Cargar imagen de perfil primero
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
                console.warn("Error cargando imagen de perfil, se usará imagen predeterminada:", profileError.message);
                // Se usará imagen genérica en el proceso de generación
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
                console.warn("Error cargando imagen adjunta:", imageError.message);
                // Si falla, continuamos sin la imagen
            }
        }

        // Generar imagen de tarjeta de Twitter con diseño mejorado
        try {
            const cardBuffer = await generarTarjetaTwitter({
                nombre,
                usuario,
                profileImageBuffer,
                texto,
                verificado: verificado.toLowerCase() === "true",
                colorFondo: color.toLowerCase(),
                attachedImageBuffer,
                afiliacion,
                importante,
                likes: parseInt(likes) || 0,
                replies: parseInt(replies) || 0,
                retweets: parseInt(retweets) || 0,
                fecha,
                idioma
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
 * Genera una imagen de tarjeta similar a Twitter con diseño actualizado
 */
async function generarTarjetaTwitter(opciones) {
    // Establecer dimensiones base
    const ancho = 600;
    let alto = opciones.attachedImageBuffer ? 600 : 350;
    
    // Aumentar altura si hay mucho texto
    const lineasEstimadas = Math.ceil(opciones.texto.length / 50);
    if (lineasEstimadas > 4) {
        alto += (lineasEstimadas - 4) * 24;
    }
    
    const padding = 20;
    
    // Crear canvas
    const canvas = createCanvas(ancho, alto);
    const ctx = canvas.getContext("2d");
    
    // Definir colores según tema (actualizado a Twitter 2023)
    const colores = {
        blanco: {
            fondo: "#ffffff",
            texto: "#0f1419",
            textoSecundario: "#536471",
            borde: "#eff3f4",
            separador: "#eff3f4",
            iconos: "#536471",
            iconosHover: "#1d9bf0",
            azulTwitter: "#1d9bf0",
            linkColor: "#1d9bf0",
            verifiedBadge: "#1d9bf0",
            replyLine: "#eff3f4"
        },
        negro: {
            fondo: "#15202b",
            texto: "#ffffff",
            textoSecundario: "#8899a6",
            borde: "#38444d",
            separador: "#38444d",
            iconos: "#8899a6",
            iconosHover: "#1d9bf0",
            azulTwitter: "#1d9bf0",
            linkColor: "#1d9bf0",
            verifiedBadge: "#1d9bf0",
            replyLine: "#38444d"
        },
        oscuro: {
            fondo: "#000000",
            texto: "#e7e9ea",
            textoSecundario: "#71767b",
            borde: "#2f3336",
            separador: "#2f3336",
            iconos: "#71767b",
            iconosHover: "#1d9bf0",
            azulTwitter: "#1d9bf0",
            linkColor: "#1d9bf0",
            verifiedBadge: "#1d9bf0",
            replyLine: "#2f3336"
        }
    };
    
    // Seleccionar tema o usar blanco como predeterminado
    const tema = colores[opciones.colorFondo] || colores.blanco;
    
    // Textos según idioma
    const textos = {
        es: {
            responder: "Responder",
            retwittear: "Retwittear",
            meGusta: "Me gusta",
            via: "vía Twitter Web App"
        },
        en: {
            responder: "Reply",
            retwittear: "Retweet",
            meGusta: "Like",
            via: "via Twitter Web App"
        },
        fr: {
            responder: "Répondre",
            retwittear: "Retweeter",
            meGusta: "J'aime",
            via: "via Twitter Web App"
        },
        pt: {
            responder: "Responder",
            retwittear: "Retuitar",
            meGusta: "Curtir",
            via: "via Twitter Web App"
        }
    };
    
    // Seleccionar idioma o usar español como predeterminado
    const idioma = textos[opciones.idioma] || textos.es;
    
    // Establecer color de fondo
    ctx.fillStyle = tema.fondo;
    ctx.fillRect(0, 0, ancho, alto);
    
    // Dibujar línea separadora superior sutil
    ctx.fillStyle = tema.separador;
    ctx.fillRect(0, 0, ancho, 1);
    
    // Variables para posicionamiento
    const tamañoPerfil = 48;
    const perfilX = padding;
    const perfilY = padding + tamañoPerfil/2;
    const nombreX = perfilX + tamañoPerfil + 12;
    const nombreY = padding + 18;
    
    // Cargar imagen de perfil
    try {
        let imagenPerfil;
        
        if (opciones.profileImageBuffer) {
            imagenPerfil = await loadImage(opciones.profileImageBuffer);
        } else {
            // Cargar imagen predeterminada
            const defaultImagePath = path.join(__dirname, 'default_profile.png');
            if (fs.existsSync(defaultImagePath)) {
                imagenPerfil = await loadImage(defaultImagePath);
            } else {
                // Si no hay imagen predeterminada, crear un círculo de color
                ctx.beginPath();
                ctx.arc(perfilX + tamañoPerfil/2, perfilY, tamañoPerfil/2, 0, Math.PI * 2);
                ctx.fillStyle = tema.azulTwitter;
                ctx.fill();
                
                // Añadir iniciales si no hay imagen
                const iniciales = obtenerIniciales(opciones.nombre);
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 18px 'Arial'";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(iniciales, perfilX + tamañoPerfil/2, perfilY);
            }
        }
        
        // Dibujar perfil con recorte circular si tenemos la imagen
        if (imagenPerfil) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(perfilX + tamañoPerfil/2, perfilY, tamañoPerfil/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(imagenPerfil, perfilX, perfilY - tamañoPerfil/2, tamañoPerfil, tamañoPerfil);
            ctx.restore();
        }
        
        // Dibujar nombre con estilo actual de Twitter
        ctx.fillStyle = tema.texto;
        ctx.font = "bold 16px 'Arial'";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(opciones.nombre, nombreX, nombreY);
        
        // Dibujar insignia de verificación si está verificado
        if (opciones.verificado) {
            const tamañoInsignia = 16;
            const insigniaX = nombreX + ctx.measureText(opciones.nombre).width + 2;
            const insigniaY = nombreY - tamañoInsignia/2;
            
            // Dibuja un círculo azul para la insignia de verificación
            ctx.beginPath();
            ctx.arc(insigniaX + tamañoInsignia/2, insigniaY + tamañoInsignia/2, tamañoInsignia/2, 0, Math.PI * 2);
            ctx.fillStyle = tema.verifiedBadge;
            ctx.fill();
            
            // Dibuja el check blanco
            ctx.beginPath();
            ctx.moveTo(insigniaX + 4, insigniaY + tamañoInsignia/2);
            ctx.lineTo(insigniaX + 7, insigniaY + tamañoInsignia/2 + 3);
            ctx.lineTo(insigniaX + 12, insigniaY + tamañoInsignia/2 - 3);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        
        // Dibujar nombre de usuario y fecha
        ctx.fillStyle = tema.textoSecundario;
        ctx.font = "14px 'Arial'";
        
        let textoUsuario = `@${opciones.usuario}`;
        if (opciones.fecha) {
            textoUsuario += ` · ${opciones.fecha}`;
        }
        
        ctx.fillText(textoUsuario, nombreX, nombreY + 20);
        
        // Dibujar etiqueta importante si existe
        let offsetY = nombreY + 45;
        
        if (opciones.importante) {
            ctx.fillStyle = tema.azulTwitter;
            ctx.font = "14px 'Arial'";
            ctx.fillText(opciones.importante, nombreX, offsetY);
            offsetY += 25;
        }
        
        // Dibujar texto del tweet con formato mejorado
        ctx.fillStyle = tema.texto;
        ctx.font = "16px 'Arial'";
        
        // Ajustar texto a múltiples líneas
        const textoAjustado = ajustarTexto(ctx, opciones.texto, ancho - (padding * 2) - tamañoPerfil - 10);
        
        // Dibujar cada línea
        let alturaTexto = 0;
        textoAjustado.forEach((linea, index) => {
            // Destacar menciones, hashtags y enlaces
            const palabras = linea.split(' ');
            let posX = nombreX;
            
            palabras.forEach(palabra => {
                const anchoPalabra = ctx.measureText(palabra + ' ').width;
                
                // Colorear menciones, hashtags y enlaces
                if (palabra.startsWith('@') || palabra.startsWith('#') || 
                    palabra.startsWith('http') || palabra.includes('.com')) {
                    ctx.fillStyle = tema.linkColor;
                    ctx.fillText(palabra, posX, offsetY + alturaTexto);
                    ctx.fillStyle = tema.texto;
                } else {
                    ctx.fillText(palabra, posX, offsetY + alturaTexto);
                }
                
                posX += anchoPalabra;
                // Añadir espacio después de cada palabra excepto la última
                if (palabra !== palabras[palabras.length - 1]) {
                    ctx.fillText(' ', posX - anchoPalabra/8, offsetY + alturaTexto);
                }
            });
            
            alturaTexto += 24; // Espacio entre líneas
        });
        
        // Posición actual después del texto
        let posicionActual = offsetY + alturaTexto + 15;
        
        // Dibujar imagen adjunta si existe
        if (opciones.attachedImageBuffer) {
            try {
                const imagenTweet = await loadImage(opciones.attachedImageBuffer);
                
                // Dimensiones máximas para la imagen
                const maxImgWidth = ancho - (padding * 2);
                const maxImgHeight = 280;
                
                // Calcular dimensiones preservando relación de aspecto
                let imgWidth = Math.min(maxImgWidth, imagenTweet.width);
                let imgHeight = (imgWidth / imagenTweet.width) * imagenTweet.height;
                
                // Si la altura excede el máximo, ajustar
                if (imgHeight > maxImgHeight) {
                    imgHeight = maxImgHeight;
                    imgWidth = (imgHeight / imagenTweet.height) * imagenTweet.width;
                }
                
                // Coordenadas para centrar la imagen
                const imgX = (ancho - imgWidth) / 2;
                const imgY = posicionActual;
                
                // Dibujar imagen con bordes redondeados
                ctx.save();
                ctx.beginPath();
                dibujarRectanguloRedondeado(ctx, imgX, imgY, imgWidth, imgHeight, 16);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(imagenTweet, imgX, imgY, imgWidth, imgHeight);
                ctx.restore();
                
                // Añadir un borde sutil
                ctx.strokeStyle = tema.borde;
                ctx.lineWidth = 1;
                ctx.beginPath();
                dibujarRectanguloRedondeado(ctx, imgX, imgY, imgWidth, imgHeight, 16);
                ctx.stroke();
                
                // Actualizar posición actual después de la imagen
                posicionActual = imgY + imgHeight + 15;
            } catch (imgError) {
                console.warn("Error dibujando imagen adjunta:", imgError.message);
            }
        }
        
        // Dibujar barra de interacciones (con estilo actualizado de Twitter)
        const iconosY = posicionActual + 20;
        const espacioIconos = (ancho - padding * 2) / 3;
        
        // Dibujar línea separadora antes de los iconos
        ctx.fillStyle = tema.separador;
        ctx.fillRect(padding, posicionActual, ancho - padding * 2, 1);
        
        // Función para dibujar un icono de interacción
        function dibujarIconoInteraccion(x, y, tipo, numero, texto) {
            const radio = 10;
            
            // Dibujar círculo de fondo para el icono
            ctx.beginPath();
            ctx.arc(x + radio, y, radio, 0, Math.PI * 2);
            ctx.fillStyle = `${tema.iconos}20`; // Color semitransparente
            ctx.fill();
            
            // Dibujar el icono según su tipo
            ctx.beginPath();
            
            switch (tipo) {
                case "reply":
                    // Dibujar icono de respuesta (bocadillo)
                    ctx.moveTo(x + radio - 5, y - 3);
                    ctx.lineTo(x + radio + 5, y - 3);
                    ctx.quadraticCurveTo(x + radio + 8, y - 3, x + radio + 8, y);
                    ctx.quadraticCurveTo(x + radio + 8, y + 5, x + radio + 5, y + 5);
                    ctx.lineTo(x + radio + 2, y + 5);
                    ctx.lineTo(x + radio, y + 8);
                    ctx.lineTo(x + radio, y + 5);
                    ctx.lineTo(x + radio - 5, y + 5);
                    ctx.quadraticCurveTo(x + radio - 8, y + 5, x + radio - 8, y);
                    ctx.quadraticCurveTo(x + radio - 8, y - 3, x + radio - 5, y - 3);
                    break;
                    
                case "retweet":
                    // Dibujar icono de retweet (flechas)
                    ctx.moveTo(x + radio - 5, y - 2);
                    ctx.lineTo(x + radio, y - 6);
                    ctx.lineTo(x + radio + 5, y - 2);
                    ctx.moveTo(x + radio, y - 6);
                    ctx.lineTo(x + radio, y + 1);
                    
                    ctx.moveTo(x + radio + 5, y + 2);
                    ctx.lineTo(x + radio, y + 6);
                    ctx.lineTo(x + radio - 5, y + 2);
                    ctx.moveTo(x + radio, y + 6);
                    ctx.lineTo(x + radio, y);
                    break;
                    
                case "like":
                    // Dibujar icono de corazón
                    ctx.moveTo(x + radio, y + 5);
                    ctx.bezierCurveTo(
                        x + radio - 7, y - 2,
                        x + radio - 10, y - 2,
                        x + radio - 5, y - 6
                    );
                    ctx.bezierCurveTo(
                        x + radio - 3, y - 8,
                        x + radio, y - 5,
                        x + radio, y - 5
                    );
                    ctx.bezierCurveTo(
                        x + radio, y - 5,
                        x + radio + 3, y - 8,
                        x + radio + 5, y - 6
                    );
                    ctx.bezierCurveTo(
                        x + radio + 10, y - 2,
                        x + radio + 7, y - 2,
                        x + radio, y + 5
                    );
                    break;
            }
            
            // Dibujar el contorno del icono
            ctx.strokeStyle = tema.iconos;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Mostrar el número si es mayor que 0
            if (numero && numero > 0) {
                ctx.fillStyle = tema.textoSecundario;
                ctx.font = "13px 'Arial'";
                ctx.textAlign = "left";
                ctx.fillText(formatearNumero(numero), x + radio*2 + 5, y + 4);
            }
            
            // Mostrar el texto
            if (texto) {
                ctx.fillStyle = tema.textoSecundario;
                ctx.font = "13px 'Arial'";
                ctx.fillText(texto, x + radio*2 + 5 + (numero > 0 ? ctx.measureText(formatearNumero(numero)).width + 5 : 0), y + 4);
            }
        }
        
        // Dibujar iconos de interacción
        dibujarIconoInteraccion(padding, iconosY, "reply", opciones.replies, idioma.responder);
        dibujarIconoInteraccion(padding + espacioIconos, iconosY, "retweet", opciones.retweets, idioma.retwittear);
        dibujarIconoInteraccion(padding + espacioIconos * 2, iconosY, "like", opciones.likes, idioma.meGusta);
        
        // Dibujar línea separadora después de los iconos
        ctx.fillStyle = tema.separador;
        ctx.fillRect(padding, iconosY + 25, ancho - padding * 2, 1);
        
        // Añadir indicador "vía Twitter Web App" en la parte inferior
        ctx.fillStyle = tema.textoSecundario;
        ctx.font = "13px 'Arial'";
        ctx.textAlign = "left";
        ctx.fillText(idioma.via, padding, iconosY + 45);
        
        // Añadir marca de agua sutil con el logo de Twitter/X
        ctx.fillStyle = `${tema.textoSecundario}50`; // Semi-transparente
        ctx.font = "12px 'Arial'";
        ctx.textAlign = "right";
        ctx.fillText("X", ancho - padding, iconosY + 45);
        
        // Devolver el buffer de imagen
        return canvas.toBuffer("image/png");
        
    } catch (error) {
        console.error("Error en generación de tarjeta Twitter:", error);
        throw error;
    }
}

/**
 * Obtiene las iniciales de un nombre
 */
function obtenerIniciales(nombre) {
    if (!nombre) return "??";
    
    const palabras = nombre.split(' ');
    if (palabras.length === 1) {
        return nombre.substring(0, 2).toUpperCase();
    }
    
    return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase();
}

/**
 * Ajusta el texto para que quepa dentro de un ancho especificado
 */
function ajustarTexto(ctx, texto, anchoMaximo) {
    const palabras = texto.split(' ');
    const lineas = [];
    let lineaActual = '';
    
    // Ajustar palabras a líneas
    for (let i = 0; i < palabras.length; i++) {
        const palabra = palabras[i];
        const lineaConPalabra = lineaActual + (lineaActual ? ' ' : '') + palabra;
        
        if (ctx.measureText(lineaConPalabra).width <= anchoMaximo) {
            lineaActual = lineaConPalabra;
        } else {
            // Si la línea actual no está vacía, agregarla
            if (lineaActual) {
                lineas.push(lineaActual);
                lineaActual = palabra;
            } else {
                // Si la palabra por sí sola es más ancha que el límite
                let fragmento = '';
                for (let j = 0; j < palabra.length; j++) {
                    fragmento += palabra[j];
                    if (ctx.measureText(fragmento).width >= anchoMaximo) {
                        lineas.push(fragmento.slice(0, -1));
                        fragmento = palabra[j];
                    }
                }
                lineaActual = fragmento;
            }
        }
    }
    
    // Agregar la última línea si tiene contenido
    if (lineaActual) {
        lineas.push(lineaActual);
    }
    
    return lineas;
}

/**
 * Formatea números para mostrar (ej. 1000 -> 1K)
 */
function formatearNumero(num) {
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

module.exports = router;
