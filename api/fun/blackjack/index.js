// api/fun/blackjack/index.js
const express = require("express");
const Groq = require("groq-sdk");
const router = express.Router();

// Inicializar el cliente de Groq con la API key
const groq = new Groq({ apiKey: "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" });

// Almacenamiento en memoria para las últimas 10 acciones por sesión
const sesionesJuego = {};

/**
 * API de Juego 21/Blackjack - Juega contra la IA
 */
router.get("/", async (req, res) => {
    try {
        const { cartasJugador, cartasDealer, accion, sessionId } = req.query;

        // Validar parámetros
        if (!cartasJugador || !cartasDealer) {
            return res.status(400).json({ 
                error: "Debes proporcionar las cartas del jugador y del dealer", 
                ejemplo: "/api/fun/blackjack?cartasJugador=A,10&cartasDealer=8,4&accion=iniciar&sessionId=abc123"
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

        // Gestionar historial de acciones
        if (sessionId) {
            if (!sesionesJuego[sessionId]) {
                sesionesJuego[sessionId] = {
                    acciones: [],
                    timestamp: Date.now()
                };
            }

            // Actualizar acción actual
            if (accion) {
                const nuevaAccion = {
                    fecha: new Date().toISOString(),
                    accion: accion,
                    cartasJugador: [...cartasJugadorArray],
                    cartasDealer: [...cartasDealerArray],
                    valorJugador,
                    valorDealer
                };
                
                // Mantener solo las últimas 10 acciones
                sesionesJuego[sessionId].acciones.push(nuevaAccion);
                if (sesionesJuego[sessionId].acciones.length > 10) {
                    sesionesJuego[sessionId].acciones.shift();
                }
                
                // Actualizar timestamp
                sesionesJuego[sessionId].timestamp = Date.now();
            }
        }

        // Si el juego sigue en curso, consultar a Groq para la próxima acción del dealer
        let decisionDealer = null;
        let pensamientoDealer = null;
        let resultado = null;

        if (estadoJuego === "en_curso") {
            if (accion === "plantar") {
                // El jugador se planta, el dealer decide
                const respuestaDealer = await consultarGroqDealer(cartasJugadorArray, cartasDealerArray, valorJugador, valorDealer);
                decisionDealer = respuestaDealer.decision;
                pensamientoDealer = respuestaDealer.pensamiento;
                resultado = procesarDecisionDealer(decisionDealer, valorJugador, valorDealer);
            } else {
                // El juego continúa
                decisionDealer = "esperando";
                resultado = {
                    estado: "en_curso",
                    mensaje: "El juego continúa. Puedes pedir otra carta o plantarte."
                };
            }
        } else {
            // El juego ha terminado (alguien se pasó de 21 o hay blackjack)
            resultado = {
                estado: estadoJuego,
                mensaje: obtenerMensajeFinal(estadoJuego)
            };
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

        // Incluir historial de acciones si hay sessionId
        if (sessionId && sesionesJuego[sessionId]) {
            respuesta.historial = sesionesJuego[sessionId].acciones;
        }

        // Limpiar sesiones antiguas (más de 1 hora)
        limpiarSesionesAntiguas();

        res.json(respuesta);

    } catch (error) {
        console.error("Error en la API de Blackjack:", error);
        res.status(500).json({ 
            error: "Error al procesar el juego de 21", 
            detalle: error.message 
        });
    }
});

/**
 * Calcula el valor de una mano de blackjack, considerando los Ases como 1 u 11
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
 * Consulta a Groq para obtener la decisión y el pensamiento del dealer
 */
async function consultarGroqDealer(cartasJugador, cartasDealer, valorJugador, valorDealer) {
    try {
        const prompt = `
Estás jugando una partida de 21 (similar al Blackjack) como dealer.
Reglas:
- Cartas J, Q, K valen 10
- Ases valen 1 u 11, lo que más convenga
- El objetivo es acercarse a 21 sin pasarse
- El dealer debe plantarse con 17 o más

Situación actual:
- Cartas del jugador: ${cartasJugador.join(', ')} (Valor total: ${valorJugador})
- Tus cartas como dealer: ${cartasDealer.join(', ')} (Valor total: ${valorDealer})

El jugador se ha plantado. Analiza la situación y responde en formato JSON con estos dos campos:
1. "pensamiento": Explica brevemente tu análisis de la situación y estrategia (máximo 100 caracteres)
2. "decision": SOLO "continuar" (para pedir otra carta) o "parar" (para plantarte)

Sigue estrictamente este formato JSON:
{
  "pensamiento": "Tu explicación breve aquí",
  "decision": "continuar" o "parar"
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
                pensamiento: jsonRespuesta.pensamiento || "Analizando las probabilidades basadas en las reglas del 21.",
                decision: jsonRespuesta.decision
            };
        } catch (jsonError) {
            console.error("Error al parsear JSON de la respuesta:", jsonError);
            
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
                pensamiento: "No pude analizar con claridad, pero estoy tomando una decisión basada en las reglas.",
                decision: decision
            };
        }
    } catch (error) {
        console.error("Error consultando a Groq:", error);
        // En caso de error, tomar una decisión por defecto basada en reglas clásicas
        return {
            pensamiento: "Siguiendo la estrategia básica de 21: plantarse con 17+ y pedir con 16 o menos.",
            decision: valorDealer < 17 ? "continuar" : "parar"
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

/**
 * Limpia sesiones antiguas (más de 1 hora)
 */
function limpiarSesionesAntiguas() {
    const ahora = Date.now();
    const unaHoraMs = 60 * 60 * 1000;
    
    for (const sessionId in sesionesJuego) {
        if (ahora - sesionesJuego[sessionId].timestamp > unaHoraMs) {
            delete sesionesJuego[sessionId];
        }
    }
}

// Exportar el router para que pueda ser utilizado en la aplicación principal
module.exports = router;
