// api/utility/invertido/index.js
const express = require("express");
const router = express.Router();

/**
 * API Texto Invertido - Invierte el orden de los caracteres de un texto
 * Endpoint: /api/utility/invertido?texto=Hola mundo
 */
router.get("/", async (req, res) => {
    try {
        const { texto } = req.query;

        if (!texto) {
            return res.status(400).json({ 
                error: "Se requiere un texto para invertir", 
                ejemplo: "/api/utility/invertido?texto=Hola mundo" 
            });
        }

        // Invertir el texto
        const textoInvertido = texto.split('').reverse().join('');
        
        // Responder con JSON
        return res.json({
            success: true,
            original: texto,
            invertido: textoInvertido,
            longitud: texto.length
        });

    } catch (error) {
        console.error("Error en API Texto Invertido:", error);
        res.status(500).json({ 
            error: "Error al invertir el texto",
            detalle: error.message
        });
    }
});

module.exports = router;
