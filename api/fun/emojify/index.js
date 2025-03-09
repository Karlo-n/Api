// api/fun/emojify/index.js
const express = require("express");
const router = express.Router();
const { convertToEmoji } = require("./emoji-modes");
const { validateInput } = require("./emoji-utils");

/**
 * API Emojify - Convierte texto normal en representaciones con emojis
 * Endpoints:
 * - /api/fun/emojify?texto=Hola mundo -> Devuelve texto convertido a emojis
 */
router.get("/", async (req, res) => {
    try {
        const { texto, modo = "combinado", idioma = "es", intensidad = "media" } = req.query;

        // Validar parámetros
        if (!texto) {
            return res.status(400).json({ 
                error: "Se requiere un texto para convertir", 
                ejemplo: "/api/fun/emojify?texto=Hola mundo&modo=combinado&intensidad=media" 
            });
        }

        // Validar y normalizar parámetros
        const validationResult = validateInput(texto, modo, idioma, intensidad);
        if (validationResult.error) {
            return res.status(400).json(validationResult);
        }

        // Convertir texto a emojis
        const resultado = await convertToEmoji(
            texto, 
            validationResult.modo, 
            validationResult.idioma, 
            validationResult.intensidad
        );

        // Responder con JSON
        return res.json({
            success: true,
            original: texto,
            texto_emojificado: resultado.texto,
            modo: validationResult.modo,
            idioma: validationResult.idioma,
            intensidad: validationResult.intensidad,
            emojis_usados: resultado.emojisUsados,
            estadisticas: {
                palabras_originales: texto.split(/\s+/).filter(word => word.length > 0).length,
                emojis_insertados: resultado.contadorEmojis,
                porcentaje_conversion: resultado.porcentajeConversion
            }
        });

    } catch (error) {
        console.error("Error en API Emojify:", error);
        res.status(500).json({ 
            error: "Error al convertir texto a emojis",
            detalle: error.message
        });
    }
});

// Ruta para obtener información sobre los modos disponibles
router.get("/info", (req, res) => {
    res.json({
        modos_disponibles: {
            sustitucion: "Sustituye palabras completas por emojis",
            combinado: "Combina texto con emojis asociados",
            intercalado: "Intercala emojis entre palabras",
            palabra_por_palabra: "Sustituye cada palabra por un emoji aproximado",
            emojipasta: "Genera texto sobrecargado de emojis (estilo emojipasta)"
        },
        intensidades: {
            baja: "Pocos emojis estratégicamente insertados",
            media: "Balance entre texto y emojis",
            alta: "Muchos emojis, alto reemplazo de palabras"
        },
        idiomas_soportados: ["es", "en"],
        ejemplos: [
            "/api/fun/emojify?texto=Me encanta la pizza",
            "/api/fun/emojify?texto=El perro corre en el parque&modo=sustitucion",
            "/api/fun/emojify?texto=Me siento feliz hoy&modo=emojipasta&intensidad=alta",
            "/api/fun/emojify?texto=I love cats&idioma=en"
        ]
    });
});

module.exports = router;
