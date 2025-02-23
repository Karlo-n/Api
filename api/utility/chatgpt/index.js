const express = require("express");
const axios = require("axios");
const router = express.Router();

// **Ruta de la API de ChatGPT**
router.get("/", async (req, res) => {
    try {
        const { prompt, rol } = req.query;

        if (!prompt) {
            return res.status(400).json({ error: "❌ Debes proporcionar un prompt." });
        }

        // Construir el prompt final con rol si se proporciona
        let finalPrompt = prompt;
        if (rol) {
            finalPrompt = `Instrucciones para la IA: ${rol}.\n\n${prompt}`;
        }

        // Codificar el prompt para evitar errores en la URL
        const encodedPrompt = encodeURIComponent(finalPrompt);

        // **URL de la API de ChatGPT**
        const CHATGPT_API_URL = `https://api.kastg.xyz/api/ai/chatgptV4?prompt=${encodedPrompt}&key=Kastg_ykMAbn6ipjRxHW6NpWRQ_free`;

        // **Hacer la solicitud a ChatGPT**
        const response = await axios.get(CHATGPT_API_URL, { timeout: 15000 });

        // **Validar la respuesta**
        if (!response.data || typeof response.data.response !== "string") {
            throw new Error("La API de ChatGPT no devolvió una respuesta válida.");
        }

        // **Enviar la respuesta final**
        res.json({ respuesta: response.data.response });

    } catch (error) {
        console.error("❌ Error en la API de ChatGPT:", error.message);

        // **Capturar errores específicos de Axios**
        if (error.response) {
            return res.status(error.response.status).json({ 
                error: "❌ Error al procesar la solicitud.", 
                detalles: error.response.data 
            });
        } else if (error.code === "ECONNABORTED") {
            return res.status(500).json({ error: "❌ La solicitud a la API de ChatGPT tardó demasiado en responder." });
        } else {
            return res.status(500).json({ error: "❌ Error interno del servidor.", detalles: error.message });
        }
    }
});

module.exports = router;
