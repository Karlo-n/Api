const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { id, descripcion } = req.query;

        if (!id || !descripcion) {
            return res.status(400).json({ error: "Debes proporcionar un ID de usuario y una descripción." });
        }

        // Obtener datos del usuario en Roblox
        const response = await axios.get(`https://users.roblox.com/v1/users/${id}`);

        if (!response.data || response.data.description === undefined) {
            return res.status(404).json({ error: "Usuario no encontrado o sin descripción." });
        }

        // Comparar la descripción proporcionada con la real
        const esCorrecto = response.data.description.trim() === descripcion.trim();

        res.json(esCorrecto);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al verificar la descripción." });
    }
});

module.exports = router;
