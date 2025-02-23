const express = require("express");
const Groq = require("groq-sdk");
const router = express.Router();

const groq = new Groq({ apiKey: "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" });

router.get("/", async (req, res) => {
    try {
        const { prompt } = req.query;

        if (!prompt) {
            return res.status(400).json({ error: "❌ Debes proporcionar un prompt." });
        }

        // Hacer la solicitud a la IA
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-r1-distill-qwen-32b",
        });

        // Obtener la respuesta completa
        const fullResponse = completion.choices[0].message.content;

        // Extraer pensamiento y respuesta final
        const pensamientoMatch = fullResponse.match(/<think>(.*?)<\/think>/s);
        const pensamiento = pensamientoMatch ? pensamientoMatch[1].trim() : "No disponible";

        // Remover la etiqueta <think> del mensaje final
        const respuesta = fullResponse.replace(/<think>.*?<\/think>\n?/s, "").trim();

        // Enviar la respuesta estructurada en JSON
        res.json({ pensamiento, respuesta });

    } catch (error) {
        console.error("❌ Error en la API de DeepSeek:", error.message);
        res.status(500).json({ error: "❌ Error al procesar la solicitud." });
    }
});

module.exports = router;
