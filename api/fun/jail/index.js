const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Importar canvas con manejo de errores
let Canvas;
try {
    Canvas = require("canvas");
} catch (error) {
    console.error("Error al cargar canvas, usando modo fallback:", error.message);
    Canvas = null;
}

// Ruta para servir la imagen estática de barras
router.get("/bars.svg", (req, res) => {
    const barsPath = path.join(__dirname, "jail_bars.svg");
    if (fs.existsSync(barsPath)) {
        res.sendFile(barsPath);
    } else {
        res.status(404).send("Archivo de barras no encontrado");
    }
});

/**
 * API JAIL - Genera imágenes de avatares detrás de rejas
 */
router.get("/", async (req, res) => {
    try {
        const { avatar1, nombre, razon, precio, fecha, id } = req.query;

        // Validar parámetro obligatorio
        if (!avatar1) {
            return res.status(400).json({ 
                error: "Se requiere una URL de avatar", 
                ejemplo: "/api/fun/jail?avatar1=https://ejemplo.com/avatar.jpg&nombre=Usuario" 
            });
        }

        // Si Canvas no está disponible, usar modo texto
        if (!Canvas) {
            return res.json({
                success: true,
                modo: "fallback",
                mensaje: "Generando imagen en modo texto (Canvas no disponible en el servidor)",
                avatar: avatar1,
                nombre: nombre || "Prisionero",
                razon: razon || "Delito sin especificar",
                precio: precio || "$1000",
                fecha: fecha || new Date().toLocaleDateString(),
                id: id || generarIdPrisionero()
            });
        }

        // Cargar imagen del avatar con manejo mejorado de errores
        let avatarImg;
        try {
            const avatarResponse = await axios.get(avatar1, { 
                responseType: "arraybuffer",
                timeout: 5000 // Reducido a 5 segundos para evitar timeouts
            });
            
            // Verificar que se recibió contenido
            if (!avatarResponse.data || avatarResponse.data.length === 0) {
                throw new Error("Avatar vacío o no disponible");
            }
            
            avatarImg = await Canvas.loadImage(Buffer.from(avatarResponse.data));
        } catch (loadError) {
            console.error("Error al cargar avatar:", loadError.message);
            return res.status(400).json({ 
                error: "No se pudo cargar la imagen del avatar", 
                detalle: loadError.message 
            });
        }
        
        // Generar la imagen con memoria limitada
        try {
            // Dimensiones más pequeñas para reducir uso de memoria
            const width = 500;
            const height = 500;
            
            // Crear canvas con tamaño limitado
            const canvas = Canvas.createCanvas(width, height);
            const ctx = canvas.getContext('2d', { alpha: false }); // Sin canal alpha para reducir memoria
            
            // Dibujar fondo sólido (más eficiente)
            ctx.fillStyle = '#2c2c2c';
            ctx.fillRect(0, 0, width, height);
            
            // Avatar sin efectos complejos para reducir uso de memoria
            const avatarSize = 200;
            const avatarX = (width - avatarSize) / 2;
            const avatarY = (height - avatarSize) / 2;
            
            // Recorte circular simple
            ctx.save();
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
            
            // Barras de la celda (versión simplificada)
            for (let i = 0; i < 9; i++) {
                const x = i * 60;
                ctx.fillStyle = i % 2 === 0 ? '#111111' : '#222222';
                ctx.fillRect(x, 0, 16, height);
            }
            
            // Área de texto
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, height - 100, width, 100);
            
            // Textos simples
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            
            // Nombre
            ctx.font = 'bold 24px Arial';
            ctx.fillText(nombre || "Prisionero", width / 2, height - 65);
            
            // Razón
            ctx.font = '18px Arial';
            ctx.fillText(razon || "Delito sin especificar", width / 2, height - 35);
            
            // Precio de fianza (si existe)
            if (precio) {
                ctx.fillStyle = '#FF6666';
                ctx.fillText(`Fianza: ${precio}`, width / 2, height - 10);
            }
            
            // Enviar imagen
            res.setHeader('Content-Type', 'image/png');
            canvas.createPNGStream().pipe(res);
        } catch (canvasError) {
            console.error("Error al generar imagen:", canvasError.message);
            
            // Si falla la generación, responder con JSON
            return res.json({
                success: false,
                error: "Error al procesar la imagen en el servidor",
                detalle: canvasError.message,
                fallback: {
                    avatar: avatar1,
                    nombre: nombre || "Prisionero",
                    razon: razon || "Delito sin especificar"
                }
            });
        }
        
    } catch (error) {
        console.error("Error general en API JAIL:", error.message);
        res.status(500).json({ 
            error: "Error al generar la imagen", 
            detalle: error.message 
        });
    }
});

/**
 * Genera un ID de prisionero aleatorio
 */
function generarIdPrisionero() {
    const part1 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const part2 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${part1}-${part2}`;
}

module.exports = router;
