// api/fun/would-you-rather/index.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const crypto = require("crypto");

// Base de datos en memoria para almacenar preguntas y respuestas
const questionsDB = {};
const responsesDB = {};

/**
 * API WOULD YOU RATHER - Genera escenarios de "¿Qué preferirías?" para animar conversaciones
 * 
 * Endpoints:
 * - GET /api/fun/would-you-rather/generate - Genera una nueva pregunta
 * - GET /api/fun/would-you-rather/:id - Obtiene una pregunta específica
 * - POST /api/fun/would-you-rather/:id/answer - Registra una respuesta
 * - GET /api/fun/would-you-rather/:id/stats - Obtiene estadísticas de respuestas
 */

// Categorías disponibles
const CATEGORIAS = {
    GENERAL: "general",
    DIVERTIDO: "divertido",
    EXTREMO: "extremo",
    COMIDA: "comida",
    VIAJES: "viajes",
    TECNOLOGIA: "tecnologia",
    SUPERPODERES: "superpoderes",
    CASUAL: "casual"
};

// Endpoint para generar una nueva pregunta
router.get("/generate", async (req, res) => {
    try {
        const { categoria = CATEGORIAS.GENERAL } = req.query;
        
        // Validar categoría
        if (!Object.values(CATEGORIAS).includes(categoria.toLowerCase())) {
            return res.status(400).json({
                error: "Categoría no válida",
                categorias_disponibles: Object.values(CATEGORIAS)
            });
        }
        
        // Generar prompt según la categoría
        let prompt = "Genera 5 dilemas del tipo '¿Qué preferirías?' ";
        
        switch (categoria.toLowerCase()) {
            case CATEGORIAS.DIVERTIDO:
                prompt += "que sean divertidos y humorísticos";
                break;
            case CATEGORIAS.EXTREMO:
                prompt += "con situaciones extremas o difíciles de decidir";
                break;
            case CATEGORIAS.COMIDA:
                prompt += "relacionados con comida y bebidas";
                break;
            case CATEGORIAS.VIAJES:
                prompt += "relacionados con viajes y lugares";
                break;
            case CATEGORIAS.TECNOLOGIA:
                prompt += "relacionados con tecnología y dispositivos";
                break;
            case CATEGORIAS.SUPERPODERES:
                prompt += "sobre superpoderes o habilidades fantásticas";
                break;
            case CATEGORIAS.CASUAL:
                prompt += "sobre situaciones cotidianas o triviales";
                break;
            default:
                prompt += "variados e interesantes";
        }
        
        // Hacer solicitud a la API de generación
        try {
            // Agregar instrucciones de formato explícitas al prompt
            prompt += ". Responde con un array de 5 objetos JSON, cada uno con una 'pregunta' y un array de 'opciones'";
            
            console.log("Enviando prompt a deepseek:", prompt);
            
            const response = await axios.get(`http://api.apikarl.com/api/utility/deepseek?prompt=${encodeURIComponent(prompt)}`);
            
            console.log("Respuesta recibida de deepseek");
            
            // Preguntas predefinidas para usar como respaldo
            const preguntasRespaldo = [
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        "Poder volar pero solo a 5 km/h", 
                        "Poder teletransportarte pero solo 10 metros cada vez",
                        "Poder leer mentes pero solo las de personas que no conoces",
                        "Poder hablar con animales pero solo con reptiles"
                    ]
                },
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        "Vivir sin internet por un año", 
                        "Vivir sin tu comida favorita para siempre",
                        "Vivir sin poder usar aplicaciones de mensajería",
                        "Vivir sin poder ver series o películas"
                    ]
                },
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        "Tener que decir todo lo que piensas", 
                        "Nunca poder expresar tu opinión",
                        "Solo poder hablar en preguntas",
                        "Solo poder hablar en rimas"
                    ]
                },
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        "Saber cuándo morirás pero no poder cambiarlo", 
                        "No saber cuándo morirás pero tener la oportunidad de prolongar tu vida",
                        "Vivir exactamente 100 años sin importar nada",
                        "Vivir mientras seas feliz y morir cuando ya no lo seas"
                    ]
                },
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        "Tener un botón que te da $1,000 pero una persona aleatoria pierde $100", 
                        "Tener un botón que te quita $100 pero 10 personas aleatorias ganan $100 cada una",
                        "Tener un botón que te da $500 y también a una persona necesitada",
                        "No tener ningún botón especial"
                    ]
                }
            ];
            
            // Intentar procesar la respuesta como un array de objetos
            let generatedQuestions = [];
            
            if (response.data) {
                if (Array.isArray(response.data)) {
                    generatedQuestions = response.data
                        .filter(item => item && typeof item === 'object' && item.pregunta && Array.isArray(item.opciones))
                        .map(item => ({
                            pregunta: item.pregunta,
                            opciones: item.opciones.slice(0, Math.max(4, item.opciones.length))
                        }));
                }
            }
            
            // Si no se pudieron generar preguntas, usar las predefinidas
            if (generatedQuestions.length === 0) {
                console.log("Usando preguntas predefinidas");
                generatedQuestions = preguntasRespaldo;
            }
            
            // Elegir una pregunta aleatoria de las generadas
            const selectedQuestion = generatedQuestions[Math.floor(Math.random() * generatedQuestions.length)];
            
            // Generar ID único para la pregunta
            const questionId = crypto.randomBytes(8).toString('hex');
            
            // Guardar la pregunta en la base de datos en memoria
            questionsDB[questionId] = {
                ...selectedQuestion,
                categoria,
                timestamp: Date.now(),
                visitas: 0
            };
            
            // Inicializar contadores de respuestas
            responsesDB[questionId] = selectedQuestion.opciones.map(() => 0);
            
            // Devolver la pregunta con su ID
            return res.json({
                id: questionId,
                pregunta: selectedQuestion.pregunta,
                opciones: selectedQuestion.opciones.map((opcion, index) => ({
                    id: index + 1,
                    texto: opcion
                })),
                categoria
            });
        } catch (error) {
            console.error("Error en la solicitud a deepseek:", error);
            
            // Usar preguntas de respaldo en caso de error
            const preguntasRespaldo = [
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        "Poder volar pero solo a 5 km/h", 
                        "Poder teletransportarte pero solo 10 metros cada vez",
                        "Poder leer mentes pero solo las de personas que no conoces",
                        "Poder hablar con animales pero solo con reptiles"
                    ]
                },
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        "Vivir sin internet por un año", 
                        "Vivir sin tu comida favorita para siempre",
                        "Vivir sin poder usar aplicaciones de mensajería",
                        "Vivir sin poder ver series o películas"
                    ]
                },
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        "Tener que decir todo lo que piensas", 
                        "Nunca poder expresar tu opinión",
                        "Solo poder hablar en preguntas",
                        "Solo poder hablar en rimas"
                    ]
                }
            ];
            
            // Elegir una pregunta aleatoria de respaldo
            const selectedQuestion = preguntasRespaldo[Math.floor(Math.random() * preguntasRespaldo.length)];
            
            // Generar ID único para la pregunta
            const questionId = crypto.randomBytes(8).toString('hex');
            
            // Guardar la pregunta en la base de datos en memoria
            questionsDB[questionId] = {
                ...selectedQuestion,
                categoria,
                timestamp: Date.now(),
                visitas: 0
            };
            
            // Inicializar contadores de respuestas
            responsesDB[questionId] = selectedQuestion.opciones.map(() => 0);
            
            // Devolver la pregunta con su ID
            return res.json({
                id: questionId,
                pregunta: selectedQuestion.pregunta,
                opciones: selectedQuestion.opciones.map((opcion, index) => ({
                    id: index + 1,
                    texto: opcion
                })),
                categoria
            });
        }
        
    } catch (error) {
        console.error("Error al generar pregunta:", error);
        return res.status(500).json({
            error: "Error al generar la pregunta",
            detalle: error.message
        });
    }
});

// Endpoint para obtener una pregunta específica
router.get("/:id", (req, res) => {
    const { id } = req.params;
    
    if (!questionsDB[id]) {
        return res.status(404).json({
            error: "Pregunta no encontrada",
            detalle: "El ID proporcionado no existe en la base de datos"
        });
    }
    
    // Incrementar contador de visitas
    questionsDB[id].visitas++;
    
    // Devolver la pregunta
    return res.json({
        id,
        pregunta: questionsDB[id].pregunta,
        opciones: questionsDB[id].opciones.map((opcion, index) => ({
            id: index + 1,
            texto: opcion
        })),
        categoria: questionsDB[id].categoria,
        visitas: questionsDB[id].visitas
    });
});

// Endpoint para registrar una respuesta
router.post("/:id/answer", (req, res) => {
    const { id } = req.params;
    const { respuesta_tipo } = req.body;
    
    // Validar que exista la pregunta
    if (!questionsDB[id]) {
        return res.status(404).json({
            error: "Pregunta no encontrada",
            detalle: "El ID proporcionado no existe en la base de datos"
        });
    }
    
    // Validar que el tipo de respuesta sea válido
    const respuestaIndex = parseInt(respuesta_tipo) - 1;
    if (isNaN(respuestaIndex) || respuestaIndex < 0 || respuestaIndex >= questionsDB[id].opciones.length) {
        return res.status(400).json({
            error: "Tipo de respuesta no válido",
            detalle: `Debe ser un número entre 1 y ${questionsDB[id].opciones.length}`
        });
    }
    
    // Registrar la respuesta
    responsesDB[id][respuestaIndex]++;
    
    // Devolver confirmación
    return res.json({
        mensaje: "Respuesta registrada correctamente",
        id,
        respuesta_seleccionada: {
            id: respuestaIndex + 1,
            texto: questionsDB[id].opciones[respuestaIndex]
        }
    });
});

// Endpoint para obtener estadísticas de respuestas
router.get("/:id/stats", (req, res) => {
    const { id } = req.params;
    
    // Validar que exista la pregunta
    if (!questionsDB[id]) {
        return res.status(404).json({
            error: "Pregunta no encontrada",
            detalle: "El ID proporcionado no existe en la base de datos"
        });
    }
    
    // Calcular total de respuestas
    const totalRespuestas = responsesDB[id].reduce((sum, count) => sum + count, 0);
    
    // Calcular porcentajes
    const estadisticas = questionsDB[id].opciones.map((opcion, index) => {
        const count = responsesDB[id][index];
        const porcentaje = totalRespuestas > 0 ? Math.round((count / totalRespuestas) * 100) : 0;
        
        return {
            id: index + 1,
            texto: opcion,
            votos: count,
            porcentaje
        };
    });
    
    // Ordenar por número de votos (descendente)
    estadisticas.sort((a, b) => b.votos - a.votos);
    
    return res.json({
        id,
        pregunta: questionsDB[id].pregunta,
        total_respuestas: totalRespuestas,
        estadisticas,
        visitas: questionsDB[id].visitas,
        categoria: questionsDB[id].categoria
    });
});

// Endpoint para obtener las categorías disponibles
router.get("/info/categorias", (req, res) => {
    res.json({
        categorias: Object.values(CATEGORIAS),
        descripcion: "Categorías disponibles para las preguntas de '¿Qué preferirías?'"
    });
});

// Endpoint para obtener información general de la API
router.get("/info", (req, res) => {
    // Contar preguntas por categoría
    const categoriaStats = {};
    Object.values(CATEGORIAS).forEach(cat => {
        categoriaStats[cat] = 0;
    });
    
    let totalPreguntas = 0;
    let totalRespuestas = 0;
    
    Object.entries(questionsDB).forEach(([id, question]) => {
        totalPreguntas++;
        
        if (question.categoria && categoriaStats[question.categoria] !== undefined) {
            categoriaStats[question.categoria]++;
        }
        
        if (responsesDB[id]) {
            totalRespuestas += responsesDB[id].reduce((sum, count) => sum + count, 0);
        }
    });
    
    res.json({
        nombre: "API de Would You Rather - Generador de dilemas '¿Qué preferirías?'",
        descripcion: "Genera escenarios de '¿Qué preferirías?' para animar conversaciones",
        endpoints: {
            generar: "/api/fun/would-you-rather/generate?categoria=CATEGORIA",
            obtener: "/api/fun/would-you-rather/:id",
            responder: "/api/fun/would-you-rather/:id/answer (POST con respuesta_tipo)",
            estadisticas: "/api/fun/would-you-rather/:id/stats",
            categorias: "/api/fun/would-you-rather/info/categorias",
            info: "/api/fun/would-you-rather/info"
        },
        categorias_disponibles: Object.values(CATEGORIAS),
        estadisticas: {
            preguntas_por_categoria: categoriaStats,
            total_preguntas: totalPreguntas,
            total_respuestas: totalRespuestas
        },
        ejemplos: [
            "/api/fun/would-you-rather/generate",
            "/api/fun/would-you-rather/generate?categoria=superpoderes",
            "/api/fun/would-you-rather/abcd1234 (obteniendo pregunta específica)",
            "/api/fun/would-you-rather/abcd1234/stats (obteniendo estadísticas)"
        ]
    });
});

// Limpiar preguntas antiguas cada 24 horas (opcional)
setInterval(() => {
    const ahora = Date.now();
    const limiteAntiguedad = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos
    
    Object.entries(questionsDB).forEach(([id, question]) => {
        if (ahora - question.timestamp > limiteAntiguedad) {
            delete questionsDB[id];
            delete responsesDB[id];
        }
    });
    
    console.log(`Limpieza de preguntas antiguas completada. Preguntas restantes: ${Object.keys(questionsDB).length}`);
}, 24 * 60 * 60 * 1000);

module.exports = router;
