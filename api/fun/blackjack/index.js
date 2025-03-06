// api/fun/blackjack/index.js
const express = require("express");
const Groq = require("groq-sdk");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Inicializar el cliente de Groq con la API key
const groq = new Groq({ apiKey: "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" });

// Almacenamiento en memoria para las partidas activas
const partidasActivas = {};

/**
 * API de Juego 21 - Juega contra la IA
 */
router.get("/", async (req, res) => {
    try {
        const { cartasJugador, cartasDealer, accion, partidaId, id } = req.query;

        // Verificar si una partida existe
        if (id && !accion) {
            if (partidasActivas[id]) {
                return res.json({
                    existe: true,
                    partidaId: id,
                    acciones_restantes: 10 - partidasActivas[id].contador,
                    acciones_totales: partidasActivas[id].acciones.length,
                    fecha_creacion: partidasActivas[id].fechaCreacion
                });
            } else {
                return res.json({
                    existe: false,
                    mensaje: "La partida no existe o ha expirado"
                });
            }
        }
        
        // Caso especial: Iniciar nueva partida
        if (accion === "iniciar") {
            const nuevoId = uuidv4();
            partidasActivas[nuevoId] = {
                acciones: [],
                contador: 0,
                fechaCreacion: new Date().toISOString()
            };
            
            return res.json({
                mensaje: "Nueva partida de 21 iniciada",
                partidaId: nuevoId,
                acciones_restantes: 10,
                instrucciones: "Usa este partidaId en tus próximas solicitudes. La partida durará por 10 acciones."
            });
        }

        // Validar que se proporcione partidaId para todas las demás acciones
        if (!partidaId) {
            return res.status(400).json({ 
                error: "Debes proporcionar un partidaId", 
                instrucciones: "Primero inicia una partida con ?accion=iniciar o proporciona un partidaId válido",
                ejemplo: "/api/fun/blackjack?partidaId=abc123&cartasJugador=A,10&cartasDealer=8,4&accion=pedir"
            });
        }
        
        // Validar parámetros
        if (!cartasJugador || !cartasDealer) {
            return res.status(400).json({ 
                error: "Debes proporcionar las cartas del jugador y del dealer", 
                ejemplo: "/api/fun/blackjack?partidaId=abc123&cartasJugador=A,10&cartasDealer=8,4&accion=pedir"
            });
        }

        // Verificar si la partida existe
        if (partidaId && !partidasActivas[partidaId]) {
            return res.status(404).json({
                error: "Partida no encontrada o expirada",
                sugerencia: "Inicia una nueva partida con ?accion=iniciar"
            });
        }

        // Parsear las cartas
        const cartasJugadorArray = cartasJugador.split(',').map(carta => carta.trim());
        const cartasDealerArray = cartasDealer.split(',').map(carta => carta.trim());

        // Calcular los valores de las manos
        const valorJugador = calcularValorMano(cartasJugadorArray);
        const valorDealer = calcularValorMano(cartasDealerArray);

        // Determinar estado actual del juego
        let estadoJuego = determinarEstadoJuego(valorJugador, valorDealer);

        // Si el juego sigue en curso, consultar a Groq para la próxima acción del dealer
        let decisionDealer = null;
        let pensamientoDealer = null;
        let resultado = null;

        // Obtener siempre el pensamiento del dealer mientras el juego esté en curso
        if (estadoJuego === "en_curso") {
            const respuestaDealer = await consultarGroqDealer(cartasJugadorArray, cartasDealerArray, valorJugador, valorDealer);
            pensamientoDealer = respuestaDealer.pensamiento;
            
            if (accion === "plantar") {
                // El jugador se planta, el dealer toma su decisión
                decisionDealer = respuestaDealer.decision;
                resultado = procesarDecisionDealer(decisionDealer, valorJugador, valorDealer);
            } else {
                // El juego continúa, pero el dealer sigue analizando
                decisionDealer = "esperando";
                resultado = {
                    estado: "en_curso",
                    mensaje: "El juego continúa. Puedes pedir otra carta o plantarte."
                };
            }
        } else {
            // El juego ha terminado (alguien se pasó de 21 o hay 21 exacto)
            resultado = {
                estado: estadoJuego,
                mensaje: obtenerMensajeFinal(estadoJuego)
            };
            
            // Aún así, obtener el pensamiento del dealer sobre el resultado final
            const respuestaDealer = await consultarGroqDealerFinal(cartasJugadorArray, cartasDealerArray, valorJugador, valorDealer, estadoJuego);
            pensamientoDealer = respuestaDealer.pensamiento;
        }

        // Registrar la acción en la partida si hay partidaId
        if (partidaId && partidasActivas[partidaId]) {
            // Incrementar contador de acciones
            partidasActivas[partidaId].contador++;
            
            // Guardar la acción actual
            partidasActivas[partidaId].acciones.push({
                indice: partidasActivas[partidaId].contador,
                fecha: new Date().toISOString(),
                accion: accion || "observar",
                cartasJugador: [...cartasJugadorArray],
                cartasDealer: [...cartasDealerArray],
                valorJugador,
                valorDealer,
                pensamientoDealer,
                estadoJuego
            });
            
            // Mantener solo las últimas 10 acciones
            if (partidasActivas[partidaId].acciones.length > 10) {
                partidasActivas[partidaId].acciones.shift();
            }
            
            // Si se alcanzó el límite de 10 acciones, marcar la partida para eliminación
            if (partidasActivas[partidaId].contador >= 10) {
                setTimeout(() => {
                    delete partidasActivas[partidaId];
                }, 60000); // Dar 1 minuto extra después de la última acción
            }
        }

        // Construir respuesta completa
        const respuesta = {
            mano_jugador: {
                cartas: cartasJugadorArray,
                valor: valorJugador
            },
            mano_dealer: {
                cartas: cartasDealerArray,
                valor: valorDealer
            },
            decision_dealer: decisionDealer,
            pensamiento_dealer: pensamientoDealer,
            resultado: resultado
        };

        // Incluir información de la partida si hay partidaId
        if (partidaId && partidasActivas[partidaId]) {
            respuesta.partida = {
                id: partidaId,
                acciones_restantes: 10 - partidasActivas[partidaId].contador,
                historial: partidasActivas[partidaId].acciones
            };
        }

        res.json(respuesta);

    } catch (error) {
        console.error("Error en la API de 21:", error);
        res.status(500).json({ 
            error: "Error al procesar el juego de 21", 
            detalle: error.message 
        });
    }
});

/**
 * Calcula el valor de una mano de 21, considerando los Ases como 1 u 11
 */
function calcularValorMano(cartas) {
    let valor = 0;
    let ases = 0;

    for (const carta of cartas) {
        if (carta === 'A') {
            ases++;
            valor += 11;
        } else if (['J', 'Q', 'K'].includes(carta)) {
            valor += 10;
        } else {
            valor += parseInt(carta);
        }
    }

    // Ajustar valor de Ases si es necesario para evitar pasarse de 21
    while (valor > 21 && ases > 0) {
        valor -= 10;  // Cambiar un As de 11 a 1
        ases--;
    }

    return valor;
}

/**
 * Determina el estado actual del juego basado en los valores de las manos
 */
function determinarEstadoJuego(valorJugador, valorDealer) {
    if (valorJugador === 21) {
        return "blackjack_jugador";
    } else if (valorDealer === 21) {
        return "blackjack_dealer";
    } else if (valorJugador > 21) {
        return "jugador_pierde";
    } else if (valorDealer > 21) {
        return "jugador_gana";
    } else {
        return "en_curso";
    }
}

/**
 * Consulta a Groq para obtener la decisión y el pensamiento del dealer durante el juego
 */
async function consultarGroqDealer(cartasJugador, cartasDealer, valorJugador, valorDealer) {
    try {
        const prompt = `
Estás jugando una partida de 21 como dealer (similar al Blackjack).
Reglas:
- Cartas J, Q, K valen 10
- Ases valen 1 u 11, lo que más convenga
- El objetivo es acercarse a 21 sin pasarse
- El dealer debe plantarse con 17 o más y pedir carta con 16 o menos

Situación actual:
- Cartas del jugador: ${cartasJugador.join(', ')} (Valor total: ${valorJugador})
- Tus cartas como dealer: ${cartasDealer.join(', ')} (Valor total: ${valorDealer})

Analiza la situación como un dealer experto. Responde en formato JSON con estos dos campos:
1. "pensamiento": Escribe tu análisis detallado de la situación actual, valorando las probabilidades y riesgos (entre 50-100 caracteres)
2. "decision": SOLO puedes responder con "continuar" o "parar"

Formato exacto de respuesta:
{
  "pensamiento": "Tu análisis aquí (50-100 caracteres)",
  "decision": "continuar" o "parar"
}
`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-r1-distill-qwen-32b",
            max_tokens: 200,
            temperature: 0.7
        });

        const respuesta = completion.choices[0].message.content.trim();
        
        try {
            // Intentar parsear la respuesta como JSON
            const jsonRespuesta = JSON.parse(respuesta);
            
            // Asegurarse de que la decisión esté normalizada
            if (jsonRespuesta.decision) {
                jsonRespuesta.decision = jsonRespuesta.decision.toLowerCase();
                // Normalizar la decisión a solo "continuar" o "parar"
                if (jsonRespuesta.decision.includes("continuar") || 
                    jsonRespuesta.decision.includes("pedir") || 
                    jsonRespuesta.decision.includes("otra carta") ||
                    jsonRespuesta.decision.includes("avanzar")) {
                    jsonRespuesta.decision = "continuar";
                } else {
                    jsonRespuesta.decision = "parar";
                }
            } else {
                // Si no hay decisión, establecer valor por defecto
                jsonRespuesta.decision = valorDealer < 17 ? "continuar" : "parar";
            }
            
            return {
                pensamiento: jsonRespuesta.pensamiento || "Con " + valorDealer + " puntos, analizo probabilidades y me guío por la estrategia básica del 21.",
                decision: jsonRespuesta.decision
            };
        } catch (jsonError) {
            console.error("Error al parsear JSON de la respuesta:", jsonError);
            
            // Extracción de pensamiento por defecto basado en la situación
            let pensamiento = "Con " + valorDealer + " puntos, debo seguir la estrategia básica del 21.";
            
            // Si no se puede parsear como JSON, intentar extraer la decisión del texto
            let decision = valorDealer < 17 ? "continuar" : "parar";
            if (respuesta.toLowerCase().includes("continuar") || 
                respuesta.toLowerCase().includes("pedir") || 
                respuesta.toLowerCase().includes("otra carta") ||
                respuesta.toLowerCase().includes("avanzar")) {
                decision = "continuar";
            } else if (respuesta.toLowerCase().includes("parar") || 
                       respuesta.toLowerCase().includes("planto") || 
                       respuesta.toLowerCase().includes("me quedo")) {
                decision = "parar";
            }
            
            return {
                pensamiento: pensamiento,
                decision: decision
            };
        }
    } catch (error) {
        console.error("Error consultando a Groq:", error);
        // En caso de error, tomar una decisión por defecto basada en reglas clásicas
        return {
            pensamiento: valorDealer < 17 ? 
                         "Tengo " + valorDealer + " puntos, debo pedir carta según las reglas básicas." : 
                         "Con " + valorDealer + " puntos, debo plantarme según las reglas básicas.",
            decision: valorDealer < 17 ? "continuar" : "parar"
        };
    }
}

/**
 * Consulta a Groq para obtener el pensamiento del dealer sobre el resultado final
 */
async function consultarGroqDealerFinal(cartasJugador, cartasDealer, valorJugador, valorDealer, estadoJuego) {
    try {
        let situacion = "";
        if (estadoJuego === "blackjack_jugador") {
            situacion = "El jugador tiene 21 exactos y ha ganado.";
        } else if (estadoJuego === "blackjack_dealer") {
            situacion = "Como dealer, tengo 21 exactos y he ganado.";
        } else if (estadoJuego === "jugador_pierde") {
            situacion = "El jugador se ha pasado de 21 y ha perdido.";
        } else if (estadoJuego === "jugador_gana") {
            situacion = "Como dealer, me he pasado de 21 y he perdido.";
        }

        const prompt = `
Partida de 21 finalizada:
- Cartas del jugador: ${cartasJugador.join(', ')} (Valor total: ${valorJugador})
- Tus cartas como dealer: ${cartasDealer.join(', ')} (Valor total: ${valorDealer})
- Resultado: ${situacion}

Como dealer experto, analiza brevemente el resultado final del juego.
Responde SOLO con un objeto JSON con un campo "pensamiento" que contenga tu análisis (entre 50-100 caracteres).

Formato exacto de respuesta:
{
  "pensamiento": "Tu análisis aquí (50-100 caracteres)"
}
`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-r1-distill-qwen-32b",
            max_tokens: 150,
            temperature: 0.7
        });

        const respuesta = completion.choices[0].message.content.trim();
        
        try {
            // Intentar parsear la respuesta como JSON
            const jsonRespuesta = JSON.parse(respuesta);
            return {
                pensamiento: jsonRespuesta.pensamiento || `Partida finalizada con ${valorDealer} vs ${valorJugador}. ${situacion}`
            };
        } catch (jsonError) {
            // Si falla el parseo, extraer un pensamiento del texto o usar uno predeterminado
            return {
                pensamiento: `Partida finalizada con ${valorDealer} vs ${valorJugador}. ${situacion}`
            };
        }
    } catch (error) {
        console.error("Error consultando a Groq para el resultado final:", error);
        return {
            pensamiento: `Partida finalizada. ${estadoJuego.replace('_', ' ')}.`
        };
    }
}

/**
 * Procesa la decisión del dealer y determina el resultado del juego
 */
function procesarDecisionDealer(decision, valorJugador, valorDealer) {
    if (decision === "parar") {
        // El dealer se planta, comparar valores
        if (valorDealer > valorJugador) {
            return {
                estado: "dealer_gana",
                mensaje: `El dealer se planta con ${valorDealer}. Gana al jugador que tiene ${valorJugador}.`
            };
        } else if (valorDealer < valorJugador) {
            return {
                estado: "jugador_gana",
                mensaje: `El dealer se planta con ${valorDealer}. Pierde contra el jugador que tiene ${valorJugador}.`
            };
        } else {
            return {
                estado: "empate",
                mensaje: `¡Empate! Ambos tienen ${valorJugador}.`
            };
        }
    } else {
        // El dealer pide otra carta
        return {
            estado: "dealer_avanza",
            mensaje: "El dealer decide pedir otra carta."
        };
    }
}

/**
 * Obtiene un mensaje descriptivo para el estado final del juego
 */
function obtenerMensajeFinal(estado) {
    switch (estado) {
        case "blackjack_jugador":
            return "¡21 exactos! El jugador gana.";
        case "blackjack_dealer":
            return "¡21 exactos para el dealer! El dealer gana.";
        case "jugador_pierde":
            return "El jugador se pasa de 21. ¡El dealer gana!";
        case "jugador_gana":
            return "El dealer se pasa de 21. ¡El jugador gana!";
        default:
            return "El juego continúa.";
    }
}

// Limpiar partidas inactivas cada hora
setInterval(() => {
    const ahora = Date.now();
    const unaHoraMs = 60 * 60 * 1000;
    
    for (const partidaId in partidasActivas) {
        const ultimaAccion = new Date(partidasActivas[partidaId].acciones[partidasActivas[partidaId].acciones.length - 1]?.fecha || 0).getTime();
        if (ahora - ultimaAccion > unaHoraMs) {
            delete partidasActivas[partidaId];
        }
    }
}, 30 * 60 * 1000); // Revisar cada 30 minutos

// Exportar el router para que pueda ser utilizado en la aplicación principal
module.exports = router;
