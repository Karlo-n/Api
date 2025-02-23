const express = require("express");
const axios = require("axios");
const router = express.Router();

// 📌 Ruta y clave de la API de Groq
const GROQ_API_URL = "https://api.groq.com/v1/chat/completions";
const GROQ_API_KEY = "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"; // Tu API Key

// **Ruta para generar texto con Groq AI**
router.get("/", async (req, res) => {
    try {
        const { prompt } = req.query;

        if (!prompt) {
            return res.status(400).json({ error: "❌ Debes proporcionar un prompt." });
        }

        // 📌 Construir el mensaje con "pensamiento" y la solicitud real
        const systemMessage = {
            role: "system",
            content: "Eres un asistente útil y avanzado. Responde de manera clara y estructurada."
        };

        const userMessage = {
            role: "user",
            content: prompt
        };

        const requestData = {
            model: "deepseek-r1-distill-qwen-32b",
            messages: [systemMessage, userMessage],
            temperature: 0.7,
            max_tokens: 500
        };

        // 📌 Hacer la solicitud a la API de Groq
        const response = await axios.post(GROQ_API_URL, requestData, {
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        // 📌 Verificar si la API de Groq responde correctamente
        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
            return res.status(500).json({ error: "❌ La API de Groq no devolvió una respuesta válida." });
        }

        // 📌 Extraer el "pensamiento" (primera parte de la respuesta) y la respuesta final
        const fullResponse = response.data.choices[0].message.content;
        const splitResponse = fullResponse.split("\n\n");
        const pensamiento = splitResponse.length > 1 ? splitResponse[0] : "🤔 Pensando...";
        const respuestaFinal = splitResponse.length > 1 ? splitResponse.slice(1).join("\n\n") : fullResponse;

        // 📌 Enviar la respuesta final
        res.json({
            pensamiento: pensamiento,
            respuesta: respuestaFinal
        });

    } catch (error) {
        console.error("❌ Error en la API de Groq:", error.response ? error.response.data : error.message);
        res.status(500).json({
            error: "❌ Error al procesar la solicitud.",
            detalles: error.response ? error.response.data : error.message
        });
    }
});

module.exports = router;
