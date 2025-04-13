// api/fun/nsfw/index.js - Versión modificada con descarga directa
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();

// Configuración para guardar imágenes y videos descargados
const CONTENT_DIR = path.join(__dirname, "downloads");
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || "https://api.apikarl.com";
const PUBLIC_PATH = "/api/fun/nsfw/downloads";

// Crear directorio de salida si no existe
if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

// Ruta para servir los archivos descargados
router.get("/downloads/:filename", (req, res) => {
    const filePath = path.join(CONTENT_DIR, req.params.filename);
    
    if (fs.existsSync(filePath)) {
        // Detectar el tipo de contenido basado en la extensión
        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'application/octet-stream';
        
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.mp4') contentType = 'video/mp4';
        else if (ext === '.webm') contentType = 'video/webm';
        
        // Configurar headers para el contenido
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=86400"); // Cache por 24 horas
        
        // Enviar el archivo
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "Archivo no encontrado o expirado" });
    }
});

// Fuentes disponibles para búsqueda
const SOURCES = {
    // Fuentes de imágenes
    RULE34: "rule34",
    DANBOORU: "danbooru",
    GELBOORU: "gelbooru",
    
    // Fuentes de videos
    XVIDEOS: "xvideos",
    PORNHUB: "pornhub",
    XNXX: "xnxx",
    
    // Aleatorio
    RANDOM: "random",
    RANDOM_IMG: "random_img",
    RANDOM_VID: "random_vid"
};

// Clasificaciones disponibles
const CLASIFICACIONES = {
    NUEVO: "nuevo",        // Contenido más reciente
    FAMOSO: "famoso",      // Contenido más popular/con más vistas
    ALEATORIO: "aleatorio", // Contenido aleatorio (por defecto)
    GAY: "gay",           // Contenido gay
    AMATEUR: "amateur",    // Contenido amateur
    HD: "hd",             // Contenido en alta definición
    PROFESIONAL: "profesional", // Contenido profesional
    VERIFICADO: "verificado"    // Contenido de usuarios verificados
};

// Mapeo de términos similares a clasificaciones estándar
const CLASIFICACIONES_ALIAS = {
    // Nuevo y reciente
    "reciente": CLASIFICACIONES.NUEVO,
    "nuevos": CLASIFICACIONES.NUEVO,
    "recent": CLASIFICACIONES.NUEVO,
    "new": CLASIFICACIONES.NUEVO,
    "ultima": CLASIFICACIONES.NUEVO,
    "ultimos": CLASIFICACIONES.NUEVO,
    
    // Famoso y popular
    "popular": CLASIFICACIONES.FAMOSO,
    "mejores": CLASIFICACIONES.FAMOSO,
    "best": CLASIFICACIONES.FAMOSO,
    "top": CLASIFICACIONES.FAMOSO,
    "trending": CLASIFICACIONES.FAMOSO,
    "tendencia": CLASIFICACIONES.FAMOSO,
    "viral": CLASIFICACIONES.FAMOSO,
    
    // Aleatorio
    "random": CLASIFICACIONES.ALEATORIO,
    "cualquiera": CLASIFICACIONES.ALEATORIO,
    "any": CLASIFICACIONES.ALEATORIO,
    
    // Gay y LGBT
    "homosexual": CLASIFICACIONES.GAY,
    "lgbt": CLASIFICACIONES.GAY,
    
    // Amateur y casero
    "casero": CLASIFICACIONES.AMATEUR,
    "homemade": CLASIFICACIONES.AMATEUR,
    
    // Alta definición
    "alta definicion": CLASIFICACIONES.HD,
    "high definition": CLASIFICACIONES.HD,
    "4k": CLASIFICACIONES.HD,
    
    // Profesional y producido
    "producido": CLASIFICACIONES.PROFESIONAL,
    "studio": CLASIFICACIONES.PROFESIONAL,
    "produced": CLASIFICACIONES.PROFESIONAL,
    
    // Verificado
    "verificado": CLASIFICACIONES.VERIFICADO,
    "verified": CLASIFICACIONES.VERIFICADO,
    "oficial": CLASIFICACIONES.VERIFICADO,
    "official": CLASIFICACIONES.VERIFICADO
};

// Configuración de cada fuente
const sourceConfig = {
    [SOURCES.RULE34]: {
        type: "image",
        name: "Rule34",
        baseUrl: "https://rule34.xxx/",
        enabled: true,
        priority: 1
    },
    [SOURCES.DANBOORU]: {
        type: "image",
        name: "Danbooru",
        baseUrl: "https://danbooru.donmai.us/",
        enabled: true,
        priority: 2
    },
    [SOURCES.GELBOORU]: {
        type: "image",
        name: "Gelbooru",
        baseUrl: "https://gelbooru.com/",
        enabled: true,
        priority: 3
    },
    [SOURCES.XVIDEOS]: {
        type: "video",
        name: "XVideos",
        baseUrl: "https://www.xvideos.com/",
        enabled: true,
        priority: 1
    },
    [SOURCES.PORNHUB]: {
        type: "video",
        name: "Pornhub",
        baseUrl: "https://www.pornhub.com/",
        enabled: true,
        priority: 2
    },
    [SOURCES.XNXX]: {
        type: "video",
        name: "XNXX",
        baseUrl: "https://www.xnxx.com/",
        enabled: true,
        priority: 3
    }
};

// Configuración del cliente HTTP para mejor simulación de navegador
const axiosClient = axios.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Ch-Ua": '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Referer": "https://www.google.com/"
    },
    timeout: 15000, // 15 segundos
    maxRedirects: 5
});

/**
 * Middleware para verificación de edad
 */
const verificarEdad = (req, res, next) => {
    const ageVerification = req.headers["age-verification"] || req.query.age_verification;
    
    if (!ageVerification || ageVerification !== "adult_18_plus") {
        return res.status(403).json({
            error: true,
            message: "Acceso denegado. Esta API requiere verificación de edad 18+.",
            help: "Incluye el encabezado 'age-verification: adult_18_plus' o el parámetro 'age_verification=adult_18_plus'"
        });
    }
    
    next();
};

router.use(verificarEdad);

/**
 * Endpoint principal para búsqueda de contenido adulto
 */
router.get("/", async (req, res) => {
    try {
        const { 
            cantidad = 5, 
            tags, 
            pagina, 
            fuente = "random",
            fallback = "true",
            mostrar_errores = "false",
            clasificacion = "aleatorio"
        } = req.query;
        
        // Validación de parámetros
        if (!tags) {
            return res.status(400).json({
                error: true,
                message: "Se requiere el parámetro 'tags' para realizar la búsqueda",
                ejemplo: "/api/fun/nsfw?tags=tag1,tag2&cantidad=5&fuente=rule34&clasificacion=nuevo"
            });
        }
        
        // Normalizar clasificación
        const clasificacionNormalizada = normalizarClasificacion(clasificacion);
        
        // Limitar la cantidad para evitar abusos y tiempos de espera largos
        let cantidadLimitada;
        // Para fuentes de video, limitamos más debido a las peticiones adicionales para URLs directas
        if (fuente === SOURCES.XVIDEOS || fuente === SOURCES.PORNHUB || fuente === SOURCES.XNXX || fuente === SOURCES.RANDOM_VID) {
            cantidadLimitada = Math.min(parseInt(cantidad) || 5, 5); // Máximo 5 para videos
        } else {
            cantidadLimitada = Math.min(parseInt(cantidad) || 5, 10); // Máximo 10 para imágenes
        }
        
        // Normalizar los tags
        const tagsList = tags.split(",").map(tag => tag.trim().toLowerCase());
        
        // Si la clasificación es GAY y no está en los tags, añadirlo a los tags
        if (clasificacionNormalizada === CLASIFICACIONES.GAY && !tagsList.includes('gay')) {
            tagsList.push('gay');
        }
        
        // Determinar la fuente a utilizar
        let fuenteSeleccionada = fuente.toLowerCase();
        
        // Manejar selección aleatoria de fuente
        if (fuenteSeleccionada === SOURCES.RANDOM || fuenteSeleccionada === SOURCES.RANDOM_IMG || fuenteSeleccionada === SOURCES.RANDOM_VID) {
            let fuentesDisponibles;
            
            if (fuenteSeleccionada === SOURCES.RANDOM_IMG) {
                fuentesDisponibles = Object.keys(sourceConfig).filter(key => 
                    sourceConfig[key].type === "image" && sourceConfig[key].enabled
                );
            } else if (fuenteSeleccionada === SOURCES.RANDOM_VID) {
                fuentesDisponibles = Object.keys(sourceConfig).filter(key => 
                    sourceConfig[key].type === "video" && sourceConfig[key].enabled
                );
            } else {
                fuentesDisponibles = Object.keys(sourceConfig).filter(key => 
                    ![SOURCES.RANDOM, SOURCES.RANDOM_IMG, SOURCES.RANDOM_VID].includes(key) && 
                    sourceConfig[key].enabled
                );
            }
            
            if (fuentesDisponibles.length === 0) {
                return res.status(500).json({
                    error: true,
                    message: "No hay fuentes disponibles para la búsqueda"
                });
            }
            
            fuenteSeleccionada = fuentesDisponibles[Math.floor(Math.random() * fuentesDisponibles.length)];
        }
        
        // Verificar si la fuente es válida y está habilitada
        if (!Object.keys(sourceConfig).includes(fuenteSeleccionada)) {
            return res.status(400).json({
                error: true,
                message: "Fuente no válida",
                fuentes_validas: Object.keys(sourceConfig).filter(k => sourceConfig[k].enabled)
            });
        }
        
        if (!sourceConfig[fuenteSeleccionada].enabled) {
            return res.status(503).json({
                error: true,
                message: `La fuente '${fuenteSeleccionada}' está temporalmente deshabilitada`,
                fuentes_alternativas: Object.keys(sourceConfig)
                    .filter(k => sourceConfig[k].enabled && sourceConfig[k].type === sourceConfig[fuenteSeleccionada].type)
            });
        }
        
        // Realizar búsqueda con posible fallback
        const { resultados, fuente: fuenteUsada, errores } = await buscarContenido(
            fuenteSeleccionada, 
            tagsList, 
            cantidadLimitada, 
            pagina, 
            clasificacionNormalizada,
            fallback === "true"
        );
        
        // Manejar caso sin resultados
        if (resultados.length === 0 && errores.length > 0) {
            const respuestaError = {
                error: true,
                message: "No se encontraron resultados en ninguna fuente",
                fuente_intentada: fuenteSeleccionada,
                fuentes_alternativas: Object.keys(sourceConfig)
                    .filter(k => sourceConfig[k].enabled && k !== fuenteSeleccionada)
            };
            
            if (mostrar_errores === "true") {
                respuestaError.errores = errores;
            }
            
            return res.status(404).json(respuestaError);
        }

        // NUEVA FUNCIONALIDAD: DESCARGAR MÚLTIPLES CONTENIDOS Y DEVOLVER INFORMACIÓN COMPLETA
        // Limitar la cantidad real de resultados que procesaremos
        const cantidadResultados = Math.min(resultados.length, cantidadLimitada);
        const resultadosProcesados = [];
        
        // Si no hay suficientes resultados, informar al usuario
        if (resultados.length < cantidadLimitada) {
            console.log(`Advertencia: Solo se encontraron ${resultados.length} resultados de los ${cantidadLimitada} solicitados`);
        }
        
        // Procesar cada resultado hasta alcanzar la cantidad solicitada
        for (let i = 0; i < cantidadResultados; i++) {
            const resultado = resultados[i];
            
            // Determinar la URL directa a descargar
            let urlDescarga;
            if (sourceConfig[fuenteUsada].type === "video") {
                urlDescarga = resultado.direct_video_url || resultado.video_url;
            } else {
                urlDescarga = resultado.file_url;
            }
            
            if (!urlDescarga) {
                console.log(`Advertencia: No se encontró URL directa para el resultado ${i+1}`);
                continue; // Saltar este resultado
            }
            
            try {
                console.log(`Descargando contenido ${i+1}/${cantidadResultados} desde: ${urlDescarga}`);
                
                // Descargar el contenido
                const response = await axios.get(urlDescarga, { 
                    responseType: 'arraybuffer',
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Referer": sourceConfig[fuenteUsada].baseUrl
                    },
                    timeout: 30000, // 30 segundos para descarga
                    maxContentLength: 100 * 1024 * 1024 // Limitar a 100MB
                });
                
                // Determinar el tipo de contenido basado en los encabezados o la extensión
                let contentType = response.headers['content-type'];
                
                if (!contentType || contentType === 'application/octet-stream') {
                    // Intentar determinar por la URL
                    if (urlDescarga.endsWith('.jpg') || urlDescarga.endsWith('.jpeg')) {
                        contentType = 'image/jpeg';
                    } else if (urlDescarga.endsWith('.png')) {
                        contentType = 'image/png';
                    } else if (urlDescarga.endsWith('.gif')) {
                        contentType = 'image/gif';
                    } else if (urlDescarga.endsWith('.webp')) {
                        contentType = 'image/webp';
                    } else if (urlDescarga.endsWith('.mp4')) {
                        contentType = 'video/mp4';
                    } else if (urlDescarga.endsWith('.webm')) {
                        contentType = 'video/webm';
                    } else {
                        // Por defecto para imágenes
                        contentType = sourceConfig[fuenteUsada].type === "video" ? 'video/mp4' : 'image/jpeg';
                    }
                }
                
                // Generar nombre único para el archivo
                const extension = contentType.split('/')[1];
                const safeTag = tagsList[0].replace(/[^a-z0-9]/gi, '_').substring(0, 15);
                const uniqueId = crypto.randomBytes(8).toString('hex');
                const filename = `nsfw_${safeTag}_${uniqueId}.${extension}`;
                const filePath = path.join(CONTENT_DIR, filename);
                
                // Guardar el archivo descargado
                fs.writeFileSync(filePath, Buffer.from(response.data));
                
                // Generar URL pública para el contenido descargado
                const contentUrl = `${PUBLIC_URL_BASE}${PUBLIC_PATH}/${filename}`;
                
                // Programar eliminación del archivo después de 24 horas
                setTimeout(() => {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Archivo NSFW eliminado: ${filename}`);
                    }
                }, 24 * 60 * 60 * 1000);
                
                // Guardar la información procesada
                resultadosProcesados.push({
                    titulo: resultado.title || "Sin título",
                    descripcion: resultado.description || "",
                    pagina_web: resultado.video_url || urlDescarga, // URL de la página del contenido
                    recurso: urlDescarga, // URL directa original 
                    thumbnail: resultado.thumbnail || resultado.preview_url || "",
                    [sourceConfig[fuenteUsada].type]: contentUrl, // video o imagen según el tipo
                    autor: resultado.author || "Unknown",
                    duracion: resultado.duration || null,
                    expira_en: "24 horas"
                });
                
            } catch (downloadError) {
                console.error(`Error descargando contenido ${i+1}:`, downloadError);
                // No añadimos los resultados fallidos
            }
        }
        
        // Si no se pudo procesar ningún resultado
        if (resultadosProcesados.length === 0) {
            return res.status(500).json({
                error: true,
                message: "No se pudo descargar ningún contenido correctamente",
                fuente: fuenteUsada,
                tipo: sourceConfig[fuenteUsada].type,
                tags: tagsList
            });
        }
        
        // Preparar respuesta con todos los datos solicitados
        return res.json({
            success: true,
            total: resultadosProcesados.length,
            solicitados: cantidadLimitada,
            fuente: fuenteUsada,
            tipo: sourceConfig[fuenteUsada].type,
            tags: tagsList,
            resultados: resultadosProcesados
        });
        
    } catch (error) {
        console.error("Error en búsqueda NSFW:", error);
        return res.status(500).json({
            error: true,
            message: "Error al realizar la búsqueda",
            detalles: error.message
        });
    }
});

/**
 * Normaliza el valor de clasificación proporcionado
 * @param {string} clasificacion - Clasificación proporcionada por el usuario 
 * @returns {string} - Clasificación normalizada
 */
function normalizarClasificacion(clasificacion) {
    if (!clasificacion) return CLASIFICACIONES.ALEATORIO;
    
    const clasificacionLower = clasificacion.toLowerCase().trim();
    
    // Verificar si es una clasificación directa
    if (Object.values(CLASIFICACIONES).includes(clasificacionLower)) {
        return clasificacionLower;
    }
    
    // Verificar si es un alias
    if (CLASIFICACIONES_ALIAS[clasificacionLower]) {
        return CLASIFICACIONES_ALIAS[clasificacionLower];
    }
    
    // Si no coincide con nada, devolver aleatorio
    return CLASIFICACIONES.ALEATORIO;
}

/**
 * Función principal para buscar contenido con fallback
 */
async function buscarContenido(fuente, tags, cantidad, pagina, clasificacion, permitirFallback = true) {
    const errores = [];
    let resultados = [];
    
    async function intentarBusqueda(fuenteActual) {
        try {
            let resultadosBusqueda;
            
            switch (fuenteActual) {
                // Fuentes de imágenes
                case SOURCES.RULE34:
                    resultadosBusqueda = await buscarEnRule34(tags, cantidad, pagina, clasificacion);
                    break;
                    
                case SOURCES.DANBOORU:
                    resultadosBusqueda = await buscarEnDanbooru(tags, cantidad, pagina, clasificacion);
                    break;
                    
                case SOURCES.GELBOORU:
                    resultadosBusqueda = await buscarEnGelbooru(tags, cantidad, pagina, clasificacion);
                    break;
                
                // Fuentes de videos
                case SOURCES.XVIDEOS:
                    resultadosBusqueda = await buscarEnXVideos(tags, cantidad, pagina, clasificacion);
                    break;
                    
                case SOURCES.PORNHUB:
                    resultadosBusqueda = await buscarEnPornhub(tags, cantidad, pagina, clasificacion);
                    break;
                    
                case SOURCES.XNXX:
                    resultadosBusqueda = await buscarEnXnxx(tags, cantidad, pagina, clasificacion);
                    break;
                    
                default:
                    throw new Error(`Fuente no implementada: ${fuenteActual}`);
            }
            
            return resultadosBusqueda;
        } catch (error) {
            errores.push({
                fuente: fuenteActual,
                error: error.message
            });
            return [];
        }
    }
    
    // Primer intento con la fuente seleccionada
    resultados = await intentarBusqueda(fuente);
    
    // Intentar con fuentes alternativas si es necesario
    if (resultados.length === 0 && permitirFallback) {
        console.log(`Búsqueda en ${fuente} falló, intentando con fuentes alternativas...`);
        
        const tipo = sourceConfig[fuente].type;
        const fuentesAlternativas = Object.keys(sourceConfig)
            .filter(k => 
                sourceConfig[k].enabled && 
                sourceConfig[k].type === tipo && 
                k !== fuente
            )
            .sort((a, b) => sourceConfig[a].priority - sourceConfig[b].priority);
        
        for (const fuenteAlternativa of fuentesAlternativas) {
            console.log(`Intentando con fuente alternativa: ${fuenteAlternativa}`);
            
            resultados = await intentarBusqueda(fuenteAlternativa);
            
            if (resultados.length > 0) {
                console.log(`Éxito con fuente alternativa: ${fuenteAlternativa}`);
                return { resultados, fuente: fuenteAlternativa, errores };
            }
        }
    }
    
    return { resultados, fuente, errores };
}

/**
 * Buscar en Rule34.xxx con datos simplificados
 */
async function buscarEnRule34(tags, cantidad, pagina, clasificacion) {
    try {
        const tagsStr = tags.join("+");
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10);
        
        // Construir URL según clasificación
        let searchUrl;
        switch (clasificacion) {
            case CLASIFICACIONES.NUEVO:
                searchUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}&order=date`;
                break;
            case CLASIFICACIONES.FAMOSO:
                searchUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}&order=score`;
                break;
            default:
                searchUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}`;
                break;
        }
        
        const response = await axiosClient.get(searchUrl);
        
        if (!response.data) {
            throw new Error("Respuesta vacía de Rule34");
        }
        
        const $ = cheerio.load(response.data, { xmlMode: true });
        
        const posts = [];
        $("post").each(function() {
            const post = {
                title: $(this).attr("tags").split(" ")[0] || "Sin título",
                author: "Unknown", // Rule34 no muestra autor directamente en API
                description: $(this).attr("tags"),
                file_url: $(this).attr("file_url"),
                preview_url: $(this).attr("preview_url"),
                source: "rule34"
            };
            
            posts.push(post);
        });
        
        if (posts.length === 0) {
            throw new Error("No se encontraron resultados en Rule34");
        }
        
        return posts;
    } catch (error) {
        console.error("Error buscando en Rule34:", error);
        throw new Error(`Error en Rule34: ${error.message}`);
    }
}

/**
 * Buscar en Danbooru con datos simplificados
 */
async function buscarEnDanbooru(tags, cantidad, pagina, clasificacion) {
    try {
        const tagsLimitados = tags.slice(0, 2);
        const tagsStr = tagsLimitados.join("+");
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10) + 1;
        
        // Construir URL según clasificación
        let searchUrl;
        switch (clasificacion) {
            case CLASIFICACIONES.NUEVO:
                searchUrl = `https://danbooru.donmai.us/posts.json?tags=${tagsStr}&limit=${cantidad}&page=${page}&order=date`;
                break;
            case CLASIFICACIONES.FAMOSO:
                searchUrl = `https://danbooru.donmai.us/posts.json?tags=${tagsStr}&limit=${cantidad}&page=${page}&order=score`;
                break;
            default:
                searchUrl = `https://danbooru.donmai.us/posts.json?tags=${tagsStr}&limit=${cantidad}&page=${page}`;
                break;
        }
        
        const response = await axiosClient.get(searchUrl);
        
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
            throw new Error("No se encontraron resultados en Danbooru");
        }
        
        const posts = response.data.map(post => ({
            title: post.tag_string.split(" ")[0] || "Sin título",
            author: post.uploader_name || "Unknown",
            description: post.tag_string,
            file_url: post.file_url,
            preview_url: post.preview_file_url,
            source: "danbooru"
        })).filter(post => post.file_url);
        
        if (posts.length === 0) {
            throw new Error("No se encontraron resultados válidos en Danbooru");
        }
        
        return posts;
    } catch (error) {
        console.error("Error buscando en Danbooru:", error);
        throw new Error(`Error en Danbooru: ${error.message}`);
    }
}

/**
 * Buscar en Gelbooru con datos simplificados
 */
async function buscarEnGelbooru(tags, cantidad, pagina, clasificacion) {
    try {
        const tagsStr = tags.join("+");
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10);
        
        // Construir URL según clasificación
        let searchUrl;
        switch (clasificacion) {
            case CLASIFICACIONES.NUEVO:
                searchUrl = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}&json=1&sort=date`;
                break;
            case CLASIFICACIONES.FAMOSO:
                searchUrl = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}&json=1&sort=score`;
                break;
            default:
                searchUrl = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}&json=1`;
                break;
        }
        
        const response = await axiosClient.get(searchUrl);
        
        if (!response.data || !response.data.post || !Array.isArray(response.data.post) || response.data.post.length === 0) {
            throw new Error("No se encontraron resultados en Gelbooru");
        }
        
        const posts = response.data.post.map(post => ({
            title: post.tags.split(" ")[0] || "Sin título",
            author: "Unknown",
            description: post.tags,
            file_url: post.file_url,
            preview_url: post.preview_url,
            source: "gelbooru"
        }));
        
        return posts;
    } catch (error) {
        console.error("Error buscando en Gelbooru:", error);
        throw new Error(`Error en Gelbooru: ${error.message}`);
    }
}

/**
 * Buscar en XVideos con obtención automática de URL directa
 */
async function buscarEnXVideos(tags, cantidad, pagina, clasificacion) {
    try {
        const tagsStr = tags.join("+");
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10) + 1;
        
        // Modificar la URL de búsqueda según la clasificación
        let searchUrl;
        switch (clasificacion) {
            case CLASIFICACIONES.NUEVO:
                searchUrl = `https://www.xvideos.com/?k=${tagsStr}&p=${page}&sort=uploaddate`;
                break;
            case CLASIFICACIONES.FAMOSO:
                searchUrl = `https://www.xvideos.com/?k=${tagsStr}&p=${page}&sort=views`;
                break;
            case CLASIFICACIONES.VERIFICADO:
                searchUrl = `https://www.xvideos.com/?k=${tagsStr}&p=${page}&sort=relevance&verified=1`;
                break;
            case CLASIFICACIONES.HD:
                searchUrl = `https://www.xvideos.com/?k=${tagsStr}&p=${page}&sort=relevance&quality=hd`;
                break;
            case CLASIFICACIONES.PROFESIONAL:
                searchUrl = `https://www.xvideos.com/?k=${tagsStr}&p=${page}&sort=relevance&quality=hd&verified=1`;
                break;
            case CLASIFICACIONES.AMATEUR:
                searchUrl = `https://www.xvideos.com/?k=${tagsStr}+amateur&p=${page}`;
                break;
            default:
                searchUrl = `https://www.xvideos.com/?k=${tagsStr}&p=${page}`;
                break;
        }
        
        const cookieHeader = {
            Cookie: "age_verified=1; gdpr_registered=1"
        };
        
        const response = await axiosClient.get(searchUrl, { headers: { ...axiosClient.defaults.headers, ...cookieHeader } });
        
        if (!response.data) {
            throw new Error("Respuesta vacía de XVideos");
        }
        
        const $ = cheerio.load(response.data);
        
        const videos = [];
        const videoElements = $(".mozaique .thumb-block");
        let count = 0;
        
        // Limitar la cantidad debido a las peticiones adicionales para URLs directas
        const maxResults = Math.min(cantidad, 5);
        
        for (const element of videoElements.toArray()) {
            if (count >= maxResults) break;
            
            const thumbElement = $(element);
            const title = thumbElement.find(".title a").text().trim();
            const thumbnail = thumbElement.find("img").attr("data-src") || thumbElement.find("img").attr("src");
            const videoUrl = "https://www.xvideos.com" + thumbElement.find("a").attr("href");
            const duration = thumbElement.find(".duration").text().trim();
            
            let directVideoUrl = null;
            let description = "";
            let author = "";
            
            try {
                const videoPage = await axiosClient.get(videoUrl, { 
                    headers: { ...axiosClient.defaults.headers, ...cookieHeader }
                });
                
                if (videoPage.data) {
                    const videoPageHtml = cheerio.load(videoPage.data);
                    
                    // Extraer autor
                    author = videoPageHtml(".uploader-tag").text().trim() || 
                             videoPageHtml("span.video-metadata").text().trim() || 
                             "Unknown";
                    
                    // Extraer descripción
                    description = videoPageHtml(".video-metadata-description").text().trim() || 
                                 videoPageHtml("meta[name='description']").attr("content") || 
                                 "";
                    
                    // Extraer URL del video
                    let scriptContent = videoPageHtml("script:contains('html5player')").html() || "";
                    
                    let urlMatch = scriptContent.match(/setVideoUrl(?:Low|High|HLS)\('([^']+)'\)/);
                    if (!urlMatch) {
                        urlMatch = scriptContent.match(/html5player\.setVideoUrlHigh\('([^']+)'\)/);
                    }
                    if (!urlMatch) {
                        urlMatch = scriptContent.match(/html5player\.setVideoUrl\('([^']+)'\)/);
                    }
                    
                    if (urlMatch && urlMatch[1]) {
                        directVideoUrl = urlMatch[1];
                        
                        if (directVideoUrl.startsWith('/')) {
                            directVideoUrl = "https://www.xvideos.com" + directVideoUrl;
                        }
                    }
                }
            } catch (e) {
                console.error(`Error obteniendo datos de video individual: ${e.message}`);
                directVideoUrl = videoUrl; // Usar URL de la página como fallback
            }
            
            videos.push({
                title,
                author,
                description,
                thumbnail,
                video_url: videoUrl,
                direct_video_url: directVideoUrl || videoUrl,
                duration,
                source: "xvideos"
            });
            
            count++;
        }
        
        if (videos.length === 0) {
            throw new Error("No se encontraron resultados en XVideos");
        }
        
        return videos;
    } catch (error) {
        console.error("Error buscando en XVideos:", error);
        throw new Error(`Error en XVideos: ${error.message}`);
    }
}

/**
 * Buscar en Pornhub con obtención automática de URL directa
 */
async function buscarEnPornhub(tags, cantidad, pagina, clasificacion) {
    try {
        const tagsStr = tags.join("+");
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10) + 1;
        
        // Construir URL según clasificación
        let searchUrl;
        switch (clasificacion) {
            case CLASIFICACIONES.NUEVO:
                searchUrl = `https://www.pornhub.com/video/search?search=${tagsStr}&page=${page}&o=mr`; // Most Recent
                break;
            case CLASIFICACIONES.FAMOSO:
                searchUrl = `https://www.pornhub.com/video/search?search=${tagsStr}&page=${page}&o=mv`; // Most Viewed
                break;
            case CLASIFICACIONES.HD:
                searchUrl = `https://www.pornhub.com/video/search?search=${tagsStr}&page=${page}&hd=1`;
                break;
            case CLASIFICACIONES.PROFESIONAL:
                searchUrl = `https://www.pornhub.com/video/search?search=${tagsStr}&page=${page}&p=professional`;
                break;
            case CLASIFICACIONES.AMATEUR:
                searchUrl = `https://www.pornhub.com/video/search?search=${tagsStr}&page=${page}&p=homemade`;
                break;
            case CLASIFICACIONES.VERIFICADO:
                searchUrl = `https://www.pornhub.com/video/search?search=${tagsStr}&page=${page}&verified=1`;
                break;
            default:
                searchUrl = `https://www.pornhub.com/video/search?search=${tagsStr}&page=${page}`;
                break;
        }
        
        const cookieHeader = {
            Cookie: "age_verified=1; gdpr_registered=1"
        };
        
        const response = await axiosClient.get(searchUrl, { headers: { ...axiosClient.defaults.headers, ...cookieHeader } });
        
        if (!response.data) {
            throw new Error("Respuesta vacía de Pornhub");
        }
        
        const $ = cheerio.load(response.data);
        
        const videos = [];
        const videoElements = $(".videoBox");
        let count = 0;
        
        // Limitar la cantidad debido a las peticiones adicionales para URLs directas
        const maxResults = Math.min(cantidad, 5);
        
        for (const element of videoElements.toArray()) {
            if (count >= maxResults) break;
            
            const videoElement = $(element);
            const title = videoElement.find(".title a").text().trim();
            const thumbnail = videoElement.find("img").data("src") || videoElement.find("img").attr("src") || "";
            const videoUrl = "https://www.pornhub.com" + videoElement.find(".title a").attr("href");
            const duration = videoElement.find(".duration").text().trim();
            
            let directVideoUrl = null;
            let description = "";
            let author = "";
            
            try {
                const videoPage = await axiosClient.get(videoUrl, { 
                    headers: { ...axiosClient.defaults.headers, ...cookieHeader }
                });
                
                if (videoPage.data) {
                    const videoPageHtml = cheerio.load(videoPage.data);
                    
                    // Extraer autor
                    author = videoPageHtml(".usernameBadgesWrapper a").text().trim() || 
                             videoPageHtml(".video-info-row .userRow a").text().trim() || 
                             "Unknown";
                    
                    // Extraer descripción
                    description = videoPageHtml(".description").text().trim() || 
                                  videoPageHtml("meta[name='description']").attr("content") || 
                                  "";
                    
                    // Extraer URL del video
                    let scriptContent = videoPageHtml("script:contains('mediaDefinitions')").html() || "";
                    
                    // Buscar patrones de configuración de video
                    let dataMatch = scriptContent.match(/var\s+flashvars_\d+\s*=\s*({[^;]+})/);
                    
                    if (dataMatch && dataMatch[1]) {
                        try {
                            // Usar regex para extraer URLs directamente
                            const qualityItems = scriptContent.match(/"quality":"[^"]+","videoUrl":"[^"]+"/g) || [];
                            
                            if (qualityItems.length > 0) {
                                // Intentar obtener la mejor calidad disponible
                                for (const quality of ['1080', '720', '480', '360', '240']) {
                                    const matchItem = qualityItems.find(item => item.includes(`"quality":"${quality}"`));
                                    if (matchItem) {
                                        const urlMatch = matchItem.match(/"videoUrl":"([^"]+)"/);
                                        if (urlMatch && urlMatch[1]) {
                                            directVideoUrl = urlMatch[1].replace(/\\/g, '');
                                            break;
                                        }
                                    }
                                }
                                
                                // Si no se encontró una calidad específica, usar la primera disponible
                                if (!directVideoUrl) {
                                    const firstMatch = qualityItems[0].match(/"videoUrl":"([^"]+)"/);
                                    if (firstMatch && firstMatch[1]) {
                                        directVideoUrl = firstMatch[1].replace(/\\/g, '');
                                    }
                                }
                            }
                        } catch (e) {
                            console.error(`Error al parsear datos de video: ${e.message}`);
                        }
                    }
                }
            } catch (e) {
                console.error(`Error obteniendo datos de video individual: ${e.message}`);
                directVideoUrl = videoUrl; // Usar URL de la página como fallback
            }
            
            videos.push({
                title,
                author,
                description,
                thumbnail,
                video_url: videoUrl,
                direct_video_url: directVideoUrl || videoUrl,
                duration,
                source: "pornhub"
            });
            
            count++;
        }
        
        if (videos.length === 0) {
            throw new Error("No se encontraron resultados en Pornhub");
        }
        
        return videos;
    } catch (error) {
        console.error("Error buscando en Pornhub:", error);
        throw new Error(`Error en Pornhub: ${error.message}`);
    }
}

/**
 * Buscar en XNXX con obtención automática de URL directa
 */
async function buscarEnXnxx(tags, cantidad, pagina, clasificacion) {
    try {
        const tagsStr = tags.join("+");
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10) + 1;
        
        // Construir URL según clasificación
        let searchUrl;
        switch (clasificacion) {
            case CLASIFICACIONES.NUEVO:
                searchUrl = `https://www.xnxx.com/search/${tagsStr}/${page}/rec`;  // Recent = rec
                break;
            case CLASIFICACIONES.FAMOSO:
                searchUrl = `https://www.xnxx.com/search/${tagsStr}/${page}/views`; // Most viewed
                break;
            case CLASIFICACIONES.HD:
                searchUrl = `https://www.xnxx.com/search/${tagsStr}/${page}/hd`; // HD only
                break;
            case CLASIFICACIONES.AMATEUR:
                searchUrl = `https://www.xnxx.com/search/${tagsStr}+amateur/${page}`;
                break;
            default:
                searchUrl = `https://www.xnxx.com/search/${tagsStr}/${page}`;
                break;
        }
        
        const cookieHeader = {
            Cookie: "age_verified=1; gdpr_registered=1"
        };
        
        const response = await axiosClient.get(searchUrl, { headers: { ...axiosClient.defaults.headers, ...cookieHeader } });
        
        if (!response.data) {
            throw new Error("Respuesta vacía de XNXX");
        }
        
        const $ = cheerio.load(response.data);
        
        const videos = [];
        const videoElements = $(".mozaique .thumb-block");
        let count = 0;
        
        // Limitar la cantidad debido a las peticiones adicionales para URLs directas
        const maxResults = Math.min(cantidad, 5);
        
        for (const element of videoElements.toArray()) {
            if (count >= maxResults) break;
            
            const thumbElement = $(element);
            const title = thumbElement.find(".title a").text().trim();
            const thumbnail = thumbElement.find("img").data("src") || thumbElement.find("img").attr("src") || "";
            const videoUrl = "https://www.xnxx.com" + thumbElement.find("a").attr("href");
            const duration = thumbElement.find(".duration").text().trim();
            
            let directVideoUrl = null;
            let description = "";
            let author = "";
            
            try {
                const videoPage = await axiosClient.get(videoUrl, { 
                    headers: { ...axiosClient.defaults.headers, ...cookieHeader }
                });
                
                if (videoPage.data) {
                    const videoPageHtml = cheerio.load(videoPage.data);
                    
                    // Extraer autor
                    author = videoPageHtml(".uploader-tag").text().trim() || 
                             videoPageHtml(".video-metadata").text().trim() || 
                             "Unknown";
                    
                    // Extraer descripción
                    description = videoPageHtml(".video-metadata-description").text().trim() || 
                                  videoPageHtml("meta[name='description']").attr("content") || 
                                  "";
                    
                    // XNXX y XVideos comparten estructura similar
                    let scriptContent = videoPageHtml("script:contains('html5player')").html() || "";
                    
                    let urlMatch = scriptContent.match(/setVideoUrl(?:Low|High|HLS)\('([^']+)'\)/);
                    if (!urlMatch) {
                        urlMatch = scriptContent.match(/html5player\.setVideoUrlHigh\('([^']+)'\)/);
                    }
                    if (!urlMatch) {
                        urlMatch = scriptContent.match(/html5player\.setVideoUrl\('([^']+)'\)/);
                    }
                    
                    if (urlMatch && urlMatch[1]) {
                        directVideoUrl = urlMatch[1];
                        
                        if (directVideoUrl.startsWith('/')) {
                            directVideoUrl = "https://www.xnxx.com" + directVideoUrl;
                        }
                    }
                }
            } catch (e) {
                console.error(`Error obteniendo datos de video individual: ${e.message}`);
                directVideoUrl = videoUrl; // Usar URL de la página como fallback
            }
            
            videos.push({
                title,
                author,
                description,
                thumbnail,
                video_url: videoUrl,
                direct_video_url: directVideoUrl || videoUrl,
                duration,
                source: "xnxx"
            });
            
            count++;
        }
        
        if (videos.length === 0) {
            throw new Error("No se encontraron resultados en XNXX");
        }
        
        return videos;
    } catch (error) {
        console.error("Error buscando en XNXX:", error);
        throw new Error(`Error en XNXX: ${error.message}`);
    }
}

/**
 * Endpoint para obtener información sobre las fuentes disponibles
 */
router.get("/fuentes", (req, res) => {
    // Filtrar solo las fuentes habilitadas para la respuesta
    const fuentesActivas = Object.keys(sourceConfig)
        .filter(key => sourceConfig[key].enabled)
        .reduce((obj, key) => {
            obj[key] = {
                name: sourceConfig[key].name,
                type: sourceConfig[key].type
            };
            return obj;
        }, {});
    
    // Incluir también las opciones de selección aleatoria
    const opcionesAleatorias = {
        [SOURCES.RANDOM]: "Cualquier fuente",
        [SOURCES.RANDOM_IMG]: "Cualquier fuente de imágenes",
        [SOURCES.RANDOM_VID]: "Cualquier fuente de videos"
    };
    
    // Incluir clasificaciones disponibles
    const clasificacionesDisponibles = Object.values(CLASIFICACIONES);
    
    return res.json({
        success: true,
        fuentes_disponibles: fuentesActivas,
        opciones_aleatorias: opcionesAleatorias,
        clasificaciones: clasificacionesDisponibles,
        parametros: {
            tags: "Tags separados por comas (obligatorio)",
            cantidad: "Número de resultados (máx. 10 para imágenes, 5 para videos)",
            fuente: "Fuente específica o aleatoria",
            clasificacion: "Categoría o criterio de orden (nuevo, famoso, etc.)",
            pagina: "Página de resultados (opcional)",
            fallback: "true/false - Usar fuentes alternativas si la principal falla (por defecto: true)"
        },
        ejemplos: [
            "/api/fun/nsfw?tags=anime&cantidad=5&clasificacion=nuevo",
            "/api/fun/nsfw?tags=cosplay&fuente=rule34&clasificacion=famoso",
            "/api/fun/nsfw?tags=amateur&fuente=xvideos&clasificacion=hd"
        ]
    });
});

// ADVERTENCIA: Esta API es para uso exclusivo de adultos mayores de 18 años.

// Limpieza periódica de archivos antiguos (cada 6 horas)
setInterval(() => {
    try {
        const files = fs.readdirSync(CONTENT_DIR);
        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(CONTENT_DIR, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtimeMs;
            
            // Eliminar archivos mayores a 24 horas
            if (fileAge > 24 * 60 * 60 * 1000) {
                fs.unlinkSync(filePath);
                console.log(`Archivo NSFW eliminado por limpieza programada: ${file}`);
            }
        });
    } catch (error) {
        console.error("Error en limpieza de archivos NSFW:", error);
    }
}, 6 * 60 * 60 * 1000);

module.exports = router;
