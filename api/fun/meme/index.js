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
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || "https://tudominio.com"; // Cambia esto a tu dominio
const PUBLIC_PATH = "/api/fun/meme/output"; // Ruta pública para acceder a las imágenes

// Crear directorio de salida si no existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Configuración de las plantillas de memes con posicionamiento y estilo personalizado
const MEME_TEMPLATES = {
    // Cada meme tiene: url, zonas de texto (textZones), y opcionalmente estilos específicos (textStyle)
    
    // Clásicos y más populares con configuración de zonas de texto
    "drake": {
        url: "https://imgflip.com/s/meme/Drake-Hotline-Bling.jpg",
        textZones: [
            { x: 290, y: 130, width: 250, align: "left" },  // Arriba (rechazando)
            { x: 290, y: 390, width: 250, align: "left" }   // Abajo (aprobando)
        ]
    },
    "distracted": {
        url: "https://imgflip.com/s/meme/Distracted-Boyfriend.jpg",
        textZones: [
            { x: 160, y: 100, width: 140, align: "center" },  // Chica nueva
            { x: 370, y: 100, width: 140, align: "center" },  // Novio
            { x: 240, y: 220, width: 140, align: "center" }   // Novia
        ]
    },
    "button": {
        url: "https://imgflip.com/s/meme/Two-Buttons.jpg",
        textZones: [
            { x: 105, y: 100, width: 170, align: "center" },  // Botón izquierdo
            { x: 245, y: 100, width: 170, align: "center" },  // Botón derecho
            { x: 180, y: 320, width: 200, align: "center" }   // Persona sudando
        ]
    },
    "change": {
        url: "https://imgflip.com/s/meme/Change-My-Mind.jpg",
        textZones: [
            { x: 180, y: 135, width: 350, align: "center" }   // Texto en cartel
        ]
    },
    "doge": {
        url: "https://imgflip.com/s/meme/Doge.jpg",
        textZones: [
            { x: 150, y: 100, width: 250, align: "center" },  // Arriba izquierda
            { x: 350, y: 200, width: 250, align: "center" },  // Medio derecha
            { x: 150, y: 300, width: 250, align: "center" }   // Abajo izquierda
        ],
        textStyle: { color: "red", strokeColor: "white" }     // Estilo específico para doge
    },
    "alien": {
        url: "https://imgflip.com/s/meme/Ancient-Aliens.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 380, width: 450, align: "center" }   // Abajo
        ]
    },
    "fry": {
        url: "https://imgflip.com/s/meme/Futurama-Fry.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 380, width: 450, align: "center" }   // Abajo
        ]
    },
    "wonka": {
        url: "https://imgflip.com/s/meme/Creepy-Condescending-Wonka.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 380, width: 450, align: "center" }   // Abajo
        ]
    },
    "success": {
        url: "https://imgflip.com/s/meme/Success-Kid.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 320, width: 450, align: "center" }   // Abajo
        ]
    },
    "rollsafe": {
        url: "https://imgflip.com/s/meme/Roll-Safe-Think-About-It.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 320, width: 450, align: "center" }   // Abajo
        ]
    },
    
    // Expansión - Memes populares modernos
    "expanding": {
        url: "https://imgflip.com/s/meme/Expanding-Brain.jpg",
        textZones: [
            { x: 410, y: 80, width: 200, align: "center" },   // Primer cerebro
            { x: 410, y: 230, width: 200, align: "center" },  // Segundo cerebro
            { x: 410, y: 370, width: 200, align: "center" },  // Tercer cerebro
            { x: 410, y: 510, width: 200, align: "center" }   // Cuarto cerebro iluminado
        ]
    },
    "woman-yelling": {
        url: "https://imgflip.com/s/meme/Woman-Yelling-At-Cat.jpg",
        textZones: [
            { x: 225, y: 120, width: 250, align: "center" },  // Mujer gritando
            { x: 650, y: 120, width: 250, align: "center" }   // Gato
        ]
    },
    "cat": {
        url: "https://imgflip.com/s/meme/Smudge-the-Cat.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 260, width: 450, align: "center" }   // Abajo
        ]
    },
    "butterfly": {
        url: "https://imgflip.com/s/meme/Is-This-A-Pigeon.jpg",
        textZones: [
            { x: 180, y: 90, width: 150, align: "center" },   // Mariposa
            { x: 370, y: 180, width: 170, align: "center" },  // Hombre
            { x: 225, y: 300, width: 300, align: "center" }   // "¿Es esto...?"
        ]
    },
    "always-has-been": {
        url: "https://imgflip.com/s/meme/Always-Has-Been.png",
        textZones: [
            { x: 300, y: 150, width: 300, align: "center" },  // Astronauta mirando
            { x: 300, y: 300, width: 300, align: "center" }   // Astronauta con pistola
        ]
    },
    "stonks": {
        url: "https://imgflip.com/s/meme/Stonks.jpg",
        textZones: [
            { x: 225, y: 280, width: 450, align: "center" }   // Texto abajo
        ]
    },
    "not-stonks": {
        url: "https://imgflip.com/s/meme/Not-Stonks.jpg",
        textZones: [
            { x: 225, y: 280, width: 450, align: "center" }   // Texto abajo
        ]
    },
    "trade-offer": {
        url: "https://imgflip.com/s/meme/Trade-Offer.jpg",
        textZones: [
            { x: 155, y: 125, width: 300, align: "center" },  // Yo recibo
            { x: 155, y: 280, width: 300, align: "center" },  // Tú recibes
            { x: 155, y: 400, width: 300, align: "center" }   // Nombre
        ]
    },
    "mike-sullivan": {
        url: "https://imgflip.com/s/meme/Sully-Face-Swap.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 320, width: 450, align: "center" }   // Abajo
        ]
    },
    
    // Más clásicos
    "one-does-not": {
        url: "https://imgflip.com/s/meme/One-Does-Not-Simply.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 280, width: 450, align: "center" }   // Abajo
        ]
    },
    "disaster-girl": {
        url: "https://imgflip.com/s/meme/Disaster-Girl.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 300, width: 450, align: "center" }   // Abajo
        ]
    },
    "cry": {
        url: "https://imgflip.com/s/meme/First-World-Problems.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 300, width: 450, align: "center" }   // Abajo
        ]
    },
    "evil-kermit": {
        url: "https://imgflip.com/s/meme/Evil-Kermit.jpg",
        textZones: [
            { x: 150, y: 80, width: 250, align: "center" },   // Kermit normal
            { x: 350, y: 250, width: 250, align: "center" }   // Kermit oscuro
        ]
    },
    "patrick": {
        url: "https://imgflip.com/s/meme/Evil-Patrick.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 280, width: 450, align: "center" }   // Abajo
        ]
    },
    "this-is-fine": {
        url: "https://imgflip.com/s/meme/This-Is-Fine.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 280, width: 450, align: "center" }   // Abajo
        ]
    },
    "hide-the-pain": {
        url: "https://imgflip.com/s/meme/Hide-the-Pain-Harold.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 300, width: 450, align: "center" }   // Abajo
        ]
    },
    "waiting-skeleton": {
        url: "https://imgflip.com/s/meme/Waiting-Skeleton.jpg",
        textZones: [
            { x: 225, y: 390, width: 450, align: "center" }   // Solo texto abajo
        ]
    },
    "awkward-monkey": {
        url: "https://imgflip.com/s/meme/Monkey-Puppet.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 420, width: 450, align: "center" }   // Abajo
        ]
    },
    "sweating-button": {
        url: "https://imgflip.com/s/meme/Blank-Button.jpg",
        textZones: [
            { x: 225, y: 150, width: 450, align: "center" },  // Botón
            { x: 225, y: 350, width: 450, align: "center" }   // Persona sudando
        ]
    },
    
    // Más memes modernos
    "surprised-pikachu": {
        url: "https://imgflip.com/s/meme/Surprised-Pikachu.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 300, width: 450, align: "center" }   // Abajo
        ]
    },
    "gru-plan": {
        url: "https://imgflip.com/s/meme/Grus-Plan.jpg",
        textZones: [
            { x: 450, y: 120, width: 280, align: "center" },  // Panel 1
            { x: 450, y: 320, width: 280, align: "center" },  // Panel 2
            { x: 450, y: 520, width: 280, align: "center" },  // Panel 3
            { x: 450, y: 720, width: 280, align: "center" }   // Panel 4
        ]
    },
    "and-just": {
        url: "https://imgflip.com/s/meme/Left-Exit-12-Off-Ramp.jpg",
        textZones: [
            { x: 210, y: 120, width: 200, align: "center" },  // Salida
            { x: 400, y: 180, width: 200, align: "center" },  // Seguir recto
            { x: 300, y: 320, width: 250, align: "center" }   // Carro
        ]
    },
    "buff-doge": {
        url: "https://imgflip.com/s/meme/Buff-Doge-vs-Cheems.png",
        textZones: [
            { x: 180, y: 120, width: 200, align: "center" },  // Doge fuerte
            { x: 500, y: 120, width: 200, align: "center" }   // Cheems débil
        ]
    },
    "cheems": {
        url: "https://imgflip.com/s/meme/Swole-Doge-vs-Cheems.png",
        textZones: [
            { x: 180, y: 120, width: 200, align: "center" },  // Doge grande
            { x: 490, y: 120, width: 200, align: "center" }   // Cheems
        ]
    },
    "tuxedo-pooh": {
        url: "https://imgflip.com/s/meme/Tuxedo-Winnie-The-Pooh.png",
        textZones: [
            { x: 300, y: 100, width: 300, align: "left" },    // Pooh normal
            { x: 300, y: 330, width: 300, align: "left" }     // Pooh elegante
        ]
    },
    "pointing-spiderman": {
        url: "https://imgflip.com/s/meme/Spider-Man-Pointing-at-Spider-Man.jpg",
        textZones: [
            { x: 160, y: 150, width: 150, align: "center" },  // Spiderman izquierda
            { x: 330, y: 150, width: 150, align: "center" }   // Spiderman derecha
        ]
    },
    "unsettled-tom": {
        url: "https://imgflip.com/s/meme/Unsettled-Tom.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 290, width: 450, align: "center" }   // Abajo
        ]
    },
    "they-dont-know": {
        url: "https://imgflip.com/s/meme/They-Dont-Know.jpg",
        textZones: [
            { x: 180, y: 280, width: 150, align: "center" }   // Texto en el pensamiento
        ]
    },
    "bernie-mittens": {
        url: "https://imgflip.com/s/meme/Bernie-I-Am-Once-Again-Asking-For-Your-Support.jpg",
        textZones: [
            { x: 225, y: 300, width: 450, align: "center" }   // Texto abajo
        ]
    },
    
    // Últimas adiciones
    "chad": {
        url: "https://imgflip.com/s/meme/Average-Fan-vs-Average-Enjoyer.jpg",
        textZones: [
            { x: 180, y: 180, width: 200, align: "center" },  // Fan izquierda
            { x: 520, y: 180, width: 200, align: "center" }   // Chad derecha
        ]
    },
    "omg": {
        url: "https://imgflip.com/s/meme/OMG-Face.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 320, width: 450, align: "center" }   // Abajo
        ]
    },
    "galaxy-brain": {
        url: "https://imgflip.com/s/meme/Galaxy-Brain.jpg",
        textZones: [
            { x: 400, y: 130, width: 350, align: "right" },   // Cerebro pequeño
            { x: 400, y: 330, width: 350, align: "right" },   // Cerebro mediano
            { x: 400, y: 530, width: 350, align: "right" },   // Cerebro brillante
            { x: 400, y: 730, width: 350, align: "right" }    // Cerebro galaxia
        ]
    },
    "american-chopper": {
        url: "https://imgflip.com/s/meme/American-Chopper-Argument.jpg",
        textZones: [
            { x: 270, y: 90, width: 250, align: "left" },     // Panel 1
            { x: 270, y: 290, width: 250, align: "left" },    // Panel 2
            { x: 270, y: 490, width: 250, align: "left" },    // Panel 3
            { x: 270, y: 690, width: 250, align: "left" },    // Panel 4
            { x: 270, y: 890, width: 250, align: "left" }     // Panel 5
        ]
    },
    "mocking-spongebob": {
        url: "https://imgflip.com/s/meme/Mocking-Spongebob.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba (texto normal)
            { x: 225, y: 290, width: 450, align: "center" }   // Abajo (texto burlón)
        ],
        textStyle: { alternatingCase: true }  // Para el texto inferior
    },
    "think-about-it": {
        url: "https://imgflip.com/s/meme/Think-About-It.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 280, width: 450, align: "center" }   // Abajo
        ]
    },
    "laughing-leo": {
        url: "https://imgflip.com/s/meme/Leonardo-Dicaprio-Cheers.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 280, width: 450, align: "center" }   // Abajo
        ]
    },
    "sad-pablo": {
        url: "https://imgflip.com/s/meme/Sad-Pablo-Escobar.jpg",
        textZones: [
            { x: 225, y: 320, width: 450, align: "center" }   // Texto abajo
        ]
    },
    "pretend": {
        url: "https://imgflip.com/s/meme/Pretend-To-Be-Happy-Hiding-Pain.jpg",
        textZones: [
            { x: 225, y: 50, width: 450, align: "center" },   // Arriba
            { x: 225, y: 280, width: 450, align: "center" }   // Abajo
        ]
    },
    "incredibles": {
        url: "https://imgflip.com/s/meme/If-I-Had-One.jpg",
        textZones: [
            { x: 225, y: 250, width: 450, align: "center" }   // Texto central
        ]
    }
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
    // Crear un objeto con información detallada sobre cada plantilla
    const plantillasInfo = {};
    
    Object.keys(MEME_TEMPLATES).forEach(key => {
        const template = MEME_TEMPLATES[key];
        let numZonas = 2; // Por defecto
        
        if (typeof template !== 'string' && template.textZones) {
            numZonas = template.textZones.length;
        }
        
        plantillasInfo[key] = {
            nombre: key,
            zonas_texto: numZonas,
            descripcion: getPlantillaDescripcion(key, numZonas)
        };
    });
    
    return res.json({
        success: true,
        total_plantillas: Object.keys(MEME_TEMPLATES).length,
        plantillas: plantillasInfo,
        uso: "Usa el parámetro 'plantilla' con alguno de estos nombres",
        ejemplo: "/api/fun/meme?plantilla=drake&textoArriba=No usar APIs&textoAbajo=Usar API Karl"
    });
});

// Función auxiliar para generar descripciones de plantillas
function getPlantillaDescripcion(nombre, numZonas) {
    const descripciones = {
        "drake": "Drake rechazando y aceptando",
        "distracted": "Chico distraído mirando a otra chica",
        "button": "Persona indecisa con dos botones",
        "change": "Change my mind",
        "expanding": "Cerebro expansivo con etapas de iluminación",
        "woman-yelling": "Mujer gritando al gato",
        "gru-plan": "Plan de Gru (4 paneles)",
        "tuxedo-pooh": "Winnie Pooh normal y elegante",
        "stonks": "Hombre de negocios con gráfico",
        "mocking-spongebob": "Bob Esponja burlándose",
        "trade-offer": "Propuesta de intercambio",
        "always-has-been": "Astronautas: siempre ha sido así",
    };
    
    return descripciones[nombre] || `Plantilla con ${numZonas} zonas de texto`;
}

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
            const plantillaLower = plantilla.toLowerCase();
            // Verificar si la plantilla existe
            if (!MEME_TEMPLATES[plantillaLower]) {
                return res.status(400).json({ 
                    error: "Plantilla no encontrada", 
                    plantillas_disponibles: Object.keys(MEME_TEMPLATES),
                    consultar: "/api/fun/meme/plantillas"
                });
            }
            
            // Obtener la URL dependiendo del formato del objeto de plantilla
            if (typeof MEME_TEMPLATES[plantillaLower] === 'string') {
                imagenUrl = MEME_TEMPLATES[plantillaLower];
            } else {
                imagenUrl = MEME_TEMPLATES[plantillaLower].url;
            }
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
