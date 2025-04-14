const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Configuración para guardar imágenes temporalmente
const TEMP_DIR = path.join(__dirname, "temp");
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * API JAIL - Genera imágenes de avatares detrás de rejas
 * 
 * Parámetros:
 * @param {string} avatar1 - URL del avatar principal (obligatorio)
 * @param {string} nombre - Nombre del prisionero
 * @param {string} razon - Razón del arresto
 * @param {string} precio - Precio de la fianza
 * @param {string} fecha - Fecha del arresto (por defecto: fecha actual)
 * @param {string} id - ID del prisionero (por defecto: generado aleatoriamente)
 */
router.get("/", async (req, res) => {
    try {
        const { avatar1, nombre, razon, precio, fecha, id } = req.query;

        // Validar parámetro obligatorio
        if (!avatar1) {
            return res.status(400).json({ 
                error: "Se requiere una URL de avatar", 
                ejemplo: "/api/fun/jail?avatar1=https://ejemplo.com/avatar.jpg&nombre=Usuario&razon=Robo%20de%20memes" 
            });
        }

        // Cargar imagen del avatar
        let avatarImg;
        try {
            const avatarResponse = await axios.get(avatar1, { 
                responseType: "arraybuffer",
                timeout: 10000 // 10 segundos timeout
            });
            
            avatarImg = await loadImage(Buffer.from(avatarResponse.data));
        } catch (loadError) {
            return res.status(400).json({ 
                error: "No se pudo cargar la imagen del avatar", 
                detalle: loadError.message 
            });
        }
        
        // Generar la imagen de la prisión
        const canvas = await generarImagenJail(
            avatarImg,
            nombre || "Prisionero",
            razon || "Delito sin especificar",
            precio || "$1000",
            fecha || obtenerFechaActual(),
            id || generarIdPrisionero()
        );
        
        // Enviar imagen como respuesta
        res.setHeader('Content-Type', 'image/png');
        canvas.createPNGStream().pipe(res);
        
    } catch (error) {
        console.error("Error en API JAIL:", error);
        res.status(500).json({ 
            error: "Error al generar la imagen", 
            detalle: error.message 
        });
    }
});

/**
 * Genera un ID de prisionero aleatorio en formato '000-000'
 */
function generarIdPrisionero() {
    const part1 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const part2 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${part1}-${part2}`;
}

/**
 * Obtiene la fecha actual en formato DD/MM/YYYY
 */
function obtenerFechaActual() {
    const fecha = new Date();
    return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
}

/**
 * Genera la imagen completa con el avatar encarcelado
 */
async function generarImagenJail(avatarImg, nombre, razon, precio, fecha, id) {
    // Dimensiones de la imagen
    const width = 600;
    const height = 600;
    
    // Crear canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Dibujar fondo (color gris oscuro)
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(0, 0, width, height);
    
    // Dibujar textura de pared de celda
    dibujarTexturaParedes(ctx, width, height);
    
    // Dibujar ID y fecha en la esquina superior
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, 50);
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(`ID: ${id}`, 20, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`FECHA: ${fecha}`, width - 20, 30);
    
    // Dibujar avatar en el centro con efecto sepia
    const avatarSize = 300;
    const avatarX = (width - avatarSize) / 2;
    const avatarY = (height - avatarSize) / 2 - 10;
    
    // Crear máscara circular para el avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 10, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Dibujar avatar dentro del círculo
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    
    // Aplicar efecto sepia
    const imageData = ctx.getImageData(avatarX, avatarY, avatarSize, avatarSize);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Convertir a escala de grises
        const avg = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
        
        // Aplicar tono sepia
        data[i] = Math.min(255, avg * 1.2); // R - más rojo
        data[i + 1] = Math.min(255, avg * 1.0); // G
        data[i + 2] = Math.min(255, avg * 0.8); // B - menos azul
    }
    
    ctx.putImageData(imageData, avatarX, avatarY);
    
    // Agregar ruido/textura de foto antigua
    agregarRuidoFotoAntigua(ctx, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
    
    // Dibujar borde del avatar
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 10, avatarSize / 2 + 4, 0, Math.PI * 2);
    ctx.stroke();
    
    // Agregar regla de medición al fondo (típica de fotos policiales)
    dibujarReglaMedicion(ctx, width, height);
    
    // Cargar y dibujar barras de la celda desde el archivo SVG
    try {
        const barsSvgPath = path.join(__dirname, "jail_bars.svg");
        const rejasImg = await loadImage(barsSvgPath);
        ctx.drawImage(rejasImg, 0, 0, width, height);
    } catch (svgError) {
        console.error("Error cargando SVG de rejas:", svgError);
        // Si falla la carga del SVG, usar el método alternativo
        dibujarBarras(ctx, width, height);
    }
    
    // Dibujar texto en la parte inferior
    const textBgHeight = 140;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, height - textBgHeight, width, textBgHeight);
    
    // Línea divisoria en la parte superior del área de texto
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - textBgHeight);
    ctx.lineTo(width, height - textBgHeight);
    ctx.stroke();
    
    // Dibujar nombre
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(nombre, width / 2, height - textBgHeight + 30);
    
    // Dibujar razón del arresto
    ctx.font = '22px Arial';
    const palabras = razon.split(' ');
    let linea = '';
    let yPos = height - textBgHeight + 65;
    
    for (let i = 0; i < palabras.length; i++) {
        const testLinea = linea + palabras[i] + ' ';
        const metrica = ctx.measureText(testLinea);
        
        if (metrica.width > width - 40 && i > 0) {
            ctx.fillText(linea, width / 2, yPos);
            linea = palabras[i] + ' ';
            yPos += 30;
            
            // Si se sale del espacio, cortar el texto
            if (yPos > height - 40) {
                ctx.fillText(linea + '...', width / 2, yPos);
                break;
            }
        } else {
            linea = testLinea;
        }
        
        // Última línea
        if (i === palabras.length - 1) {
            ctx.fillText(linea, width / 2, yPos);
        }
    }
    
    // Dibujar precio de fianza
    if (precio) {
        ctx.font = 'bold 24px Arial';
        const precioTexto = `FIANZA: ${precio}`;
        const precioMetrica = ctx.measureText(precioTexto);
        const precioWidth = precioMetrica.width + 40;
        
        // Fondo para el precio
        ctx.fillStyle = 'rgba(255, 50, 50, 0.7)';
        ctx.fillRect((width - precioWidth) / 2, height - 40, precioWidth, 32);
        
        // Borde para el precio
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect((width - precioWidth) / 2, height - 40, precioWidth, 32);
        
        // Texto del precio
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(precioTexto, width / 2, height - 25);
    }
    
    // Agregar marca de agua sutil
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'right';
    ctx.fillText('JailAPI', width - 10, height - 10);
    
    return canvas;
}

/**
 * Dibuja las barras de la celda
 */
function dibujarBarras(ctx, width, height) {
    // Configuración de las barras
    const barWidth = 14;
    const barGap = 60;
    const numBars = Math.floor(width / barGap) + 1;
    
    // Dibujar barras verticales
    for (let i = 0; i < numBars; i++) {
        const x = i * barGap;
        
        // Crear gradiente para efecto metálico
        const barGradient = ctx.createLinearGradient(x, 0, x + barWidth, 0);
        barGradient.addColorStop(0, '#444444');
        barGradient.addColorStop(0.5, '#111111');
        barGradient.addColorStop(1, '#333333');
        
        // Dibujar barra
        ctx.fillStyle = barGradient;
        ctx.fillRect(x, 0, barWidth, height);
        
        // Agregar brillo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x + 2, 0, 2, height);
    }
    
    // Dibujar barras horizontales
    const horizontalBars = [100, 300, 500];
    for (const y of horizontalBars) {
        // Crear gradiente para efecto metálico
        const barGradient = ctx.createLinearGradient(0, y, 0, y + barWidth);
        barGradient.addColorStop(0, '#444444');
        barGradient.addColorStop(0.5, '#111111');
        barGradient.addColorStop(1, '#333333');
        
        // Dibujar barra
        ctx.fillStyle = barGradient;
        ctx.fillRect(0, y, width, barWidth);
        
        // Agregar brillo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, y + 2, width, 2);
    }
}

/**
 * Dibuja textura de paredes de celda al fondo
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

// Limpieza periódica de imágenes temporales (cada hora)
setInterval(() => {
    try {
        const files = fs.readdirSync(TEMP_DIR);
        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(TEMP_DIR, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtimeMs;
            
            // Eliminar archivos mayores a 1 hora
            if (fileAge > 60 * 60 * 1000) {
                fs.unlinkSync(filePath);
                console.log(`Archivo temporal eliminado: ${file}`);
            }
        });
    } catch (error) {
        console.error("Error en limpieza de archivos temporales:", error);
    }
}, 60 * 60 * 1000);

module.exports = router;
