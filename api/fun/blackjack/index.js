// api/fun/blackjack/index.js
const express = require("express");
const Groq = require("groq-sdk");
const router = express.Router();

// Inicializar el cliente de Groq con la API key
const groq = new Groq({ apiKey: "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" });

/**
 * API de Juego 21/Blackjack - Juega contra la IA
 */
router.get("/", async (req, res) => {
    try {
        const { cartasJugador, cartasDealer, accion } = req.query;

        // Validar parámetros
        if (!cartasJugador || !cartasDealer) {
            return res.status(400).json({ 
                error: "Debes proporcionar las cartas del jugador y del dealer", 
                ejemplo: "/api/fun/blackjack?cartasJugador=A,10&cartasDealer=8,4&accion=iniciar"
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

        // Si el juego sigue en curso, consultar a DeepSeek para la próxima acción del dealer
        let decisionDealer = null;
        let resultado = null;

        if (estadoJuego === "en_curso") {
            if (accion === "plantar") {
                // El jugador se planta, el dealer decide
                decisionDealer = await consultarDeepSeekDealer(cartasJugadorArray, cartasDealerArray, valorJugador, valorDealer);
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
            resultado: resultado
        };

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
 * Consulta a DeepSeek para obtener la decisión del dealer
 */
async function consultarDeepSeekDealer(cartasJugador, cartasDealer, valorJugador, valorDealer) {
    try {
        const prompt = `
Estás jugando una partida de Blackjack (21) como dealer.
Reglas:
- Cartas J, Q, K valen 10
- Ases valen 1 u 11, lo que más convenga
- El objetivo es acercarse a 21 sin pasarse
- El dealer debe plantarse con 17 o más

Situación actual:
- Cartas del jugador: ${cartasJugador.join(', ')} (Valor total: ${valorJugador})
- Tus cartas como dealer: ${cartasDealer.join(', ')} (Valor total: ${valorDealer})

El jugador se ha plantado. ¿Qué decides hacer?
Responde SOLO con una de estas opciones:
- "avanzar" (pedir otra carta)
- "parar" (plantarse con las cartas actuales)

Ten en cuenta las reglas del blackjack y toma la mejor decisión estratégica.
`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-r1-distill-qwen-32b",
            max_tokens: 50
        });

        const respuesta = completion.choices[0].message.content.trim().toLowerCase();
        
        // Normalizar la respuesta
        if (respuesta.includes("avanzar") || respuesta.includes("pedir") || respuesta.includes("otra carta")) {
            return "avanzar";
        } else {
            return "parar";
        }
    } catch (error) {
        console.error("Error consultando a DeepSeek:", error);
        // En caso de error, tomar una decisión por defecto basada en reglas clásicas
        return valorDealer < 17 ? "avanzar" : "parar";
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
            return "¡Blackjack! El jugador gana con 21 puntos exactos.";
        case "blackjack_dealer":
            return "¡Blackjack del dealer! El dealer gana con 21 puntos exactos.";
        case "jugador_pierde":
            return "El jugador se pasa de 21. ¡El dealer gana!";
        case "jugador_gana":
            return "El dealer se pasa de 21. ¡El jugador gana!";
        default:
            return "El juego continúa.";
    }
}

// Exportar el router para que pueda ser utilizado en la aplicación principal
module.exports = router;
