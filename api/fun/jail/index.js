// api/fun/jail/index.js
const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();

// Configuración para guardar imágenes
const IMAGES_DIR = path.join(__dirname, "output");
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || "https://api.apikarl.com";
const PUBLIC_PATH = "/api/fun/jail/output";

// Crear directorio de salida si no existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Ruta para servir las imágenes guardadas
router.get("/output/:filename", (req, res) => {
    const filePath = path.join(IMAGES_DIR, req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400"); // Cache por 24 horas
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "Imagen no encontrada" });
    }
});

/**
 * API JAIL - Genera imágenes de avatares detrás de rejas
 * Parámetros:
 * - avatar1: URL del avatar que estará tras las rejas (obligatorio)
 * - background: URL de la imagen de fondo (opcional)
 * - precio: Monto de la fianza (opcional)
 * - nombre: Nombre del arrestado (opcional)
 * - razon: Razón del arresto (opcional)
 */
router.get("/", async (req, res) => {
    try {
        const { avatar1, background, precio, nombre, razon } = req.query;

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
                timeout: 15000
            });
            avatarImg = await loadImage(Buffer.from(avatarResponse.data));

            // Si hay una imagen de fondo personalizada, cargarla
            if (background) {
                const bgResponse = await axios.get(background, {
                    responseType: "arraybuffer",
                    timeout: 15000
                });
                backgroundImg = await loadImage(Buffer.from(bgResponse.data));
            }
            
            // Cargar imagen de rejas (debe estar en la misma carpeta o usar una ruta absoluta)
            const rejasImg = await loadImage(path.join(__dirname, "jail_bars.svg"));
            
            // Generar la imagen
            const canvas = await generarImagenJail(avatarImg, backgroundImg, rejasImg, nombre, precio, razon);
            
            // Generar nombre único para la imagen
            const hash = crypto.randomBytes(8).toString('hex');
            const filename = `jail-${hash}.png`;
            const filePath = path.join(IMAGES_DIR, filename);
            
            // Guardar la imagen como PNG
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(filePath, buffer);
            
            // Generar URL pública
            const imageUrl = `${PUBLIC_URL_BASE}${PUBLIC_PATH}/${filename}`;
            
            // Programar eliminación del archivo después de 24 horas
            setTimeout(() => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Imagen JAIL eliminada: ${filename}`);
                }
            }, 24 * 60 * 60 * 1000);
            
            // Responder con JSON que contiene la URL de la imagen
            return res.json({
                success: true,
                url: imageUrl,
                message: "Imagen JAIL generada correctamente"
            });
            
        } catch (loadError) {
            console.error("Error cargando imágenes:", loadError);
            return res.status(400).json({ 
                error: "Error al cargar las imágenes", 
                detalle: loadError.message 
            });
        }

    } catch (error) {
        console.error("Error en API JAIL:", error);
        res.status(500).json({ 
            error: "Error al generar la imagen JAIL",
            detalle: error.message
        });
    }
});

/**
 * Genera la imagen JAIL con todos los elementos
 * @param {Image} avatarImg - Imagen del avatar
 * @param {Image} backgroundImg - Imagen de fondo (opcional)
 * @param {Image} rejasImg - Imagen de las rejas
 * @param {string} nombre - Nombre del arrestado (opcional)
 * @param {string} precio - Precio de la fianza (opcional)
 * @param {string} razon - Razón del arresto (opcional)
 * @returns {Canvas} - Canvas con la imagen final
 */
async function generarImagenJail(avatarImg, backgroundImg, rejasImg, nombre, precio, razon) {
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
        ctx.globalAlpha = 0.5; // Hacer el fondo semi-transparente para oscurecerlo
        ctx.drawImage(backgroundImg, x, y, scaledWidth, scaledHeight);
        ctx.globalAlpha = 1.0; // Restaurar opacidad normal
    }
    
    // Dibujar avatar en el centro (dentro de un círculo)
    const avatarSize = 300;
    const avatarX = (width - avatarSize) / 2;
    const avatarY = (height - avatarSize) / 2;
    
    // Crear máscara circular para el avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Dibujar avatar dentro del círculo
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    
    // Agregar efecto de escala de grises al avatar
    const imageData = ctx.getImageData(avatarX, avatarY, avatarSize, avatarSize);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // R
        data[i + 1] = avg; // G
        data[i + 2] = avg; // B
        // No modificar el canal alpha (i+3)
    }
    
    ctx.putImageData(imageData, avatarX, avatarY);
    ctx.restore();
    
    // Dibujar el borde del avatar
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, avatarSize / 2 + 4, 0, Math.PI * 2);
    ctx.stroke();
    
    // Dibujar las rejas sobre todo
    ctx.drawImage(rejasImg, 0, 0, width, height);
    
    // Dibujar texto en la parte inferior
    // Primero, un fondo para el texto
    const textBgHeight = 120;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, height - textBgHeight, width, textBgHeight);
    
    // Configurar estilo del texto
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    
    // Dibujar cada texto si está definido
    if (nombre) {
        ctx.font = 'bold 28px Arial';
        ctx.fillText(nombre, width / 2, height - textBgHeight + 35);
    }
    
    if (razon) {
        ctx.font = '24px Arial';
        ctx.fillText(razon, width / 2, height - textBgHeight + 70);
    }
    
    if (precio) {
        ctx.font = 'bold 22px Arial';
        ctx.fillText(`Fianza: ${precio}`, width / 2, height - textBgHeight + 105);
    }
    
    return canvas;
}

// Limpieza periódica de archivos antiguos (cada 12 horas)
setInterval(() => {
    try {
        const files = fs.readdirSync(IMAGES_DIR);
        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(IMAGES_DIR, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtimeMs;
            
            // Eliminar archivos mayores a 24 horas
            if (fileAge > 24 * 60 * 60 * 1000) {
                fs.unlinkSync(filePath);
                console.log(`Archivo JAIL eliminado: ${file}`);
            }
        });
    } catch (error) {
        console.error("Error en limpieza de archivos:", error);
    }
}, 12 * 60 * 60 * 1000);

module.exports = router;
