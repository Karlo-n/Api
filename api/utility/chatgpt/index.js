const express = require("express");
const axios = require("axios");
const router = express.Router();

// **Ruta de la API de ChatGPT**
router.get("/", async (req, res) => {
    try {
        const { prompt } = req.query;

        if (!prompt) {
            return res.status(400).json({ error: "❌ Debes proporcionar un prompt." });
        }

        // URL de la API de ChatGPT sin encodeURIComponent
        const CHATGPT_API = `https://api.kastg.xyz/api/ai/chatgptV4?prompt=${prompt}&key=Kastg_ykMAbn6ipjRxHW6NpWRQ_free`;

        // Hacer la solicitud a ChatGPT
        const response = await axios.get(CHATGPT_API, { timeout: 15000 });

        if (!response.data || !response.data.response) {
            return res.status(500).json({ error: "❌ La API de ChatGPT no devolvió una respuesta válida." });
        }

        // Enviar la respuesta final
        res.json({ respuesta: response.data.response });

    } catch (error) {
        console.error("❌ Error en la API de ChatGPT:", error.message);

        return res.status(500).json({
            error: "❌ Error interno del servidor.",
            detalles: error.message
        });
    }
});

module.exports = router;
