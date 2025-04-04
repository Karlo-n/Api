// api/fun/akinator/index.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Almacenamiento en memoria para las partidas activas y temporizadores
const partidasActivas = {};
const temporizadoresPartidas = {};

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

// Opciones de respuesta aceptadas
const RESPUESTAS = {
    SI: ["si", "sí", "yes", "s", "true", "verdadero", "1"],
    NO: ["no", "n", "false", "falso", "0"],
    TAL_VEZ: ["tal vez", "talvez", "quizas", "quizá", "quizás", "puede ser", "maybe"],
    PROBABLEMENTE: ["probablemente", "casi seguro", "muy probable", "probably"],
    PROBABLEMENTE_NO: ["probablemente no", "casi seguro que no", "probably not"],
    DEPENDE: ["depende", "a veces", "en ocasiones", "depends"],
    DESCONOZCO: ["desconozco", "no sé", "no se", "no lo sé", "no lo se", "ni idea", "don't know", "no idea"]
};

// Función para limpiar las preguntas y asegurar que están en español
function limpiarPregunta(pregunta) {
    if (!pregunta) return "¿Qué estás pensando?";
    
    // Quitar formato tipo "/question/" o similares
    pregunta = pregunta.replace(/\/(question|pregunta|query)\/\s*/gi, '');
    
    // Asegurar que empieza con un signo de interrogación si no lo tiene
    if (!pregunta.includes("?") && !pregunta.includes("¿")) {
        pregunta = "¿" + pregunta + "?";
    }
    
    // Traducción simple de palabras comunes inglés-español si parece estar en inglés
    const palabrasIngles = [
        {en: "is", es: "es"},
        {en: "are", es: "es/son"},
        {en: "does", es: "hace"},
        {en: "do", es: "hace"},
        {en: "can", es: "puede"},
        {en: "has", es: "tiene"},
        {en: "have", es: "tiene"},
        {en: "your", es: "tu"},
        {en: "the", es: "el/la"},
        {en: "a", es: "un/una"},
        {en: "you", es: "tú"},
        {en: "they", es: "ellos"},
        {en: "he", es: "él"},
        {en: "she", es: "ella"},
        {en: "it", es: "esto"},
        {en: "this", es: "este/esta"},
        {en: "that", es: "ese/esa"},
        {en: "with", es: "con"},
        {en: "for", es: "para"},
        {en: "from", es: "de"},
        {en: "at", es: "en"},
        {en: "by", es: "por"},
        {en: "on", es: "en"},
        {en: "in", es: "en"},
        {en: "to", es: "a"},
        {en: "of", es: "de"}
    ];
    
    // Detectar si parece estar en inglés (aproximado)
    const palabrasDeteccion = ["is", "are", "does", "do", "the", "this", "that", "with", "for"];
    const preguntaLower = pregunta.toLowerCase();
    
    // Contamos cuántas palabras detectadas en inglés hay
    let contadorIngles = 0;
    
    for (const palabra of palabrasDeteccion) {
        const regex = new RegExp(`\\b${palabra}\\b`, 'i');
        if (regex.test(preguntaLower)) {
            contadorIngles++;
        }
    }
    
    // Si hay 2 o más coincidencias, probable inglés, intentamos traducir
    if (contadorIngles >= 2) {
        // Traducción simple palabra por palabra
        let preguntaTraducida = pregunta;
        
        for (const {en, es} of palabrasIngles) {
            const regex = new RegExp(`\\b${en}\\b`, 'gi');
            preguntaTraducida = preguntaTraducida.replace(regex, es);
        }
        
        return "¿" + preguntaTraducida.replace(/[¿?]/g, '').trim() + "?";
    }
    
    return pregunta;
}

// Función para obtener decoración temática según categoría
function obtenerTematicaCategoria(categoria) {
    const tematicas = {
        personajes: { emoji: "👤", color: "#4CAF50", icono: "user" },
        animales: { emoji: "🐾", color: "#FF9800", icono: "paw" },
        objetos: { emoji: "🔍", color: "#2196F3", icono: "search" },
        paises: { emoji: "🌎", color: "#3F51B5", icono: "globe" },
        famosos: { emoji: "🌟", color: "#E91E63", icono: "star" },
        personajes_anime: { emoji: "🎌", color: "#9C27B0", icono: "tv" },
        videojuegos: { emoji: "🎮", color: "#607D8B", icono: "gamepad" }
    };
    
    return tematicas[categoria.toLowerCase()] || { emoji: "🎲", color: "#795548", icono: "question" };
}

// Traducir respuesta del usuario a un valor normalizado
function normalizarRespuesta(respuestaUsuario) {
    if (!respuestaUsuario) return null;
    
    const respuesta = respuestaUsuario.toLowerCase().trim();
    
    for (const [tipo, opciones] of Object.entries(RESPUESTAS)) {
        if (opciones.includes(respuesta)) {
            return tipo;
        }
    }
    
    // Si no coincide con ninguna respuesta conocida, intentar encontrar la más cercana
    if (respuesta.includes("si") || respuesta.includes("sí")) return "SI";
    if (respuesta.includes("no")) return "NO";
    if (respuesta.includes("tal") || respuesta.includes("quiz")) return "TAL_VEZ";
    if (respuesta.includes("probab") && !respuesta.includes("no")) return "PROBABLEMENTE";
    if (respuesta.includes("probab") && respuesta.includes("no")) return "PROBABLEMENTE_NO";
    if (respuesta.includes("depend") || respuesta.includes("veces")) return "DEPENDE";
    if (respuesta.includes("conozco") || respuesta.includes("idea") || respuesta.includes("sé")) return "DESCONOZCO";
    
    return "DESCONOCIDO";
}

// Endpoint principal para interactuar con el juego
router.get("/", async (req, res) => {
    try {
        const { 
            partidaId, 
            respuesta, 
            categoria = CATEGORIAS.PERSONAJES,
            reiniciar,
            formato = "json"
        } = req.query;

        // Validar categoría
        if (!Object.values(CATEGORIAS).includes(categoria.toLowerCase())) {
            return res.status(400).json({
                "error": "Categoría no válida",
                "categorias_disponibles": Object.values(CATEGORIAS)
            });
        }

        // Verificar si se solicita reiniciar una partida
        if (partidaId && reiniciar === "true") {
            return await reiniciarPartida(partidaId, categoria, res);
        }

        // Si no hay partidaId, iniciar nueva partida
        if (!partidaId) {
            return await iniciarNuevaPartida(categoria, formato, res);
        }

        // Validar que la partida exista
        const partida = partidasActivas[partidaId];
        if (!partida) {
            return res.status(404).json({
                "error": "❌ Partida no encontrada",
                "sugerencia": "Inicia una nueva partida",
                "codigo_error": "PARTIDA_NO_ENCONTRADA"
            });
        }

        // Si ya se adivinó o se ha llegado al límite, mostrar resultado
        if (partida.terminada) {
            return res.json({
                "partidaId": partidaId,
                "terminada": true,
                "personaje": partida.personaje,
                "mensaje": partida.mensajeFinal || "La partida ha terminado",
                "imagen": partida.imagenPersonaje,
                "estadisticas": {
                    "preguntas_totales": partida.preguntasHechas || 0,
                    "tiempo_juego": obtenerTiempoTranscurrido(partida.fechaCreacion)
                }
            });
        }

        // Verificar si la partida ha sido cancelada por inactividad
        if (partida.cancelada) {
            return res.json({
                "🎮": "Akinator API",
                "🆔": partidaId,
                "❗": "Partida cancelada por inactividad",
                "error": true,
                "mensaje": "⏱️ La partida fue cancelada por exceder el tiempo de espera (30 segundos)",
                "sugerencia": "Puedes reiniciar la partida",
                "restart_url": `/api/fun/akinator?partidaId=${partidaId}&reiniciar=true`
            });
        }
        
        // Procesar respuesta si se proporciona
        if (respuesta) {
            const respuestaNormalizada = normalizarRespuesta(respuesta);
            
            if (respuestaNormalizada === "DESCONOCIDO") {
                return res.status(400).json({
                    "error": "❌ Respuesta no reconocida",
                    "sugerencia": "Utiliza una de las siguientes opciones",
                    "opciones_validas": {
                        "✅": RESPUESTAS.SI[0],
                        "❌": RESPUESTAS.NO[0],
                        "🤔": RESPUESTAS.TAL_VEZ[0],
                        "🔄": RESPUESTAS.PROBABLEMENTE[0],
                        "⚠️": RESPUESTAS.PROBABLEMENTE_NO[0],
                        "🔀": RESPUESTAS.DEPENDE[0],
                        "❓": RESPUESTAS.DESCONOZCO[0]
                    },
                    "botones": [
                        { "valor": "si", "texto": "✅ Sí", "color": "#4CAF50" },
                        { "valor": "no", "texto": "❌ No", "color": "#F44336" },
                        { "valor": "tal_vez", "texto": "🤔 Tal vez", "color": "#2196F3" },
                        { "valor": "probablemente", "texto": "🔄 Probablemente", "color": "#FF9800" },
                        { "valor": "desconozco", "texto": "❓ No lo sé", "color": "#9E9E9E" }
                    ]
                });
            }
            
            // Reiniciar temporizador de inactividad
            iniciarTemporizadorPartida(partidaId);
            
            return await procesarRespuesta(partidaId, respuestaNormalizada, formato, res);
        }

        // Reiniciar temporizador de inactividad
        iniciarTemporizadorPartida(partidaId);
        
        // Obtener tema visual según categoría
        const tematica = obtenerTematicaCategoria(partida.categoria);
        
        // Devolver la siguiente pregunta (si no hay respuesta)
        return res.json({
            "🎮": "Akinator API", // Nombre decorativo
            "🆔": partidaId, // ID de partida
            "partidaId": partidaId,
            "❓": partida.preguntaActual, // Pregunta actual con emoji
            "pregunta": partida.preguntaActual,
            "pregunta_numero": partida.preguntasHechas || a0,
            "progreso": `${partida.progreso}%`,
            "progreso_valor": partida.progreso,
            "preguntas_maximas": 30,
            "preguntas_restantes": 30 - partida.preguntasHechas,
            "categoria": partida.categoria,
            "tema": tematica,
            "tiempo_limite": "⏱️ 30 segundos para responder",
            "opciones_respuesta": {
                "✅": "Sí, es correcto",
                "❌": "No",
                "🤔": "Tal vez",
                "🔄": "Probablemente sí",
                "⚠️": "Probablemente no",
                "🔀": "Depende",
                "❓": "No lo sé"
            },
            "botones": [
                { "valor": "si", "texto": "✅ Sí", "color": "#4CAF50" },
                { "valor": "no", "texto": "❌ No", "color": "#F44336" },
                { "valor": "tal_vez", "texto": "🤔 Tal vez", "color": "#2196F3" },
                { "valor": "probablemente", "texto": "🔄 Probablemente", "color": "#FF9800" },
                { "valor": "desconozco", "texto": "❓ No lo sé", "color": "#9E9E9E" }
            ],
            "tiempo_transcurrido": obtenerTiempoTranscurrido(partida.fechaCreacion),
            "tiempo_restante": "30s",
            "next_url": `/api/fun/akinator?partidaId=${partidaId}&respuesta=`
        });

    } catch (error) {
        console.error("Error en la API de Akinator:", error);
        res.status(500).json({ 
            "error": "Error al procesar la solicitud",
            "detalle": error.message 
        });
    }
});

// Endpoint para obtener información de una partida específica
router.get("/partida/:id", (req, res) => {
    const partidaId = req.params.id;
    
    if (!partidaId || !partidasActivas[partidaId]) {
        return res.status(404).json({
            "error": "❌ Partida no encontrada",
            "codigo_error": "PARTIDA_NO_ENCONTRADA"
        });
    }
    
    const partida = partidasActivas[partidaId];
    const tematica = obtenerTematicaCategoria(partida.categoria);
    
    return res.json({
        "🎮": "Akinator API", // Nombre decorativo
        "🆔": partidaId, // ID de partida
        "partidaId": partidaId,
        "estado": partida.terminada ? "✅ Terminada" : "⏳ Activa",
        "personaje": partida.terminada ? partida.personaje : null,
        "imagen": partida.terminada && partida.personaje ? partida.imagenPersonaje : null,
        "progreso": `${partida.progreso}%`,
        "progreso_valor": partida.progreso,
        "categoria": partida.categoria,
        "tema": tematica,
        "❓": partida.preguntaActual,
        "pregunta_actual": partida.preguntaActual,
        "preguntas_hechas": partida.preguntasHechas || 0,
        "preguntas_maximas": 30,
        "preguntas_restantes": 30 - partida.preguntasHechas,
        "tiempo_transcurrido": obtenerTiempoTranscurrido(partida.fechaCreacion),
        "fecha_creacion": partida.fechaCreacion,
        "tiempo_limite": partida.cancelada ? "⌛ Tiempo excedido" : "⏱️ 30 segundos para responder",
        "historial": partida.historial || [],
        "botones": [
            { "valor": "si", "texto": "✅ Sí", "color": "#4CAF50" },
            { "valor": "no", "texto": "❌ No", "color": "#F44336" },
            { "valor": "tal_vez", "texto": "🤔 Tal vez", "color": "#2196F3" },
            { "valor": "probablemente", "texto": "🔄 Probablemente", "color": "#FF9800" },
            { "valor": "desconozco", "texto": "❓ No lo sé", "color": "#9E9E9E" }
        ],
        "next_url": partida.terminada ? 
            `/api/fun/akinator?partidaId=${partidaId}&reiniciar=true` : 
            `/api/fun/akinator?partidaId=${partidaId}&respuesta=`
    });
});

// Iniciar nueva partida
async function iniciarNuevaPartida(categoria, formato, res) {
    try {
        // Obtener pregunta inicial desde la IA
        const respuestaIA = await consultarDeepSeek(`
        Eres un juego de adivinanzas tipo Akinator.
        
        Genera una pregunta inicial para adivinar un ${categoria}.
        IMPORTANTE: RESPONDE SIEMPRE EN ESPAÑOL con una pregunta clara y directa.
        
        Formato de respuesta:
        {
            "pregunta": "La pregunta inicial EN ESPAÑOL (sin formato tipo '/question/')",
            "contexto": "Detalles adicionales que ayuden a entender la pregunta"
        }
        `);

        // Generar ID único para la partida
        const nuevoId = uuidv4();
        
        // Limpiar y verificar la pregunta (asegurar español)
        const preguntaLimpia = limpiarPregunta(respuestaIA.pregunta);
        
        // Crear nueva partida con decoración y metadatos adicionales
        partidasActivas[nuevoId] = {
            id: nuevoId,
            categoria: categoria,
            preguntaActual: preguntaLimpia,
            contexto: respuestaIA.contexto,
            progreso: 0,
            pistas: [],
            terminada: false,
            personaje: null,
            personajeProvisional: null,
            imagenPersonaje: null,
            fechaCreacion: new Date().toISOString(),
            ultimaInteraccion: new Date().toISOString(),
            preguntasHechas: 0,
            cancelada: false,
            confianza: 0,
            historial: [{
                pregunta: preguntaLimpia,
                respuesta: null,
                timestamp: new Date().toISOString()
            }],
            tematica: obtenerTematicaCategoria(categoria)
        };
        
        // Iniciar temporizador de inactividad
        iniciarTemporizadorPartida(nuevoId);

        // Si formato simple, respuesta mínima
        if (formato === 'simple') {
            return res.json({
                "partidaId": nuevoId,
                "pregunta": preguntaLimpia,
                "categoria": categoria,
                "preguntas_maximas": 30
            });
        }
        
        // Respuesta estándar con todos los detalles y decoración
        return res.json({
            "🎮": "Akinator API", // Nombre decorativo
            "🆔": nuevoId, // ID de partida
            "partidaId": nuevoId,
            "❓": preguntaLimpia, // Pregunta actual con emoji
            "pregunta": preguntaLimpia,
            "contexto": respuestaIA.contexto,
            "progreso": 0,
            "pregunta_numero": 0,
            "preguntas_maximas": 30,
            "preguntas_restantes": 30,
            "categoria": categoria,
            "tema": obtenerTematicaCategoria(categoria),
            "tiempo_limite": "⏱️ 30 segundos para responder",
            "opciones_respuesta": {
                "✅": "Sí, es correcto",
                "❌": "No",
                "🤔": "Tal vez",
                "🔄": "Probablemente sí",
                "⚠️": "Probablemente no",
                "🔀": "Depende",
                "❓": "No lo sé"
            },
            "botones": [
                { "valor": "si", "texto": "✅ Sí", "color": "#4CAF50" },
                { "valor": "no", "texto": "❌ No", "color": "#F44336" },
                { "valor": "tal_vez", "texto": "🤔 Tal vez", "color": "#2196F3" },
                { "valor": "probablemente", "texto": "🔄 Probablemente", "color": "#FF9800" },
                { "valor": "desconozco", "texto": "❓ No lo sé", "color": "#9E9E9E" }
            ],
            "next_url": `/api/fun/akinator?partidaId=${nuevoId}&respuesta=`
        });

    } catch (error) {
        console.error("Error iniciando partida:", error);
        res.status(500).json({ 
            "error": "Error al iniciar la partida",
            "detalle": error.message 
        });
    }
}

// Reiniciar una partida existente
async function reiniciarPartida(partidaId, categoria, res) {
    // Verificar si la partida existe
    if (!partidasActivas[partidaId]) {
        return res.status(404).json({
            "error": "❌ Partida no encontrada para reiniciar",
            "sugerencia": "Inicia una nueva partida"
        });
    }
    
    // Usar la misma categoría si no se especifica una nueva
    const categoriaFinal = categoria || partidasActivas[partidaId].categoria;
    
    // Limpiar temporizador asociado si existe
    if (temporizadoresPartidas[partidaId]) {
        clearTimeout(temporizadoresPartidas[partidaId]);
        delete temporizadoresPartidas[partidaId];
    }
    
    // Eliminar la partida anterior
    delete partidasActivas[partidaId];
    
    // Iniciar una nueva partida con el mismo ID
    try {
        // Obtener pregunta inicial desde la IA
        const respuestaIA = await consultarDeepSeek(`
        Eres un juego de adivinanzas tipo Akinator.
        
        Genera una pregunta inicial para adivinar un ${categoriaFinal}.
        IMPORTANTE: RESPONDE SIEMPRE EN ESPAÑOL con una pregunta clara y directa.
        
        Formato de respuesta:
        {
            "pregunta": "La pregunta inicial EN ESPAÑOL (sin formato tipo '/question/')",
            "contexto": "Detalles adicionales que ayuden a entender la pregunta"
        }
        `);
        
        // Limpiar y verificar la pregunta (asegurar español)
        const preguntaLimpia = limpiarPregunta(respuestaIA.pregunta);
        
        // Crear nueva partida con el mismo ID
        partidasActivas[partidaId] = {
            id: partidaId,
            categoria: categoriaFinal,
            preguntaActual: preguntaLimpia,
            contexto: respuestaIA.contexto,
            progreso: 0,
            pistas: [],
            terminada: false,
            personaje: null,
            personajeProvisional: null,
            imagenPersonaje: null,
            fechaCreacion: new Date().toISOString(),
            ultimaInteraccion: new Date().toISOString(),
            preguntasHechas: 0,
            cancelada: false,
            confianza: 0,
            historial: [{
                pregunta: preguntaLimpia,
                respuesta: null,
                timestamp: new Date().toISOString()
            }],
            tematica: obtenerTematicaCategoria(categoriaFinal)
        };
        
        // Iniciar temporizador de inactividad
        iniciarTemporizadorPartida(partidaId);
        
        // Responder
        return res.json({
            "🎮": "Akinator API", // Nombre decorativo
            "🆔": partidaId, // ID de partida
            "partidaId": partidaId,
            "mensaje": "Partida reiniciada correctamente",
            "pregunta": preguntaLimpia,
            "contexto": respuestaIA.contexto,
            "progreso": 0,
            "preguntas_maximas": 30,
            "preguntas_restantes": 30,
            "categoria": categoriaFinal,
            "opciones_respuesta": {
                "✅": "Sí, es correcto",
                "❌": "No",
                "🤔": "Tal vez",
                "🔄": "Probablemente sí",
                "⚠️": "Probablemente no",
                "🔀": "Depende",
                "❓": "No lo sé"
            },
            "botones": [
                { "valor": "si", "texto": "✅ Sí", "color": "#4CAF50" },
                { "valor": "no", "texto": "❌ No", "color": "#F44336" },
                { "valor": "tal_vez", "texto": "🤔 Tal vez", "color": "#2196F3" },
                { "valor": "probablemente", "texto": "🔄 Probablemente", "color": "#FF9800" },
                { "valor": "desconozco", "texto": "❓ No lo sé", "color": "#9E9E9E" }
            ],
            "next_url": `/api/fun/akinator?partidaId=${partidaId}&respuesta=`
        });
        
    } catch (error) {
        console.error("Error reiniciando partida:", error);
        res.status(500).json({ 
            "error": "Error al reiniciar la partida",
            "detalle": error.message 
        });
    }
}

// Procesar respuesta del jugador
async function procesarRespuesta(partidaId, respuesta, formato, res) {
    const partida = partidasActivas[partidaId];
    
    // Incrementar contador de preguntas
    partida.preguntasHechas = (partida.preguntasHechas || 0) + 1;
    
    // Verificar si se alcanzó el límite máximo de preguntas (30)
    if (partida.preguntasHechas >= 30) {
        partida.terminada = true;
        
        // Si hay algún personaje provisional, usarlo como respuesta final
        if (partida.personajeProvisional) {
            partida.personaje = partida.personajeProvisional;
            partida.mensajeFinal = `🤔 Después de ${partida.preguntasHechas} preguntas, mi mejor suposición es: ${partida.personajeProvisional}`;
            
            // Buscar imagen del personaje
            try {
                const imagenInfo = await buscarImagenPersonaje(partida.personajeProvisional);
                partida.imagenPersonaje = imagenInfo;
            } catch (error) {
                console.error("Error buscando imagen:", error);
            }
        } else {
            partida.mensajeFinal = "🔍 He llegado al límite de 30 preguntas y no he podido adivinar. ¡Has ganado esta vez!";
        }
        
        // Liberar el temporizador
        if (temporizadoresPartidas[partidaId]) {
            clearTimeout(temporizadoresPartidas[partidaId]);
            delete temporizadoresPartidas[partidaId];
        }
        
        // Devolver resultado final
        return devolverResultadoFinal(partidaId, formato, res);
    }
    
    // Guardar la respuesta en el historial
    if (partida.historial && partida.historial.length > 0) {
        // Actualizar la última entrada con la respuesta
        partida.historial[partida.historial.length - 1].respuesta = respuesta;
    }
    
    // Construir el prompt para la IA teniendo en cuenta más tipos de respuestas
    let descripcionRespuesta;
    let emojiRespuesta;
    
    switch(respuesta) {
        case "SI": 
            descripcionRespuesta = "Sí, es correcto";
            emojiRespuesta = "✅";
            break;
        case "NO": 
            descripcionRespuesta = "No";
            emojiRespuesta = "❌";
            break;
        case "TAL_VEZ": 
            descripcionRespuesta = "Tal vez, no estoy seguro";
            emojiRespuesta = "🤔";
            break;
        case "PROBABLEMENTE": 
            descripcionRespuesta = "Probablemente sí";
            emojiRespuesta = "🔄";
            break;
        case "PROBABLEMENTE_NO": 
            descripcionRespuesta = "Probablemente no";
            emojiRespuesta = "⚠️";
            break;
        case "DEPENDE": 
            descripcionRespuesta = "Depende, no siempre";
            emojiRespuesta = "🔀";
            break;
        case "DESCONOZCO": 
            descripcionRespuesta = "No lo sé, desconozco esa información";
            emojiRespuesta = "❓";
            break;
        default:
            descripcionRespuesta = respuesta;
            emojiRespuesta = "🔍";
    }
    
    // Actualizar última interacción para el tiempo de espera
    partida.ultimaInteraccion = new Date().toISOString();
    
    // Consultar a la IA para procesar la respuesta y generar nueva pregunta
    const respuestaIA = await consultarDeepSeek(`
    Estás jugando Akinator para adivinar un ${partida.categoria}.
    
    Contexto actual: ${partida.contexto || 'Sin contexto previo'}
    Última pregunta: ${partida.preguntaActual}
    Respuesta del jugador: ${descripcionRespuesta}
    Número de preguntas realizadas: ${partida.preguntasHechas}
    Preguntas restantes: ${30 - partida.preguntasHechas}
    
    IMPORTANTE: RESPONDE SIEMPRE EN ESPAÑOL.
    
    Genera la siguiente pregunta, actualizando tu conocimiento según la respuesta. La pregunta debe ser clara y directa.
    
    Formato de respuesta:
    {
        "pregunta": "Nueva pregunta para seguir adivinando (EN ESPAÑOL, sin formato tipo '/pregunta/')",
        "contexto": "Información actualizada basada en la respuesta",
        "progresoAdivinanza": 0-100,
        "probabilidadAdivinanza": true/false,
        "personajeProvisional": "Si crees que ya sabes qué es, ponlo aquí, sino null",
        "confianza": 0-100,
        "mensajeFinal": "Si tienes un personaje con alta confianza, añade un mensaje final",
        "descripcion": "Breve descripción del personaje si lo has adivinado"
    }
    `);

    // Actualizar estado de la partida
    partida.preguntaActual = limpiarPregunta(respuestaIA.pregunta);
    partida.contexto = respuestaIA.contexto;
    partida.progreso = respuestaIA.progresoAdivinanza || Math.min(100, partida.progreso + 5);
    partida.ultimaInteraccion = new Date().toISOString();
    partida.confianza = respuestaIA.confianza || 0;
    partida.personajeProvisional = respuestaIA.personajeProvisional || partida.personajeProvisional;
    
    // Añadir la nueva pregunta al historial
    partida.historial.push({
        pregunta: partida.preguntaActual,
        respuesta: null,
        timestamp: new Date().toISOString()
    });
    
    // Ver si la IA cree que ya puede adivinar
    const confianza = respuestaIA.confianza || 0;
    const umbralConfianza = 85; // Umbral alto para evitar adivinanzas incorrectas
    
    // Verificar si ya podemos adivinar el personaje
    if (respuestaIA.probabilidadAdivinanza && confianza >= umbralConfianza) {
        // Guardar el personaje y marcar como terminada
        partida.terminada = true;
        partida.personaje = respuestaIA.personajeProvisional;
        partida.mensajeFinal = respuestaIA.mensajeFinal || `✨ ¡Creo que es ${respuestaIA.personajeProvisional}!`;
        partida.descripcionPersonaje = respuestaIA.descripcion || `Un ${partida.categoria}`;
        
        // Buscar una imagen del personaje
        try {
            const imagenInfo = await buscarImagenPersonaje(respuestaIA.personajeProvisional);
            partida.imagenPersonaje = imagenInfo;
        } catch (error) {
            console.error("Error buscando imagen:", error);
            partida.imagenPersonaje = {
                personaje: respuestaIA.personajeProvisional,
                searchUrl: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(respuestaIA.personajeProvisional)}`
            };
        }
        
        // Liberar el temporizador
        if (temporizadoresPartidas[partidaId]) {
            clearTimeout(temporizadoresPartidas[partidaId]);
            delete temporizadoresPartidas[partidaId];
        }
        
        return devolverResultadoFinal(partidaId, formato, res);
    }
    
    // Si formato simple, respuesta mínima
    if (formato === 'simple') {
        const respuesta = {
            "partidaId": partidaId,
            "pregunta": partida.preguntaActual,
            "terminada": partida.terminada,
            "personaje": partida.terminada ? partida.personaje : null,
            "mensaje": partida.terminada ? partida.mensajeFinal : null,
            "preguntas_realizadas": partida.preguntasHechas,
            "preguntas_maximas": 30
        };
        
        // Si terminada y hay personaje, incluir imagen
        if (partida.terminada && partida.personaje && partida.imagenPersonaje) {
            respuesta.imagen = partida.imagenPersonaje;
        }
        
        return res.json(respuesta);
    }
    
    // Obtener tema visual según categoría
    const tematica = obtenerTematicaCategoria(partida.categoria);
    
    // Construir respuesta con decoración según si terminó o no
    if (partida.terminada) {
        return devolverResultadoFinal(partidaId, formato, res);
    } else {
        // Respuesta cuando aún está en curso
        return res.json({
            "🎮": "Akinator API", // Nombre decorativo
            "🆔": partidaId, // ID de partida
            "partidaId": partidaId,
            "❓": respuestaIA.pregunta, // Pregunta actual con emoji
            "pregunta": partida.preguntaActual,
            "contexto": respuestaIA.contexto,
            "progreso": `${partida.progreso}%`,
            "progreso_valor": partida.progreso,
            "pregunta_numero": partida.preguntasHechas,
            "preguntas_restantes": 30 - partida.preguntasHechas,
            "preguntas_maximas": 30,
            "categoria": partida.categoria,
            "tema": tematica,
            "terminada": false,
            "tiempo_limite": "⏱️ 30 segundos para responder",
            "tiempo_transcurrido": obtenerTiempoTranscurrido(partida.fechaCreacion),
            "opciones_respuesta": {
                "✅": "Sí, es correcto",
                "❌": "No",
                "🤔": "Tal vez",
                "🔄": "Probablemente sí",
                "⚠️": "Probablemente no",
                "🔀": "Depende",
                "❓": "No lo sé"
            },
            "botones": [
                { "valor": "si", "texto": "✅ Sí", "color": "#4CAF50" },
                { "valor": "no", "texto": "❌ No", "color": "#F44336" },
                { "valor": "tal_vez", "texto": "🤔 Tal vez", "color": "#2196F3" },
                { "valor": "probablemente", "texto": "🔄 Probablemente", "color": "#FF9800" },
                { "valor": "desconozco", "texto": "❓ No lo sé", "color": "#9E9E9E" }
            ],
            "next_url": `/api/fun/akinator?partidaId=${partidaId}&respuesta=`
        });
    }
}

// Función para devolver el resultado final cuando se adivina o termina
function devolverResultadoFinal(partidaId, formato, res) {
    const partida = partidasActivas[partidaId];
    
    // Si formato simple, respuesta mínima
    if (formato === 'simple') {
        const respuesta = {
            "partidaId": partidaId,
            "terminada": true,
            "personaje": partida.personaje,
            "mensaje": partida.mensajeFinal
        };
        
        // Si terminada y hay personaje, incluir imagen
        if (partida.personaje && partida.imagenPersonaje) {
            respuesta.imagen = partida.imagenPersonaje;
        }
        
        return res.json(respuesta);
    }
    
    // Obtener tema visual según categoría
    const tematica = obtenerTematicaCategoria(partida.categoria);
    
    // Respuesta cuando ha terminado (adivinado o cancelado)
    return res.json({
        "🎮": "Akinator API", // Nombre decorativo
        "🆔": partidaId, // ID de partida
        "partidaId": partidaId,
        "estado": "✅ ¡Adivinado!",
        "terminada": true,
        "✨": partida.personaje,
        "personaje": partida.personaje,
        "mensaje": partida.mensajeFinal,
        "imagen": partida.imagenPersonaje,
        "descripcion": partida.descripcionPersonaje || `Un ${partida.categoria}`,
        "confianza": `${partida.confianza}%`,
        "progreso": `100%`,
        "pregunta_numero": partida.preguntasHechas,
        "preguntas_maximas": 30,
        "categoria": partida.categoria,
        "tema": tematica,
        "tiempo_transcurrido": obtenerTiempoTranscurrido(partida.fechaCreacion),
        "estadisticas": {
            "preguntas_realizadas": partida.preguntasHechas,
            "tiempo_total": obtenerTiempoTranscurrido(partida.fechaCreacion),
            "fecha_inicio": partida.fechaCreacion,
            "fecha_fin": new Date().toISOString()
        },
        "acciones": {
            "reiniciar": `/api/fun/akinator?partidaId=${partidaId}&reiniciar=true`,
            "nueva_partida": "/api/fun/akinator"
        }
    });
}

// Función para buscar una imagen del personaje
async function buscarImagenPersonaje(personaje) {
    try {
        // Construir URL de búsqueda de Google Images
        const searchQuery = encodeURIComponent(`${personaje} personaje`);
        
        // Opción 1: Devolver URL para que cliente realice la búsqueda
        const searchUrl = `https://www.google.com/search?tbm=isch&q=${searchQuery}`;
        
        // Opción 2: Intentar obtener una imagen directamente (mock)
        // Aquí podrías implementar una búsqueda real con una API como Google Custom Search,
        // Bing Image Search o similar. Por ahora usaremos un enfoque simplificado.
        const imageUrl = `https://via.placeholder.com/300x300?text=${encodeURIComponent(personaje)}`;
        
        return {
            searchUrl: searchUrl,
            imageUrl: imageUrl,
            personaje: personaje
        };
    } catch (error) {
        console.error("Error buscando imagen:", error);
        return {
            searchUrl: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(personaje)}`,
            error: "No se pudo obtener una imagen directa"
        };
    }
}

// Función para manejar el tiempo de espera de una partida
function iniciarTemporizadorPartida(partidaId) {
    // Cancelar temporizador anterior si existe
    if (temporizadoresPartidas[partidaId]) {
        clearTimeout(temporizadoresPartidas[partidaId]);
    }
    
    // Crear nuevo temporizador (30 segundos)
    temporizadoresPartidas[partidaId] = setTimeout(() => {
        // Verificar si la partida aún existe
        if (partidasActivas[partidaId]) {
            // Marcar como cancelada por inactividad
            partidasActivas[partidaId].cancelada = true;
            partidasActivas[partidaId].mensajeFinal = "✨ Partida cancelada por inactividad (30 segundos sin respuesta)";
            partidasActivas[partidaId].terminada = true;
            
            console.log(`⏱️ Partida ${partidaId} cancelada por tiempo de espera excedido`);
        }
        
        // Eliminar referencia al temporizador
        delete temporizadoresPartidas[partidaId];
    }, 30000); // 30 segundos
}

// Función para calcular el tiempo transcurrido
function obtenerTiempoTranscurrido(fechaInicio) {
    const inicio = new Date(fechaInicio).getTime();
    const ahora = Date.now();
    const diferenciaMs = ahora - inicio;
    
    const segundos = Math.floor(diferenciaMs / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    
    if (horas > 0) {
        return `${horas}h ${minutos % 60}m`;
    } else if (minutos > 0) {
        return `${minutos}m ${segundos % 60}s`;
    } else {
        return `${segundos}s`;
    }
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
        } catch (parseError) {
            console.error("Error al parsear respuesta JSON:", parseError);
            
            // Si falla el parseo, aplicar un regex para extraer JSON
            const jsonMatch = response.data.respuesta.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (secondParseError) {
                    console.error("Error en segundo intento de parsing:", secondParseError);
                }
            }
            
            // Si todo falla, devolver un objeto con la pregunta directamente
            return { 
                pregunta: response.data.respuesta, 
                contexto: "Respuesta no estructurada",
                progresoAdivinanza: 10
            };
        }
    } catch (error) {
        console.error("Error consultando DeepSeek:", error);
        throw error;
    }
}

// Endpoint de info (versión mejorada)
router.get("/info", (req, res) => {
    const estadisticas = {
        partidas_activas: Object.keys(partidasActivas).length,
        partidas_por_categoria: {}
    };
    
    // Calcular estadísticas por categoría
    Object.values(partidasActivas).forEach(partida => {
        const categoria = partida.categoria;
        if (!estadisticas.partidas_por_categoria[categoria]) {
            estadisticas.partidas_por_categoria[categoria] = 0;
        }
        estadisticas.partidas_por_categoria[categoria]++;
    });
    
    res.json({
        "nombre": "Akinator API - Versión Mejorada",
        "descripcion": "Juego de adivinanzas con inteligencia artificial",
        "categorias": Object.values(CATEGORIAS),
        "opciones_respuesta": {
            "SI": RESPUESTAS.SI[0],
            "NO": RESPUESTAS.NO[0],
            "TAL_VEZ": RESPUESTAS.TAL_VEZ[0],
            "PROBABLEMENTE": RESPUESTAS.PROBABLEMENTE[0],
            "PROBABLEMENTE_NO": RESPUESTAS.PROBABLEMENTE_NO[0],
            "DEPENDE": RESPUESTAS.DEPENDE[0],
            "DESCONOZCO": RESPUESTAS.DESCONOZCO[0]
        },
        "preguntas_maximas": 30,
        "tiempo_limite": "30 segundos entre respuestas",
        "instrucciones": [
            "1. Inicia una partida: GET /api/fun/akinator?categoria=personajes",
            "2. Responde a las preguntas: GET /api/fun/akinator?partidaId=ID&respuesta=RESPUESTA",
            "3. Reinicia una partida: GET /api/fun/akinator?partidaId=ID&reiniciar=true",
            "4. Consulta estado de partida: GET /api/fun/akinator/partida/ID"
        ],
        "ejemplos": [
            "/api/fun/akinator?categoria=personajes_anime",
            "/api/fun/akinator?partidaId=abc123&respuesta=si",
            "/api/fun/akinator?partidaId=abc123&respuesta=tal vez",
            "/api/fun/akinator?formato=simple (para respuestas simplificadas)"
        ],
        "estadisticas": estadisticas
    });
});

// Endpoint para listar partidas activas (admin)
router.get("/admin/partidas", (req, res) => {
    // Aquí podrías implementar autenticación para administradores
    const { key } = req.query;
    
    if (key !== "admin_key_secreta") {
        return res.status(403).json({ "error": "No autorizado" });
    }
    
    const resumen = Object.entries(partidasActivas).map(([id, partida]) => ({
        id,
        categoria: partida.categoria,
        progreso: partida.progreso,
        terminada: partida.terminada,
        creacion: partida.fechaCreacion,
        preguntas: partida.preguntasHechas || 0,
        preguntas_restantes: 30 - (partida.preguntasHechas || 0)
    }));
    
    res.json({
        total_partidas: resumen.length,
        partidas: resumen
    });
});

// Limpiar partidas caducadas y temporizadores
setInterval(() => {
    const ahora = Date.now();
    const tiempoMaximo = 60 * 60 * 1000; // 1 hora (mayor tiempo de caducidad)
    let partidasEliminadas = 0;
    let temporizadoresLimpiados = 0;
    
    // Limpiar partidas inactivas
    Object.keys(partidasActivas).forEach(id => {
        const partida = partidasActivas[id];
        const ultimaInteraccion = new Date(partida.ultimaInteraccion || partida.fechaCreacion).getTime();
        const tiempoTranscurrido = ahora - ultimaInteraccion;
        
        if (tiempoTranscurrido > tiempoMaximo) {
            // Limpiar temporizador asociado si existe
            if (temporizadoresPartidas[id]) {
                clearTimeout(temporizadoresPartidas[id]);
                delete temporizadoresPartidas[id];
                temporizadoresLimpiados++;
            }
            
            // Eliminar partida
            delete partidasActivas[id];
            partidasEliminadas++;
        }
    });
    
    // Limpiar temporizadores huérfanos (sin partida asociada)
    Object.keys(temporizadoresPartidas).forEach(id => {
        if (!partidasActivas[id]) {
            clearTimeout(temporizadoresPartidas[id]);
            delete temporizadoresPartidas[id];
            temporizadoresLimpiados++;
        }
    });
    
    if (partidasEliminadas > 0 || temporizadoresLimpiados > 0) {
        console.log(`🧹 Limpieza: ${partidasEliminadas} partidas y ${temporizadoresLimpiados} temporizadores eliminados por inactividad`);
    }
}, 10 * 60 * 1000); // Ejecutar cada 10 minutos

module.exports = router;
