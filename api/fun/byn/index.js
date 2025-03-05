const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
const router = express.Router();

// Ruta para convertir una imagen a blanco y negro
router.get('/bw', async (req, res) => {
  try {
    // Obtener la URL de la imagen desde el parámetro de consulta
    const imageUrl = req.query.imagen;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Se requiere una URL de imagen (parámetro "imagen")' });
    }
    
    // Descargar la imagen desde la URL
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'arraybuffer'
    });
    
    // Convertir la imagen a blanco y negro usando Sharp
    const processedImageBuffer = await sharp(response.data)
      .grayscale() // Convierte a escala de grises (blanco y negro)
      .toBuffer();
    
    // Configurar encabezados de respuesta
    res.set('Content-Type', 'image/jpeg');
    
    // Enviar la imagen procesada como respuesta
    res.send(processedImageBuffer);
    
  } catch (error) {
    console.error('Error al procesar la imagen:', error);
    res.status(500).json({ 
      error: 'Error al procesar la imagen', 
      mensaje: error.message 
    });
  }
});

module.exports = router;
