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

// Imágenes genéricas por categoría
const IMAGENES_CATEGORIAS = {
    general: "https://via.placeholder.com/400x300?text=Dilema",
    divertido: "https://via.placeholder.com/400x300?text=Dilema+Divertido",
    extremo: "https://via.placeholder.com/400x300?text=Dilema+Extremo",
    comida: "https://via.placeholder.com/400x300?text=Dilema+Comida",
    viajes: "https://via.placeholder.com/400x300?text=Dilema+Viajes",
    tecnologia: "https://via.placeholder.com/400x300?text=Dilema+Tecnologia",
    superpoderes: "https://via.placeholder.com/400x300?text=Dilema+Superpoderes",
    casual: "https://via.placeholder.com/400x300?text=Dilema+Casual"
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
        let prompt = `Genera 3 dilemas del tipo '¿Qué preferirías?' para la categoría "${categoria}". 
Para cada opción, también incluye un porcentaje estimado de las personas que elegirían esa opción (los porcentajes de cada dilema deben sumar 100%).

Cada dilema debe estar en formato JSON como este:
{
  "pregunta": "¿Qué preferirías?",
  "opciones": [
    {
      "texto": "Primera opción",
      "porcentaje": 60
    },
    {
      "texto": "Segunda opción",
      "porcentaje": 40
    }
  ]
}

La respuesta debe ser SOLAMENTE un array de objetos JSON, sin ningún otro texto o explicación. Ejemplo:
[
  {
    "pregunta": "¿Qué preferirías?",
    "opciones": [
      {
        "texto": "Opción 1",
        "porcentaje": 70
      },
      {
        "texto": "Opción 2",
        "porcentaje": 30
      }
    ]
  },
  {
    "pregunta": "¿Qué preferirías?",
    "opciones": [
      {
        "texto": "Opción 1",
        "porcentaje": 25
      },
      {
        "texto": "Opción 2",
        "porcentaje": 45
      },
      {
        "texto": "Opción 3",
        "porcentaje": 30
      }
    ]
  }
]`;
        
        // Personalizar el prompt según la categoría
        switch (categoria.toLowerCase()) {
            case CATEGORIAS.DIVERTIDO:
                prompt = prompt.replace('para la categoría "divertido"', 'que sean divertidos y humorísticos');
                break;
            case CATEGORIAS.EXTREMO:
                prompt = prompt.replace('para la categoría "extremo"', 'con situaciones extremas o difíciles de decidir');
                break;
            case CATEGORIAS.COMIDA:
                prompt = prompt.replace('para la categoría "comida"', 'relacionados con comida y bebidas');
                break;
            case CATEGORIAS.VIAJES:
                prompt = prompt.replace('para la categoría "viajes"', 'relacionados con viajes y lugares');
                break;
            case CATEGORIAS.TECNOLOGIA:
                prompt = prompt.replace('para la categoría "tecnologia"', 'relacionados con tecnología y dispositivos');
                break;
            case CATEGORIAS.SUPERPODERES:
                prompt = prompt.replace('para la categoría "superpoderes"', 'sobre superpoderes o habilidades fantásticas');
                break;
            case CATEGORIAS.CASUAL:
                prompt = prompt.replace('para la categoría "casual"', 'sobre situaciones cotidianas o triviales');
                break;
        }
        
        console.log("Enviando prompt a deepseek:", prompt);
        
        // Hacer solicitud a la API de generación
        try {
            const response = await axios.get(`http://api.apikarl.com/api/utility/deepseek`, {
                params: { prompt }
            });
            
            console.log("Respuesta recibida de deepseek");
            
            // Preguntas predefinidas para usar como respaldo
            const preguntasRespaldo = [
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        { texto: "Poder volar pero solo a 5 km/h", porcentaje: 65 },
                        { texto: "Poder teletransportarte pero solo 10 metros cada vez", porcentaje: 35 }
                    ]
                },
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        { texto: "Vivir sin internet por un año", porcentaje: 25 },
                        { texto: "Vivir sin tu comida favorita para siempre", porcentaje: 40 },
                        { texto: "Vivir sin poder usar aplicaciones de mensajería", porcentaje: 35 }
                    ]
                },
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        { texto: "Tener que decir todo lo que piensas", porcentaje: 20 },
                        { texto: "Nunca poder expresar tu opinión", porcentaje: 30 },
                        { texto: "Solo poder hablar en preguntas", porcentaje: 50 }
                    ]
                }
            ];
            
            // Intentar procesar la respuesta desde DeepSeek
            let generatedQuestions = [];
            
            if (response.data && response.data.respuesta) {
                try {
                    // Buscar el array JSON en la respuesta
                    const respuestaTexto = response.data.respuesta;
                    
                    // Encontrar donde comienza y termina el array
                    const inicioArray = respuestaTexto.indexOf('[');
                    const finArray = respuestaTexto.lastIndexOf(']') + 1;
                    
                    if (inicioArray !== -1 && finArray !== -1) {
                        const jsonText = respuestaTexto.substring(inicioArray, finArray);
                        const parsedData = JSON.parse(jsonText);
                        
                        if (Array.isArray(parsedData)) {
                            generatedQuestions = parsedData
                                .filter(item => {
                                    return item && 
                                           typeof item === 'object' && 
                                           item.pregunta && 
                                           Array.isArray(item.opciones) && 
                                           item.opciones.length >= 2 &&
                                           item.opciones.every(opt => 
                                               opt && 
                                               typeof opt === 'object' && 
                                               opt.texto && 
                                               typeof opt.porcentaje === 'number'
                                           );
                                })
                                .map(item => ({
                                    pregunta: item.pregunta,
                                    opciones: item.opciones.slice(0, Math.min(5, item.opciones.length)) // Máximo 5 opciones
                                }));
                        }
                    }
                } catch (parseError) {
                    console.error("Error al parsear JSON de DeepSeek:", parseError);
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
            
            // Asignar una imagen según la categoría
            const imagen = IMAGENES_CATEGORIAS[categoria.toLowerCase()] || IMAGENES_CATEGORIAS.general;
            
            // Extraer textos de opciones y porcentajes
            const opcionesTexto = selectedQuestion.opciones.map(opt => opt.texto);
            const porcentajes = selectedQuestion.opciones.map(opt => opt.porcentaje);
            
            // Guardar la pregunta en la base de datos en memoria
            questionsDB[questionId] = {
                pregunta: selectedQuestion.pregunta,
                opciones: opcionesTexto,
                categoria,
                imagen,
                timestamp: Date.now(),
                visitas: 0
            };
            
            // Simular votos basados en los porcentajes sugeridos por la IA
            // Establecemos un número base de 100 votos totales
            const baseVotos = 100;
            responsesDB[questionId] = porcentajes.map(porcentaje => Math.round((porcentaje / 100) * baseVotos));
            
            // Devolver la pregunta con su ID
            return res.json({
                id: questionId,
                pregunta: selectedQuestion.pregunta,
                opciones: opcionesTexto.map((opcion, index) => ({
                    id: index + 1,
                    texto: opcion
                })),
                categoria,
                imagen,
                refresh_stats_after: 10, // Indicar al cliente que actualice los stats después de 10 segundos
                stats_url: `/api/fun/would-you-rather/${questionId}/stats` // URL para obtener estadísticas
            });
        } catch (error) {
            console.error("Error en la solicitud a deepseek:", error);
            
            // Usar preguntas de respaldo en caso de error
            const preguntasRespaldo = [
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        { texto: "Poder volar pero solo a 5 km/h", porcentaje: 65 },
                        { texto: "Poder teletransportarte pero solo 10 metros cada vez", porcentaje: 35 }
                    ]
                },
                {
                    pregunta: "¿Qué preferirías?",
                    opciones: [
                        { texto: "Vivir sin internet por un año", porcentaje: 25 },
                        { texto: "Vivir sin tu comida favorita para siempre", porcentaje: 75 }
                    ]
                }
            ];
            
            // Elegir una pregunta aleatoria de respaldo
            const selectedQuestion = preguntasRespaldo[Math.floor(Math.random() * preguntasRespaldo.length)];
            
            // Generar ID único para la pregunta
            const questionId = crypto.randomBytes(8).toString('hex');
            
            // Asignar una imagen según la categoría
            const imagen = IMAGENES_CATEGORIAS[categoria.toLowerCase()] || IMAGENES_CATEGORIAS.general;
            
            // Extraer textos de opciones y porcentajes
            const opcionesTexto = selectedQuestion.opciones.map(opt => opt.texto);
            const porcentajes = selectedQuestion.opciones.map(opt => opt.porcentaje);
            
            // Guardar la pregunta en la base de datos en memoria
            questionsDB[questionId] = {
                pregunta: selectedQuestion.pregunta,
                opciones: opcionesTexto,
                categoria,
                imagen,
                timestamp: Date.now(),
                visitas: 0
            };
            
            // Simular votos basados en los porcentajes
            const baseVotos = 100;
            responsesDB[questionId] = porcentajes.map(porcentaje => Math.round((porcentaje / 100) * baseVotos));
            
            // Devolver la pregunta con su ID
            return res.json({
                id: questionId,
                pregunta: selectedQuestion.pregunta,
                opciones: opcionesTexto.map((opcion, index) => ({
                    id: index + 1,
                    texto: opcion
                })),
                categoria,
                imagen,
                refresh_stats_after: 10, // Indicar al cliente que actualice los stats después de 10 segundos
                stats_url: `/api/fun/would-you-rather/${questionId}/stats` // URL para obtener estadísticas
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
        imagen: questionsDB[id].imagen,
        visitas: questionsDB[id].visitas,
        refresh_stats_after: 10, // Indicar al cliente que actualice los stats después de 10 segundos
        stats_url: `/api/fun/would-you-rather/${id}/stats` // URL para obtener estadísticas
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
        },
        refresh_stats_after: 10, // Indicar al cliente que actualice los stats después de 10 segundos
        stats_url: `/api/fun/would-you-rather/${id}/stats` // URL para obtener estadísticas
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
        categoria: questionsDB[id].categoria,
        imagen: questionsDB[id].imagen
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
