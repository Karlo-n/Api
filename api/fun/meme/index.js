// api/fun/meme/index.js
const express = require("express");
const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();

// Configuración para guardar imágenes
const IMAGES_DIR = path.join(__dirname, "output");
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || "https://api.apikarl.com"; // Cambia esto a tu dominio
const PUBLIC_PATH = "/api/fun/meme/output"; // Ruta pública para acceder a las imágenes

// Crear directorio de salida si no existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Plantillas predefinidas de memes populares (50 plantillas)
const MEME_TEMPLATES = {
    // Clásicos y más populares
    "drake": "https://imgflip.com/s/meme/Drake-Hotline-Bling.jpg",
    "distracted": "https://imgflip.com/s/meme/Distracted-Boyfriend.jpg",
    "button": "https://imgflip.com/s/meme/Two-Buttons.jpg",
    "change": "https://imgflip.com/s/meme/Change-My-Mind.jpg",
    "doge": "https://imgflip.com/s/meme/Doge.jpg",
    "alien": "https://imgflip.com/s/meme/Ancient-Aliens.jpg",
    "fry": "https://imgflip.com/s/meme/Futurama-Fry.jpg",
    "wonka": "https://imgflip.com/s/meme/Creepy-Condescending-Wonka.jpg",
    "success": "https://imgflip.com/s/meme/Success-Kid.jpg",
    "rollsafe": "https://imgflip.com/s/meme/Roll-Safe-Think-About-It.jpg",
    
    // Expansión - Memes populares modernos
    "expanding": "https://imgflip.com/s/meme/Expanding-Brain.jpg",
    "boyfriend": "https://imgflip.com/s/meme/Distracted-Boyfriend.jpg",
    "woman-yelling": "https://imgflip.com/s/meme/Woman-Yelling-At-Cat.jpg",
    "cat": "https://imgflip.com/s/meme/Smudge-the-Cat.jpg",
    "butterfly": "https://imgflip.com/s/meme/Is-This-A-Pigeon.jpg",
    "always-has-been": "https://imgflip.com/s/meme/Always-Has-Been.png",
    "stonks": "https://imgflip.com/s/meme/Stonks.jpg",
    "not-stonks": "https://imgflip.com/s/meme/Not-Stonks.jpg",
    "trade-offer": "https://imgflip.com/s/meme/Trade-Offer.jpg",
    "mike-sullivan": "https://imgflip.com/s/meme/Sully-Face-Swap.jpg",
    
    // Más clásicos
    "one-does-not": "https://imgflip.com/s/meme/One-Does-Not-Simply.jpg",
    "disaster-girl": "https://imgflip.com/s/meme/Disaster-Girl.jpg",
    "cry": "https://imgflip.com/s/meme/First-World-Problems.jpg",
    "evil-kermit": "https://imgflip.com/s/meme/Evil-Kermit.jpg",
    "patrick": "https://imgflip.com/s/meme/Evil-Patrick.jpg",
    "this-is-fine": "https://imgflip.com/s/meme/This-Is-Fine.jpg",
    "hide-the-pain": "https://imgflip.com/s/meme/Hide-the-Pain-Harold.jpg",
    "waiting-skeleton": "https://imgflip.com/s/meme/Waiting-Skeleton.jpg",
    "awkward-monkey": "https://imgflip.com/s/meme/Monkey-Puppet.jpg",
    "sweating-button": "https://imgflip.com/s/meme/Blank-Button.jpg",
    
    // Más memes modernos
    "surprised-pikachu": "https://imgflip.com/s/meme/Surprised-Pikachu.jpg",
    "gru-plan": "https://imgflip.com/s/meme/Grus-Plan.jpg",
    "and-just": "https://imgflip.com/s/meme/Left-Exit-12-Off-Ramp.jpg",
    "buff-doge": "https://imgflip.com/s/meme/Buff-Doge-vs-Cheems.png",
    "cheems": "https://imgflip.com/s/meme/Swole-Doge-vs-Cheems.png",
    "tuxedo-pooh": "https://imgflip.com/s/meme/Tuxedo-Winnie-The-Pooh.png",
    "pointing-spiderman": "https://imgflip.com/s/meme/Spider-Man-Pointing-at-Spider-Man.jpg",
    "unsettled-tom": "https://imgflip.com/s/meme/Unsettled-Tom.jpg",
    "they-dont-know": "https://imgflip.com/s/meme/They-Dont-Know.jpg",
    "bernie-mittens": "https://imgflip.com/s/meme/Bernie-I-Am-Once-Again-Asking-For-Your-Support.jpg",
    
    // Últimas adiciones
    "chad": "https://imgflip.com/s/meme/Average-Fan-vs-Average-Enjoyer.jpg",
    "omg": "https://imgflip.com/s/meme/OMG-Face.jpg",
    "galaxy-brain": "https://imgflip.com/s/meme/Galaxy-Brain.jpg",
    "american-chopper": "https://imgflip.com/s/meme/American-Chopper-Argument.jpg",
    "mocking-spongebob": "https://imgflip.com/s/meme/Mocking-Spongebob.jpg",
    "think-about-it": "https://imgflip.com/s/meme/Think-About-It.jpg",
    "laughing-leo": "https://imgflip.com/s/meme/Leonardo-Dicaprio-Cheers.jpg",
    "sad-pablo": "https://imgflip.com/s/meme/Sad-Pablo-Escobar.jpg",
    "pretend": "https://imgflip.com/s/meme/Pretend-To-Be-Happy-Hiding-Pain.jpg",
    "incredibles": "https://imgflip.com/s/meme/If-I-Had-One.jpg"
};

// Ruta para servir las imágenes guardadas
router.get("/output/:filename", (req, res) => {
    const filePath = path.join(IMAGES_DIR, req.params.filename);
    
    if (fs.existsSync(filePath)) {
        // Configurar headers para la imagen
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400"); // Cache por 24 horas
        
        // Enviar el archivo
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "Imagen no encontrada" });
    }
});

// Listar plantillas disponibles
router.get("/plantillas", (req, res) => {
    return res.json({
        success: true,
        plantillas: Object.keys(MEME_TEMPLATES),
        mensaje: "Usa estas plantillas en el parámetro 'plantilla' de la API"
    });
});

/**
 * API Generador de Memes - Crea memes personalizados con texto arriba y abajo
 */
router.get("/", async (req, res) => {
    try {
        const { plantilla, imagen, textoArriba, textoAbajo } = req.query;

        // Verificar que se proporcionó plantilla o imagen
        if (!plantilla && !imagen) {
            return res.status(400).json({ 
                error: "Se requiere una plantilla o una URL de imagen", 
                ejemplo: "/api/fun/meme?plantilla=drake&textoArriba=No usar APIs&textoAbajo=Usar API Karl",
                plantillas_disponibles: "/api/fun/meme/plantillas"
            });
        }

        // Determinar la URL de la imagen a usar
        let imagenUrl;
        if (plantilla) {
            // Verificar si la plantilla existe
            if (!MEME_TEMPLATES[plantilla.toLowerCase()]) {
                return res.status(400).json({ 
                    error: "Plantilla no encontrada", 
                    plantillas_disponibles: Object.keys(MEME_TEMPLATES),
                    consultar: "/api/fun/meme/plantillas"
                });
            }
            imagenUrl = MEME_TEMPLATES[plantilla.toLowerCase()];
        } else {
            imagenUrl = imagen;
        }

        console.log("Generando meme a partir de:", imagenUrl);

        // Cargar imagen
        let imagenOriginal;
        try {
            const response = await axios.get(imagenUrl, { 
                responseType: "arraybuffer",
                timeout: 15000 // 15 segundos timeout
            });
            imagenOriginal = await Canvas.loadImage(Buffer.from(response.data));
        } catch (loadError) {
            console.error("Error cargando la imagen:", loadError.message);
            return res.status(400).json({ 
                error: "No se pudo cargar la imagen", 
                detalle: loadError.message 
            });
        }

        // Configurar canvas
        const width = imagenOriginal.width;
        const height = imagenOriginal.height;
        
        // Crear canvas
        const canvas = Canvas.createCanvas(width, height);
        const ctx = canvas.getContext("2d");
        
        // Dibujar imagen original
        ctx.drawImage(imagenOriginal, 0, 0);
        
        // Dibujar texto en la imagen
        ctx.textAlign = "center";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        ctx.fillStyle = "white";
        
        // Configurar tamaño y fuente del texto (proporcional a la imagen)
        const fontSize = Math.floor(height / 10);
        ctx.font = `bold ${fontSize}px Impact, Arial, sans-serif`;
        
        // Función para manejar el ajuste de texto largo
        const wrapText = (text, x, y, maxWidth, lineHeight) => {
            if (!text) return;
            
            // Dividir por palabras
            const words = text.split(' ');
            let line = '';
            let lines = [];
            
            // Crear las líneas
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                
                if (testWidth > maxWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);
            
            // Dibujar cada línea
            for (let i = 0; i < lines.length; i++) {
                const textY = y + (i * lineHeight);
                ctx.strokeText(lines[i], x, textY);
                ctx.fillText(lines[i], x, textY);
            }
        };
        
        // Agregar texto
        const maxWidth = width * 0.9;
        const lineHeight = fontSize + 10;
        
        // Texto superior
        if (textoArriba) {
            wrapText(textoArriba.toUpperCase(), width / 2, fontSize + 20, maxWidth, lineHeight);
        }
        
        // Texto inferior
        if (textoAbajo) {
            wrapText(textoAbajo.toUpperCase(), width / 2, height - 30, maxWidth, lineHeight);
        }
        
        // Generar nombre único para la imagen
        const hash = crypto.createHash('md5').update(JSON.stringify({imagenUrl, textoArriba, textoAbajo, date: Date.now()})).digest('hex');
        const filename = `meme-${hash}.png`;
        const filePath = path.join(IMAGES_DIR, filename);
        
        // Guardar la imagen
        const out = fs.createWriteStream(filePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        
        // Esperar a que termine de escribir el archivo
        await new Promise((resolve, reject) => {
            out.on('finish', resolve);
            out.on('error', reject);
        });
        
        // Generar URL pública
        const imageUrl = `${PUBLIC_URL_BASE}${PUBLIC_PATH}/${filename}`;
        
        // Devolver JSON con la URL
        res.json({
            success: true,
            url: imageUrl,
            plantilla: plantilla || "personalizada",
            mensaje: "Meme generado correctamente"
        });

    } catch (error) {
        console.error("Error en generador de memes:", error);
        res.status(500).json({ 
            error: "Error al generar el meme",
            detalle: error.message
        });
    }
});

// Limpieza periódica de imágenes antiguas (cada 12 horas)
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
                console.log(`Archivo eliminado: ${file}`);
            }
        });
    } catch (error) {
        console.error("Error en limpieza de archivos:", error);
    }
}, 12 * 60 * 60 * 1000);

module.exports = router;
