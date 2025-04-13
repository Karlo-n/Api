// api/fun/jail/index.js
const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();

/**
 * API JAIL - Genera imágenes de avatares detrás de rejas
 * Parámetros:
 * - avatar1: URL del avatar que estará tras las rejas (obligatorio)
 * - background: URL de la imagen de fondo (opcional)
 * - precio: Monto de la fianza (opcional)
 * - nombre: Nombre del arrestado (opcional)
 * - razon: Razón del arresto (opcional)
 * - id: Número de identificación del preso (opcional)
 * - fecha: Fecha de arresto (opcional)
 */
router.get("/", async (req, res) => {
    try {
        const { avatar1, background, precio, nombre, razon, id, fecha } = req.query;

        // Validar parámetro obligatorio
        if (!avatar1) {
            return res.status(400).json({ 
                error: "Se requiere una URL de avatar", 
                ejemplo: "/api/fun/jail?avatar1=https://ejemplo.com/avatar.jpg" 
            });
        }

        // Cargar imágenes necesarias
        let avatarImg, backgroundImg;
        try {
            // Descargar y cargar el avatar
            const avatarResponse = await axios.get(avatar1, { 
                responseType: "arraybuffer",
                timeout: 15000,
                headers: {
                    'User-Agent': 'JailAPI/1.0'
                }
            });
            
            if (!avatarResponse.data || avatarResponse.data.length === 0) {
                throw new Error("La respuesta del avatar está vacía");
            }
            
            avatarImg = await loadImage(Buffer.from(avatarResponse.data));

            // Si hay una imagen de fondo personalizada, cargarla
            if (background) {
                const bgResponse = await axios.get(background, {
                    responseType: "arraybuffer",
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'JailAPI/1.0'
                    }
                });
                
                if (!bgResponse.data || bgResponse.data.length === 0) {
                    throw new Error("La respuesta del fondo está vacía");
                }
                
                backgroundImg = await loadImage(Buffer.from(bgResponse.data));
            }
            
            // Asegurar la ruta absoluta correcta al archivo SVG de las rejas
            const barsSvgPath = path.resolve(__dirname, "jail_bars.svg");
            
            if (!fs.existsSync(barsSvgPath)) {
                throw new Error(`Archivo de rejas no encontrado en: ${barsSvgPath}`);
            }
            
            // Cargar imagen de rejas (SVG)
            const rejasImg = await loadImage(barsSvgPath);
            
            // Generar la imagen
            const canvas = await generarImagenJail(
                avatarImg, 
                backgroundImg, 
                rejasImg, 
                nombre, 
                precio, 
                razon,
                id || generarIdPrisionero(),
                fecha || obtenerFechaActual()
            );
            
            // Responder con la imagen PNG
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
            res.setHeader('Content-Disposition', 'inline; filename="jail.png"');
            
            // Crear un buffer de la imagen y enviarlo
            const buffer = canvas.toBuffer('image/png', { 
                compressionLevel: 6,
                filters: canvas.PNG_FILTER_NONE,
                resolution: 96
            });
            
            res.end(buffer);
            
        } catch (loadError) {
            console.error("Error cargando imágenes:", loadError);
            return res.status(400).json({ 
                error: "Error al cargar las imágenes", 
                detalle: loadError.message,
                stack: process.env.NODE_ENV === 'development' ? loadError.stack : undefined
            });
        }

    } catch (error) {
        console.error("Error en API JAIL:", error);
        res.status(500).json({ 
            error: "Error al generar la imagen JAIL",
            detalle: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * Genera un ID de prisionero aleatorio en formato '000-000'
 * @returns {string} ID de prisionero
 */
function generarIdPrisionero() {
    const part1 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const part2 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${part1}-${part2}`;
}

/**
 * Obtiene la fecha actual en formato DD/MM/YYYY
 * @returns {string} Fecha actual formateada
 */
function obtenerFechaActual() {
    const fecha = new Date();
    return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
}

/**
 * Genera la imagen JAIL con todos los elementos
 * @param {Image} avatarImg - Imagen del avatar
 * @param {Image} backgroundImg - Imagen de fondo (opcional)
 * @param {Image} rejasImg - Imagen de las rejas
 * @param {string} nombre - Nombre del arrestado (opcional)
 * @param {string} precio - Precio de la fianza (opcional)
 * @param {string} razon - Razón del arresto (opcional)
 * @param {string} id - ID del prisionero
 * @param {string} fecha - Fecha de arresto
 * @returns {Canvas} - Canvas con la imagen final
 */
async function generarImagenJail(avatarImg, backgroundImg, rejasImg, nombre, precio, razon, id, fecha) {
    // Configurar dimensiones del canvas 
    const width = 600;
    const height = 600;
    
    // Crear canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Fondo color gris oscuro por defecto
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(0, 0, width, height);
    
    // Si hay fondo personalizado, dibujarlo
    if (backgroundImg) {
        // Escalar y centrar la imagen de fondo para que cubra todo el canvas
        const scale = Math.max(width / backgroundImg.width, height / backgroundImg.height);
        const scaledWidth = backgroundImg.width * scale;
        const scaledHeight = backgroundImg.height * scale;
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;
        
        // Dibujar fondo con efecto de oscurecimiento
        ctx.globalAlpha = 0.4; // Hacer el fondo más oscuro
        ctx.drawImage(backgroundImg, x, y, scaledWidth, scaledHeight);
        ctx.globalAlpha = 1.0; // Restaurar opacidad normal
        
        // Agregar viñeta para mejorar el efecto dramático
        const gradient = ctx.createRadialGradient(
            width/2, height/2, height/4,
            width/2, height/2, height
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    } else {
        // Si no hay fondo personalizado, agregar textura de pared de celda
        dibujarTexturaParedes(ctx, width, height);
    }
    
    // Dibujar ID y fecha en la esquina superior
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, 50);
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(`ID: ${id}`, 20, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`FECHA: ${fecha}`, width - 20, 30);
    
    // Dibujar avatar en el centro (dentro de un círculo)
    const avatarSize = 300;
    const avatarX = (width - avatarSize) / 2;
    const avatarY = (height - avatarSize) / 2 - 10; // Subir un poco para dejar espacio al texto
    
    // Crear máscara circular para el avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 10, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Dibujar avatar dentro del círculo
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    
    // Agregar efecto de escala de grises con tono sepia al avatar
    const imageData = ctx.getImageData(avatarX, avatarY, avatarSize, avatarSize);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Convertir a escala de grises
        const avg = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
        
        // Aplicar tono sepia para efecto de foto antigua
        data[i] = Math.min(255, avg * 1.2); // R - más rojo
        data[i + 1] = Math.min(255, avg * 1.0); // G
        data[i + 2] = Math.min(255, avg * 0.8); // B - menos azul
    }
    
    ctx.putImageData(imageData, avatarX, avatarY);
    
    // Agregar ruido/textura de foto antigua
    agregarRuidoFotoAntigua(ctx, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
    
    // Dibujar el borde del avatar
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 10, avatarSize / 2 + 4, 0, Math.PI * 2);
    ctx.stroke();
    
    // Agregar una regla de medición al fondo (típica de fotos policiales)
    dibujarReglaMedicion(ctx, width, height);
    
    // Dibujar las rejas sobre todo
    ctx.drawImage(rejasImg, 0, 0, width, height);
    
    // Dibujar texto en la parte inferior
    // Fondo para el texto con más altura para acomodar más información
    const textBgHeight = 140;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, height - textBgHeight, width, textBgHeight);
    
    // Agregar línea divisoria en la parte superior del área de texto
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - textBgHeight);
    ctx.lineTo(width, height - textBgHeight);
    ctx.stroke();
    
    // Configurar estilo del texto
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    
    // Dibujar cada texto si está definido con mejor espaciado
    let yPosition = height - textBgHeight + 30;
    
    if (nombre) {
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillText(nombre, width / 2, yPosition);
        yPosition += 35;
    } else {
        yPosition += 20;
    }
    
    if (razon) {
        ctx.font = '22px Arial, sans-serif';
        // Dividir texto largo en múltiples líneas si es necesario
        const palabras = razon.split(' ');
        let linea = '';
        const maxWidth = width - 40;
        
        for (let i = 0; i < palabras.length; i++) {
            const testLinea = linea + palabras[i] + ' ';
            const metrica = ctx.measureText(testLinea);
            
            if (metrica.width > maxWidth && i > 0) {
                ctx.fillText(linea, width / 2, yPosition);
                linea = palabras[i] + ' ';
                yPosition += 30;
            } else {
                linea = testLinea;
            }
        }
        
        ctx.fillText(linea, width / 2, yPosition);
        yPosition += 35;
    } else {
        yPosition += 20;
    }
    
    if (precio) {
        ctx.font = 'bold 24px Arial, sans-serif';
        // Agregar un rectángulo decorativo alrededor del precio
        const precioTexto = `FIANZA: ${precio}`;
        const precioMetrica = ctx.measureText(precioTexto);
        const precioWidth = precioMetrica.width + 40;
        
        // Fondo para el precio
        ctx.fillStyle = 'rgba(255, 50, 50, 0.7)';
        ctx.fillRect((width - precioWidth) / 2, yPosition - 24, precioWidth, 32);
        
        // Borde para el precio
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect((width - precioWidth) / 2, yPosition - 24, precioWidth, 32);
        
        // Texto del precio
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(precioTexto, width / 2, yPosition);
    }
    
    // Agregar marca de agua sutil
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'right';
    ctx.fillText('JailAPI v2.0', width - 10, height - 10);
    
    return canvas;
}

/**
 * Agrega textura de paredes de celda al fondo
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {number} width - Ancho del canvas
 * @param {number} height - Alto del canvas
 */
function dibujarTexturaParedes(ctx, width, height) {
    // Color base de la pared
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, width, height);
    
    // Patrón de ladrillos
    ctx.fillStyle = '#2a2a2a';
    
    const ladrilloBrillo = () => Math.random() * 0.1 - 0.05;
    const ladrilloAncho = 60;
    const ladrilloAlto = 30;
    
    for (let y = 0; y < height; y += ladrilloAlto) {
        const offsetX = (Math.floor(y / ladrilloAlto) % 2) * (ladrilloAncho / 2);
        
        for (let x = -ladrilloAncho/2; x < width; x += ladrilloAncho) {
            // Variar ligeramente el color para dar textura
            const brillo = ladrilloBrillo();
            ctx.fillStyle = `rgba(${42 + brillo * 255}, ${42 + brillo * 255}, ${42 + brillo * 255}, 1)`;
            
            // Dibujar ladrillo con borde redondeado
            ctx.beginPath();
            ctx.roundRect(x + offsetX, y, ladrilloAncho - 2, ladrilloAlto - 2, 2);
            ctx.fill();
            
            // Agregar línea de mortero
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
    
    // Agregar sombras en las esquinas
    const gradient = ctx.createRadialGradient(
        width/2, height/2, height/3,
        width/2, height/2, height
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

/**
 * Agrega efecto de ruido para simular una foto antigua
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} width - Ancho
 * @param {number} height - Alto
 */
function agregarRuidoFotoAntigua(ctx, x, y, width, height) {
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Sólo aplicar ruido a píxeles no transparentes
        if (data[i+3] > 0) {
            // Añadir efecto de película antigua - rayas y puntos aleatorios
            if (Math.random() < 0.03) {
                const noise = Math.random() * 50 - 25;
                data[i] = Math.max(0, Math.min(255, data[i] + noise));
                data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
                data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
            }
            
            // Ocasionalmente añadir un rasguño vertical
            if (Math.random() < 0.001) {
                data[i] = 255;
                data[i+1] = 255;
                data[i+2] = 255;
                data[i+3] = 180;
            }
        }
    }
    
    ctx.putImageData(imageData, x, y);
}

/**
 * Dibuja una regla de medición como en las fotos policiales
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {number} width - Ancho del canvas
 * @param {number} height - Alto del canvas
 */
function dibujarReglaMedicion(ctx, width, height) {
    // Dibujar regla de medición al lado del avatar
    const reglaPosX = width - 60;
    const reglaPosY = height/2 - 120;
    const reglaAltura = 240;
    
    // Fondo de la regla
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(reglaPosX, reglaPosY, 24, reglaAltura);
    
    // Marcas de la regla
    ctx.fillStyle = '#000000';
    for (let y = 0; y <= reglaAltura; y += 10) {
        const markerWidth = (y % 50 === 0) ? 15 : (y % 20 === 0) ? 10 : 5;
        ctx.fillRect(reglaPosX, reglaPosY + y, markerWidth, 2);
        
        if (y % 50 === 0) {
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText((y/10).toString(), reglaPosX - 5, reglaPosY + y + 5);
        }
    }
}

module.exports = router;
