// api/fun/trivia/index.js
const express = require("express");
const router = express.Router();

/**
 * API TRIVIA GENERATOR - Genera preguntas de trivia en diversas categorías
 * 
 * Funcionalidades:
 * - Múltiples categorías (anime, videojuegos, películas, ciencia, etc.)
 * - Diferentes niveles de dificultad
 * - Tipos de preguntas (opción múltiple, verdadero/falso)
 * - Explicaciones detalladas para respuestas
 * - Evita repetición de preguntas
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

// Ubicación de la imagen de trivia (accesible desde el index.js principal)
const TRIVIA_IMAGEN = "trivia.png";

// Banco de datos de preguntas
// Estructura mínima para cada categoría para ilustrar el ejemplo
// En producción, este banco sería mucho más extenso
const BANCO_PREGUNTAS = {
    // ANIME
    [CATEGORIAS.ANIME]: [
        {
            pregunta: "¿Cuál es el nombre del protagonista de 'Naruto'?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["Naruto Uzumaki", "Sasuke Uchiha", "Kakashi Hatake", "Itachi Uchiha"],
            respuesta_correcta: 0,
            explicacion: "Naruto Uzumaki es el protagonista principal de la serie, un ninja de Konoha que sueña con convertirse en Hokage.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿En 'Death Note', qué debe conocer Light para matar a alguien usando el Death Note?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["El nombre y rostro de la persona", "Solo el nombre", "Solo el rostro", "El nombre y la fecha de nacimiento"],
            respuesta_correcta: 0,
            explicacion: "Para matar a alguien con el Death Note, Light debe conocer el nombre de la persona y tener su rostro en mente al escribirlo.",
            dificultad: DIFICULTADES.MEDIO,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿'Fullmetal Alchemist: Brotherhood' está basado fielmente en el manga original?",
            tipo: TIPOS.VERDADERO_FALSO,
            opciones: ["Verdadero", "Falso"],
            respuesta_correcta: 0,
            explicacion: "A diferencia de la primera adaptación, 'Fullmetal Alchemist: Brotherhood' sigue fielmente la historia del manga de Hiromu Arakawa.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿Cuál es el nombre del ataque especial que el Capitán Levi utiliza para matar titanes en 'Attack on Titan'?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["Giro de ataque", "Corte en espiral", "Rebanada relampago", "No tiene nombre"],
            respuesta_correcta: 3,
            explicacion: "Aunque es conocido por su técnica de giro, el ataque distintivo de Levi no tiene un nombre oficial en la serie.",
            dificultad: DIFICULTADES.DIFICIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿Cuál fue el primer anime en utilizar la técnica de animación por celdas en color?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["Astro Boy", "Kimba el León Blanco", "La Princesa Caballero", "Fantasmagórico"],
            respuesta_correcta: 1,
            explicacion: "Kimba el León Blanco (1965) fue el primer anime televisivo en utilizar animación por celdas completamente a color.",
            dificultad: DIFICULTADES.EXPERTO,
            imagen: TRIVIA_IMAGEN
        }
    ],

    // VIDEOJUEGOS
    [CATEGORIAS.VIDEOJUEGOS]: [
        {
            pregunta: "¿Qué personaje es la mascota de Nintendo?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["Sonic", "Mario", "Link", "Pikachu"],
            respuesta_correcta: 1,
            explicacion: "Mario, el fontanero italiano, es considerado la mascota oficial de Nintendo desde los años 80.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿En qué año se lanzó el primer juego de The Legend of Zelda?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["1985", "1986", "1987", "1990"],
            respuesta_correcta: 1,
            explicacion: "The Legend of Zelda fue lanzado originalmente para la Famicom Disk System en Japón el 21 de febrero de 1986.",
            dificultad: DIFICULTADES.MEDIO,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿La frase 'War, war never changes' pertenece a la serie de juegos Fallout?",
            tipo: TIPOS.VERDADERO_FALSO,
            opciones: ["Verdadero", "Falso"],
            respuesta_correcta: 0,
            explicacion: "Esta frase icónica aparece en la introducción de casi todos los juegos de la serie Fallout, convirtiéndose en su lema característico.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿Cuál es el easter egg más antiguo en videojuegos que se ha documentado?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["'Adventure' de Atari 2600", "'Starship 1' de Atari", "El puntaje '8675309' en Ms. Pac-Man", "El modo secreto en Space Invaders"],
            respuesta_correcta: 1,
            explicacion: "Aunque el de 'Adventure' es muy conocido, el easter egg en 'Starship 1' (1977) predató a éste por casi dos años, mostrando el mensaje 'Hi Ron!' cuando se activaba una secuencia específica.",
            dificultad: DIFICULTADES.EXPERTO,
            imagen: TRIVIA_IMAGEN
        }
    ],

    // PELÍCULAS
    [CATEGORIAS.PELICULAS]: [
        {
            pregunta: "¿Quién dirigió la película 'Titanic' (1997)?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["Steven Spielberg", "James Cameron", "Christopher Nolan", "Martin Scorsese"],
            respuesta_correcta: 1,
            explicacion: "James Cameron dirigió 'Titanic', película que ganó 11 Premios Óscar, incluyendo Mejor Director y Mejor Película.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿En 'Star Wars: El Imperio Contraataca', cuál es la famosa revelación que hace Darth Vader a Luke Skywalker?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: [
                "Que es su padre", 
                "Que Obi-Wan lo traicionó", 
                "Que la Princesa Leia es su hermana", 
                "Que el Emperador es un Sith"
            ],
            respuesta_correcta: 0,
            explicacion: "En una de las revelaciones más famosas del cine, Darth Vader le dice a Luke: 'Yo soy tu padre', cambiando para siempre el rumbo de la saga.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿La película 'El Padrino' está basada en una historia real?",
            tipo: TIPOS.VERDADERO_FALSO,
            opciones: ["Verdadero", "Falso"],
            respuesta_correcta: 1,
            explicacion: "'El Padrino' está basada en la novela homónima de Mario Puzo, que si bien se inspiró en familias mafiosas reales como los Genovese, la historia específica es ficción.",
            dificultad: DIFICULTADES.MEDIO,
            imagen: TRIVIA_IMAGEN
        }
    ],

    // CIENCIA
    [CATEGORIAS.CIENCIA]: [
        {
            pregunta: "¿Cuál es el elemento químico más abundante en el universo?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["Oxígeno", "Carbono", "Hidrógeno", "Helio"],
            respuesta_correcta: 2,
            explicacion: "El hidrógeno constituye aproximadamente el 75% de toda la materia bariónica del universo. Es el elemento más simple y ligero.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿Cuánto tiempo tarda la luz del Sol en llegar a la Tierra?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["1 segundo", "8 minutos y 20 segundos", "1 hora", "24 horas"],
            respuesta_correcta: 1,
            explicacion: "La luz viaja a aproximadamente 300,000 km/s, y la distancia media del Sol a la Tierra es de 150 millones de km, lo que resulta en un tiempo de viaje de 8 minutos y 20 segundos.",
            dificultad: DIFICULTADES.MEDIO,
            imagen: TRIVIA_IMAGEN
        }
    ]
};

// Cache para evitar repetición de preguntas por sesión/usuario
// En una implementación real, esto podría ser una base de datos
const preguntasUsadas = {};

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
        const pregunta = obtenerPregunta(categoriaFinal, dificultadFinal, tipoFinal, usuario_id);
        
        if (!pregunta) {
            return res.status(404).json({
                error: "No se encontraron preguntas disponibles con los criterios especificados",
                sugerencia: "Intenta con diferentes parámetros o categorías"
            });
        }
        
        // Formatear respuesta según sea opción múltiple o verdadero/falso
        const respuestaFormateada = formatearRespuesta(pregunta, tipoFinal);
        
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
    // Contar preguntas por categoría
    const estadisticas = Object.entries(BANCO_PREGUNTAS).reduce((acc, [categoria, preguntas]) => {
        acc[categoria] = preguntas.length;
        return acc;
    }, {});
    
    // Contar preguntas por tipo
    const tiposStats = {};
    const dificultadStats = {};
    
    Object.values(BANCO_PREGUNTAS).flat().forEach(pregunta => {
        // Contar por tipo
        tiposStats[pregunta.tipo] = (tiposStats[pregunta.tipo] || 0) + 1;
        
        // Contar por dificultad
        dificultadStats[pregunta.dificultad] = (dificultadStats[pregunta.dificultad] || 0) + 1;
    });
    
    res.json({
        nombre: "API de Trivia - Generador de Preguntas",
        endpoints: {
            principal: "/api/fun/trivia?categoria=CATEGORIA&dificultad=DIFICULTAD&tipo=TIPO",
            info: "/api/fun/trivia/info",
            categorias: "/api/fun/trivia/categorias"
        },
        categorias_disponibles: Object.values(CATEGORIAS),
        dificultades_disponibles: Object.values(DIFICULTADES),
        tipos_disponibles: Object.values(TIPOS),
        estadisticas: {
            preguntas_por_categoria: estadisticas,
            preguntas_por_tipo: tiposStats,
            preguntas_por_dificultad: dificultadStats,
            total_preguntas: Object.values(BANCO_PREGUNTAS).flat().length
        },
        ejemplos: [
            "/api/fun/trivia?categoria=anime",
            "/api/fun/trivia?categoria=videojuegos&dificultad=dificil",
            "/api/fun/trivia?categoria=random&tipo=verdadero_falso",
            "/api/fun/trivia?usuario_id=123456789" // Para seguimiento de preguntas ya usadas
        ]
    });
});

/**
 * Endpoint para listar preguntas disponibles por categoría
 */
router.get("/categorias/:categoria?", (req, res) => {
    const { categoria } = req.params;
    
    if (categoria) {
        const categoriaNormalizada = normalizarCategoria(categoria);
        
        if (!BANCO_PREGUNTAS[categoriaNormalizada]) {
            return res.status(404).json({
                error: "Categoría no encontrada",
                categorias_disponibles: Object.values(CATEGORIAS)
            });
        }
        
        // Información resumida (sin mostrar respuestas)
        const preguntasResumidas = BANCO_PREGUNTAS[categoriaNormalizada].map(pregunta => ({
            pregunta: pregunta.pregunta,
            tipo: pregunta.tipo,
            dificultad: pregunta.dificultad,
            opciones: pregunta.tipo === TIPOS.OPCION_MULTIPLE ? pregunta.opciones.length : 2
        }));
        
        return res.json({
            categoria: categoriaNormalizada,
            total_preguntas: preguntasResumidas.length,
            preguntas: preguntasResumidas
        });
    }
    
    // Si no se especifica categoría, mostrar resumen de todas
    const resumen = Object.entries(BANCO_PREGUNTAS).reduce((acc, [categoria, preguntas]) => {
        acc[categoria] = {
            total: preguntas.length,
            por_dificultad: preguntas.reduce((acc, pregunta) => {
                acc[pregunta.dificultad] = (acc[pregunta.dificultad] || 0) + 1;
                return acc;
            }, {})
        };
        return acc;
    }, {});
    
    res.json({
        categorias: resumen
    });
});

// FUNCIONES DE UTILIDAD

/**
 * Valida los parámetros de la solicitud
 */
function validarParametros(categoria, dificultad, tipo) {
    // Si no se proporciona ningún parámetro, al menos necesitamos uno válido
    if (!categoria && !dificultad && !tipo) {
        return false;
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
        return null; // Cualquier dificultad
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
        return null; // Cualquier tipo
    }
    
    const tipoNormalizado = tipo.toLowerCase();
    
    if (tipoNormalizado === TIPOS.RANDOM) {
        const tipos = Object.values(TIPOS).filter(t => t !== TIPOS.RANDOM);
        return tipos[Math.floor(Math.random() * tipos.length)];
    }
    
    return tipoNormalizado;
}

/**
 * Obtiene una pregunta según los criterios especificados
 * Evita repetir preguntas para el mismo usuario
 */
function obtenerPregunta(categoria, dificultad, tipo, usuario_id) {
    // Obtener todas las preguntas de la categoría
    const preguntasCategoria = BANCO_PREGUNTAS[categoria];
    
    if (!preguntasCategoria || preguntasCategoria.length === 0) {
        return null;
    }
    
    // Filtrar por dificultad si se especifica
    let preguntasFiltradas = preguntasCategoria;
    
    if (dificultad) {
        preguntasFiltradas = preguntasFiltradas.filter(p => p.dificultad === dificultad);
    }
    
    // Filtrar por tipo si se especifica
    if (tipo) {
        preguntasFiltradas = preguntasFiltradas.filter(p => p.tipo === tipo);
    }
    
    if (preguntasFiltradas.length === 0) {
        return null;
    }
    
    // Si hay ID de usuario, evitar preguntas ya usadas
    if (usuario_id) {
        // Inicializar seguimiento para este usuario si no existe
        if (!preguntasUsadas[usuario_id]) {
            preguntasUsadas[usuario_id] = new Set();
        }
        
        // Filtrar preguntas ya usadas
        const preguntasDisponibles = preguntasFiltradas.filter((p, index) => {
            // Crear un identificador único para esta pregunta
            const preguntaId = `${categoria}-${index}`;
            return !preguntasUsadas[usuario_id].has(preguntaId);
        });
        
        // Si hay preguntas disponibles, seleccionar una aleatoria
        if (preguntasDisponibles.length > 0) {
            const indiceAleatorio = Math.floor(Math.random() * preguntasDisponibles.length);
            const preguntaSeleccionada = preguntasDisponibles[indiceAleatorio];
            
            // Marcar como usada
            const preguntaId = `${categoria}-${preguntasCategoria.indexOf(preguntaSeleccionada)}`;
            preguntasUsadas[usuario_id].add(preguntaId);
            
            // Si todas las preguntas han sido usadas, reiniciar
            if (preguntasUsadas[usuario_id].size >= preguntasCategoria.length) {
                preguntasUsadas[usuario_id].clear();
            }
            
            return preguntaSeleccionada;
        }
        
        // Si todas las preguntas fueron usadas, reiniciar y seleccionar cualquiera
        preguntasUsadas[usuario_id].clear();
    }
    
    // Seleccionar una pregunta aleatoria
    const indiceAleatorio = Math.floor(Math.random() * preguntasFiltradas.length);
    return preguntasFiltradas[indiceAleatorio];
}

/**
 * Formatea la respuesta para el usuario, ocultando la respuesta correcta
 */
function formatearRespuesta(pregunta, tipo) {
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
    for (const usuario_id in preguntasUsadas) {
        preguntasUsadas[usuario_id].clear();
    }
}, 24 * 60 * 60 * 1000);

module.exports = router;
