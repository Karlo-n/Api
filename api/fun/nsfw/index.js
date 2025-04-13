// api/adult/nsfw/index.js
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
 * - fuente: Fuente específica (rule34, danbooru, gelbooru, random)
 */
router.get("/", async (req, res) => {
    try {
        const { cantidad = 10, tags, pagina, fuente = "random" } = req.query;
        
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
                fuentesDisponibles = [SOURCES.RULE34, SOURCES.DANBOORU, SOURCES.GELBOORU];
            } else if (fuenteSeleccionada === SOURCES.RANDOM_VID) {
                // Solo fuentes de videos
                fuentesDisponibles = [SOURCES.XVIDEOS, SOURCES.PORNHUB, SOURCES.XNXX, SOURCES.CHOCHOX];
            } else {
                // Todas las fuentes excepto las random
                fuentesDisponibles = Object.values(SOURCES).filter(f => 
                    ![SOURCES.RANDOM, SOURCES.RANDOM_IMG, SOURCES.RANDOM_VID].includes(f)
                );
            }
            
            fuenteSeleccionada = fuentesDisponibles[Math.floor(Math.random() * fuentesDisponibles.length)];
        }
        
        // Verificar si la fuente es válida
        if (!Object.values(SOURCES).includes(fuenteSeleccionada)) {
            return res.status(400).json({
                error: true,
                message: "Fuente no válida",
                fuentes_validas: Object.values(SOURCES)
            });
        }
        
        // Realizar la búsqueda según la fuente seleccionada
        let resultados;
        switch (fuenteSeleccionada) {
            // Fuentes de imágenes
            case SOURCES.RULE34:
                resultados = await buscarEnRule34(tagsList, cantidadLimitada, pagina);
                break;
                
            case SOURCES.DANBOORU:
                resultados = await buscarEnDanbooru(tagsList, cantidadLimitada, pagina);
                break;
                
            case SOURCES.GELBOORU:
                resultados = await buscarEnGelbooru(tagsList, cantidadLimitada, pagina);
                break;
            
            // Fuentes de videos
            case SOURCES.XVIDEOS:
                resultados = await buscarEnXVideos(tagsList, cantidadLimitada, pagina);
                break;
                
            case SOURCES.PORNHUB:
                resultados = await buscarEnPornhub(tagsList, cantidadLimitada, pagina);
                break;
                
            case SOURCES.XNXX:
                resultados = await buscarEnXnxx(tagsList, cantidadLimitada, pagina);
                break;
                
            case SOURCES.CHOCHOX:
                resultados = await buscarEnChochox(tagsList, cantidadLimitada, pagina);
                break;
                
            default:
                return res.status(400).json({
                    error: true,
                    message: "Fuente no implementada"
                });
        }
        
        // Devolver resultados
        return res.json({
            success: true,
            fuente: fuenteSeleccionada,
            tags: tagsList,
            cantidad: resultados.length,
            resultados: resultados
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
        const response = await axios.get(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        
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
                type: $(this).attr("file_url").split('.').pop().toLowerCase()
            };
            
            posts.push(post);
        });
        
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
        const response = await axios.get(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        
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
            type: post.file_ext
        }));
        
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
        const response = await axios.get(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        
        // Procesar respuesta JSON
        if (response.data && response.data.post) {
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
                type: post.file_url.split('.').pop().toLowerCase()
            }));
            
            return posts;
        }
        
        return [];
    } catch (error) {
        console.error("Error buscando en Gelbooru:", error);
        throw new Error(`Error en Gelbooru: ${error.message}`);
    }
}

/**
 * Endpoint para obtener información sobre las fuentes disponibles
 */
router.get("/fuentes", (req, res) => {
    return res.json({
        success: true,
        fuentes_disponibles: Object.values(SOURCES),
        descripcion: "Lista de fuentes disponibles para búsqueda de contenido NSFW"
    });
});

/**
 * Endpoint para obtener tags populares de una fuente específica
 */
router.get("/tags-populares", async (req, res) => {
    try {
        const { fuente = SOURCES.RULE34 } = req.query;
        
        // Verificar si la fuente es válida
        if (!Object.values(SOURCES).includes(fuente) || fuente === SOURCES.RANDOM) {
            return res.status(400).json({
                error: true,
                message: "Fuente no válida o no se puede usar 'random' para esta función",
                fuentes_validas: Object.values(SOURCES).filter(f => f !== SOURCES.RANDOM)
            });
        }
        
        // Obtener tags populares según la fuente
        let tagsList;
        switch (fuente) {
            // Fuentes de imágenes
            case SOURCES.RULE34:
                tagsList = await obtenerTagsPopularesRule34();
                break;
                
            case SOURCES.DANBOORU:
                tagsList = await obtenerTagsPopularesDanbooru();
                break;
                
            case SOURCES.GELBOORU:
                tagsList = await obtenerTagsPopularesGelbooru();
                break;
            
            // Fuentes de videos
            case SOURCES.XVIDEOS:
                tagsList = await obtenerTagsPopularesXVideos();
                break;
                
            case SOURCES.PORNHUB:
                tagsList = await obtenerTagsPopularesPornhub();
                break;
                
            case SOURCES.XNXX:
                tagsList = await obtenerTagsPopularesXnxx();
                break;
                
            case SOURCES.CHOCHOX:
                tagsList = await obtenerTagsPopularesChochox();
                break;
                
            default:
                return res.status(400).json({
                    error: true,
                    message: "Fuente no implementada para obtención de tags populares"
                });
        }
        
        return res.json({
            success: true,
            fuente: fuente,
            cantidad: tagsList.length,
            tags: tagsList
        });
        
    } catch (error) {
        console.error("Error obteniendo tags populares:", error);
        return res.status(500).json({
            error: true,
            message: "Error al obtener tags populares",
            detalles: error.message
        });
    }
});

/**
 * Obtener tags populares de Rule34
 */
async function obtenerTagsPopularesRule34() {
    try {
        // Realizar petición a la página de tags populares
        const response = await axios.get("https://rule34.xxx/index.php?page=tags&s=list&sort=count&order=desc", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        
        // Procesar HTML usando cheerio
        const $ = cheerio.load(response.data);
        
        // Extraer tags populares
        const tags = [];
        $("table.highlightable tr").each(function(index) {
            if (index > 0) { // Saltar la fila de encabezado
                const tagName = $(this).find("td:nth-child(2)").text().trim();
                const tagCount = parseInt($(this).find("td:nth-child(3)").text().trim().replace(",", ""));
                
                if (tagName && tagCount) {
                    tags.push({
                        name: tagName,
                        count: tagCount
                    });
                }
            }
        });
        
        return tags.slice(0, 50); // Devolver los 50 más populares
    } catch (error) {
        console.error("Error obteniendo tags populares de Rule34:", error);
        return [];
    }
}

/**
 * Obtener tags populares de Danbooru
 */
async function obtenerTagsPopularesDanbooru() {
    try {
        // Realizar petición a la API de tags
        const response = await axios.get("https://danbooru.donmai.us/tags.json?search[order]=count&limit=50", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        
        // Procesar respuesta JSON
        return response.data.map(tag => ({
            name: tag.name,
            count: tag.post_count
        }));
    } catch (error) {
        console.error("Error obteniendo tags populares de Danbooru:", error);
        return [];
    }
}

/**
 * Obtener tags populares de Gelbooru
 */
async function obtenerTagsPopularesGelbooru() {
    try {
        // Realizar petición a la página de tags populares
        const response = await axios.get("https://gelbooru.com/index.php?page=tags&s=list&sort=count&order=desc", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        
        // Procesar HTML usando cheerio
        const $ = cheerio.load(response.data);
        
        // Extraer tags populares
        const tags = [];
        $("table.highlightable tr").each(function(index) {
            if (index > 0) { // Saltar la fila de encabezado
                const tagName = $(this).find("td:nth-child(2)").text().trim();
                const tagCount = parseInt($(this).find("td:nth-child(3)").text().trim().replace(",", ""));
                
                if (tagName && tagCount) {
                    tags.push({
                        name: tagName,
                        count: tagCount
                    });
                }
            }
        });
        
        return tags.slice(0, 50); // Devolver los 50 más populares
    } catch (error) {
        console.error("Error obteniendo tags populares de Gelbooru:", error);
        return [];
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
        
        // Realizar petición
        const response = await axios.get(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Cookie": "age_verified=1" // Cookie para verificación de edad
            }
        });
        
        // Procesar HTML con cheerio
        const $ = cheerio.load(response.data);
        
        // Extraer resultados de videos
        const videos = [];
        const videoElements = $(".mozaique .thumb-block");
        
        videoElements.each(function(index) {
            if (index >= cantidad) return false; // Limitar la cantidad de resultados
            
            const thumbElement = $(this);
            
            // Datos básicos del video
            const id = thumbElement.attr("data-id") || thumbElement.find("a").attr("href").split("/")[1];
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
                type: "video"
            });
        });
        
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
        
        // Realizar petición
        const response = await axios.get(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Cookie": "age_verified=1" // Cookie para verificación de edad
            }
        });
        
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
                type: "video"
            });
        });
        
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
        
        // Realizar petición
        const response = await axios.get(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Cookie": "age_verified=1" // Cookie para verificación de edad
            }
        });
        
        // Procesar HTML con cheerio
        const $ = cheerio.load(response.data);
        
        // Extraer resultados de videos
        const videos = [];
        const videoElements = $(".mozaique .thumb-block");
        
        videoElements.each(function(index) {
            if (index >= cantidad) return false; // Limitar la cantidad de resultados
            
            const thumbElement = $(this);
            
            // Datos básicos del video
            const id = thumbElement.attr("data-id") || "";
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
                type: "video"
            });
        });
        
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
        
        // Realizar petición
        const response = await axios.get(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        
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
            const id = videoUrl.split('/').filter(Boolean).pop() || "";
            
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
                type: "video"
            });
        });
        
        return videos;
    } catch (error) {
        console.error("Error buscando en ChoChoX:", error);
        throw new Error(`Error en ChoChoX: ${error.message}`);
    }
}

/**
 * Obtener tags populares de XVideos
 */
async function obtenerTagsPopularesXVideos() {
    try {
        // Realizar petición a la página principal
        const response = await axios.get("https://www.xvideos.com/tags", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Cookie": "age_verified=1" // Cookie para verificación de edad
            }
        });
        
        // Procesar HTML usando cheerio
        const $ = cheerio.load(response.data);
        
        // Extraer tags populares
        const tags = [];
        $(".tags-list-col a").each(function() {
            const tag = $(this);
            const name = tag.text().trim();
            // La cantidad de videos viene generalmente entre paréntesis
            const countMatch = name.match(/\(([0-9,]+)\)/);
            
            if (name && name !== "") {
                tags.push({
                    name: name.replace(/\([0-9,]+\)/g, "").trim(),
                    count: countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0,
                    url: "https://www.xvideos.com" + tag.attr("href")
                });
            }
        });
        
        return tags.slice(0, 50); // Devolver los 50 más populares
    } catch (error) {
        console.error("Error obteniendo tags populares de XVideos:", error);
        return [];
    }
}

/**
 * Obtener tags populares de Pornhub
 */
async function obtenerTagsPopularesPornhub() {
    try {
        // Realizar petición a la página de categorías
        const response = await axios.get("https://www.pornhub.com/categories", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Cookie": "age_verified=1" // Cookie para verificación de edad
            }
        });
        
        // Procesar HTML usando cheerio
        const $ = cheerio.load(response.data);
        
        // Extraer tags populares (categorías)
        const tags = [];
        $(".categoriesWrapper .category-wrapper").each(function() {
            const categoryBox = $(this);
            const name = categoryBox.find(".category-title").text().trim();
            const count = categoryBox.find(".videosNumber").text().trim();
            const url = "https://www.pornhub.com" + categoryBox.find("a").attr("href");
            
            if (name && name !== "") {
                tags.push({
                    name: name,
                    count: parseInt(count.replace(/[^0-9]/g, "")) || 0,
                    url: url
                });
            }
        });
        
        return tags; // Devolver las categorías encontradas
    } catch (error) {
        console.error("Error obteniendo tags populares de Pornhub:", error);
        return [];
    }
}

/**
 * Obtener tags populares de XNXX
 */
async function obtenerTagsPopularesXnxx() {
    try {
        // Realizar petición a la página de tags
        const response = await axios.get("https://www.xnxx.com/tags", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Cookie": "age_verified=1" // Cookie para verificación de edad
            }
        });
        
        // Procesar HTML usando cheerio
        const $ = cheerio.load(response.data);
        
        // Extraer tags populares
        const tags = [];
        $(".tags-list li a").each(function() {
            const tag = $(this);
            const name = tag.text().trim();
            // La cantidad de videos viene generalmente entre paréntesis
            const countMatch = name.match(/\(([0-9,]+)\)/);
            
            if (name && name !== "") {
                tags.push({
                    name: name.replace(/\([0-9,]+\)/g, "").trim(),
                    count: countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0,
                    url: "https://www.xnxx.com" + tag.attr("href")
                });
            }
        });
        
        return tags.slice(0, 50); // Devolver los 50 más populares
    } catch (error) {
        console.error("Error obteniendo tags populares de XNXX:", error);
        return [];
    }
}

/**
 * Obtener tags populares de ChoChoX
 */
async function obtenerTagsPopularesChochox() {
    try {
        // Realizar petición a la página principal donde suelen estar las categorías
        const response = await axios.get("https://chochox.com/categorias/", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        
        // Procesar HTML usando cheerio
        const $ = cheerio.load(response.data);
        
        // Extraer tags populares (categorías)
        const tags = [];
        $(".cat-item").each(function() {
            const category = $(this);
            const link = category.find("a");
            const name = link.text().trim();
            // Si hay un contador de videos, lo extraemos
            const countText = category.text().match(/\(([0-9,]+)\)/);
            
            if (name && name !== "") {
                tags.push({
                    name: name.replace(/\([0-9,]+\)/g, "").trim(),
                    count: countText ? parseInt(countText[1].replace(/,/g, "")) : 0,
                    url: link.attr("href")
                });
            }
        });
        
        return tags; // Devolver las categorías encontradas
    } catch (error) {
        console.error("Error obteniendo tags populares de ChoChoX:", error);
        return [];
    }
}

// ADVERTENCIA: Esta API es para uso exclusivo de adultos mayores de 18 años.

module.exports = router;
