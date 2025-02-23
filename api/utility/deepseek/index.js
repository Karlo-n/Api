import express from "express";
import Groq from "groq-sdk";

const router = express.Router();
const groq = new Groq({ apiKey: "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" });

router.get("/", async (req, res) => {
    try {
        const { prompt } = req.query;

        if (!prompt) {
            return res.status(400).json({ error: "❌ Debes proporcionar un prompt." });
        }

        // Generar respuesta con DeepSeek AI
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-r1-distill-qwen-32b",
        });

        // Enviar la respuesta
        res.json({
            respuesta: completion.choices[0].message.content,
        });

    } catch (error) {
        console.error("❌ Error en la API de DeepSeek:", error.message);
        res.status(500).json({ error: "❌ Error al procesar la solicitud." });
    }
});

export default router;
