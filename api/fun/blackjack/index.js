// api/fun/blackjack/index.js
const express = require("express");
const Groq = require("groq-sdk");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Inicializar el cliente de Groq con la API key
const groq = new Groq({ apiKey: "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" });

// Almacenamiento en memoria para las partidas activas
const partidasActivas = {};

// Constantes del juego
const VALORES_CARTAS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const PALOS_CARTAS = ['♥', '♦', '♣', '♠'];

/**
 * API de Juego 21 - Juega contra la IA
 */
router.get("/", async (req, res) => {
    try {
        const { accion, partidaId, id } = req.query;

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
            const mazo = crearMazoBarajado();
            
            // Repartir cartas iniciales
            const manoJugador = [mazo.pop(), mazo.pop()];
            const manoDealer = [mazo.pop(), mazo.pop()];
            
            // Crear nueva partida
            partidasActivas[nuevoId] = {
                mazo,
                manoJugador,
                manoDealer,
                acciones: [],
                contador: 0,
                fechaCreacion: new Date().toISOString(),
                estadoJuego: "en_curso",
                terminada: false
            };
            
            // Calcular valores de las manos
            const valorJugador = calcularValorMano(manoJugador);
            const valorDealer = calcularValorMano(manoDealer);
            
            // Verificar si hay blackjack inicial
            let estadoJuego = determinarEstadoJuego(valorJugador, valorDealer);
            let resultado = null;
            let pensamientoDealer = null;
            
            if (estadoJuego !== "en_curso") {
                partidasActivas[nuevoId].estadoJuego = estadoJuego;
                partidasActivas[nuevoId].terminada = true;
                resultado = {
                    estado: estadoJuego,
                    mensaje: obtenerMensajeFinal(estadoJuego)
                };
                
                // Obtener pensamiento del dealer sobre el resultado
                const respuestaDealer = await consultarGroqDealerFinal(
                    manoJugador, manoDealer, valorJugador, valorDealer, estadoJuego
                );
                pensamientoDealer = respuestaDealer.pensamiento;
            } else {
                // Analizar la situación inicial
                const respuestaDealer = await consultarGroqDealer(
                    manoJugador, manoDealer, valorJugador, valorDealer
                );
                pensamientoDealer = respuestaDealer.pensamiento;
                
                resultado = {
                    estado: "en_curso",
                    mensaje: "Partida iniciada. ¿Deseas pedir otra carta o plantarte?"
                };
            }
            
            // Registrar acción inicial
            registrarAccion(nuevoId, "iniciar", manoJugador, manoDealer, valorJugador, valorDealer, pensamientoDealer, estadoJuego);
            
            return res.json({
                mensaje: "Nueva partida de 21 iniciada",
                partidaId: nuevoId,
                mano_jugador: {
                    cartas: manoJugador,
                    valor: valorJugador
                },
                mano_dealer: {
                    cartas: manoDealer,
                    valor: valorDealer
                },
                pensamiento_dealer: pensamientoDealer,
                resultado: resultado,
                partida: {
                    id: nuevoId,
                    acciones_restantes: 9, // Ya usamos 1 acción para iniciar
                    acciones_totales: 1,
                    fecha_creacion: partidasActivas[nuevoId].fechaCreacion,
                    historial: partidasActivas[nuevoId].acciones
                },
                instrucciones: "Usa este partidaId con acciones 'seguir', 'parar' o 'terminar'. La partida durará por 10 acciones."
            });
        }

        // Validar que se proporcione partidaId para todas las demás acciones
        if (!partidaId) {
            return res.status(400).json({ 
                error: "Debes proporcionar un partidaId", 
                instrucciones: "Primero inicia una partida con ?accion=iniciar o proporciona un partidaId válido",
                ejemplo: "/api/fun/blackjack?partidaId=abc123&accion=seguir"
            });
        }
        
        // Verificar si la partida existe
        if (!partidasActivas[partidaId]) {
            return res.status(404).json({
                error: "Partida no encontrada o expirada",
                sugerencia: "Inicia una nueva partida con ?accion=iniciar"
            });
        }
        
        // Validar si la partida ya terminó
        if (partidasActivas[partidaId].terminada && accion !== "terminar") {
            return res.json({
                error: "Esta partida ya ha terminado",
                estado: partidasActivas[partidaId].estadoJuego,
                mensaje: obtenerMensajeFinal(partidasActivas[partidaId].estadoJuego),
                sugerencia: "Puedes iniciar una nueva partida con ?accion=iniciar"
            });
        }
        
        // Validar si se alcanzó el límite de acciones
        if (partidasActivas[partidaId].contador >= 10 && accion !== "terminar") {
            return res.json({
                error: "Se ha alcanzado el límite de acciones para esta partida",
                sugerencia: "Inicia una nueva partida con ?accion=iniciar"
            });
        }
        
        // Obtener el estado actual de la partida
        const partida = partidasActivas[partidaId];
        let { manoJugador, manoDealer, mazo } = partida;
        let valorJugador = calcularValorMano(manoJugador);
        let valorDealer = calcularValorMano(manoDealer);
        let estadoJuego = partida.estadoJuego;
        let resultado = null;
        let pensamientoDealer = null;
        let decisionDealer = null;
        
        // Procesar acción
        switch (accion) {
            case "seguir":
                // El jugador pide otra carta
                if (mazo.length > 0) {
                    manoJugador.push(mazo.pop());
                    valorJugador = calcularValorMano(manoJugador);
                    
                    // Verificar si el jugador se pasó
                    if (valorJugador > 21) {
                        estadoJuego = "jugador_pierde";
                        partida.estadoJuego = estadoJuego;
                        partida.terminada = true;
                        resultado = {
                            estado: estadoJuego,
                            mensaje: obtenerMensajeFinal(estadoJuego)
                        };
                        
                        // Obtener pensamiento final del dealer
                        const respuestaFinal = await consultarGroqDealerFinal(
                            manoJugador, manoDealer, valorJugador, valorDealer, estadoJuego
                        );
                        pensamientoDealer = respuestaFinal.pensamiento;
                    } else if (valorJugador === 21) {
                        // El jugador tiene 21, ahora juega el dealer
                        const resultado = await turnoDealer(partida);
                        estadoJuego = resultado.estadoJuego;
                        manoDealer = resultado.manoDealer;
                        valorDealer = resultado.valorDealer;
                        pensamientoDealer = resultado.pensamientoDealer;
                        decisionDealer = resultado.decisionDealer;
                    } else {
                        // Continuar el juego, obtener pensamiento del dealer
                        const respuestaDealer = await consultarGroqDealer(
                            manoJugador, manoDealer, valorJugador, valorDealer
                        );
                        pensamientoDealer = respuestaDealer.pensamiento;
                        
                        resultado = {
                            estado: "en_curso",
                            mensaje: `Has pedido una carta. Tu mano ahora vale ${valorJugador}.`
                        };
                    }
                } else {
                    resultado = {
                        estado: "error",
                        mensaje: "No quedan cartas en el mazo"
                    };
                }
                break;
                
            case "parar":
                // El jugador se planta, turno del dealer
                const resultadoDealer = await turnoDealer(partida);
                estadoJuego = resultadoDealer.estadoJuego;
                manoDealer = resultadoDealer.manoDealer;
                valorDealer = resultadoDealer.valorDealer;
                pensamientoDealer = resultadoDealer.pensamientoDealer;
                decisionDealer = resultadoDealer.decisionDealer;
                resultado = resultadoDealer.resultado;
                break;
                
            case "terminar":
                // Terminar partida manualmente
                if (!partida.terminada) {
                    partida.terminada = true;
                    partida.estadoJuego = "terminada_manualmente";
                    
                    resultado = {
                        estado: "terminada_manualmente",
                        mensaje: "Has terminado la partida manualmente."
                    };
                    
                    // Obtener pensamiento del dealer sobre la terminación manual
                    const respuestaDealer = await consultarGroqDealer(
                        manoJugador, manoDealer, valorJugador, valorDealer
                    );
                    pensamientoDealer = respuestaDealer.pensamiento;
                } else {
                    resultado = {
                        estado: partida.estadoJuego,
                        mensaje: obtenerMensajeFinal(partida.estadoJuego)
                    };
                }
                break;
                
            default:
                return res.status(400).json({
                    error: "Acción no válida",
                    acciones_validas: ["seguir", "parar", "terminar"]
                });
        }
        
        // Registrar la acción en el historial
        registrarAccion(partidaId, accion, manoJugador, manoDealer, valorJugador, valorDealer, pensamientoDealer, estadoJuego);
        
        // Verificar si se debe eliminar la partida por límite de acciones
        if (partidasActivas[partidaId].contador >= 10 || partidasActivas[partidaId].terminada) {
            setTimeout(() => {
                delete partidasActivas[partidaId];
            }, 60000); // Dar 1 minuto extra después de la última acción
        }
        
        // Construir respuesta
        const respuesta = {
            mano_jugador: {
                cartas: manoJugador,
                valor: valorJugador
            },
            mano_dealer: {
                cartas: manoDealer,
                valor: valorDealer
            },
            decision_dealer: decisionDealer,
            pensamiento_dealer: pensamientoDealer,
            resultado: resultado || {
                estado: estadoJuego,
                mensaje: obtenerMensajeFinal(estadoJuego)
            },
            partida: {
                id: partidaId,
                acciones_restantes: 10 - partidasActivas[partidaId].contador,
                acciones_totales: partidasActivas[partidaId].acciones.length,
                fecha_creacion: partidasActivas[partidaId].fechaCreacion,
                terminada: partidasActivas[partidaId].terminada,
                historial: partidasActivas[partidaId].acciones
            }
        };
        
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
 * Procesa el turno del dealer según las reglas
 */
async function turnoDealer(partida) {
    let { manoDealer, manoJugador, mazo } = partida;
    let valorDealer = calcularValorMano(manoDealer);
    let valorJugador = calcularValorMano(manoJugador);
    let estadoJuego = "en_curso";
    let resultado = null;
    let decisionDealer = null;
    let pensamientoDealer = null;
    
    // El dealer debe pedir carta con 16 o menos
    while (valorDealer < 17 && mazo.length > 0) {
        // El dealer pide carta automáticamente
        manoDealer.push(mazo.pop());
        valorDealer = calcularValorMano(manoDealer);
        
        // Consultar el pensamiento del dealer
        const respuestaDealer = await consultarGroqDealer(
            manoJugador, manoDealer, valorJugador, valorDealer
        );
        pensamientoDealer = respuestaDealer.pensamiento;
        decisionDealer = valorDealer < 17 ? "continuar" : "parar";
        
        // Verificar si el dealer se pasó
        if (valorDealer > 21) {
            estadoJuego = "jugador_gana";
            resultado = {
                estado: estadoJuego,
                mensaje: obtenerMensajeFinal(estadoJuego)
            };
            partida.terminada = true;
            break;
        }
    }
    
    // Si el dealer no se pasó, comparar manos
    if (valorDealer <= 21 && estadoJuego === "en_curso") {
        decisionDealer = "parar";
        
        if (valorDealer > valorJugador) {
            estadoJuego = "dealer_gana";
        } else if (valorDealer < valorJugador) {
            estadoJuego = "jugador_gana";
        } else {
            estadoJuego = "empate";
        }
        
        resultado = {
            estado: estadoJuego,
            mensaje: obtenerMensajeFinal(estadoJuego)
        };
        
        // Consultar el pensamiento final del dealer
        const respuestaFinal = await consultarGroqDealerFinal(
            manoJugador, manoDealer, valorJugador, valorDealer, estadoJuego
        );
        pensamientoDealer = respuestaFinal.pensamiento;
        
        partida.terminada = true;
    }
    
    // Actualizar el estado de la partida
    partida.manoDealer = manoDealer;
    partida.estadoJuego = estadoJuego;
    
    return {
        manoDealer,
        valorDealer,
        estadoJuego,
        resultado,
        decisionDealer,
        pensamientoDealer
    };
}

/**
 * Registra una acción en el historial de la partida
 */
function registrarAccion(partidaId, accion, manoJugador, manoDealer, valorJugador, valorDealer, pensamientoDealer, estadoJuego) {
    if (partidasActivas[partidaId]) {
        // Incrementar contador de acciones
        partidasActivas[partidaId].contador++;
        
        // Guardar la acción actual
        partidasActivas[partidaId].acciones.push({
            indice: partidasActivas[partidaId].contador,
            fecha: new Date().toISOString(),
            accion,
            cartasJugador: [...manoJugador],
            cartasDealer: [...manoDealer],
            valorJugador,
            valorDealer,
            pensamientoDealer,
            estadoJuego
        });
        
        // Asegurar que solo guardamos las últimas 10 acciones
        if (partidasActivas[partidaId].acciones.length > 10) {
            partidasActivas[partidaId].acciones.shift();
        }
    }
}

/**
 * Crea un mazo nuevo y lo baraja
 */
function crearMazoBarajado() {
    const mazo = [];
    
    // Crear todas las cartas
    for (const palo of PALOS_CARTAS) {
        for (const valor of VALORES_CARTAS) {
            mazo.push(valor + palo);
        }
    }
    
    // Barajar el mazo (algoritmo Fisher-Yates)
    for (let i = mazo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }
    
    return mazo;
}

/**
 * Calcula el valor de una mano de 21, considerando los Ases como 1 u 11
 */
function calcularValorMano(cartas) {
    let valor = 0;
    let ases = 0;

    for (const carta of cartas) {
        const valorCarta = carta.charAt(0) === '1' && carta.charAt(1) === '0' ? '10' : carta.charAt(0);
        
        if (valorCarta === 'A') {
            ases++;
            valor += 11;
        } else if (['J', 'Q', 'K'].includes(valorCarta)) {
            valor += 10;
        } else {
            valor += parseInt(valorCarta);
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
    if (valorJugador === 21 && valorDealer === 21) {
        return "empate";
    } else if (valorJugador === 21) {
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
 * Consulta a la API de Groq para obtener la decisión y el pensamiento del dealer durante el juego
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
1. "pensamiento": Escribe tu análisis detallado de la situación, incluye tus probabilidades estimadas de pasarte de 21 si pides otra carta, y tu estrategia considerando la mano del jugador (mínimo 100 caracteres)
2. "decision": SOLO puedes responder con "continuar" o "parar"

Formato exacto de respuesta:
{
  "pensamiento": "Tu análisis aquí (mínimo 100 caracteres)",
  "decision": "continuar" o "parar"
}
`;

        // Codificar el prompt para la URL
        const promptEncoded = encodeURIComponent(prompt);
        const apiUrl = `http://api.apikarl.com/api/utility/deepseek?prompt=${promptEncoded}`;
        
        // Realizar la petición a la API
        const response = await axios.get(apiUrl);
        
        // Verificar si tenemos una respuesta válida
        if (response.data && response.data.respuesta) {
            try {
                // Intentar parsear la respuesta como JSON
                const jsonRespuesta = JSON.parse(response.data.respuesta);
                
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
                    pensamiento: jsonRespuesta.pensamiento || response.data.respuesta,
                    decision: jsonRespuesta.decision
                };
            } catch (jsonError) {
                console.error("Error al parsear JSON de la respuesta:", jsonError);
                
                // Si no es JSON válido, usar la respuesta completa como pensamiento
                return {
                    pensamiento: response.data.respuesta,
                    decision: valorDealer < 17 ? "continuar" : "parar"
                };
            }
        } else {
            // Si no hay respuesta válida de la API
            throw new Error("La API de Groq no devolvió una respuesta válida");
        }
    } catch (error) {
        console.error("Error consultando a la API de Groq:", error);
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
 * Consulta a la API de Groq para obtener el pensamiento del dealer sobre el resultado final
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
        } else if (estadoJuego === "dealer_gana") {
            situacion = "Como dealer, tengo más puntos que el jugador sin pasarme de 21 y he ganado.";
        } else if (estadoJuego === "empate") {
            situacion = "Ambos tenemos la misma puntuación. Es un empate.";
        } else {
            situacion = "La partida ha terminado de forma irregular.";
        }

        const prompt = `
Partida de 21 finalizada:
- Cartas del jugador: ${cartasJugador.join(', ')} (Valor total: ${valorJugador})
- Tus cartas como dealer: ${cartasDealer.join(', ')} (Valor total: ${valorDealer})
- Resultado: ${situacion}

Como dealer experto, analiza detalladamente el resultado final del juego.
¿Qué probabilidades teníamos cada uno? ¿Fue cuestión de suerte o de estrategia?
¿Qué jugadas alternativas habrías considerado?

Responde en formato JSON con un campo "pensamiento" que contenga tu análisis detallado (mínimo 100 caracteres).

Formato exacto de respuesta:
{
  "pensamiento": "Tu análisis aquí (mínimo 100 caracteres)"
}
`;

        // Codificar el prompt para la URL
        const promptEncoded = encodeURIComponent(prompt);
        const apiUrl = `http://api.apikarl.com/api/utility/deepseek?prompt=${promptEncoded}`;
        
        // Realizar la petición a la API
        const response = await axios.get(apiUrl);
        
        // Verificar si tenemos una respuesta válida
        if (response.data && response.data.respuesta) {
            try {
                // Intentar parsear la respuesta como JSON
                const jsonRespuesta = JSON.parse(response.data.respuesta);
                return {
                    pensamiento: jsonRespuesta.pensamiento || response.data.respuesta
                };
            } catch (jsonError) {
                // Si falla el parseo, usar la respuesta completa como pensamiento
                return {
                    pensamiento: response.data.respuesta
                };
            }
        } else {
            // Si no hay respuesta válida de la API
            throw new Error("La API de Groq no devolvió una respuesta válida");
        }
    } catch (error) {
        console.error("Error consultando a la API de Groq para el resultado final:", error);
        return {
            pensamiento: `Partida finalizada con ${valorDealer} vs ${valorJugador}. ${estadoJuego.replace('_', ' ')}.`
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
        case "dealer_gana":
            return "El dealer tiene más puntos sin pasarse. ¡El dealer gana!";
        case "empate":
            return "¡Empate! Ambos tienen la misma puntuación.";
        case "terminada_manualmente":
            return "Partida terminada manualmente.";
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
