// api/adult/nsfw/index.js - Versión mejorada con manejo de errores robusto
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

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
    CHOCHOX: "chochox",
    
    // Aleatorio
    RANDOM: "random", // Para buscar en todas aleatoriamente
    RANDOM_IMG: "random_img", // Solo fuentes de imágenes
    RANDOM_VID: "random_vid" // Solo fuentes de videos
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
    },
    [SOURCES.CHOCHOX]: {
        type: "video",
        name: "ChoChoX",
        baseUrl: "https://chochox.com/",
        enabled: false, // Desabilitado por defecto debido a errores 403
        priority: 4
    }
};

// Configuración del cliente HTTP para mejor simulación de navegador
const axiosClient = axios.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Sec-Ch-Ua": '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "Referer": "https://www.google.com/"
    },
    timeout: 10000, // 10 segundos
    maxContentLength: 20 * 1024 * 1024 // 20MB
});

/**
 * Middleware para verificación de edad
 * Requiere un encabezado de verificación o parámetro que indique edad 18+
 */
const verificarEdad = (req, res, next) => {
    // Verificar encabezado o parámetro de consulta de verificación de edad
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

// Aplicar middleware de verificación de edad a todas las rutas
router.use(verificarEdad);

/**
 * Endpoint principal para búsqueda de contenido adulto
 * Parámetros:
 * - cantidad: Número de resultados (por defecto 10, máximo 50)
 * - tags: Tags para buscar, separados por comas
 * - pagina: Página específica (opcional, por defecto aleatorio)
 * - fuente: Fuente específica (rule34, danbooru, etc., random, random_img, random_vid)
 * - mostrar_errores: Si se deben mostrar errores detallados (opcional, por defecto false)
 */
router.get("/", async (req, res) => {
    try {
        const { 
            cantidad = 10, 
            tags, 
            pagina, 
            fuente = "random",
            mostrar_errores = "false",
            fallback = "true"
        } = req.query;
        
        // Validación de parámetros
        if (!tags) {
            return res.status(400).json({
                error: true,
                message: "Se requiere el parámetro 'tags' para realizar la búsqueda",
                ejemplo: "/api/adult/nsfw?tags=tag1,tag2&cantidad=10&fuente=rule34"
            });
        }
        
        // Limitar la cantidad para evitar abusos (máximo 50)
        const cantidadLimitada = Math.min(parseInt(cantidad) || 10, 50);
        
        // Normalizar los tags (eliminar espacios, convertir a minúsculas)
        const tagsList = tags.split(",").map(tag => tag.trim().toLowerCase());
        
        // Determinar la fuente a utilizar
        let fuenteSeleccionada = fuente.toLowerCase();
        
        // Si es random, elegir una fuente aleatoria según el tipo
        if (fuenteSeleccionada === SOURCES.RANDOM || fuenteSeleccionada === SOURCES.RANDOM_IMG || fuenteSeleccionada === SOURCES.RANDOM_VID) {
            let fuentesDisponibles;
            
            if (fuenteSeleccionada === SOURCES.RANDOM_IMG) {
                // Solo fuentes de imágenes
                fuentesDisponibles = Object.keys(sourceConfig).filter(key => 
                    sourceConfig[key].type === "image" && sourceConfig[key].enabled
                );
            } else if (fuenteSeleccionada === SOURCES.RANDOM_VID) {
                // Solo fuentes de videos
                fuentesDisponibles = Object.keys(sourceConfig).filter(key => 
                    sourceConfig[key].type === "video" && sourceConfig[key].enabled
                );
            } else {
                // Todas las fuentes excepto las random
                fuentesDisponibles = Object.keys(sourceConfig).filter(key => 
                    ![SOURCES.RANDOM, SOURCES.RANDOM_IMG, SOURCES.RANDOM_VID].includes(key) && 
                    sourceConfig[key].enabled
                );
            }
            
            // Si no hay fuentes disponibles, devolver error
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
        
        // Verificar si la fuente está habilitada
        if (!sourceConfig[fuenteSeleccionada].enabled) {
            return res.status(503).json({
                error: true,
                message: `La fuente '${fuenteSeleccionada}' está temporalmente deshabilitada`,
                fuentes_alternativas: Object.keys(sourceConfig)
                    .filter(k => sourceConfig[k].enabled && sourceConfig[k].type === sourceConfig[fuenteSeleccionada].type)
            });
        }
        
        // Intentar búsqueda con posible fallback a otras fuentes si falla
        const { resultados, fuente: fuenteUsada, errores } = await buscarContenido(
            fuenteSeleccionada, tagsList, cantidadLimitada, pagina, fallback === "true"
        );
        
        // Si no hay resultados y hay errores, mostrar el último error
        if (resultados.length === 0 && errores.length > 0) {
            const respuestaError = {
                error: true,
                message: "No se encontraron resultados en ninguna fuente",
                fuente_intentada: fuenteSeleccionada,
                fuentes_alternativas: Object.keys(sourceConfig)
                    .filter(k => sourceConfig[k].enabled && k !== fuenteSeleccionada)
            };
            
            // Incluir detalles de errores si se solicita
            if (mostrar_errores === "true") {
                respuestaError.errores = errores;
            }
            
            return res.status(404).json(respuestaError);
        }
        
        // Construir la respuesta exitosa
        const respuesta = {
            success: true,
            fuente: fuenteUsada,
            fuente_original: fuenteSeleccionada !== fuenteUsada ? fuenteSeleccionada : undefined,
            tipo: sourceConfig[fuenteUsada].type,
            tags: tagsList,
            cantidad: resultados.length,
            resultados: resultados
        };
        
        // Incluir errores si se solicita
        if (mostrar_errores === "true" && errores.length > 0) {
            respuesta.errores = errores;
        }
        
        // Devolver resultados
        return res.json(respuesta);
        
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
 * Función principal para buscar contenido con posibilidad de fallback automático
 * @param {String} fuente - Fuente seleccionada
 * @param {Array} tags - Lista de tags
 * @param {Number} cantidad - Cantidad de resultados
 * @param {Number} pagina - Página específica (opcional)
 * @param {Boolean} permitirFallback - Si se debe intentar con fuentes alternativas
 * @returns {Object} - Resultados y fuente utilizada
 */
async function buscarContenido(fuente, tags, cantidad, pagina, permitirFallback = true) {
    const errores = [];
    let resultados = [];
    
    // Función de búsqueda que maneja errores
    async function intentarBusqueda(fuenteActual) {
        try {
            switch (fuenteActual) {
                // Fuentes de imágenes
                case SOURCES.RULE34:
                    return await buscarEnRule34(tags, cantidad, pagina);
                    
                case SOURCES.DANBOORU:
                    return await buscarEnDanbooru(tags, cantidad, pagina);
                    
                case SOURCES.GELBOORU:
                    return await buscarEnGelbooru(tags, cantidad, pagina);
                
                // Fuentes de videos
                case SOURCES.XVIDEOS:
                    return await buscarEnXVideos(tags, cantidad, pagina);
                    
                case SOURCES.PORNHUB:
                    return await buscarEnPornhub(tags, cantidad, pagina);
                    
                case SOURCES.XNXX:
                    return await buscarEnXnxx(tags, cantidad, pagina);
                    
                case SOURCES.CHOCHOX:
                    return await buscarEnChochox(tags, cantidad, pagina);
                    
                default:
                    throw new Error(`Fuente no implementada: ${fuenteActual}`);
            }
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
    
    // Si no hay resultados y se permite fallback, intentar con fuentes alternativas
    if (resultados.length === 0 && permitirFallback) {
        console.log(`Búsqueda en ${fuente} falló, intentando con fuentes alternativas...`);
        
        // Obtener fuentes alternativas del mismo tipo, ordenadas por prioridad
        const tipo = sourceConfig[fuente].type;
        const fuentesAlternativas = Object.keys(sourceConfig)
            .filter(k => 
                sourceConfig[k].enabled && 
                sourceConfig[k].type === tipo && 
                k !== fuente
            )
            .sort((a, b) => sourceConfig[a].priority - sourceConfig[b].priority);
        
        // Intentar cada fuente alternativa hasta encontrar resultados
        for (const fuenteAlternativa of fuentesAlternativas) {
            console.log(`Intentando con fuente alternativa: ${fuenteAlternativa}`);
            
            resultados = await intentarBusqueda(fuenteAlternativa);
            
            if (resultados.length > 0) {
                console.log(`Éxito con fuente alternativa: ${fuenteAlternativa}`);
                return { resultados, fuente: fuenteAlternativa, errores };
            }
        }
    }
    
    // Devolver resultados con la fuente original
    return { resultados, fuente, errores };
}

/**
 * Buscar en Rule34.xxx
 * @param {Array} tags - Lista de tags
 * @param {Number} cantidad - Cantidad de resultados
 * @param {Number} pagina - Página específica (opcional)
 */
async function buscarEnRule34(tags, cantidad, pagina) {
    try {
        // Formatear tags para Rule34
        const tagsStr = tags.join("+");
        
        // Determinar la página
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10); // Si no se especifica, elegir una aleatoria entre 0 y 9
        
        // Construir URL de búsqueda (usando su API XML o JSON si está disponible)
        const searchUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}`;
        
        // Realizar petición
        const response = await axiosClient.get(searchUrl);
        
        // Verificar si la respuesta es válida
        if (!response.data) {
            throw new Error("Respuesta vacía de Rule34");
        }
        
        // Procesar respuesta XML usando cheerio
        const $ = cheerio.load(response.data, { xmlMode: true });
        
        // Extraer información de posts
        const posts = [];
        $("post").each(function() {
            const post = {
                id: $(this).attr("id"),
                tags: $(this).attr("tags").split(" "),
                source: $(this).attr("source") || null,
                score: parseInt($(this).attr("score")),
                file_url: $(this).attr("file_url"),
                preview_url: $(this).attr("preview_url"),
                sample_url: $(this).attr("sample_url") || null,
                width: parseInt($(this).attr("width")),
                height: parseInt($(this).attr("height")),
                rating: $(this).attr("rating"),
                created_at: $(this).attr("created_at"),
                type: $(this).attr("file_url").split('.').pop().toLowerCase(),
                content_type: "image"
            };
            
            posts.push(post);
        });
        
        // Si no hay resultados, lanzar error
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
 * Buscar en Danbooru
 * @param {Array} tags - Lista de tags
 * @param {Number} cantidad - Cantidad de resultados
 * @param {Number} pagina - Página específica (opcional)
 */
async function buscarEnDanbooru(tags, cantidad, pagina) {
    try {
        // Formatear tags para Danbooru (máximo 2 tags en la versión gratuita)
        const tagsLimitados = tags.slice(0, 2);
        const tagsStr = tagsLimitados.join("+");
        
        // Determinar la página
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10) + 1;
        
        // Construir URL de búsqueda (usando su API JSON)
        const searchUrl = `https://danbooru.donmai.us/posts.json?tags=${tagsStr}&limit=${cantidad}&page=${page}`;
        
        // Realizar petición
        const response = await axiosClient.get(searchUrl);
        
        // Verificar si la respuesta es válida
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
            throw new Error("No se encontraron resultados en Danbooru");
        }
        
        // Procesar respuesta JSON
        const posts = response.data.map(post => ({
            id: post.id,
            tags: (post.tag_string || "").split(" "),
            source: post.source || null,
            score: post.score,
            file_url: post.file_url,
            preview_url: post.preview_file_url,
            sample_url: post.large_file_url || null,
            width: post.image_width,
            height: post.image_height,
            rating: post.rating,
            created_at: post.created_at,
            type: post.file_ext,
            content_type: "image"
        })).filter(post => post.file_url); // Filtrar posts sin URL de archivo
        
        // Si no hay resultados después del filtrado, lanzar error
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
 * Buscar en Gelbooru
 * @param {Array} tags - Lista de tags
 * @param {Number} cantidad - Cantidad de resultados
 * @param {Number} pagina - Página específica (opcional)
 */
async function buscarEnGelbooru(tags, cantidad, pagina) {
    try {
        // Formatear tags para Gelbooru
        const tagsStr = tags.join("+");
        
        // Determinar la página
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10);
        
        // Construir URL de búsqueda (usando su API XML o JSON si está disponible)
        const searchUrl = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=${tagsStr}&limit=${cantidad}&pid=${page}&json=1`;
        
        // Realizar petición
        const response = await axiosClient.get(searchUrl);
        
        // Verificar si la respuesta es válida
        if (!response.data || !response.data.post || !Array.isArray(response.data.post) || response.data.post.length === 0) {
            throw new Error("No se encontraron resultados en Gelbooru");
        }
        
        // Procesar respuesta JSON
        const posts = response.data.post.map(post => ({
            id: post.id,
            tags: (post.tags || "").split(" "),
            source: post.source || null,
            score: post.score,
            file_url: post.file_url,
            preview_url: post.preview_url,
            sample_url: post.sample_url || null,
            width: post.width,
            height: post.height,
            rating: post.rating,
            created_at: post.created_at,
            type: post.file_url.split('.').pop().toLowerCase(),
            content_type: "image"
        }));
        
        return posts;
    } catch (error) {
        console.error("Error buscando en Gelbooru:", error);
        throw new Error(`Error en Gelbooru: ${error.message}`);
    }
}

/**
 * Buscar en XVideos
 * @param {Array} tags - Lista de tags
 * @param {Number} cantidad - Cantidad de resultados
 * @param {Number} pagina - Página específica (opcional)
 */
async function buscarEnXVideos(tags, cantidad, pagina) {
    try {
        // Formatear tags para XVideos (usa + para separar)
        const tagsStr = tags.join("+");
        
        // Determinar la página
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10) + 1;
        
        // Construir URL de búsqueda
        const searchUrl = `https://www.xvideos.com/?k=${tagsStr}&p=${page}`;
        
        // Configurar cookies para verificación de edad
        const cookieHeader = {
            Cookie: "age_verified=1; gdpr_registered=1"
        };
        
        // Realizar petición
        const response = await axiosClient.get(searchUrl, { headers: { ...axiosClient.defaults.headers, ...cookieHeader } });
        
        // Verificar si la respuesta es válida
        if (!response.data) {
            throw new Error("Respuesta vacía de XVideos");
        }
        
        // Procesar HTML con cheerio
        const $ = cheerio.load(response.data);
        
        // Extraer resultados de videos
        const videos = [];
        const videoElements = $(".mozaique .thumb-block");
        
        videoElements.each(function(index) {
            if (index >= cantidad) return false; // Limitar la cantidad de resultados
            
            const thumbElement = $(this);
            
            // Datos básicos del video
            let id = "";
            const linkElem = thumbElement.find("a");
            if (linkElem.attr("href")) {
                const matches = linkElem.attr("href").match(/\/video(\d+)\//);
                id = matches ? matches[1] : "";
            }
            
            const title = thumbElement.find(".title a").text().trim();
            const duration = thumbElement.find(".duration").text().trim();
            const thumbnail = thumbElement.find("img").attr("data-src") || thumbElement.find("img").attr("src");
            const videoUrl = "https://www.xvideos.com" + thumbElement.find("a").attr("href");
            
            // Información adicional
            const views = thumbElement.find(".views").text().trim();
            const rating = thumbElement.find(".rating").text().trim();
            
            videos.push({
                id,
                title,
                duration,
                thumbnail,
                video_url: videoUrl,
                views,
                rating,
                source: "xvideos",
                type: "mp4",
                content_type: "video"
            });
        });
        
        // Si no hay resultados, lanzar error
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
 * Buscar en Pornhub
 * @param {Array} tags - Lista de tags
 * @param {Number} cantidad - Cantidad de resultados
 * @param {Number} pagina - Página específica (opcional)
 */
async function buscarEnPornhub(tags, cantidad, pagina) {
    try {
        // Formatear tags para Pornhub (usa + para separar)
        const tagsStr = tags.join("+");
        
        // Determinar la página
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10) + 1;
        
        // Construir URL de búsqueda
        const searchUrl = `https://www.pornhub.com/video/search?search=${tagsStr}&page=${page}`;
        
        // Configurar cookies para verificación de edad
        const cookieHeader = {
            Cookie: "age_verified=1; gdpr_registered=1"
        };
        
        // Realizar petición
        const response = await axiosClient.get(searchUrl, { headers: { ...axiosClient.defaults.headers, ...cookieHeader } });
        
        // Verificar si la respuesta es válida
        if (!response.data) {
            throw new Error("Respuesta vacía de Pornhub");
        }
        
        // Procesar HTML con cheerio
        const $ = cheerio.load(response.data);
        
        // Extraer resultados de videos
        const videos = [];
        const videoElements = $(".videoBox");
        
        videoElements.each(function(index) {
            if (index >= cantidad) return false; // Limitar la cantidad de resultados
            
            const videoElement = $(this);
            
            // Datos básicos del video
            const id = videoElement.attr("data-id") || "";
            const title = videoElement.find(".title a").text().trim();
            const duration = videoElement.find(".duration").text().trim();
            const thumbnail = videoElement.find("img").data("src") || videoElement.find("img").attr("src") || "";
            const videoUrl = "https://www.pornhub.com" + videoElement.find(".title a").attr("href");
            
            // Información adicional
            const views = videoElement.find(".views").text().trim();
            const rating = videoElement.find(".rating-container .value").text().trim();
            
            videos.push({
                id,
                title,
                duration,
                thumbnail,
                video_url: videoUrl,
                views,
                rating: rating || "N/A",
                source: "pornhub",
                type: "mp4",
                content_type: "video"
            });
        });
        
        // Si no hay resultados, lanzar error
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
 * Buscar en XNXX
 * @param {Array} tags - Lista de tags
 * @param {Number} cantidad - Cantidad de resultados
 * @param {Number} pagina - Página específica (opcional)
 */
async function buscarEnXnxx(tags, cantidad, pagina) {
    try {
        // Formatear tags para XNXX (usa + para separar)
        const tagsStr = tags.join("+");
        
        // Determinar la página
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10) + 1;
        
        // Construir URL de búsqueda
        const searchUrl = `https://www.xnxx.com/search/${tagsStr}/${page}`;
        
        // Configurar cookies para verificación de edad
        const cookieHeader = {
            Cookie: "age_verified=1; gdpr_registered=1"
        };
        
        // Realizar petición
        const response = await axiosClient.get(searchUrl, { headers: { ...axiosClient.defaults.headers, ...cookieHeader } });
        
        // Verificar si la respuesta es válida
        if (!response.data) {
            throw new Error("Respuesta vacía de XNXX");
        }
        
        // Procesar HTML con cheerio
        const $ = cheerio.load(response.data);
        
        // Extraer resultados de videos
        const videos = [];
        const videoElements = $(".mozaique .thumb-block");
        
        videoElements.each(function(index) {
            if (index >= cantidad) return false; // Limitar la cantidad de resultados
            
            const thumbElement = $(this);
            
            // Datos básicos del video
            let id = "";
            const linkElem = thumbElement.find("a");
            if (linkElem.attr("href")) {
                const matches = linkElem.attr("href").match(/\/video(\w+)\//);
                id = matches ? matches[1] : "";
            }
            
            const title = thumbElement.find(".title a").text().trim();
            const duration = thumbElement.find(".duration").text().trim();
            const thumbnail = thumbElement.find("img").data("src") || thumbElement.find("img").attr("src") || "";
            const videoUrl = "https://www.xnxx.com" + thumbElement.find("a").attr("href");
            
            // Información adicional
            const views = thumbElement.find(".metadata").text().trim();
            
            videos.push({
                id,
                title,
                duration,
                thumbnail,
                video_url: videoUrl,
                views,
                source: "xnxx",
                type: "mp4",
                content_type: "video"
            });
        });
        
        // Si no hay resultados, lanzar error
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
 * Buscar en ChoChoX
 * @param {Array} tags - Lista de tags
 * @param {Number} cantidad - Cantidad de resultados
 * @param {Number} pagina - Página específica (opcional)
 */
async function buscarEnChochox(tags, cantidad, pagina) {
    try {
        // Formatear tags para ChoChoX (usa - para separar)
        const tagsStr = tags.join("-");
        
        // Determinar la página
        const page = pagina ? parseInt(pagina) : Math.floor(Math.random() * 10) + 1;
        
        // Construir URL de búsqueda
        const searchUrl = `https://chochox.com/search/${tagsStr}/page/${page}/`;
        
        // Configurar un User-Agent más específico para este sitio
        const customHeaders = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
            "Referer": "https://www.google.com/"
        };
        
        // Realizar petición
        const response = await axiosClient.get(searchUrl, { headers: { ...axiosClient.defaults.headers, ...customHeaders } });
        
        // Verificar si la respuesta es válida
        if (!response.data) {
            throw new Error("Respuesta vacía de ChoChoX");
        }
        
        // Procesar HTML con cheerio
        const $ = cheerio.load(response.data);
        
        // Extraer resultados de videos
        const videos = [];
        const videoElements = $(".video-item");
        
        videoElements.each(function(index) {
            if (index >= cantidad) return false; // Limitar la cantidad de resultados
            
            const videoElement = $(this);
            
            // Datos básicos del video
            const title = videoElement.find(".title a").text().trim();
            const duration = videoElement.find(".duration").text().trim();
            const thumbnail = videoElement.find("img").attr("src") || videoElement.find("img").attr("data-original") || "";
            const videoUrl = videoElement.find(".title a").attr("href");
            
            // Extraer ID del vídeo de la URL
            const id = videoUrl ? videoUrl.split('/').filter(Boolean).pop() || "" : "";
            
            // Información adicional
            const views = videoElement.find(".views").text().trim();
            
            videos.push({
                id,
                title,
                duration,
                thumbnail,
                video_url: videoUrl,
                views,
                source: "chochox",
                type: "mp4",
                content_type: "video"
            });
        });
        
        // Si no hay resultados, lanzar error
        if (videos.length === 0) {
            throw new Error("No se encontraron resultados en ChoChoX");
        }
        
        return videos;
    } catch (error) {
        console.error("Error buscando en ChoChoX:", error);
        throw new Error(`Error en ChoChoX: ${error.message}`);
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
                baseUrl: sourceConfig[key].baseUrl,
                priority: sourceConfig[key].priority
            };
            return obj;
        }, {});
    
    // Incluir también las opciones de selección aleatoria
    const opcionesAleatorias = {
        [SOURCES.RANDOM]: "Selecciona aleatoriamente entre todas las fuentes",
        [SOURCES.RANDOM_IMG]: "Selecciona aleatoriamente entre fuentes de imágenes",
        [SOURCES.RANDOM_VID]: "Selecciona aleatoriamente entre fuentes de videos"
    };
    
    return res.json({
        success: true,
        fuentes_disponibles: fuentesActivas,
        opciones_aleatorias: opcionesAleatorias,
        descripcion: "Lista de fuentes disponibles para búsqueda de contenido NSFW"
    });
});

// ADVERTENCIA: Esta API es para uso exclusivo de adultos mayores de 18 años.

module.exports = router;
