const express = require("express");
const axios = require("axios");
const router = express.Router();

// Middleware para verificar la key desde tu API
const verificarKey = async (req, res, next) => {
    const { key } = req.query;

    if (!key) {
        return res.status(400).json({ error: "❌ Debes proporcionar una key." });
    }

    try {
        // Verificar la key en tu API
        const keyCheckURL = `https://api.apikarl.com/key/check/api/${key}`;
        const response = await axios.get(keyCheckURL);

        // Si la key es válida, continuar con la petición
        if (response.data.valida === true) {
            return next();
        } else {
            return res.status(403).json({ error: "🔑 Key inválida o no autorizada." });
        }
    } catch (error) {
        console.error("Error verificando la key:", error);
        return res.status(500).json({ error: "❌ No se pudo verificar la key." });
    }
};

// **Ruta de la API de ChatGPT**
router.get("/", verificarKey, async (req, res) => {
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

        // URL de la API de ChatGPT con la key externa
        const chatGPTURL = `https://api.kastg.xyz/api/ai/chatgptV4?prompt=${encodeURIComponent(finalPrompt)}&key=Kastg_ykMAbn6ipjRxHW6NpWRQ_free`;

        // Hacer la solicitud a ChatGPT
        const response = await axios.get(chatGPTURL);

        // Enviar la respuesta final
        res.json({ respuesta: response.data });
    } catch (error) {
        console.error("Error en la API de ChatGPT:", error);
        res.status(500).json({ error: "❌ Error al procesar la solicitud." });
    }
});

module.exports = router;
