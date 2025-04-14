// api/fun/nsfw/index.js - Versión mejorada con E621 y búsqueda múltiple
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
    E621: "e621",         // NUEVA FUENTE: e621
    REALBOORU: "realbooru", // NUEVA FUENTE: realbooru (contenido realista)
    TBIB: "tbib",         // NUEVA FUENTE: The Big Image Board
    
    // Fuentes de videos
    XVIDEOS: "xvideos",
    PORNHUB: "pornhub",
    XNXX: "xnxx",
    REDTUBE: "redtube",   // NUEVA FUENTE: RedTube
    SPANKBANG: "spankbang", // NUEVA FUENTE: SpankBang
    
    // Aleatorio
    RANDOM: "random",
    RANDOM_IMG: "random_img",
    RANDOM_VID: "random_vid",
    RANDOM_MULTI: "random_multi"  // NUEVA OPCIÓN: Busca en múltiples fuentes a la vez
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
    VERIFICADO: "verificado",    // Contenido de usuarios verificados
    FURRY: "furry"         // NUEVA: Contenido furry
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
    "official": CLASIFICACIONES.VERIFICADO,
    
    // Furry
    "furry": CLASIFICACIONES.FURRY,
    "anthro": CLASIFICACIONES.FURRY,
    "animal": CLASIFICACIONES.FURRY
};

// Tags alternativos cuando la búsqueda original no encuentra resultados
const TAGS_ALTERNATIVOS = {
    // General
    "anime": ["hentai", "manga", "japanese", "cartoon"],
    "hentai": ["anime", "manga", "japanese", "cartoon"],
    "bondage": ["bdsm", "tied", "rope", "restraint"],
    "milf": ["mature", "mom", "cougar", "older"],
    "teen": ["young", "college", "petite", "18"],
    "cosplay": ["costume", "roleplay", "anime", "character"],
    "lesbian": ["girl on girl", "lesbians", "girls only", "female only"],
    "gay": ["men only", "male only", "homosexual"],
    "amateur": ["homemade", "real", "selfie", "non-professional"],
    "professional": ["studio", "pornstar", "produced", "high quality"],
    
    // Para e621 y contenido furry
    "furry": ["anthro", "animal", "kemono", "fursuit"],
    "anthro": ["furry", "anthropomorphic", "animal_humanoid"],
    "canine": ["dog", "wolf", "fox", "coyote"],
    "feline": ["cat", "lion", "tiger", "leopard"],
    "pokemon": ["digimon", "nintendo", "game_character"],
    
    // Elementos visuales
    "blonde": ["fair_hair", "yellow_hair", "gold_hair"],
    "redhead": ["red_hair", "ginger", "orange_hair"],
    "brunette": ["dark_hair", "brown_hair", "black_hair"],
    "big_breasts": ["large_breasts", "huge_breasts", "busty"],
    "small_breasts": ["flat_chest", "petite", "tiny_breasts"],
    
    // Categorías populares
    "threesome": ["group", "orgy", "3some", "3p"],
    "anal": ["ass", "butt", "rear", "backdoor"],
    "oral": ["blowjob", "fellatio", "cunnilingus", "mouth"],
    "pov": ["point of view", "first person", "perspective"]
};

// Configuración de cada fuente
const sourceConfig = {
    [SOURCES.RULE34]: {
        type: "image",
        name: "Rule34",
        baseUrl: "https://rule34.xxx/",
        enabled: true,
        priority: 1,
        description: "Rule34 - Si existe, hay porno de ello"
    },
    [SOURCES.DANBOORU]: {
        type: "image",
        name: "Danbooru",
        baseUrl: "https://danbooru.donmai.us/",
        enabled: true,
        priority: 2,
        description: "Danbooru - Imágenes anime/manga"
    },
    [SOURCES.GELBOORU]: {
        type: "image",
        name: "Gelbooru",
        baseUrl: "https://gelbooru.com/",
        enabled: true,
        priority: 3,
        description: "Gelbooru - Gran colección de anime/hentai"
    },
    [SOURCES.E621]: {
        type: "image",
        name: "E621",
        baseUrl: "https://e621.net/",
        enabled: true,
        priority: 1,
        description: "E621 - Especializado en contenido furry/anthro",
        userAgent: "KarlAPI/1.0 (by YourUsername; for API testing)" // E621 requiere User-Agent
    },
    [SOURCES.REALBOORU]: {
        type: "image",
        name: "Realbooru",
        baseUrl: "https://realbooru.com/",
        enabled: true,
        priority: 4,
        description: "Realbooru - Contenido realista/fotográfico"
    },
    [SOURCES.TBIB]: {
        type: "image",
        name: "TBIB",
        baseUrl: "https://tbib.org/",
        enabled: true,
        priority: 5,
        description: "The Big Image Board - Colección variada de anime/hentai"
    },
    [SOURCES.XVIDEOS]: {
        type: "video",
        name: "XVideos",
        baseUrl: "https://www.xvideos.com/",
        enabled: true,
        priority: 1,
        description: "XVideos - Mayor sitio de videos pornográficos"
    },
    [SOURCES.PORNHUB]: {
        type: "video",
        name: "Pornhub",
        baseUrl: "https://www.pornhub.com/",
        enabled: true,
        priority: 2,
        description: "Pornhub - Popular sitio de videos premium"
    },
    [SOURCES.XNXX]: {
        type: "video",
        name: "XNXX",
        baseUrl: "https://www.xnxx.com/",
        enabled: true,
        priority: 3,
        description: "XNXX - Gran colección de videos pornográficos"
    },
    [SOURCES.REDTUBE]: {
        type: "video",
        name: "RedTube",
        baseUrl: "https://www.redtube.com/",
        enabled: true,
        priority: 4,
        description: "RedTube - Videos premium con categorías variadas"
    },
    [SOURCES.SPANKBANG]: {
        type: "video",
        name: "SpankBang",
        baseUrl: "https://spankbang.com/",
        enabled: true,
        priority: 5,
        description: "SpankBang - Videos HD con búsqueda avanzada"
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
            clasificacion = "aleatorio",
            multi_fuentes = "false"  // Nuevo parámetro para buscar en múltiples fuentes
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
        if (fuente === SOURCES.XVIDEOS || fuente === SOURCES.PORNHUB || fuente === SOURCES.XNXX || 
            fuente === SOURCES.REDTUBE || fuente === SOURCES.SPANKBANG || fuente === SOURCES.RANDOM_VID) {
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
        
        // Si la clasificación es FURRY y no está en los tags, añadirlo y preferir e621
        let fuentePreferida = fuente.toLowerCase();
        if (clasificacionNormalizada === CLASIFICACIONES.FURRY) {
            if (!tagsList.includes('furry') && !tagsList.includes('anthro')) {
                tagsList.push('furry');
            }
            // Si la fuente es random o no está especificada, preferir E621 para contenido furry
            if (fuentePreferida === SOURCES.RANDOM || fuentePreferida === SOURCES.RANDOM_IMG) {
                fuentePreferida = SOURCES.E621;
            }
        }
        
        // NUEVA FUNCIONALIDAD: Búsqueda multi-fuente
        if (fuente === SOURCES.RANDOM_MULTI || multi_fuentes === "true") {
            return await busquedaMultiFuente(req, res, tagsList, cantidadLimitada, pagina, clasificacionNormalizada);
        }
        
        // Determinar la fuente a utilizar
        let fuenteSeleccionada = fuentePreferida;
        
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
                    ![SOURCES.RANDOM, SOURCES.RANDOM_IMG, SOURCES.RANDOM_VID, SOURCES.RANDOM_MULTI].includes(key) && 
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
        
        // MEJORA: Fallback con tags alternativos
        let { resultados, fuente: fuenteUsada, errores, tagsUsados } = await buscarContenido(
            fuenteSeleccionada, 
            tagsList, 
            cantidadLimitada, 
            pagina, 
            clasificacionNormalizada,
            fallback === "true"
        );
        
        // Si no hay resultados y fallback está activado, intentar con tags alternativos
        if (resultados.length === 0 && fallback === "true") {
            const tagsAlternativos = generarTagsAlternativos(tagsList);
            console.log("Intentando con tags alternativos:", tagsAlternativos);
            
            const resultadoAlternativo = await buscarContenido(
                fuenteSeleccionada,
                tagsAlternativos,
                cantidadLimitada,
                pagina,
                clasificacionNormalizada,
                true
            );
            
            if (resultadoAlternativo.resultados.length > 0) {
                resultados = resultadoAlternativo.resultados;
                fuenteUsada = resultadoAlternativo.fuente;
                errores = [...errores, ...resultadoAlternativo.errores];
                tagsUsados = resultadoAlternativo.tagsUsados;
            }
        }
        
        // Manejar caso sin resultados
        if (resultados.length === 0 && errores.length > 0) {
            const respuestaError = {
                error: true,
                message: "No se encontraron resultados en ninguna fuente",
                fuente_intentada: fuenteSeleccionada,
                tags_originales: tagsList,
                tags_alternativos: tagsUsados !== tagsList ? tagsUsados : null,
                fuentes_alternativas: Object.keys(sourceConfig)
                    .filter(k => sourceConfig[k].enabled && k !== fuenteSeleccionada),
                sugerencia: "Intenta con la fuente 'random_multi' para buscar en múltiples fuentes simultáneamente"
            };
            
            if (mostrar_errores === "true") {
                respuestaError.errores = errores;
            }
            
            return res.status(404).json(respuestaError);
        }

        // FUNCIONALIDAD: DESCARGAR MÚLTIPLES CONTENIDOS Y DEVOLVER INFORMACIÓN COMPLETA
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
                
                // Configurar headers específicos para e621 si es necesario
                let downloadHeaders = {
                    "User-Agent": sourceConfig[fuenteUsada].userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Referer": sourceConfig[fuenteUsada].baseUrl
                };
                
                // Descargar el contenido
                const response = await axios.get(urlDescarga, { 
                    responseType: 'arraybuffer',
                    headers: downloadHeaders,
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
                    fuente: resultado.source || fuenteUsada,
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
                tags: tagsList,
                tags_utilizados: tagsUsados
            });
        }
        
        // Preparar respuesta con todos los datos solicitados
        return res.json({
            success: true,
            total: resultadosProcesados.length,
            solicitados: cantidadLimitada,
            fuente: fuenteUsada,
            tipo: sourceConfig[fuenteUsada].type,
            tags_originales: tagsList,
            tags_utilizados: tagsUsados,
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
 * NUEVA FUNCIONALIDAD: Búsqueda en múltiples fuentes simultáneamente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Array} tags - Tags de búsqueda
 * @param {Number} cantidad - Cantidad solicitada
 * @param {Number} pagina - Página de resultados
 * @param {String} clasificacion - Clasificación de contenido
 */
async function busquedaMultiFuente(req, res, tags, cantidad, pagina, clasificacion) {
    try {
        // Determinar si estamos buscando imágenes, videos o ambos
        const tipo = req.query.tipo || "mixto"; // "imagen", "video" o "mixto" (por defecto)
        
        // Seleccionar las fuentes disponibles según el tipo
        let fuentesSeleccionadas = [];
        
        if (tipo === "imagen" || tipo === "mixto") {
            const fuentesImagen = Object.keys(sourceConfig).filter(key => 
                sourceConfig[key].type === "image" && sourceConfig[key].enabled
            );
            fuentesSeleccionadas.push(...fuentesImagen);
        }
        
        if (tipo === "video" || tipo === "mixto") {
            const fuentesVideo = Object.keys(sourceConfig).filter(key => 
                sourceConfig[key].type === "video" && sourceConfig[key].enabled
            );
            fuentesSeleccionadas.push(...fuentesVideo);
        }
        
        // Limitar el número de fuentes a consultar para evitar sobrecarga
        const maxFuentes = Math.min(fuentesSeleccionadas.length, 5);
        fuentesSeleccionadas = fuentesSeleccionadas.slice(0, maxFuentes);
        
        console.log(`Buscando en múltiples fuentes: ${fuentesSeleccionadas.join(", ")}`);
        
        // Cantidad por fuente
        const cantidadPorFuente = Math.ceil(cantidad / fuentesSeleccionadas.length);
        
        // Búsqueda en paralelo en todas las fuentes seleccionadas
        const promesasBusqueda = fuentesSeleccionadas.map(fuente => 
            buscarContenido(fuente, tags, cantidadPorFuente, pagina, clasificacion, true)
                .catch(error => ({ resultados: [], fuente, errores: [{ fuente, error: error.message }], tagsUsados: tags }))
        );
        
        // Esperar a que todas las búsquedas terminen
        const resultadosPorFuente = await Promise.all(promesasBusqueda);
        
        // Combinar todos los resultados
        let todosResultados = [];
        let todosFallos = [];
        let fuentesUsadas = [];
        let todosTagsUsados = new Set([...tags]);
        
        resultadosPorFuente.forEach(resultado => {
            if (resultado.resultados.length > 0) {
                todosResultados.push(...resultado.resultados.map(r => ({...r, source: resultado.fuente})));
                fuentesUsadas.push(resultado.fuente);
                resultado.tagsUsados.forEach(tag => todosTagsUsados.add(tag));
            } else {
                todosFallos.push(...resultado.errores);
            }
        });
        
        // Aleatorizar resultados para tener una mezcla de fuentes
        todosResultados = todosResultados.sort(() => Math.random() - 0.5);
        
        // Limitar al número solicitado
        todosResultados = todosResultados.slice(0, cantidad);
        
        // Manejar si no se encontraron resultados
        if (todosResultados.length === 0) {
            // Intentar con tags alternativos
            const tagsAlternativos = generarTagsAlternativos(tags);
            console.log("Búsqueda multi-fuente: Intentando con tags alternativos:", tagsAlternativos);
            
            // Búsqueda en paralelo con tags alternativos
            const promesasAlternativas = fuentesSeleccionadas.map(fuente => 
                buscarContenido(fuente, tagsAlternativos, cantidadPorFuente, pagina, clasificacion, true)
                    .catch(error => ({ resultados: [], fuente, errores: [{ fuente, error: error.message }], tagsUsados: tagsAlternativos }))
            );
            
            const resultadosAlternativos = await Promise.all(promesasAlternativas);
            
            resultadosAlternativos.forEach(resultado => {
                if (resultado.resultados.length > 0) {
                    todosResultados.push(...resultado.resultados.map(r => ({...r, source: resultado.fuente})));
                    fuentesUsadas.push(resultado.fuente);
                    resultado.tagsUsados.forEach(tag => todosTagsUsados.add(tag));
                } else {
                    todosFallos.push(...resultado.errores);
                }
            });
            
            // Aleatorizar y limitar resultados
            todosResultados = todosResultados.sort(() => Math.random() - 0.5).slice(0, cantidad);
        }
        
        // Si aún no hay resultados, devolver error
        if (todosResultados.length === 0) {
            return res.status(404).json({
                error: true,
                message: "No se encontraron resultados en ninguna fuente",
                fuentes_intentadas: fuentesSeleccionadas,
                tags_originales: tags,
                tags_alternativos: Array.from(todosTagsUsados).filter(tag => !tags.includes(tag)),
                errores: todosFallos.length > 0 && req.query.mostrar_errores === "true" ? todosFallos : undefined
            });
        }
        
        // Descargar y procesar resultados
        const resultadosProcesados = [];
        const cantidadResultados = Math.min(todosResultados.length, cantidad);
        
        for (let i = 0; i < cantidadResultados; i++) {
            const resultado = todosResultados[i];
            const fuenteResultado = resultado.source;
            
            // Determinar la URL directa a descargar
            let urlDescarga;
            if (sourceConfig[fuenteResultado].type === "video") {
                urlDescarga = resultado.direct_video_url || resultado.video_url;
            } else {
                urlDescarga = resultado.file_url;
            }
            
            if (!urlDescarga) {
                console.log(`Advertencia: No se encontró URL directa para el resultado ${i+1}`);
                continue;
            }
            
            try {
                console.log(`Multi-fuente: Descargando contenido ${i+1}/${cantidadResultados} desde: ${urlDescarga}`);
                
                // Configurar headers específicos para e621 si es necesario
                let downloadHeaders = {
                    "User-Agent": sourceConfig[fuenteResultado].userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Referer": sourceConfig[fuenteResultado].baseUrl
                };
                
                // Descargar el contenido
                const response = await axios.get(urlDescarga, { 
                    responseType: 'arraybuffer',
                    headers: downloadHeaders,
                    timeout: 30000,
                    maxContentLength: 100 * 1024 * 1024
                });
                
                // Determinar el tipo de contenido
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
                        contentType = sourceConfig[fuenteResultado].type === "video" ? 'video/mp4' : 'image/jpeg';
                    }
                }
                
                // Generar nombre único para el archivo
                const extension = contentType.split('/')[1];
                const safeTag = tags[0].replace(/[^a-z0-9]/gi, '_').substring(0, 15);
                const uniqueId = crypto.randomBytes(8).toString('hex');
                const filename = `nsfw_${safeTag}_${uniqueId}.${extension}`;
                const filePath = path.join(CONTENT_DIR, filename);
                
                // Guardar el archivo descargado
                fs.writeFileSync(filePath, Buffer.from(response.data));
                
                // Generar URL pública
                const contentUrl = `${PUBLIC_URL_BASE}${PUBLIC_PATH}/${filename}`;
                
                // Programar eliminación
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
                    pagina_web: resultado.video_url || urlDescarga,
                    recurso: urlDescarga,
                    thumbnail: resultado.thumbnail || resultado.preview_url || "",
                    [sourceConfig[fuenteResultado].type]: contentUrl,
                    autor: resultado.author || "Unknown",
                    duracion: resultado.duration || null,
                    fuente: fuenteResultado,
                    tipo_contenido: sourceConfig[fuenteResultado].type,
                    expira_en: "24 horas"
                });
                
            } catch (downloadError) {
                console.error(`Error multi-fuente descargando contenido ${i+1}:`, downloadError);
                // No añadimos los resultados fallidos
            }
        }
        
        // Si no se pudo procesar ningún resultado
        if (resultadosProcesados.length === 0) {
            return res.status(500).json({
                error: true,
                message: "No se pudo descargar ningún contenido correctamente",
                fuentes_intentadas: fuentesUsadas.length > 0 ? fuentesUsadas : fuentesSeleccionadas,
                tipo: tipo,
                tags: tags,
                tags_alternativos: Array.from(todosTagsUsados).filter(tag => !tags.includes(tag))
            });
        }
        
        // Preparar respuesta
        return res.json({
            success: true,
            total: resultadosProcesados.length,
            solicitados: cantidad,
            fuentes_utilizadas: [...new Set(resultadosProcesados.map(r => r.fuente))],
            modo: "multi_fuente",
            tags_originales: tags,
            tags_utilizados: Array.from(todosTagsUsados),
            resultados: resultadosProcesados
        });
        
    } catch (error) {
        console.error("Error en búsqueda multi-fuente:", error);
        return res.status(500).json({
            error: true,
            message: "Error al realizar la búsqueda en múltiples fuentes",
            detalles: error.message
        });
    }
}

/**
 * Genera tags alternativos cuando no se encuentran resultados
 * @param {Array} tags - Tags originales
 * @returns {Array} - Tags alternativos
 */
function generarTagsAlternativos(tags) {
    const tagsAlternativos = [...tags]; // Copiar tags originales
    let cambiosRealizados = false;
    
    // Intentar reemplazar uno o más tags con alternativas
    for (let i = 0; i < tags.length; i++) {
        const tagOriginal = tags[i];
        
        // Si hay alternativas para este tag
        if (TAGS_ALTERNATIVOS[tagOriginal]) {
            // Seleccionar una alternativa aleatoria
            const alternativas = TAGS_ALTERNATIVOS[tagOriginal];
            const tagAlternativo = alternativas[Math.floor(Math.random() * alternativas.length)];
            
            // Reemplazar el tag original con la alternativa
            tagsAlternativos[i] = tagAlternativo;
            cambiosRealizados = true;
            
            // Limitar a un cambio para no alterar demasiado la búsqueda
            if (tags.length > 2 && cambiosRealizados) {
                break;
            }
        }
    }
    
    // Si no se realizaron cambios, agregar un tag adicional para ampliar la búsqueda
    if (!cambiosRealizados && tags.length < 3) {
        // Si no hay tags alternativos, usar tags genéricos según la categoría
        const tagsPosibles = ['sexy', 'nsfw', 'adult', 'xxx', 'hot'];
        const tagAdicional = tagsPosibles[Math.floor(Math.random() * tagsPosibles.length)];
        
        if (!tagsAlternativos.includes(tagAdicional)) {
            tagsAlternativos.push(tagAdicional);
        }
    }
    
    return tagsAlternativos;
}

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
    let tagsUsados = [...tags]; // Por defecto, los tags usados son los originales
    
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
                
                case SOURCES.E621:
                    resultadosBusqueda = await buscarEnE621(tags, cantidad, pagina, clasificacion);
                    break;
                    
                case SOURCES.REALBOORU:
                    resultadosBusqueda = await buscarEnRealbooru(tags, cantidad, pagina, clasificacion);
                    break;
                    
                case SOURCES.TBIB:
                    resultadosBusqueda = await buscarEnTbib(tags, cantidad, pagina, clasificacion);
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
                    
                case SOURCES.REDTUBE:
                    resultadosBusqueda = await buscarEnRedtube(tags, cantidad, pagina, clasificacion);
                    break;
                    
                case SOURCES.SPANKBANG:
                    resultadosBusqueda = await buscarEnSpankbang(tags, cantidad, pagina, clasificacion);
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
    
    // Si no se obtuvieron resultados y es una búsqueda de furry/anthro, intentar con e621
    if (resultados.length === 0 && permitirFallback && 
        fuente !== SOURCES.E621 && 
        (tags.includes('furry') || tags.includes('anthro'))) {
        console.log("Contenido furry detectado, intentando con E621...");
        const resultadosE621 = await intentarBusqueda(SOURCES.E621);
        
        if (resultadosE621.length > 0) {
            return { resultados: resultadosE621, fuente: SOURCES.E621, errores, tagsUsados };
        }
    }
    
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
                return { resultados, fuente: fuenteAlternativa, errores, tagsUsados };
            }
        }
        
        // Si aún no hay resultados, intentar con tags alternativos en la fuente original
        console.log("Intentando con tags alternativos en la fuente original...");
        const tagsAlternativos = generarTagsAlternativos(tags);
        
        if (tagsAlternativos.some(tag => !tags.includes(tag))) {
            console.log(`Tags originales: ${tags.join(', ')} -> Tags alternativos: ${tagsAlternativos.join(', ')}`);
            resultados = await intentarBusqueda(fuente);
            
            if (resultados.length > 0) {
                console.log(`Éxito con tags alternativos en fuente original: ${fuente}`);
                return { resultados, fuente, errores, tagsUsados: tagsAlternativos };
            }
            
            // Intentar con tags alternativos en fuentes alternativas
            for (const fuenteAlternativa of fuentesAlternativas) {
                console.log(`Intentando con tags alternativos en fuente alternativa: ${fuenteAlternativa}`);
                
                resultados = await buscarContenidoConTags(fuenteAlternativa, tagsAlternativos, cantidad, pagina, clasificacion);
                
                if (resultados.length > 0) {
                    console.log(`Éxito con tags alternativos en fuente alternativa: ${fuenteAlternativa}`);
                    return { resultados, fuente: fuenteAlternativa, errores, tagsUsados: tagsAlternativos };
                }
            }
        }
    }
    
    return { resultados, fuente, errores, tagsUsados };
}

/**
 * Función auxiliar para buscar contenido con tags específicos
 */
async function buscarContenidoConTags(fuente, tags, cantidad, pagina, clasificacion) {
    try {
        switch (fuente) {
            case SOURCES.RULE34:
                return await buscarEnRule34(tags, cantidad, pagina, clasificacion);
            case SOURCES.DANBOORU:
                return await buscarEnDanbooru(tags, cantidad, pagina, clasificacion);
            case SOURCES.GELBOORU:
                return await buscarEnGelbooru(tags, cantidad, pagina, clasificacion);
            case SOURCES.E621:
                return await buscarEnE621(tags, cantidad, pagina, clasificacion);
            case SOURCES.REALBOORU:
                return await buscarEnRealbooru(tags, cantidad, pagina, clasificacion);
            case SOURCES.TBIB:
                return await buscarEnTbib(tags, cantidad, pagina, clasificacion);
            case SOURCES.XVIDEOS:
                return await buscarEnXVideos(tags, cantidad, pagina, clasificacion);
            case SOURCES.PORNHUB:
                return await buscarEnPornhub(tags, cantidad, pagina, clasificacion);
            case SOURCES.XNXX:
                return await buscarEnXnxx(tags, cantidad, pagina, clasificacion);
            case SOURCES.REDTUBE:
                return await buscarEnRedtube(tags, cantidad, pagina, clasificacion);
            case SOURCES.SPANKBANG:
                return await buscarEnSpankbang(tags, cantidad, pagina, clasificacion);
            default:
                return [];
        }
    } catch (error) {
        console.error(`Error buscando en ${fuente} con tags ${tags.join(',')}:`, error);
        return [];
    }
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
 * NUEVA FUNCIÓN: Buscar en E621 (sitio de imágenes furry/anthro)
 */
async function buscarEnE621(tags, cantidad, pagina, clasificacion) {
    try {
        // E621 usa guiones bajos en lugar de espacios
        const tagsFormateados = tags.map(tag => tag.replace(/\s+/g, '_'));
        const tagsStr = tagsFormateados.join("+");
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10) + 1;
        
        // Construir URL según clasificación
        let searchUrl;
        let ordenacion = '';
        
        switch (clasificacion) {
            case CLASIFICACIONES.NUEVO:
                ordenacion = 'order:date';
                break;
            case CLASIFICACIONES.FAMOSO:
                ordenacion = 'order:score';
                break;
            case CLASIFICACIONES.FURRY:
                // Para clasificación furry explícita, asegurarse de incluir tags relevantes
                if (!tagsFormateados.some(tag => ['furry', 'anthro', 'animal_humanoid'].includes(tag))) {
                    ordenacion = 'anthro';
                }
                break;
            default:
                ordenacion = 'order:random';
                break;
        }
        
        // Añadir ordenación a la búsqueda si está definida
        const queryTags = ordenacion ? `${tagsStr}+${ordenacion}` : tagsStr;
        
        // E621 requiere un User-Agent específico
        const userAgent = sourceConfig[SOURCES.E621].userAgent;
        
        searchUrl = `https://e621.net/posts.json?tags=${queryTags}&limit=${cantidad}&page=${page}`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                "User-Agent": userAgent,
                "Accept": "application/json"
            }
        });
        
        if (!response.data || !response.data.posts || !Array.isArray(response.data.posts) || response.data.posts.length === 0) {
            throw new Error("No se encontraron resultados en E621");
        }
        
        const posts = response.data.posts.map(post => {
            // E621 tiene diferentes tamaños de imágenes
            const file = post.file || {};
            const preview = post.preview || {};
            const sample = post.sample || {};
            
            // Obtener tags formateados
            const allTags = [];
            if (post.tags) {
                Object.values(post.tags).forEach(tagCategory => {
                    if (Array.isArray(tagCategory)) {
                        allTags.push(...tagCategory);
                    }
                });
            }
            
            return {
                title: (allTags.length > 0 ? allTags[0] : "Sin título"),
                author: post.uploader_name || post.uploader_id?.toString() || "Unknown",
                description: allTags.join(" "),
                file_url: file.url || sample.url || preview.url,
                preview_url: preview.url || sample.url,
                source: "e621"
            };
        }).filter(post => post.file_url);
        
        if (posts.length === 0) {
            throw new Error("No se encontraron resultados válidos en E621");
        }
        
        return posts;
    } catch (error) {
        console.error("Error buscando en E621:", error);
        throw new Error(`Error en E621: ${error.message}`);
    }
}

/**
 * NUEVA FUNCIÓN: Buscar en Realbooru (sitio de imágenes realistas)
 */
async function buscarEnRealbooru(tags, cantidad, pagina, clasificacion) {
    try {
        const tagsStr = tags.join("+");
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10);
        
        // Construir URL según clasificación
        let searchUrl;
        switch (clasificacion) {
            case CLASIFICACIONES.NUEVO:
                searchUrl = `https://realbooru.com/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}&json=1&sort=date`;
                break;
            case CLASIFICACIONES.FAMOSO:
                searchUrl = `https://realbooru.com/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}&json=1&sort=score`;
                break;
            default:
                searchUrl = `https://realbooru.com/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}&json=1`;
                break;
        }
        
        const response = await axiosClient.get(searchUrl);
        
        // Realbooru puede devolver datos en diferentes formatos
        let posts = [];
        
        if (response.data && typeof response.data === 'object') {
            // Formato JSON
            if (response.data.post && Array.isArray(response.data.post)) {
                posts = response.data.post.map(post => ({
                    title: post.tags ? post.tags.split(" ")[0] : "Sin título",
                    author: post.owner || "Unknown",
                    description: post.tags || "",
                    file_url: post.file_url || `https://realbooru.com/images/${post.directory}/${post.image}`,
                    preview_url: post.preview_url || `https://realbooru.com/thumbnails/${post.directory}/thumbnail_${post.image}`,
                    source: "realbooru"
                }));
            }
        } else if (response.data) {
            // Formato XML
            const $ = cheerio.load(response.data, { xmlMode: true });
            
            $("post").each(function() {
                const postElement = $(this);
                const directory = postElement.attr("directory") || "";
                const image = postElement.attr("image") || "";
                
                const post = {
                    title: postElement.attr("tags") ? postElement.attr("tags").split(" ")[0] : "Sin título",
                    author: postElement.attr("owner") || "Unknown",
                    description: postElement.attr("tags") || "",
                    file_url: postElement.attr("file_url") || `https://realbooru.com/images/${directory}/${image}`,
                    preview_url: postElement.attr("preview_url") || `https://realbooru.com/thumbnails/${directory}/thumbnail_${image}`,
                    source: "realbooru"
                };
                
                posts.push(post);
            });
        }
        
        if (posts.length === 0) {
            throw new Error("No se encontraron resultados en Realbooru");
        }
        
        return posts;
    } catch (error) {
        console.error("Error buscando en Realbooru:", error);
        throw new Error(`Error en Realbooru: ${error.message}`);
    }
}

/**
 * NUEVA FUNCIÓN: Buscar en TBIB (The Big Image Board)
 */
async function buscarEnTbib(tags, cantidad, pagina, clasificacion) {
    try {
        const tagsStr = tags.join("+");
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10);
        
        // Construir URL según clasificación
        let searchUrl;
        switch (clasificacion) {
            case CLASIFICACIONES.NUEVO:
                searchUrl = `https://tbib.org/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}&json=1&sort=date`;
                break;
            case CLASIFICACIONES.FAMOSO:
                searchUrl = `https://tbib.org/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}&json=1&sort=score`;
                break;
            default:
                searchUrl = `https://tbib.org/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}&json=1`;
                break;
        }
        
        const response = await axiosClient.get(searchUrl);
        
        let posts = [];
        
        if (response.data && typeof response.data === 'object') {
            // Formato JSON
            if (response.data.post && Array.isArray(response.data.post)) {
                posts = response.data.post.map(post => ({
                    title: post.tags ? post.tags.split(" ")[0] : "Sin título",
                    author: post.owner || "Unknown",
                    description: post.tags || "",
                    file_url: post.file_url,
                    preview_url: post.preview_url,
                    source: "tbib"
                }));
            }
        } else if (response.data) {
            // Formato XML
            const $ = cheerio.load(response.data, { xmlMode: true });
            
            $("post").each(function() {
                const post = {
                    title: $(this).attr("tags") ? $(this).attr("tags").split(" ")[0] : "Sin título",
                    author: $(this).attr("owner") || "Unknown",
                    description: $(this).attr("tags") || "",
                    file_url: $(this).attr("file_url"),
                    preview_url: $(this).attr("preview_url"),
                    source: "tbib"
                };
                
                posts.push(post);
            });
        }
        
        if (posts.length === 0) {
            throw new Error("No se encontraron resultados en TBIB");
        }
        
        return posts;
    } catch (error) {
        console.error("Error buscando en TBIB:", error);
        throw new Error(`Error en TBIB: ${error.message}`);
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
 * NUEVA FUNCIÓN: Buscar en RedTube
 */
async function buscarEnRedtube(tags, cantidad, pagina, clasificacion) {
    try {
        const tagsStr = tags.join("+");
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10) + 1;
        
        // Construir URL según clasificación
        let searchUrl;
        switch (clasificacion) {
            case CLASIFICACIONES.NUEVO:
                searchUrl = `https://www.redtube.com/?search=${tagsStr}&page=${page}&ordering=newest`;
                break;
            case CLASIFICACIONES.FAMOSO:
                searchUrl = `https://www.redtube.com/?search=${tagsStr}&page=${page}&ordering=mostviewed`;
                break;
            case CLASIFICACIONES.HD:
                searchUrl = `https://www.redtube.com/?search=${tagsStr}&page=${page}&hd=1`;
                break;
            case CLASIFICACIONES.PROFESIONAL:
                searchUrl = `https://www.redtube.com/?search=${tagsStr}&page=${page}&premium=1`;
                break;
            case CLASIFICACIONES.VERIFICADO:
                searchUrl = `https://www.redtube.com/?search=${tagsStr}&page=${page}&verified=1`;
                break;
            default:
                searchUrl = `https://www.redtube.com/?search=${tagsStr}&page=${page}`;
                break;
        }
        
        const cookieHeader = {
            Cookie: "age_verified=1; gdpr_registered=1"
        };
        
        const response = await axiosClient.get(searchUrl, { headers: { ...axiosClient.defaults.headers, ...cookieHeader } });
        
        if (!response.data) {
            throw new Error("Respuesta vacía de RedTube");
        }
        
        const $ = cheerio.load(response.data);
        
        const videos = [];
        const videoElements = $(".video_listing_block");
        let count = 0;
        
        // Limitar la cantidad
        const maxResults = Math.min(cantidad, 5);
        
        for (const element of videoElements.toArray()) {
            if (count >= maxResults) break;
            
            const videoElement = $(element);
            const title = videoElement.find("a.video_title").text().trim() || videoElement.find(".video_title").text().trim();
            const thumbnail = videoElement.find("img").data("src") || videoElement.find("img").attr("src") || "";
            const videoUrl = videoElement.find("a").attr("href");
            const fullVideoUrl = videoUrl.startsWith("https") ? videoUrl : `https://www.redtube.com${videoUrl}`;
            const duration = videoElement.find(".duration").text().trim();
            
            let directVideoUrl = null;
            let description = "";
            let author = "";
            
            try {
                const videoPage = await axiosClient.get(fullVideoUrl, { 
                    headers: { ...axiosClient.defaults.headers, ...cookieHeader }
                });
                
                if (videoPage.data) {
                    const videoPageHtml = cheerio.load(videoPage.data);
                    
                    // Extraer autor
                    author = videoPageHtml(".video-uploader-name").text().trim() || 
                             videoPageHtml(".usernameLink").text().trim() || 
                             "Unknown";
                    
                    // Extraer descripción
                    description = videoPageHtml(".video-description").text().trim() || 
                                  videoPageHtml("meta[name='description']").attr("content") || 
                                  "";
                    
                    // Extraer URL del video mediante regex en scripts
                    const scriptContent = videoPageHtml("script").text();
                    
                    // Patrones para encontrar URLs en RedTube
                    const patterns = [
                        /videoUrl":"([^"]+)"/i,
                        /mp4_url":"([^"]+)"/i,
                        /source src="([^"]+)"/i,
                        /videoLinkUrl":"([^"]+)"/i
                    ];
                    
                    for (const pattern of patterns) {
                        const match = scriptContent.match(pattern);
                        if (match && match[1]) {
                            directVideoUrl = match[1].replace(/\\/g, '');
                            break;
                        }
                    }
                }
            } catch (e) {
                console.error(`Error obteniendo datos de video individual en RedTube: ${e.message}`);
                directVideoUrl = fullVideoUrl; // Usar URL de la página como fallback
            }
            
            videos.push({
                title,
                author,
                description,
                thumbnail,
                video_url: fullVideoUrl,
                direct_video_url: directVideoUrl || fullVideoUrl,
                duration,
                source: "redtube"
            });
            
            count++;
        }
        
        if (videos.length === 0) {
            throw new Error("No se encontraron resultados en RedTube");
        }
        
        return videos;
    } catch (error) {
        console.error("Error buscando en RedTube:", error);
        throw new Error(`Error en RedTube: ${error.message}`);
    }
}

/**
 * NUEVA FUNCIÓN: Buscar en SpankBang
 */
async function buscarEnSpankbang(tags, cantidad, pagina, clasificacion) {
    try {
        const tagsStr = tags.join("+");
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10) + 1;
        
        // Construir URL según clasificación
        let searchUrl;
        let orden = '';
        
        switch (clasificacion) {
            case CLASIFICACIONES.NUEVO:
                orden = 'new';
                break;
            case CLASIFICACIONES.FAMOSO:
                orden = 'trending';
                break;
            case CLASIFICACIONES.HD:
                orden = '4k'; // SpankBang permite filtrar por 4K
                break;
            case CLASIFICACIONES.PROFESIONAL:
                orden = 'top';
                break;
            default:
                orden = 'relevant';
                break;
        }
        
        searchUrl = `https://spankbang.com/s/${tagsStr}/${page}/?o=${orden}`;
        
        const cookieHeader = {
            Cookie: "age_verified=1; gdpr_registered=1"
        };
        
        const response = await axiosClient.get(searchUrl, { headers: { ...axiosClient.defaults.headers, ...cookieHeader } });
        
        if (!response.data) {
            throw new Error("Respuesta vacía de SpankBang");
        }
        
        const $ = cheerio.load(response.data);
        
        const videos = [];
        const videoElements = $(".video-item");
        let count = 0;
        
        // Limitar la cantidad
        const maxResults = Math.min(cantidad, 5);
        
        for (const element of videoElements.toArray()) {
            if (count >= maxResults) break;
            
            const videoElement = $(element);
            const title = videoElement.find(".n").text().trim();
            const thumbnail = videoElement.find("img").data("src") || videoElement.find("img").attr("src") || "";
            const videoUrl = videoElement.find("a").attr("href");
            const fullVideoUrl = videoUrl.startsWith("https") ? videoUrl : `https://spankbang.com${videoUrl}`;
            const duration = videoElement.find(".l").text().trim();
            
            let directVideoUrl = null;
            let description = "";
            let author = videoElement.find(".u").text().trim() || "Unknown";
            
            try {
                const videoPage = await axiosClient.get(fullVideoUrl, { 
                    headers: { ...axiosClient.defaults.headers, ...cookieHeader }
                });
                
                if (videoPage.data) {
                    const videoPageHtml = cheerio.load(videoPage.data);
                    
                    // Extraer descripción
                    description = videoPageHtml(".desc").text().trim() || 
                                  videoPageHtml("meta[name='description']").attr("content") || 
                                  "";
                    
                    // Extraer URL del video mediante regex en scripts
                    const scriptContent = videoPageHtml("script").text();
                    
                    // Patrones para encontrar URLs de video en SpankBang
                    let streamDataMatch = scriptContent.match(/stream_data\s*=\s*({[^;]+})/);
                    if (streamDataMatch && streamDataMatch[1]) {
                        try {
                            // Buscar URLs directamente con regex
                            const streamDataText = streamDataMatch[1];
                            const qualityMatches = streamDataText.match(/"[^"]+":"[^"]+\.mp4"/g) || [];
                            
                            if (qualityMatches.length > 0) {
                                // Intentar encontrar la mejor calidad
                                const qualities = ['4k', '1080p', '720p', '480p', '320p', '240p'];
                                let foundUrl = null;
                                
                                for (const quality of qualities) {
                                    for (const qualityMatch of qualityMatches) {
                                        if (qualityMatch.includes(quality)) {
                                            const urlMatch = qualityMatch.match(/"([^"]+)":"([^"]+)"/);
                                            if (urlMatch && urlMatch[2]) {
                                                foundUrl = urlMatch[2];
                                                break;
                                            }
                                        }
                                    }
                                    if (foundUrl) break;
                                }
                                
                                // Si no se encontró calidad específica, usar la primera
                                if (!foundUrl) {
                                    const firstMatch = qualityMatches[0].match(/"[^"]+":"([^"]+)"/);
                                    if (firstMatch && firstMatch[1]) {
                                        foundUrl = firstMatch[1];
                                    }
                                }
                                
                                directVideoUrl = foundUrl;
                            }
                        } catch (e) {
                            console.error(`Error al parsear datos de video SpankBang: ${e.message}`);
                        }
                    }
                }
            } catch (e) {
                console.error(`Error obteniendo datos de video individual en SpankBang: ${e.message}`);
                directVideoUrl = fullVideoUrl; // Usar URL de la página como fallback
            }
            
            videos.push({
                title,
                author,
                description,
                thumbnail,
                video_url: fullVideoUrl,
                direct_video_url: directVideoUrl || fullVideoUrl,
                duration,
                source: "spankbang"
            });
            
            count++;
        }
        
        if (videos.length === 0) {
            throw new Error("No se encontraron resultados en SpankBang");
        }
        
        return videos;
    } catch (error) {
        console.error("Error buscando en SpankBang:", error);
        throw new Error(`Error en SpankBang: ${error.message}`);
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
                type: sourceConfig[key].type,
                description: sourceConfig[key].description || null
            };
            return obj;
        }, {});
    
    // Incluir también las opciones de selección aleatoria
    const opcionesAleatorias = {
        [SOURCES.RANDOM]: "Cualquier fuente (una sola)",
        [SOURCES.RANDOM_IMG]: "Cualquier fuente de imágenes (una sola)",
        [SOURCES.RANDOM_VID]: "Cualquier fuente de videos (una sola)",
        [SOURCES.RANDOM_MULTI]: "Múltiples fuentes al mismo tiempo (novedad)"
    };
    
    // Incluir clasificaciones disponibles
    const clasificacionesDisponibles = Object.values(CLASIFICACIONES);
    
    // Incluir información sobre tags alternativos
    const tagsAlternativosInfo = Object.keys(TAGS_ALTERNATIVOS).reduce((obj, key) => {
        obj[key] = TAGS_ALTERNATIVOS[key];
        return obj;
    }, {});
    
    return res.json({
        success: true,
        fuentes_disponibles: fuentesActivas,
        opciones_aleatorias: opcionesAleatorias,
        clasificaciones: clasificacionesDisponibles,
        tags_alternativos: tagsAlternativosInfo,
        parametros: {
            tags: "Tags separados por comas (obligatorio)",
            cantidad: "Número de resultados (máx. 10 para imágenes, 5 para videos)",
            fuente: "Fuente específica o aleatoria",
            clasificacion: "Categoría o criterio de orden (nuevo, famoso, etc.)",
            pagina: "Página de resultados (opcional)",
            fallback: "true/false - Usar fuentes alternativas si la principal falla (por defecto: true)",
            multi_fuentes: "true/false - Buscar en múltiples fuentes simultáneamente (por defecto: false)",
            mostrar_errores: "true/false - Mostrar detalles de errores en la respuesta (por defecto: false)"
        },
        ejemplos: [
            "/api/fun/nsfw?tags=anime&cantidad=5&clasificacion=nuevo",
            "/api/fun/nsfw?tags=cosplay&fuente=rule34&clasificacion=famoso",
            "/api/fun/nsfw?tags=amateur&fuente=xvideos&clasificacion=hd",
            "/api/fun/nsfw?tags=furry&fuente=e621",
            "/api/fun/nsfw?tags=cosplay&fuente=random_multi"
        ],
        novedades: [
            "Se agregaron nuevas fuentes: e621, realbooru, tbib, redtube, spankbang",
            "Nueva función de búsqueda multi-fuente con 'random_multi' o 'multi_fuentes=true'",
            "Sistema mejorado de tags alternativos cuando no hay resultados",
            "Nueva clasificación 'furry' para contenido anthro/furry",
            "Mejor selección de fuentes para categorías específicas"
        ]
    });
});

/**
 * Endpoint para obtener stats de funcionamiento
 */
router.get("/stats", async (req, res) => {
    try {
        // Verificar que sea admin (opcional)
        const adminKey = req.query.admin_key || req.headers["admin-key"];
        const isAdmin = adminKey === process.env.ADMIN_KEY;
        
        // Información básica disponible para todos
        const statsBasicos = {
            fuentes_disponibles: Object.keys(sourceConfig).filter(k => sourceConfig[k].enabled).length,
            fuentes_imagen: Object.keys(sourceConfig).filter(k => sourceConfig[k].type === "image" && sourceConfig[k].enabled).length,
            fuentes_video: Object.keys(sourceConfig).filter(k => sourceConfig[k].type === "video" && sourceConfig[k].enabled).length,
            clasificaciones: Object.keys(CLASIFICACIONES).length,
            tags_alternativos: Object.keys(TAGS_ALTERNATIVOS).length
        };
        
        // Si es admin, añadir información detallada
        if (isAdmin) {
            // Contar archivos en directorio de descargas
            let archivosGuardados = 0;
            let espacioUsado = 0;
            
            if (fs.existsSync(CONTENT_DIR)) {
                const archivos = fs.readdirSync(CONTENT_DIR);
                archivosGuardados = archivos.length;
                
                // Calcular espacio usado
                for (const archivo of archivos) {
                    const stats = fs.statSync(path.join(CONTENT_DIR, archivo));
                    espacioUsado += stats.size;
                }
            }
            
            return res.json({
                success: true,
                stats_basicos: statsBasicos,
                stats_detallados: {
                    archivos_guardados: archivosGuardados,
                    espacio_usado: formatBytes(espacioUsado),
                    espacio_usado_bytes: espacioUsado,
                    fuentes_detalle: Object.keys(sourceConfig).map(key => ({
                        nombre: key,
                        tipo: sourceConfig[key].type,
                        habilitado: sourceConfig[key].enabled,
                        prioridad: sourceConfig[key].priority
                    }))
                }
            });
        } else {
            return res.json({
                success: true,
                stats: statsBasicos,
                mensaje: "Para estadísticas detalladas, use el parámetro admin_key"
            });
        }
    } catch (error) {
        console.error("Error obteniendo estadísticas:", error);
        return res.status(500).json({
            error: true,
            mensaje: "Error obteniendo estadísticas",
            detalles: error.message
        });
    }
});

/**
 * Utilidad para formatear tamaños de bytes
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

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
