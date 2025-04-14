const express = require("express");
const router = express.Router();
const axios = require("axios");
const path = require("path");
const fs = require("fs");

// Cargar biblioteca Canvas con manejo de errores
let Canvas;
try {
    Canvas = require("canvas");
} catch (error) {
    console.warn("⚠️ Canvas no disponible para Jail API, usando modo alternativo:", error.message);
    Canvas = null;
}

/**
 * API JAIL - Genera imágenes de avatares tras las rejas
 * 
 * Parámetros:
 * @param {string} avatar1 - URL del avatar principal (obligatorio)
 * @param {string} nombre - Nombre del "criminal"
 * @param {string} razon - Razón del arresto
 * @param {string} precio - Monto de la fianza
 * @param {string} estilo - Estilo de celda: 'modern', 'vintage', 'dark' (predeterminado: 'modern')
 * @param {string} filtro - Filtro de imagen: 'sepia', 'bw', 'none' (predeterminado: 'sepia')
 */
router.get("/", async (req, res) => {
    try {
        const { 
            avatar1, 
            nombre, 
            razon, 
            precio, 
            estilo = 'modern',
            filtro = 'sepia',
            id,
            fecha
        } = req.query;

        // Validar parámetro obligatorio
        if (!avatar1) {
            return res.status(400).json({ 
                error: "Se requiere una URL de avatar", 
                ejemplo: "/api/fun/jail?avatar1=https://ejemplo.com/avatar.jpg&nombre=Usuario&estilo=vintage" 
            });
        }

        // Si Canvas no está disponible, usar modo alternativo
        if (!Canvas) {
            return modoHTML(req, res, {
                avatar1, nombre, razon, precio, estilo, filtro, 
                id: id || generarIdPrisionero(),
                fecha: fecha || obtenerFechaActual()
            });
        }

        try {
            // Intentar cargar la imagen con timeout reducido
            const avatarResponse = await axios.get(avatar1, { 
                responseType: "arraybuffer",
                timeout: 5000
            });
            
            const avatarImg = await Canvas.loadImage(Buffer.from(avatarResponse.data));
            
            // Generar la imagen en canvas con configuración optimizada
            const canvas = await generarImagenJail(
                avatarImg, 
                nombre || "Anónimo", 
                razon || "Crimen sin especificar", 
                precio || "$1000",
                estilo,
                filtro,
                id || generarIdPrisionero(),
                fecha || obtenerFechaActual()
            );
            
            // Devolver la imagen directamente
            res.setHeader('Content-Type', 'image/png');
            canvas.createPNGStream().pipe(res);
        } catch (imgError) {
            console.error("Error procesando imagen:", imgError.message);
            // Fallback a modo HTML
            return modoHTML(req, res, {
                avatar1, nombre, razon, precio, estilo, filtro,
                id: id || generarIdPrisionero(),
                fecha: fecha || obtenerFechaActual(),
                error: imgError.message
            });
        }
    } catch (error) {
        console.error("Error en API JAIL:", error.message);
        res.status(500).json({ 
            error: "Error en el servicio", 
            detalle: error.message 
        });
    }
});

/**
 * Fallback: Genera una respuesta HTML cuando Canvas no está disponible
 */
function modoHTML(req, res, params) {
    const { 
        avatar1, nombre, razon, precio, estilo, filtro, id, fecha, error 
    } = params;
    
    // Determinar URL base para recursos
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const barsUrl = `${baseUrl}/api/fun/jail/bars.svg`;
    
    // Generar HTML con la imagen
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jail - ${nombre || "Prisionero"}</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            background: #111;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: Arial, sans-serif;
        }
        .jail-container {
            position: relative;
            width: 500px;
            height: 500px;
            background-color: #2c2c2c;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(0,0,0,0.8);
        }
        .prisoner-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px;
            text-align: center;
        }
        .prisoner-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .prisoner-reason {
            font-size: 16px;
            margin-bottom: 10px;
        }
        .prisoner-bail {
            font-size: 18px;
            color: #ff6666;
            font-weight: bold;
        }
        .avatar {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            border-radius: 50%;
            object-fit: cover;
            z-index: 1;
        }
        .avatar.sepia {
            filter: sepia(0.8);
        }
        .avatar.bw {
            filter: grayscale(1);
        }
        .bars {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
        }
        .prison-id {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 5px 10px;
            font-size: 14px;
        }
        .prison-date {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 5px 10px;
            font-size: 14px;
        }
        .vintage .jail-container {
            background-color: #3c3835;
        }
        .dark .jail-container {
            background-color: #111111;
        }
        .vintage .avatar {
            filter: sepia(0.9) brightness(0.8) contrast(1.2);
        }
        .dark .prisoner-info {
            background: rgba(0,0,0,0.9);
        }
        .watermark {
            position: absolute;
            bottom: 5px;
            right: 10px;
            color: rgba(255,255,255,0.3);
            font-size: 12px;
            z-index: 3;
        }
    </style>
</head>
<body class="${estilo}">
    <div class="jail-container">
        <div class="prison-id">ID: ${id}</div>
        <div class="prison-date">FECHA: ${fecha}</div>
        <img src="${avatar1}" class="avatar ${filtro}" alt="Prisionero">
        <img src="${barsUrl}" class="bars" alt="Rejas">
        <div class="prisoner-info">
            <div class="prisoner-name">${nombre || "Prisionero"}</div>
            <div class="prisoner-reason">${razon || "Crimen sin especificar"}</div>
            ${precio ? `<div class="prisoner-bail">Fianza: ${precio}</div>` : ''}
        </div>
        <div class="watermark">JailAPI</div>
    </div>
</body>
</html>`;

    // Devolver HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
}

/**
 * Genera la imagen de prisión en Canvas
 */
async function generarImagenJail(avatarImg, nombre, razon, precio, estilo, filtro, id, fecha) {
    // Canvas y contexto optimizados para rendimiento
    const canvas = Canvas.createCanvas(500, 500);
    const ctx = canvas.getContext('2d', { alpha: false });
    
    // Estilos de celda
    const estilos = {
        modern: {
            fondoColor: '#2c2c2c',
            textoBgColor: 'rgba(0,0,0,0.8)',
            textoColor: '#ffffff',
            precioColor: '#ff6666'
        },
        vintage: {
            fondoColor: '#3c3835',
            textoBgColor: 'rgba(30,25,20,0.8)',
            textoColor: '#e8e0d0',
            precioColor: '#ffcc99'
        },
        dark: {
            fondoColor: '#111111',
            textoBgColor: 'rgba(0,0,0,0.9)',
            textoColor: '#aaaaaa',
            precioColor: '#cc3333'
        }
    };
    
    // Seleccionar estilo (con fallback a modern)
    const estiloActual = estilos[estilo] || estilos.modern;
    
    // 1. Dibujar fondo
    ctx.fillStyle = estiloActual.fondoColor;
    ctx.fillRect(0, 0, 500, 500);
    
    // 2. Dibujar ID y fecha en la esquina superior
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 500, 40);
    ctx.fillStyle = estiloActual.textoColor;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`ID: ${id}`, 15, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`FECHA: ${fecha}`, 485, 25);
    
    // 3. Dibujar avatar circular con filtro seleccionado
    const avatarSize = 200;
    const avatarX = 250;
    const avatarY = 220;
    
    // Crear máscara circular
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Dibujar avatar
    ctx.drawImage(
        avatarImg, 
        avatarX - avatarSize/2, 
        avatarY - avatarSize/2, 
        avatarSize, 
        avatarSize
    );
    
    // Aplicar filtro según solicitud
    if (filtro === 'sepia' || estilo === 'vintage') {
        aplicarFiltroSepia(ctx, avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
    } else if (filtro === 'bw') {
        aplicarFiltroBlancoNegro(ctx, avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
    }
    
    ctx.restore();
    
    // 4. Dibujar borde del avatar
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize/2 + 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 6;
    ctx.stroke();
    
    // 5. Dibujar área de texto
    const textAreaHeight = 120;
    ctx.fillStyle = estiloActual.textoBgColor;
    ctx.fillRect(0, 500 - textAreaHeight, 500, textAreaHeight);
    
    // 6. Dibujar nombre
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = estiloActual.textoColor;
    ctx.textAlign = 'center';
    ctx.fillText(nombre, 250, 500 - textAreaHeight + 30);
    
    // 7. Dibujar razón del arresto (con ajuste para texto largo)
    ctx.font = '18px Arial';
    
    // Dividir texto largo en líneas si es necesario
    const maxWidth = 450;
    const lineHeight = 22;
    const palabras = razon.split(' ');
    let linea = '';
    let y = 500 - textAreaHeight + 65;
    
    for (const palabra of palabras) {
        const testLinea = linea + (linea ? ' ' : '') + palabra;
        const { width } = ctx.measureText(testLinea);
        
        if (width > maxWidth) {
            ctx.fillText(linea, 250, y);
            linea = palabra;
            y += lineHeight;
            
            // Si ya no hay espacio, cortar
            if (y > 500 - 40) {
                ctx.fillText(linea + '...', 250, y);
                break;
            }
        } else {
            linea = testLinea;
        }
    }
    
    // Dibujar última línea si queda texto
    if (linea && y <= 500 - 40) {
        ctx.fillText(linea, 250, y);
    }
    
    // 8. Dibujar precio de fianza con estilo resaltado
    if (precio) {
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = estiloActual.precioColor;
        ctx.fillText(`Fianza: ${precio}`, 250, 500 - 25);
    }
    
    // 9. Añadir marca de agua
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'right';
    ctx.fillText('JailAPI', 490, 490);
    
    // 10. Dibujar las barras
    // Esta parte depende del SVG, que ahora se carga y superpone directamente
    
    return canvas;
}

/**
 * Aplicar filtro sepia a la imagen
 */
function aplicarFiltroSepia(ctx, x, y, width, height) {
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Calcular valores sepia
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Convertir a sepia con una fórmula optimizada
        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
    }
    
    ctx.putImageData(imageData, x, y);
}

/**
 * Aplicar filtro blanco y negro a la imagen
 */
function aplicarFiltroBlancoNegro(ctx, x, y, width, height) {
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Convertir a escala de grises
        const avg = (data[i] * 0.3) + (data[i + 1] * 0.59) + (data[i + 2] * 0.11);
        data[i] = avg; // R
        data[i + 1] = avg; // G
        data[i + 2] = avg; // B
    }
    
    ctx.putImageData(imageData, x, y);
}

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

// Servir el SVG mejorado desde la ruta /bars.svg
router.get("/bars.svg", (req, res) => {
    const svgPath = path.join(__dirname, "jail_bars.svg");
    
    if (fs.existsSync(svgPath)) {
        res.setHeader("Content-Type", "image/svg+xml");
        res.sendFile(svgPath);
    } else {
        // SVG fallback en línea si el archivo no existe
        res.setHeader("Content-Type", "image/svg+xml");
        res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
  <g>
    <rect x="45" y="0" width="14" height="500" fill="#111111" />
    <rect x="105" y="0" width="14" height="500" fill="#1a1a1a" />
    <rect x="165" y="0" width="14" height="500" fill="#111111" />
    <rect x="225" y="0" width="14" height="500" fill="#1a1a1a" />
    <rect x="285" y="0" width="16" height="500" fill="#111111" />
    <rect x="345" y="0" width="14" height="500" fill="#1a1a1a" />
    <rect x="405" y="0" width="14" height="500" fill="#111111" />
    <rect x="465" y="0" width="14" height="500" fill="#1a1a1a" />
    <rect x="0" y="90" width="500" height="12" fill="#111111" />
    <rect x="0" y="240" width="500" height="14" fill="#1a1a1a" />
    <rect x="0" y="390" width="500" height="12" fill="#111111" />
  </g>
</svg>`);
    }
});

module.exports = router;
