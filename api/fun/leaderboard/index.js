// api/utility/leaderboard/index.js
const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const router = express.Router();

// Configuración para guardar imágenes
const IMAGES_DIR = path.join(__dirname, "output");
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || "https://api.apikarl.com";
const PUBLIC_PATH = "/api/utility/leaderboard/output";

// Crear directorio de salida si no existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Ruta para servir imágenes generadas
router.get("/output/:filename", (req, res) => {
    const filePath = path.join(IMAGES_DIR, req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=3600"); // Cache por 1 hora
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "Imagen de ranking no encontrada" });
    }
});

// Plantillas de estilos para el banner
const ESTILOS_BANNER = {
    default: {
        backgroundColor: "#1a1a2e",
        headerColor: "#16213e",
        textColor: "#ffffff",
        accentColor: "#0f3460",
        highlightColor: "#e94560",
        font: "Arial"
    },
    gaming: {
        backgroundColor: "#121212",
        headerColor: "#3a0ca3",
        textColor: "#ffffff",
        accentColor: "#4361ee",
        highlightColor: "#f72585",
        font: "Impact"
    },
    corporate: {
        backgroundColor: "#ffffff",
        headerColor: "#003049",
        textColor: "#000000",
        accentColor: "#669bbc",
        highlightColor: "#d62828",
        font: "Helvetica"
    },
    fantasy: {
        backgroundColor: "#2c3639",
        headerColor: "#3f4e4f",
        textColor: "#f9f9f9",
        accentColor: "#a27b5c",
        highlightColor: "#dcd7c9",
        font: "Georgia"
    },
    neon: {
        backgroundColor: "#000000",
        headerColor: "#240046",
        textColor: "#f8f9fa",
        accentColor: "#3c096c",
        highlightColor: "#ff9e00",
        font: "Verdana"
    },
    pastel: {
        backgroundColor: "#f8edeb",
        headerColor: "#fec5bb",
        textColor: "#353535",
        accentColor: "#fcd5ce",
        highlightColor: "#ff8fab",
        font: "Comic Sans MS"
    }
};

// Endpoint principal para generar ranking
router.get("/", async (req, res) => {
    try {
        // Verificar parámetros obligatorios para al menos un usuario
        if (!req.query.usuario1 || !req.query.avatar1 || !req.query.tipo_puntuaje1 || !req.query.puntuaje1) {
            return res.status(400).json({ 
                error: "Faltan parámetros obligatorios", 
                requeridos: "usuario1, avatar1, tipo_puntuaje1, puntuaje1", 
                ejemplo: "/api/utility/leaderboard?usuario1=Jugador1&avatar1=https://ejemplo.com/avatar.jpg&tipo_puntuaje1=Puntos&puntuaje1=1000"
            });
        }
        
        // Parámetros generales del ranking
        const titulo = req.query.titulo || "Tabla de Clasificación";
        const estilo = req.query.estilo || "default";
        
        // Lista para almacenar usuarios del ranking
        const usuarios = [];
        
        // Procesar hasta 30 posibles usuarios
        for (let i = 1; i <= 30; i++) {
            const usuarioParam = req.query[`usuario${i}`];
            const avatarParam = req.query[`avatar${i}`];
            const tipoPuntuajeParam = req.query[`tipo_puntuaje${i}`];
            const puntuajeParam = req.query[`puntuaje${i}`];
            const bannerParam = req.query[`banner${i}`];
            
            // Si no hay nombre de usuario para esta posición, terminamos
            if (!usuarioParam) break;
            
            // Si faltan parámetros obligatorios para esta posición, saltamos
            if (!avatarParam || !tipoPuntuajeParam || !puntuajeParam) continue;
            
            // Agregar usuario al ranking
            usuarios.push({
                nombre: usuarioParam,
                avatar: avatarParam,
                tipo_puntuaje: tipoPuntuajeParam,
                puntuaje: parseInt(puntuajeParam) || 0,
                banner: bannerParam || null
            });
        }
        
        // Ordenar usuarios por puntuaje (mayor a menor)
        usuarios.sort((a, b) => b.puntuaje - a.puntuaje);
        
        // Generar imagen del ranking
        const imagenUrl = await generarImagenRanking(usuarios, titulo, estilo);
        
        // Responder con la URL de la imagen
        res.json({
            success: true,
            titulo: titulo,
            usuarios: usuarios.length,
            imagen_url: imagenUrl,
            estilo: estilo
        });
        
    } catch (error) {
        console.error("Error al generar ranking:", error);
        res.status(500).json({ 
            error: "Error al generar imagen de ranking", 
            detalle: error.message 
        });
    }
});

// Endpoint para mostrar los estilos disponibles
router.get("/estilos", (req, res) => {
    res.json({
        estilos_disponibles: Object.keys(ESTILOS_BANNER),
        ejemplos: Object.keys(ESTILOS_BANNER).map(estilo => ({
            nombre: estilo,
            imagen_ejemplo: `${PUBLIC_URL_BASE}/api/utility/leaderboard?titulo=Ejemplo ${estilo}&estilo=${estilo}&usuario1=Jugador1&avatar1=https://i.pravatar.cc/150?u=1&tipo_puntuaje1=Puntos&puntuaje1=1000&usuario2=Jugador2&avatar2=https://i.pravatar.cc/150?u=2&tipo_puntuaje2=Puntos&puntuaje2=850`
        }))
    });
});

/**
 * Genera una imagen con el ranking de usuarios
 */
async function generarImagenRanking(usuarios, titulo, estiloNombre) {
    // Obtener estilo del banner
    const estilo = ESTILOS_BANNER[estiloNombre] || ESTILOS_BANNER.default;
    
    // Dimensiones de la imagen
    const width = 800;
    const headerHeight = 120;
    const rowHeight = 80;
    const height = headerHeight + (rowHeight * usuarios.length) + 40;
    
    // Crear canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Dibujar fondo
    ctx.fillStyle = estilo.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Dibujar encabezado
    ctx.fillStyle = estilo.headerColor;
    ctx.fillRect(0, 0, width, headerHeight);
    
    // Título
    ctx.font = `bold 40px ${estilo.font}`;
    ctx.fillStyle = estilo.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titulo, width / 2, headerHeight / 2);
    
    // Cargamos los avatares que estén disponibles
    const avatares = [];
    for (let i = 0; i < usuarios.length; i++) {
        const usuario = usuarios[i];
        try {
            avatares[i] = await loadImage(usuario.avatar);
        } catch (error) {
            console.error(`Error cargando avatar de ${usuario.nombre}:`, error.message);
            // Si falla, no asignamos avatar (será null)
        }
    }
    
    // Cargar banners personalizados si existen
    const banners = [];
    for (let i = 0; i < usuarios.length; i++) {
        const usuario = usuarios[i];
        if (usuario.banner) {
            try {
                banners[i] = await loadImage(usuario.banner);
            } catch (error) {
                console.error(`Error cargando banner de ${usuario.nombre}:`, error.message);
                // Si falla, no asignamos banner (será null)
            }
        }
    }
    
    // Dibujar cada fila
    for (let i = 0; i < usuarios.length; i++) {
        const usuario = usuarios[i];
        const posicion = i + 1;
        const y = headerHeight + (i * rowHeight);
        
        // Si hay banner personalizado, usarlo como fondo de la fila
        if (banners[i]) {
            ctx.drawImage(banners[i], 0, y, width, rowHeight);
            
            // Agregar capa semitransparente para mejorar legibilidad
            ctx.fillStyle = `rgba(${hexToRgb(estilo.accentColor)}, 0.7)`;
            ctx.fillRect(0, y, width, rowHeight);
        } else {
            // Fondo de fila alternante si no hay banner
            ctx.fillStyle = i % 2 === 0 ? estilo.accentColor : adjustColor(estilo.accentColor, -20);
            ctx.fillRect(0, y, width, rowHeight);
        }
        
        // Posición
        ctx.font = `bold 30px ${estilo.font}`;
        ctx.fillStyle = posicion <= 3 ? estilo.highlightColor : estilo.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${posicion}`, 40, y + rowHeight / 2);
        
        // Avatar
        const avatarSize = 60;
        const avatarX = 100;
        const avatarY = y + rowHeight / 2;
        
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
        
        if (avatares[i]) {
            // Dibujar avatar con recorte circular
            ctx.save();
            ctx.clip();
            ctx.drawImage(
                avatares[i],
                avatarX - avatarSize / 2,
                avatarY - avatarSize / 2,
                avatarSize,
                avatarSize
            );
            ctx.restore();
            
            // Borde del avatar
            ctx.strokeStyle = posicion <= 3 ? estilo.highlightColor : estilo.textColor;
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            // Círculo de placeholder
            ctx.fillStyle = posicion <= 3 ? estilo.highlightColor : adjustColor(estilo.accentColor, 40);
            ctx.fill();
            
            // Iniciales del usuario
            const iniciales = obtenerIniciales(usuario.nombre);
            ctx.font = `bold 20px ${estilo.font}`;
            ctx.fillStyle = estilo.textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(iniciales, avatarX, avatarY);
        }
        
        // Nombre de usuario
        ctx.font = `bold 22px ${estilo.font}`;
        ctx.fillStyle = estilo.textColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(usuario.nombre, 150, y + rowHeight / 2 - 10);
        
        // Puntuaje con tipo
        ctx.font = `16px ${estilo.font}`;
        ctx.fillStyle = posicion <= 3 ? estilo.highlightColor : estilo.textColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${formatearNumero(usuario.puntuaje)} ${usuario.tipo_puntuaje}`, 150, y + rowHeight / 2 + 15);
        
        // Medallas para los tres primeros
        if (posicion <= 3) {
            const medallas = ["🥇", "🥈", "🥉"];
            ctx.font = `30px Arial`;
            ctx.textAlign = 'right';
            ctx.fillText(medallas[posicion - 1], width - 40, y + rowHeight / 2);
        }
    }
    
    // Footer
    const footerY = headerHeight + (usuarios.length * rowHeight);
    ctx.fillStyle = estilo.headerColor;
    ctx.fillRect(0, footerY, width, 40);
    
    ctx.font = `14px ${estilo.font}`;
    ctx.fillStyle = estilo.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Generado: ${new Date().toLocaleDateString()} - API Karl Leaderboard`, width / 2, footerY + 20);
    
    // Guardar imagen
    const filename = `ranking-${crypto.randomBytes(8).toString('hex')}.png`;
    const outputPath = path.join(IMAGES_DIR, filename);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    // Devolver URL completa
    return `${PUBLIC_URL_BASE}${PUBLIC_PATH}/${filename}`;
}

/**
 * Obtiene las iniciales de un nombre de usuario
 */
function obtenerIniciales(nombre) {
    if (!nombre) return "?";
    
    const palabras = nombre.split(' ');
    
    if (palabras.length === 1) {
        return nombre.substring(0, 2).toUpperCase();
    }
    
    return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase();
}

/**
 * Formatea números grandes (ej: 1000 -> 1K)
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
 * Ajusta un color (más claro o más oscuro)
 */
function adjustColor(color, amount) {
    // Convertir a RGB
    let hex = color;
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }
    
    // Convertir a valores RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Ajustar valores
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    // Convertir de nuevo a hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Convierte color hex a valores RGB
 */
function hexToRgb(hex) {
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
}

// Limpiar archivos antiguos periódicamente (cada 12 horas)
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
                console.log(`Archivo de ranking eliminado: ${file}`);
            }
        });
    } catch (error) {
        console.error("Error en limpieza de archivos de ranking:", error);
    }
}, 12 * 60 * 60 * 1000);

module.exports = router;
