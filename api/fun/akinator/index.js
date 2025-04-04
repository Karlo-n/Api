// api/fun/akinator/index.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

// Almacenamiento en memoria para las partidas activas
const partidasActivas = {};

// Configuración de categorías
const CATEGORIAS = {
    PERSONAJES: "personajes",
    ANIMALES: "animales", 
    OBJETOS: "objetos",
    PAISES: "paises",
    FAMOSOS: "famosos",
    PERSONAJES_ANIME: "personajes_anime",
    VIDEOJUEGOS: "videojuegos"
};

// Endpoint principal para iniciar o continuar un juego
router.get("/", async (req, res) => {
    try {
        const { 
            partidaId, 
            respuesta, 
            categoria = CATEGORIAS.PERSONAJES 
        } = req.query;

        // Validar categoría
        if (!Object.values(CATEGORIAS).includes(categoria)) {
            return res.status(400).json({
                error: "Categoría no válida",
                categorias_disponibles: Object.values(CATEGORIAS)
            });
        }

        // Si no hay partidaId, iniciar nueva partida
        if (!partidaId) {
            return await iniciarNuevaPartida(categoria, res);
        }

        // Validar que la partida exista
        const partida = partidasActivas[partidaId];
        if (!partida) {
            return res.status(404).json({
                error: "Partida no encontrada",
                sugerencia: "Inicia una nueva partida"
            });
        }

        // Si ya se adivinó o se ha llegado al límite, terminar
        if (partida.terminada) {
            return res.json({
                terminada: true,
                personaje: partida.personaje,
                mensaje: "La partida ha terminado"
            });
        }

        // Procesar respuesta si se proporciona
        if (respuesta) {
            return await procesarRespuesta(partidaId, respuesta, res);
        }

        // Devolver la siguiente pregunta
        return res.json({
            partidaId: partidaId,
            pregunta: partida.preguntaActual,
            progreso: partida.progreso
        });

    } catch (error) {
        console.error("Error en la API de Akinator:", error);
        res.status(500).json({ 
            error: "Error al procesar la solicitud",
            detalle: error.message 
        });
    }
});

// Iniciar nueva partida
async function iniciarNuevaPartida(categoria, res) {
    try {
        // Obtener pregunta inicial desde la IA
        const respuestaIA = await consultarDeepSeek(`
        Eres un juego de adivinanzas tipo Akinator.
        
        Genera una pregunta inicial para adivinar un ${categoria}.
        
        Formato de respuesta:
        {
            "pregunta": "La pregunta inicial",
            "contexto": "Detalles adicionales que ayuden a entender la pregunta"
        }
        `);

        // Crear nueva partida
        const nuevoId = generarIdUnico();
        
        partidasActivas[nuevoId] = {
            id: nuevoId,
            categoria: categoria,
            preguntaActual: respuestaIA.pregunta,
            contexto: respuestaIA.contexto,
            progreso: 0,
            pistas: [],
            terminada: false,
            personaje: null,
            fechaCreacion: new Date().toISOString()
        };

        // Responder
        return res.json({
            partidaId: nuevoId,
            pregunta: respuestaIA.pregunta,
            contexto: respuestaIA.contexto,
            progreso: 0
        });

    } catch (error) {
        console.error("Error iniciando partida:", error);
        res.status(500).json({ 
            error: "Error al iniciar la partida",
            detalle: error.message 
        });
    }
}

// Procesar respuesta del jugador
async function procesarRespuesta(partidaId, respuesta, res) {
    const partida = partidasActivas[partidaId];
    
    // Consultar a la IA para procesar la respuesta y generar nueva pregunta
    const respuestaIA = await consultarDeepSeek(`
    Estás jugando Akinator para adivinar un ${partida.categoria}.
    
    Contexto actual: ${partida.contexto || 'Sin contexto previo'}
    Última pregunta: ${partida.preguntaActual}
    Respuesta del jugador: ${respuesta}
    
    Genera la siguiente pregunta, actualizando tu conocimiento según la respuesta.
    
    Formato de respuesta:
    {
        "pregunta": "Nueva pregunta para seguir adivinando",
        "contexto": "Información adicional basada en la respuesta",
        "progresoAdivinanza": 0-100,
        "probabilidadAdivinanza": true/false,
        "personajeProvisional": "Si crees que ya sabes qué es, ponlo aquí, sino null"
    }
    `);

    // Actualizar estado de la partida
    partida.preguntaActual = respuestaIA.pregunta;
    partida.contexto = respuestaIA.contexto;
    partida.progreso = respuestaIA.progresoAdivinanza || partida.progreso + 10;
    
    // Ver si la IA cree que ya puede adivinar
    if (respuestaIA.probabilidadAdivinanza) {
        partida.terminada = true;
        partida.personaje = respuestaIA.personajeProvisional;
    }

    // Responder
    return res.json({
        partidaId: partidaId,
        pregunta: respuestaIA.pregunta,
        contexto: respuestaIA.contexto,
        progreso: partida.progreso,
        terminada: partida.terminada,
        personaje: partida.personaje
    });
}

// Consultar a DeepSeek
async function consultarDeepSeek(prompt) {
    try {
        const response = await axios.get(`http://api.apikarl.com/api/utility/deepseek`, {
            params: { prompt }
        });
        
        if (!response.data || !response.data.respuesta) {
            throw new Error("Respuesta inválida de DeepSeek");
        }
        
        // Intentar parsear la respuesta JSON
        try {
            return JSON.parse(response.data.respuesta);
        } catch {
            // Si falla el parseo, devolver la respuesta original
            return { 
                pregunta: response.data.respuesta, 
                contexto: "Respuesta no estructurada" 
            };
        }
    } catch (error) {
        console.error("Error consultando DeepSeek:", error);
        throw error;
    }
}

// Generar ID único para la partida
function generarIdUnico() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Limpiar partidas caducadas
setInterval(() => {
    const ahora = Date.now();
    const tiempoMaximo = 30 * 60 * 1000; // 30 minutos
    
    Object.keys(partidasActivas).forEach(id => {
        const partida = partidasActivas[id];
        const tiempoTranscurrido = ahora - new Date(partida.fechaCreacion).getTime();
        
        if (tiempoTranscurrido > tiempoMaximo) {
            delete partidasActivas[id];
        }
    });
}, 10 * 60 * 1000); // Ejecutar cada 10 minutos

// Endpoint de info
router.get("/info", (req, res) => {
    res.json({
        nombre: "Akinator API",
        descripcion: "Juego de adivinanzas con inteligencia artificial",
        categorias: Object.values(CATEGORIAS),
        instrucciones: [
            "Inicia una partida sin parámetros adicionales",
            "Responde con true/false/talvez/no_se a las preguntas",
            "La API va reduciendo el conjunto de posibilidades"
        ],
        ejemplos: [
            "/api/fun/akinator?categoria=personajes_anime",
            "/api/fun/akinator?partidaId=abc123&respuesta=true",
            "/api/fun/akinator?categoria=famosos"
        ]
    });
});

module.exports = router;
