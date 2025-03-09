// api/fun/trivia/index.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

/**
 * API TRIVIA GENERATOR - Genera preguntas de trivia en diversas categorías
 */

// Categorías disponibles
const CATEGORIAS = {
    ANIME: "anime",
    VIDEOJUEGOS: "videojuegos",
    PELICULAS: "peliculas",
    SERIES: "series",
    CIENCIA: "ciencia",
    HISTORIA: "historia",
    GEOGRAFIA: "geografia",
    MUSICA: "musica",
    DEPORTES: "deportes",
    TECNOLOGIA: "tecnologia",
    ARTE: "arte",
    LITERATURA: "literatura",
    MITOLOGIA: "mitologia",
    GASTRONOMIA: "gastronomia",
    ASTRONOMIA: "astronomia",
    BIOLOGIA: "biologia",
    MATEMATICAS: "matematicas",
    CULTURA_POP: "cultura_pop",
    IDIOMAS: "idiomas",
    FILOSOFIA: "filosofia",
    RANDOM: "random"  // Categoría especial: cualquier tema
};

// Dificultades disponibles
const DIFICULTADES = {
    FACIL: "facil",
    MEDIO: "medio",
    DIFICIL: "dificil",
    EXPERTO: "experto",
    RANDOM: "random"  // Dificultad aleatoria
};

// Tipos de preguntas
const TIPOS = {
    OPCION_MULTIPLE: "opcion_multiple",
    VERDADERO_FALSO: "verdadero_falso",
    RANDOM: "random"  // Tipo aleatorio
};

// Ubicación de la imagen de trivia
const TRIVIA_IMAGEN = "trivia.png";

// Caché para evitar repetición de preguntas por sesión/usuario
const preguntasUsadas = {};
const cachePreguntas = {};

/**
 * Endpoint principal de la API de Trivia
 * Genera una pregunta de trivia según los parámetros dados
 */
router.get("/", async (req, res) => {
    try {
        const { categoria, dificultad, tipo, usuario_id } = req.query;
        
        // Validar parámetros
        if (!validarParametros(categoria, dificultad, tipo)) {
            return res.status(400).json({
                error: "Parámetros inválidos",
                ejemplo: "/api/fun/trivia?categoria=anime&dificultad=medio&tipo=opcion_multiple",
                categorias_disponibles: Object.values(CATEGORIAS),
                dificultades_disponibles: Object.values(DIFICULTADES),
                tipos_disponibles: Object.values(TIPOS)
            });
        }
        
        // Convertir parámetros a valores normalizados
        const categoriaFinal = normalizarCategoria(categoria);
        const dificultadFinal = normalizarDificultad(dificultad);
        const tipoFinal = normalizarTipo(tipo);
        
        // Obtener una pregunta según los criterios
        const pregunta = await obtenerPregunta(categoriaFinal, dificultadFinal, tipoFinal, usuario_id);
        
        if (!pregunta) {
            return res.status(404).json({
                error: "No se encontraron preguntas disponibles con los criterios especificados",
                sugerencia: "Intenta con diferentes parámetros o categorías"
            });
        }
        
        // Formatear respuesta según sea opción múltiple o verdadero/falso
        const respuestaFormateada = formatearRespuesta(pregunta);
        
        // Enviar respuesta
        res.json(respuestaFormateada);
        
    } catch (error) {
        console.error("Error en API de Trivia:", error);
        res.status(500).json({
            error: "Error al generar pregunta de trivia",
            detalle: error.message
        });
    }
});

/**
 * Endpoint de información - Muestra datos sobre la API
 */
router.get("/info", (req, res) => {
    res.json({
        nombre: "API de Trivia - Generador de Preguntas con IA",
        endpoints: {
            principal: "/api/fun/trivia?categoria=CATEGORIA&dificultad=DIFICULTAD&tipo=TIPO",
            info: "/api/fun/trivia/info",
            categorias: "/api/fun/trivia/categorias"
        },
        categorias_disponibles: Object.values(CATEGORIAS).filter(c => c !== CATEGORIAS.RANDOM),
        dificultades_disponibles: Object.values(DIFICULTADES).filter(d => d !== DIFICULTADES.RANDOM),
        tipos_disponibles: Object.values(TIPOS).filter(t => t !== TIPOS.RANDOM),
        funcionamiento: "Preguntas generadas con IA mediante DeepSeek"
    });
});

/**
 * Endpoint para listar categorías disponibles
 */
router.get("/categorias", (req, res) => {
    res.json({
        categorias: Object.values(CATEGORIAS).filter(cat => cat !== CATEGORIAS.RANDOM)
    });
});

// FUNCIONES DE UTILIDAD

/**
 * Valida los parámetros de la solicitud
 */
function validarParametros(categoria, dificultad, tipo) {
    // Si no se proporciona ningún parámetro, al menos necesitamos uno válido
    if (!categoria && !dificultad && !tipo) {
        return true; // Permitir consulta sin parámetros para obtener pregunta aleatoria
    }
    
    // Si se proporciona categoría, validar
    if (categoria && !esValorValido(categoria, CATEGORIAS)) {
        return false;
    }
    
    // Si se proporciona dificultad, validar
    if (dificultad && !esValorValido(dificultad, DIFICULTADES)) {
        return false;
    }
    
    // Si se proporciona tipo, validar
    if (tipo && !esValorValido(tipo, TIPOS)) {
        return false;
    }
    
    return true;
}

/**
 * Verifica si un valor es válido según un conjunto de constantes
 */
function esValorValido(valor, constantes) {
    const valoresValidos = Object.values(constantes);
    return valoresValidos.includes(valor.toLowerCase());
}

/**
 * Normaliza la categoría especificada, o devuelve una aleatoria si es "random"
 */
function normalizarCategoria(categoria) {
    if (!categoria) {
        return CATEGORIAS.RANDOM;
    }
    
    const categoriaNormalizada = categoria.toLowerCase();
    
    if (categoriaNormalizada === CATEGORIAS.RANDOM) {
        const categorias = Object.values(CATEGORIAS).filter(c => c !== CATEGORIAS.RANDOM);
        return categorias[Math.floor(Math.random() * categorias.length)];
    }
    
    return categoriaNormalizada;
}

/**
 * Normaliza la dificultad especificada, o devuelve una aleatoria si es "random"
 */
function normalizarDificultad(dificultad) {
    if (!dificultad) {
        return DIFICULTADES.FACIL; // Default a fácil si no se especifica
    }
    
    const dificultadNormalizada = dificultad.toLowerCase();
    
    if (dificultadNormalizada === DIFICULTADES.RANDOM) {
        const dificultades = Object.values(DIFICULTADES).filter(d => d !== DIFICULTADES.RANDOM);
        return dificultades[Math.floor(Math.random() * dificultades.length)];
    }
    
    return dificultadNormalizada;
}

/**
 * Normaliza el tipo especificado, o devuelve uno aleatorio si es "random"
 */
function normalizarTipo(tipo) {
    if (!tipo) {
        return TIPOS.OPCION_MULTIPLE; // Default a opción múltiple si no se especifica
    }
    
    const tipoNormalizado = tipo.toLowerCase();
    
    if (tipoNormalizado === TIPOS.RANDOM) {
        const tipos = Object.values(TIPOS).filter(t => t !== TIPOS.RANDOM);
        return tipos[Math.floor(Math.random() * tipos.length)];
    }
    
    return tipoNormalizado;
}

/**
 * Obtiene una pregunta según los criterios especificados usando DeepSeek AI
 */
async function obtenerPregunta(categoria, dificultad, tipo, usuario_id) {
    const cacheKey = `${categoria}-${dificultad}-${tipo}`;
    
    // Verificar si tenemos preguntas en caché para esta combinación
    if (!cachePreguntas[cacheKey] || cachePreguntas[cacheKey].length === 0) {
        try {
            // Generar preguntas con DeepSeek
            await cargarPreguntasDesdeDeepseek(categoria, dificultad, tipo, cacheKey);
        } catch (error) {
            console.error("Error al obtener preguntas desde DeepSeek:", error);
            return null;
        }
    }
    
    // Si hay ID de usuario, evitar preguntas ya usadas
    if (usuario_id && cachePreguntas[cacheKey]) {
        // Inicializar seguimiento para este usuario si no existe
        if (!preguntasUsadas[usuario_id]) {
            preguntasUsadas[usuario_id] = new Set();
        }
        
        // Buscar pregunta no usada
        for (let i = 0; i < cachePreguntas[cacheKey].length; i++) {
            const preguntaId = `${cacheKey}-${i}`;
            if (!preguntasUsadas[usuario_id].has(preguntaId)) {
                // Marcar como usada
                preguntasUsadas[usuario_id].add(preguntaId);
                return cachePreguntas[cacheKey][i];
            }
        }
        
        // Si todas fueron usadas, limpiar historial
        preguntasUsadas[usuario_id].clear();
    }
    
    // Seleccionar una pregunta aleatoria
    if (cachePreguntas[cacheKey] && cachePreguntas[cacheKey].length > 0) {
        const indiceAleatorio = Math.floor(Math.random() * cachePreguntas[cacheKey].length);
        return cachePreguntas[cacheKey][indiceAleatorio];
    }
    
    return null;
}

/**
 * Carga preguntas desde DeepSeek AI
 */
async function cargarPreguntasDesdeDeepseek(categoria, dificultad, tipo, cacheKey) {
    // Generar prompt para DeepSeek
    const prompt = `Genera 5 preguntas de trivia para la categoría ${categoria}. 

Las categorías disponibles son: anime, videojuegos, películas, series, ciencia, historia, geografía, música, deportes, tecnología, arte, literatura, mitología, gastronomía, astronomía, biología, matemáticas, cultura pop, idiomas, filosofía.

Cada pregunta debe tener este formato exacto:
{
  pregunta: "Texto de la pregunta",
  tipo: "${tipo}",
  opciones: ["Primera opción", "Segunda opción", "Tercera opción", "Cuarta opción"],
  respuesta_correcta: 0, // Índice de la opción correcta (empezando por 0)
  explicacion: "Explicación detallada de la respuesta correcta",
  dificultad: "${dificultad}",
  imagen: "trivia.png"
}

Si el tipo es "verdadero_falso", las opciones deben ser ["Verdadero", "Falso"].
La respuesta debe ser un array JSON válido con 5 preguntas de la categoría solicitada.
NO añadas texto adicional, comentarios o explicaciones, solo el array JSON.`;

    try {
        // Llamar a la API de DeepSeek
        const respuesta = await axios.get(`http://api.apikarl.com/api/utility/deepseek`, {
            params: { prompt }
        });

        if (respuesta.data && respuesta.data.respuesta) {
            let jsonStr = respuesta.data.respuesta;
            
            // Intentar encontrar el array JSON en la respuesta
            const inicioArray = jsonStr.indexOf('[');
            const finArray = jsonStr.lastIndexOf(']') + 1;
            
            if (inicioArray >= 0 && finArray > inicioArray) {
                jsonStr = jsonStr.substring(inicioArray, finArray);
            }
            
            // Parsear las preguntas
            const preguntas = JSON.parse(jsonStr);
            
            if (Array.isArray(preguntas) && preguntas.length > 0) {
                // Guardar en caché
                cachePreguntas[cacheKey] = preguntas;
                console.log(`Guardadas ${preguntas.length} preguntas para ${cacheKey}`);
                return preguntas;
            }
        }
        
        throw new Error("Formato de respuesta inválido desde DeepSeek");
    } catch (error) {
        console.error("Error procesando respuesta de DeepSeek:", error);
        throw error;
    }
}

/**
 * Formatea la respuesta para el usuario, ocultando la respuesta correcta
 */
function formatearRespuesta(pregunta) {
    // Clonar para no modificar el original
    const preguntaFormateada = { ...pregunta };
    
    // Eliminar la respuesta correcta de la pregunta devuelta
    const respuestaCorrecta = preguntaFormateada.respuesta_correcta;
    delete preguntaFormateada.respuesta_correcta;
    
    // Calcular puntos sugeridos según dificultad
    let puntosSugeridos = 1;
    switch (preguntaFormateada.dificultad) {
        case DIFICULTADES.FACIL:
            puntosSugeridos = 1;
            break;
        case DIFICULTADES.MEDIO:
            puntosSugeridos = 2;
            break;
        case DIFICULTADES.DIFICIL:
            puntosSugeridos = 3;
            break;
        case DIFICULTADES.EXPERTO:
            puntosSugeridos = 5;
            break;
    }
    
    // Añadir el índice de opciones (1, 2, 3, 4 en lugar de 0, 1, 2, 3)
    const opcionesConIndice = preguntaFormateada.opciones.map((opcion, index) => ({
        indice: index + 1,
        texto: opcion
    }));
    
    // Crear la respuesta final
    return {
        pregunta: preguntaFormateada.pregunta,
        tipo: preguntaFormateada.tipo,
        dificultad: preguntaFormateada.dificultad,
        opciones: opcionesConIndice,
        imagen: preguntaFormateada.imagen,
        puntos_sugeridos: puntosSugeridos,
        
        // Parámetros para verificar la respuesta después
        verificacion: {
            respuesta_correcta_indice: respuestaCorrecta + 1, // +1 para que coincida con los índices mostrados
            respuesta_correcta_texto: preguntaFormateada.opciones[respuestaCorrecta],
            explicacion: preguntaFormateada.explicacion
        }
    };
}

// Cada 24 horas, limpiar el caché de preguntas usadas
setInterval(() => {
    console.log("Limpiando caché de preguntas usadas en API de Trivia");
    Object.keys(preguntasUsadas).forEach(key => {
        preguntasUsadas[key].clear();
    });
    
    // También rotar algunas categorías del caché
    const cachesToRefresh = Object.keys(cachePreguntas);
    if (cachesToRefresh.length > 0) {
        // Refrescar hasta 5 categorías aleatorias
        const refreshCount = Math.min(5, cachesToRefresh.length);
        for (let i = 0; i < refreshCount; i++) {
            const keyToRefresh = cachesToRefresh[Math.floor(Math.random() * cachesToRefresh.length)];
            delete cachePreguntas[keyToRefresh];
            console.log(`Caché eliminado para ${keyToRefresh}, se regenerará en la próxima solicitud`);
        }
    }
}, 24 * 60 * 60 * 1000);

module.exports = router;
