// api/fun/twitter/index.js
const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * API de Tarjetas de Twitter - Genera una imagen que simula un tweet
 * Versión mejorada con íconos prediseñados y mejor diseño visual
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

        // Generar imagen de tarjeta de Twitter
        try {
            const cardBuffer = await generarTarjetaTwitter({
                nombre,
                usuario,
                profileImageBuffer, // Pasar el buffer directamente si existe
                texto,
                verificado: verificado.toLowerCase() === "true",
                colorFondo: color.toLowerCase(),
                attachedImageBuffer, // Pasar buffer de imagen adjunta si existe
                afiliacion,
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
 * Usa imágenes prediseñadas para los iconos
 */
async function generarTarjetaTwitter(opciones) {
    // Establecer dimensiones base
    const ancho = 600;
    let alto = opciones.attachedImageBuffer ? 600 : 350;
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
        },
        oscuro: {
            fondo: "#000000",
            texto: "#e7e9ea",
            textoSecundario: "#71767b",
            borde: "#2f3336",
            fondoInteracciones: "#16181c",
            hover: "#1d1f23",
            azulTwitter: "#1d9bf0",
            linkColor: "#1d9bf0",
            divider: "#2f3336"
        }
    };
    
    // Seleccionar tema o usar blanco como predeterminado
    const tema = colores[opciones.colorFondo] || colores.blanco;
    
    // Añadir un fondo con degradado muy sutil para más profundidad
    const fondoGradiente = ctx.createLinearGradient(0, 0, 0, alto);
    fondoGradiente.addColorStop(0, tema.fondo);
    fondoGradiente.addColorStop(1, tema.fondo === "#ffffff" ? "#f8f8f8" : 
                                  tema.fondo === "#15202b" ? "#101a25" : "#050505");
    
    // Establecer color de fondo principal (con borde redondeado)
    ctx.fillStyle = fondoGradiente;
    ctx.beginPath();
    dibujarRectanguloRedondeado(ctx, 0, 0, ancho, alto, 16);
    ctx.closePath();
    ctx.fill();
    
    // Añadir borde sutil alrededor de la tarjeta
    ctx.strokeStyle = tema.borde;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Añadir un destello muy sutil en la parte superior (efecto de luz)
    const brilloGradiente = ctx.createLinearGradient(ancho/2, 0, ancho/2, 70);
    brilloGradiente.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    brilloGradiente.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = brilloGradiente;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ancho, 0);
    ctx.lineTo(ancho, 70);
    ctx.lineTo(0, 70);
    ctx.closePath();
    ctx.fill();
    
    // Aplicar sombra muy sutil a toda la tarjeta
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    
    // Variables para posicionamiento
    const tamañoPerfil = 60;
    const perfilX = padding + tamañoPerfil/2;
    const perfilY = padding + tamañoPerfil/2;
    const nombreX = perfilX + tamañoPerfil/2 + 15;
    const nombreY = padding + 25;
    
    // Cargar los íconos necesarios
    const imagenes = await cargarImagenes();
    
    // Dibujar foto de perfil (recorte circular)
    try {
        let imagenPerfil;
        
        if (opciones.profileImageBuffer) {
            // Usar la imagen proporcionada si existe
            imagenPerfil = await loadImage(opciones.profileImageBuffer);
        } else {
            // Usar la imagen genérica predeterminada
            imagenPerfil = imagenes.generico;
        }
        
        // Quitar sombra para elementos internos
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
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
            // Dibujar insignia verificada usando la imagen cargada
            const tamañoInsignia = 20;
            const insigniaX = nombreX + ctx.measureText(opciones.nombre).width + 5;
            const insigniaY = nombreY - tamañoInsignia/2 - 2;
            
            ctx.drawImage(imagenes.verificado, insigniaX, insigniaY, tamañoInsignia, tamañoInsignia);
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
        
        // Dibujar texto del tweet con mejor formato y estilo
        ctx.fillStyle = tema.texto;
        
        // Preparar el ajuste de texto primero
        const textoX = padding;
        let textoY = offsetY;
        
        // Manejar ajuste de texto
        const anchoMaximo = ancho - (padding * 2);
        const textoAjustado = ajustarTexto(ctx, opciones.texto, anchoMaximo);
        
        // Añadir un pequeño decorador al inicio del texto (línea vertical sutil)
        if (textoAjustado && textoAjustado.length > 0) {
            ctx.strokeStyle = tema.azulTwitter;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(padding - 10, offsetY - 5);
            ctx.lineTo(padding - 10, offsetY + Math.min(textoAjustado.length * 28, 28));
            ctx.stroke();
        }
        
        // Usar una fuente un poco más elegante y con mejor renderizado
        ctx.font = "18px 'Arial', sans-serif";
        ctx.textRendering = "optimizeLegibility";
        
        // Aplicar un efecto de resaltado sutil para enlaces, menciones y hashtags
        let textoHeight = 0;
        textoAjustado.forEach(linea => {
            // Primero dibujamos la línea completa
            ctx.fillText(linea, textoX, textoY + textoHeight);
            
            // Luego buscamos y destacamos elementos especiales
            const palabras = linea.split(' ');
            let posicionX = textoX;
            
            palabras.forEach(palabra => {
                const anchoPalabra = ctx.measureText(palabra + ' ').width;
                
                // Resaltar enlaces, menciones y hashtags en color azul
                if (palabra.startsWith('http') || 
                    palabra.startsWith('www.') || 
                    palabra.startsWith('@') || 
                    palabra.startsWith('#')) {
                    ctx.fillStyle = tema.azulTwitter;
                    ctx.fillText(palabra, posicionX, textoY + textoHeight);
                    ctx.fillStyle = tema.texto; // Restaurar color normal
                }
                
                posicionX += anchoPalabra;
            });
            
            textoHeight += 28; // Mayor espacio entre líneas
        });
        
        // Línea divisoria sutil antes de la imagen o interacciones
        let currentY = textoY + textoHeight + 25;
        
        // Dibujar imagen adjunta si se proporciona
        let imagenHeight = 0;
        if (opciones.attachedImageBuffer) {
            try {
                const imagenTweet = await loadImage(opciones.attachedImageBuffer);
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
                
                // Añadir sombra sutil a la imagen
                ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 3;
                
                ctx.save();
                ctx.beginPath();
                dibujarRectanguloRedondeado(ctx, imagenX, imagenY, anchoImg, altoImg, 16);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(imagenTweet, imagenX, imagenY, anchoImg, altoImg);
                ctx.restore();
                
                // Quitar sombra para el resto de elementos
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
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
        
        // Agregar línea divisoria sutil con un toque decorativo
        currentY += imagenHeight;
        
        // Línea principal
        ctx.strokeStyle = tema.divider;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, currentY);
        ctx.lineTo(ancho - padding, currentY);
        ctx.stroke();
        
        // Pequeños puntos decorativos en los extremos
        ctx.fillStyle = tema.azulTwitter;
        ctx.beginPath();
        ctx.arc(padding, currentY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(ancho - padding, currentY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        currentY += 20;
        
        // Sección de interacciones con diseño mejorado
        const iconosY = currentY + 10;
        const espacioIconos = 140;
        const tamañoIcono = 20;
        
        // Configuración común para los contadores
        ctx.fillStyle = tema.textoSecundario;
        ctx.font = "14px 'Arial', sans-serif";
        
        // Crear áreas interactivas con fondo sutil
        function dibujarAreaInteractiva(x, y, ancho, icono, texto) {
            // Fondo sutil de botón
            ctx.fillStyle = tema.fondoInteracciones;
            ctx.beginPath();
            ctx.arc(x + tamañoIcono/2 + 10, y, tamañoIcono + 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Dibujar icono
            ctx.drawImage(icono, x + 10, y - tamañoIcono/2, tamañoIcono, tamañoIcono);
            
            // Dibujar texto
            ctx.fillStyle = tema.textoSecundario;
            ctx.fillText(texto, x + 35, y + 5);
        }
        
        // Dibujar zona de interacción para comentarios
        dibujarAreaInteractiva(padding, iconosY, 70, imagenes.comentarios, formatearNumero(opciones.favoritos));
        
        // Dibujar zona de interacción para retweets
        dibujarAreaInteractiva(padding + espacioIconos, iconosY, 70, imagenes.compartidos, formatearNumero(opciones.compartidos));
        
        // Dibujar zona de interacción para me gusta
        dibujarAreaInteractiva(padding + espacioIconos*2, iconosY, 70, imagenes.likes, formatearNumero(opciones.likes));
        
        // Añadir marca de tiempo mejorada con decoración
        ctx.fillStyle = tema.textoSecundario;
        
        // Pequeño detalle decorativo junto a la hora - icono de reloj dibujado
        ctx.beginPath();
        ctx.arc(ancho - padding - 85, alto - 25, 6, 0, Math.PI * 2);
        ctx.strokeStyle = tema.textoSecundario;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        
        // Manecillas del reloj
        ctx.beginPath();
        ctx.moveTo(ancho - padding - 85, alto - 25);
        ctx.lineTo(ancho - padding - 85, alto - 29);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(ancho - padding - 85, alto - 25);
        ctx.lineTo(ancho - padding - 81, alto - 25);
        ctx.stroke();
        
        // Formato fecha mejorado
        const ahora = new Date();
        const opcFecha = { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' };
        const marcaTiempo = `${ahora.getHours()}:${ahora.getMinutes().toString().padStart(2, '0')} · ${ahora.toLocaleDateString('es-ES', opcFecha)}`;
        
        ctx.font = "bold 14px 'Arial', sans-serif";
        ctx.fillText(marcaTiempo, ancho - ctx.measureText(marcaTiempo).width - padding - 15, alto - 22);
        
        // Logo de Twitter/X en la esquina inferior izquierda
        ctx.drawImage(imagenes.logo, padding, alto - 35, 22, 22);
        
        // Añadir un degradado sutil en la parte inferior
        const gradiente = ctx.createLinearGradient(0, alto - 60, 0, alto);
        gradiente.addColorStop(0, 'rgba(0,0,0,0)');
        gradiente.addColorStop(1, 'rgba(0,0,0,0.03)');
        ctx.fillStyle = gradiente;
        ctx.fillRect(0, alto - 60, ancho, 60);
        
        // Añadir un pequeño detalle de "Twitter" junto al logo
        ctx.fillStyle = tema.textoSecundario;
        ctx.font = "12px 'Arial', sans-serif";
        ctx.fillText("Twitter", padding + 28, alto - 20);
        
        // Añadir línea vertical decorativa sutil
        ctx.strokeStyle = tema.divider;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding + 90, alto - 30);
        ctx.lineTo(padding + 90, alto - 10);
        ctx.stroke();
        
        // Devolver el buffer de imagen
        return canvas.toBuffer("image/png");
        
    } catch (error) {
        console.error("Error en generación de tarjeta Twitter:", error);
        throw error;
    }
}

/**
 * Carga las imágenes necesarias para los iconos del tweet
 */
async function cargarImagenes() {
    try {
        // Rutas de las imágenes
        const directorioImagenes = path.join(__dirname);
        
        // Cargar todas las imágenes necesarias
        const imagenes = {
            generico: await loadImage(path.join(directorioImagenes, 'generico.png')),
            verificado: await loadImage(path.join(directorioImagenes, 'verificado.png')),
            likes: await loadImage(path.join(directorioImagenes, 'likes.png')),
            compartidos: await loadImage(path.join(directorioImagenes, 'compartidos.png')),
            comentarios: await loadImage(path.join(directorioImagenes, 'comentarios.png')),
            logo: await loadImage(path.join(directorioImagenes, 'logo.png'))
        };
        
        return imagenes;
    } catch (error) {
        console.error("Error cargando imágenes:", error);
        throw new Error(`No se pudieron cargar las imágenes: ${error.message}`);
    }
}

/**
 * Ajusta el texto para que quepa dentro de un ancho especificado
 * Maneja palabras muy largas dividiéndolas si es necesario
 */
function ajustarTexto(ctx, texto, anchoMaximo) {
    // Dividir el texto en palabras
    const palabras = texto.split(' ');
    const lineas = [];
    let lineaActual = '';
    
    // Procesar cada palabra
    for (let i = 0; i < palabras.length; i++) {
        let palabra = palabras[i];
        
        // Verificar si esta palabra por sí sola es más ancha que el límite
        if (ctx.measureText(palabra).width > anchoMaximo) {
            // Si la línea actual tiene contenido, guardarla primero
            if (lineaActual.length > 0) {
                lineas.push(lineaActual);
                lineaActual = '';
            }
            
            // Dividir la palabra larga en fragmentos
            let fragmento = '';
            for (let j = 0; j < palabra.length; j++) {
                fragmento += palabra[j];
                // Si el fragmento es demasiado ancho, guardarlo como línea
                if (ctx.measureText(fragmento).width >= anchoMaximo) {
                    lineas.push(fragmento);
                    fragmento = '';
                }
            }
            
            // Si queda algún fragmento, usarlo como inicio de la próxima línea
            if (fragmento.length > 0) {
                lineaActual = fragmento;
            }
            
            continue; // Pasar a la siguiente palabra
        }
        
        // Comprobar si añadir esta palabra excedería el ancho
        const lineaConPalabra = lineaActual.length > 0 ? 
                               lineaActual + ' ' + palabra : palabra;
                               
        if (ctx.measureText(lineaConPalabra).width <= anchoMaximo) {
            lineaActual = lineaConPalabra;
        } else {
            // Si no cabe, guardar la línea actual y comenzar una nueva
            lineas.push(lineaActual);
            lineaActual = palabra;
        }
    }
    
    // Añadir la última línea si tiene contenido
    if (lineaActual.length > 0) {
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
    num = parseInt(num) || 0;
    
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

module.exports = router;
