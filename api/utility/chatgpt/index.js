const express = require("express");
const axios = require("axios");
const router = express.Router();

// Configuración de la API de ChatGPT-4
const CHATGPT_API_URL = "https://api.kastg.xyz/api/ai/chatgptV4";
const API_KEY = "Kastg_ykMAbn6ipjRxHW6NpWRQ_free"; // Clave pública gratuita

router.get("/", async (req, res) => {
    try {
        const { texto, rol } = req.query;

        if (!texto) {
            return res.status(400).json({ error: "Falta el parámetro 'texto'." });
        }

        // Construcción del prompt con rol (si se proporciona)
        let mensaje = texto;
        if (rol) {
            mensaje = `Eres un asistente con el siguiente rol: ${rol}. Responde: ${texto}`;
        }

        // Petición a la API de ChatGPT-4
        const response = await axios.get(CHATGPT_API_URL, {
            params: {
                prompt: mensaje,
                key: API_KEY
            }
        });

        res.json({
            respuesta: response.data.result
        });

    } catch (error) {
        console.error("Error con la API de ChatGPT:", error);
        res.status(500).json({ error: "Error al obtener respuesta de ChatGPT-4." });
    }
});

module.exports = router;
