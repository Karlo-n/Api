/**
 * Valida si una partida está en condiciones de recibir una acción
 */
function validarPartida(partidaId, res) {
    // Verificar si la partida existe
    if (!partidasActivas[partidaId]) {
        res.status(404).json({
            error: true,
            mensaje: "Partida no encontrada",
            sugerencia: "Inicia una nueva partida (POST /api/fun/21)"
        });
        return false;
    }
    
    // Verificar si la partida ya terminó
    if (partidasActivas[partidaId].terminada) {
        res.json({
            error: true,
            mensaje: obtenerMensajeFinal(partidasActivas[partidaId].estadoJuego),
            sugerencia: "Inicia una nueva partida (POST /api/fun/21)"
        });
        return false;
    }
    
    // Verificar límite de acciones
    if (partidasActivas[partidaId].contador >= 20) {
        setTimeout(() => { delete partidasActivas[partidaId]; }, 100);
        res.json({
            error: true,
            mensaje: "Se ha alcanzado el límite de acciones para esta partida",
            sugerencia: "Inicia una nueva partida (POST /api/fun/21)"
        });
        return false;
    }
    
    // Actualizar tiempo de última interacción
    partidasActivas[partidaId].ultimaInteraccion = new Date().toISOString();
    return true;
}// api/fun/21/index.js
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
 * 
 * GET  /api/fun/21          - Verifica el estado de una partida existente
 * POST /api/fun/21          - Inicia una nueva partida
 * PUT  /api/fun/21/seguir   - El jugador pide otra carta
 * PUT  /api/fun/21/parar    - El jugador se planta
 * PUT  /api/fun/21/terminar - Termina la partida manualmente
 */

// Verificar estado de una partida (GET)
router.get("/", async (req, res) => {
    try {
        const { partidaId } = req.query;
        
        // Si no hay partidaId, iniciar una nueva partida automáticamente
        if (!partidaId) {
            return await iniciarNuevaPartida(res);
        }
        
        if (!partidasActivas[partidaId]) {
            return res.json({
                error: true,
                mensaje: "Partida no encontrada"
            });
        }
        
        const ahora = Date.now();
        const ultimaAccion = new Date(partidasActivas[partidaId].ultimaInteraccion).getTime();
        const tiempoInactivo = ahora - ultimaAccion;
        const tiempoRestanteMs = Math.max(0, 5 * 60 * 1000 - tiempoInactivo);
        
        partidasActivas[partidaId].ultimaInteraccion = new Date().toISOString();
        
        return res.json({
            partidaId,
            estado: partidasActivas[partidaId].terminada ? "terminada" : "activa",
            acciones_restantes: 20 - partidasActivas[partidaId].contador,
            tiempo_restante_segundos: Math.floor(tiempoRestanteMs / 1000)
        });
    } catch (error) {
        console.error("Error verificando partida:", error);
        return res.status(500).json({
            error: true,
            mensaje: "Error verificando la partida",
            detalle: error.message
        });
    }
});

// Iniciar nueva partida (POST)
router.post("/", async (req, res) => {
    try {
        return await iniciarNuevaPartida(res);
    } catch (error) {
        console.error("Error iniciando partida:", error);
        return res.status(500).json({
            error: true,
            mensaje: "Error iniciando nueva partida",
            detalle: error.message
        });
    }
});

// Pedir carta (PUT /seguir)
router.put("/seguir", async (req, res) => {
    try {
        const { partidaId } = req.query;
        
        if (!partidaId) {
            return res.status(400).json({
                error: true,
                mensaje: "Se requiere partidaId para pedir carta"
            });
        }
        
        // Validaciones básicas
        if (!validarPartida(partidaId, res)) return;
        
        // Procesar acción
        return await procesarAccion(partidaId, "seguir", res);
    } catch (error) {
        console.error("Error pidiendo carta:", error);
        return res.status(500).json({
            error: true,
            mensaje: "Error al pedir carta",
            detalle: error.message
        });
    }
});

// Plantarse (PUT /parar)
router.put("/parar", async (req, res) => {
    try {
        const { partidaId } = req.query;
        
        if (!partidaId) {
            return res.status(400).json({
                error: true,
                mensaje: "Se requiere partidaId para plantarse"
            });
        }
        
        // Validaciones básicas
        if (!validarPartida(partidaId, res)) return;
        
        // Procesar acción
        return await procesarAccion(partidaId, "parar", res);
    } catch (error) {
        console.error("Error al plantarse:", error);
        return res.status(500).json({
            error: true,
            mensaje: "Error al plantarse",
            detalle: error.message
        });
    }
});

// Terminar partida (PUT /terminar)
router.put("/terminar", async (req, res) => {
    try {
        const { partidaId } = req.query;
        
        if (!partidaId) {
            return res.status(400).json({
                error: true,
                mensaje: "Se requiere partidaId para terminar partida"
            });
        }
        
        // Validaciones básicas
        if (!validarPartida(partidaId, res)) return;
        
        // Procesar acción
        return await procesarAccion(partidaId, "terminar", res);
    } catch (error) {
        console.error("Error terminando partida:", error);
        return res.status(500).json({
            error: true,
            mensaje: "Error al terminar partida",
            detalle: error.message
        });
    }
});

// Para compatibilidad con versiones anteriores (GET con parámetro acción)
router.get("/:accion", async (req, res) => {
    try {
        const { partidaId } = req.query;
        const { accion } = req.params;
        
        if (!accion || !["seguir", "parar", "terminar"].includes(accion)) {
            return res.status(400).json({
                error: true,
                mensaje: "Acción no válida",
                acciones_validas: ["seguir", "parar", "terminar"]
            });
        }
        
        if (!partidaId) {
            return res.status(400).json({
                error: true,
                mensaje: "Se requiere partidaId para esta acción",
                nota: "Recomendamos usar PUT /api/fun/21/" + accion + " en su lugar"
            });
        }
        
        // Validaciones básicas
        if (!validarPartida(partidaId, res)) return;
        
        // Procesar acción
        return await procesarAccion(partidaId, accion, res);
    } catch (error) {
        console.error(`Error en acción ${req.params.accion}:`, error);
        return res.status(500).json({
            error: true,
            mensaje: `Error al procesar la acción ${req.params.accion}`,
            detalle: error.message
        });
    }
});

/**
 * Inicia una nueva partida de 21
 */
async function iniciarNuevaPartida(res) {
    const nuevoId = uuidv4();
    const mazo = crearMazoBarajado();
    
    // Repartir cartas iniciales (exactamente 1 carta para cada uno)
    const manoJugador = [mazo.pop()];
    const manoDealer = [mazo.pop()];
    
    // Calcular valores de las manos
    const valorJugador = calcularValorMano(manoJugador);
    const valorDealer = calcularValorMano(manoDealer);
    
    // Crear nueva partida
    partidasActivas[nuevoId] = {
        mazo,
        manoJugador,
        manoDealer,
        acciones: [],
        contador: 0,
        fechaCreacion: new Date().toISOString(),
        ultimaInteraccion: new Date().toISOString(),
        estadoJuego: "en_curso",
        terminada: false
    };
    
    // Verificar si hay blackjack inicial
    const estadoJuego = determinarEstadoJuego(valorJugador, valorDealer);
    let resultado = null;
    let pensamientoDealer = null;
    let decisionDealer = null;
    
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
        
        // Liberar memoria si el juego ya terminó
        setTimeout(() => {
            delete partidasActivas[nuevoId];
        }, 100);
    } else {
        // Analizar la situación inicial
        const respuestaDealer = await consultarGroqDealer(
            manoJugador, manoDealer, valorJugador, valorDealer
        );
        pensamientoDealer = respuestaDealer.pensamiento;
        decisionDealer = respuestaDealer.decision;
        
        resultado = {
            estado: "en_curso",
            mensaje: "Partida iniciada. ¿Deseas pedir otra carta o plantarte?"
        };
    }
    
    // Procesar el pensamiento del dealer para la salida
    const pensamientoTexto = extraerPensamientoTexto(pensamientoDealer);
    
    // Registrar acción inicial
    registrarAccion(nuevoId, "iniciar", manoJugador, manoDealer, valorJugador, valorDealer, pensamientoDealer, estadoJuego);
    
    // Crear respuesta
    return res.json({
        partidaId: nuevoId,
        cartas_jugador: manoJugador,
        valor_jugador: valorJugador,
        cartas_dealer: manoDealer,
        valor_dealer: valorDealer,
        pensamiento_dealer: pensamientoTexto,
        decision_dealer: decisionDealer,
        estado_juego: estadoJuego,
        mensaje: resultado ? resultado.mensaje : "Partida iniciada",
        acciones_restantes: 19
    });
}

/**
 * Procesa una acción en una partida existente
 */
async function procesarAccion(partidaId, accion, res) {
    const partida = partidasActivas[partidaId];
    const manoJugador = [...partida.manoJugador]; 
    const manoDealer = [...partida.manoDealer];
    const mazo = [...partida.mazo];
    
    let valorJugador = calcularValorMano(manoJugador);
    let valorDealer = calcularValorMano(manoDealer);
    let estadoJuego = partida.estadoJuego;
    let resultado = null;
    let pensamientoDealer = null;
    let decisionDealer = null;
    
    // Procesar la acción específica
    switch (accion) {
        case "seguir":
            if (mazo.length > 0) {
                const nuevaCarta = mazo.pop();
                manoJugador.push(nuevaCarta);
                partida.manoJugador = manoJugador;
                partida.mazo = mazo;
                
                valorJugador = calcularValorMano(manoJugador);
                
                if (valorJugador > 21) {
                    // Jugador se pasa
                    estadoJuego = "jugador_pierde";
                    partida.estadoJuego = estadoJuego;
                    partida.terminada = true;
                    
                    const respuestaFinal = await consultarGroqDealerFinal(
                        manoJugador, manoDealer, valorJugador, valorDealer, estadoJuego
                    );
                    pensamientoDealer = respuestaFinal.pensamiento;
                    
                    resultado = {
                        estado: estadoJuego,
                        mensaje: obtenerMensajeFinal(estadoJuego)
                    };
                    
                    // Liberar memoria
                    setTimeout(() => { delete partidasActivas[partidaId]; }, 100);
                } else if (valorJugador === 21) {
                    // Jugador llega a 21, verificar dealer
                    if (valorDealer === 21) {
                        estadoJuego = "empate";
                    } else {
                        estadoJuego = "jugador_gana_21";
                    }
                    
                    partida.estadoJuego = estadoJuego;
                    partida.terminada = true;
                    
                    const respuestaFinal = await consultarGroqDealerFinal(
                        manoJugador, manoDealer, valorJugador, valorDealer, estadoJuego
                    );
                    pensamientoDealer = respuestaFinal.pensamiento;
                    
                    resultado = {
                        estado: estadoJuego,
                        mensaje: obtenerMensajeFinal(estadoJuego)
                    };
                    
                    // Liberar memoria
                    setTimeout(() => { delete partidasActivas[partidaId]; }, 100);
                } else {
                    // Juego continúa
                    const respuestaDealer = await consultarGroqDealer(
                        manoJugador, manoDealer, valorJugador, valorDealer
                    );
                    pensamientoDealer = respuestaDealer.pensamiento;
                    decisionDealer = respuestaDealer.decision;
                    
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
            // El jugador se planta, el dealer decide
            const respuestaDealer = await consultarGroqDealer(
                manoJugador, manoDealer, valorJugador, valorDealer
            );
            pensamientoDealer = respuestaDealer.pensamiento;
            decisionDealer = respuestaDealer.decision;
            
            if (decisionDealer === "continuar" && mazo.length > 0) {
                const nuevaCarta = mazo.pop();
                manoDealer.push(nuevaCarta);
                partida.manoDealer = manoDealer;
                partida.mazo = mazo;
                
                valorDealer = calcularValorMano(manoDealer);
                
                if (valorDealer > 21) {
                    // Dealer se pasa
                    estadoJuego = "jugador_gana";
                    partida.estadoJuego = estadoJuego;
                    partida.terminada = true;
                    
                    const respuestaFinal = await consultarGroqDealerFinal(
                        manoJugador, manoDealer, valorJugador, valorDealer, estadoJuego
                    );
                    pensamientoDealer = respuestaFinal.pensamiento;
                    
                    resultado = {
                        estado: estadoJuego,
                        mensaje: obtenerMensajeFinal(estadoJuego)
                    };
                    
                    // Liberar memoria
                    setTimeout(() => { delete partidasActivas[partidaId]; }, 100);
                } else {
                    resultado = {
                        estado: "en_curso",
                        mensaje: `El dealer ha pedido carta. Su mano ahora vale ${valorDealer}.`
                    };
                }
            } else {
                // Comparar manos
                if (valorDealer > valorJugador) {
                    estadoJuego = "dealer_gana";
                } else if (valorDealer < valorJugador) {
                    estadoJuego = "jugador_gana";
                } else {
                    estadoJuego = "empate";
                }
                
                partida.estadoJuego = estadoJuego;
                partida.terminada = true;
                
                const respuestaFinal = await consultarGroqDealerFinal(
                    manoJugador, manoDealer, valorJugador, valorDealer, estadoJuego
                );
                pensamientoDealer = respuestaFinal.pensamiento;
                
                resultado = {
                    estado: estadoJuego,
                    mensaje: obtenerMensajeFinal(estadoJuego)
                };
                
                // Liberar memoria
                setTimeout(() => { delete partidasActivas[partidaId]; }, 100);
            }
            break;
            
        case "terminar":
            // Terminar manualmente
            if (!partida.terminada) {
                const respuestaDealer = await consultarGroqDealer(
                    manoJugador, manoDealer, valorJugador, valorDealer
                );
                pensamientoDealer = respuestaDealer.pensamiento;
                decisionDealer = respuestaDealer.decision;
                
                // Si el dealer quiere continuar, una última carta
                if (decisionDealer === "continuar" && mazo.length > 0) {
                    const nuevaCarta = mazo.pop();
                    manoDealer.push(nuevaCarta);
                    partida.manoDealer = manoDealer;
                    partida.mazo = mazo;
                    valorDealer = calcularValorMano(manoDealer);
                }
                
                // Determinar ganador
                const distanciaJugador = 21 - valorJugador >= 0 ? 21 - valorJugador : 999;
                const distanciaDealer = 21 - valorDealer >= 0 ? 21 - valorDealer : 999;
                
                if (distanciaJugador < distanciaDealer) {
                    estadoJuego = "jugador_gana";
                } else if (distanciaDealer < distanciaJugador) {
                    estadoJuego = "dealer_gana";
                } else {
                    estadoJuego = "empate";
                }
                
                partida.estadoJuego = estadoJuego;
                partida.terminada = true;
                
                const respuestaFinal = await consultarGroqDealerFinal(
                    manoJugador, manoDealer, valorJugador, valorDealer, estadoJuego
                );
                pensamientoDealer = respuestaFinal.pensamiento;
                
                resultado = {
                    estado: estadoJuego,
                    mensaje: obtenerMensajeFinal(estadoJuego) + " (Partida terminada manualmente)"
                };
                
                // Liberar memoria
                setTimeout(() => { delete partidasActivas[partidaId]; }, 100);
            } else {
                resultado = {
                    estado: partida.estadoJuego,
                    mensaje: obtenerMensajeFinal(partida.estadoJuego)
                };
            }
            break;
            
        default:
            return res.status(400).json({
                error: true,
                mensaje: "Acción no válida",
                acciones_validas: ["seguir", "parar", "terminar"]
            });
    }
    
    // Registrar la acción
    registrarAccion(partidaId, accion, manoJugador, manoDealer, valorJugador, valorDealer, pensamientoDealer, estadoJuego);
    
    // Procesar el pensamiento del dealer para la salida
    const pensamientoTexto = extraerPensamientoTexto(pensamientoDealer);
    
    // Generar respuesta
    return res.json({
        partidaId: partidaId,
        cartas_jugador: manoJugador,
        valor_jugador: valorJugador,
        cartas_dealer: manoDealer,
        valor_dealer: valorDealer,
        pensamiento_dealer: pensamientoTexto,
        decision_dealer: decisionDealer,
        estado_juego: estadoJuego,
        mensaje: resultado ? resultado.mensaje : obtenerMensajeFinal(estadoJuego),
        acciones_restantes: 20 - partidasActivas[partidaId].contador
    });
}

/**
 * Extrae el texto del pensamiento del dealer sin formato JSON
 */
function extraerPensamientoTexto(pensamientoDealer) {
    if (!pensamientoDealer) return null;
    
    try {
        // Intentar extraer solo el texto del pensamiento sin formato JSON
        const match = pensamientoDealer.match(/"pensamiento":\s*"([^"]+)"/);
        if (match && match[1]) {
            return match[1];
        } else {
            // Si no podemos extraerlo, limpiar el formato JSON manualmente
            return pensamientoDealer
                .replace(/```json\n/g, '')
                .replace(/```/g, '')
                .replace(/{\s*"pensamiento":\s*"/g, '')
                .replace(/",\s*"decision":\s*"[^"]+"\s*}\s*/g, '')
                .trim();
        }
    } catch (error) {
        console.error("Error al extraer pensamiento del dealer:", error);
        return pensamientoDealer;
    }
}

/**
 * Registra una acción en el historial de la partida
 */
function registrarAccion(partidaId, accion, manoJugador, manoDealer, valorJugador, valorDealer, pensamientoDealer, estadoJuego) {
    if (partidasActivas[partidaId]) {
        // Incrementar contador de acciones
        partidasActivas[partidaId].contador++;
        
        // Actualizar tiempo de última interacción
        partidasActivas[partidaId].ultimaInteraccion = new Date().toISOString();
        
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
        
        // Asegurar que solo guardamos las últimas 20 acciones
        if (partidasActivas[partidaId].acciones.length > 20) {
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
        return "jugador_gana_21";
    } else if (valorDealer === 21) {
        return "dealer_gana_21";
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
Estás jugando una partida de 21 como dealer (croupier).
Reglas:
- Cartas J, Q, K valen 10
- Ases valen 1 u 11, lo que más convenga
- El objetivo es acercarse a 21 sin pasarse
- El dealer debe plantarse con 17 o más y pedir carta con 16 o menos

Situación actual:
- Cartas del jugador: ${cartasJugador.join(', ')} (Valor total: ${valorJugador})
- Tus cartas como dealer: ${cartasDealer.join(', ')} (Valor total: ${valorDealer})

Analiza la situación como un dealer experto. Responde en formato JSON con estos dos campos:
1. "pensamiento": Breve análisis de tu decisión (max 120 caracteres)
2. "decision": SOLO puedes responder con "continuar" o "parar"

Formato exacto de respuesta:
{
  "pensamiento": "Tu análisis aquí (max 120 caracteres)",
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
        if (estadoJuego === "jugador_gana_21") {
            situacion = "El jugador tiene 21 exactos y ha ganado.";
        } else if (estadoJuego === "dealer_gana_21") {
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

Como dealer experto, comenta brevemente el resultado. Formato JSON:

{
  "pensamiento": "Tu breve análisis aquí (max 120 caracteres)"
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
        case "jugador_gana_21":
            return "¡21 exactos! El jugador gana.";
        case "dealer_gana_21":
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

// Limpiar partidas inactivas cada minuto
setInterval(() => {
    const ahora = Date.now();
    const tiempoMaximoInactividadMs = 5 * 60 * 1000; // 5 minutos de inactividad máxima
    
    for (const partidaId in partidasActivas) {
        // Si la partida está terminada, eliminarla directamente
        if (partidasActivas[partidaId].terminada) {
            delete partidasActivas[partidaId];
            continue;
        }
        
        // Si ha pasado el tiempo de inactividad, eliminarla
        const ultimaInteraccion = new Date(partidasActivas[partidaId].ultimaInteraccion || 0).getTime();
        if (ahora - ultimaInteraccion > tiempoMaximoInactividadMs) {
            console.log(`Eliminando partida ${partidaId} por inactividad (${Math.floor((ahora - ultimaInteraccion) / 1000)} segundos sin interacción)`);
            delete partidasActivas[partidaId];
        }
    }
}, 60 * 1000); // Revisar cada minuto

// Exportar el router para que pueda ser utilizado en la aplicación principal
module.exports = router;
