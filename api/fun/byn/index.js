// api/fun/byn/index.js
const express = require("express");
const sharp = require("sharp");
const axios = require("axios");
const router = express.Router();

/**
 * API BYN - Convierte imágenes a blanco y negro
 */
router.get("/", async (req, res) => {
    try {
        const { imagen } = req.query;

        if (!imagen) {
            return res.status(400).json({ 
                error: "Se requiere una URL de imagen", 
                ejemplo: "/api/fun/byn?imagen=https://ejemplo.com/imagen.jpg" 
            });
        }

        console.log("Procesando imagen en blanco y negro:", imagen);

        // Descargar la imagen desde la URL
        let response;
        try {
            response = await axios.get(imagen, { 
                responseType: "arraybuffer",
                timeout: 15000 // 15 segundos timeout
            });
        } catch (loadError) {
            console.error("Error cargando la imagen:", loadError.message);
            return res.status(400).json({ 
                error: "No se pudo cargar la imagen", 
                detalle: loadError.message 
            });
        }

        // Convertir la imagen a blanco y negro usando Sharp
        const processedImageBuffer = await sharp(Buffer.from(response.data))
            .grayscale() // Convierte a escala de grises (blanco y negro)
            .toBuffer();
        
        // Enviar imagen como respuesta
        res.setHeader("Content-Type", "image/jpeg");
        res.send(processedImageBuffer);

    } catch (error) {
        console.error("Error en BYN:", error);
        res.status(500).json({ 
            error: "Error al convertir la imagen a blanco y negro",
            detalle: error.message
        });
    }
});

module.exports = router;
