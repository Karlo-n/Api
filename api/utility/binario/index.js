// api/utility/binario/index.js
const express = require("express");
const router = express.Router();

/**
 * API Código Binario - Convierte texto a binario y viceversa
 * Endpoints:
 * - /api/utility/binario?texto=Hola -> Convierte texto a binario
 * - /api/utility/binario?binario=01001000 01101111 01101100 01100001 -> Convierte binario a texto
 */
router.get("/", async (req, res) => {
    try {
        const { texto, binario } = req.query;

        // Validar que se proporcionó al menos un parámetro
        if (!texto && !binario) {
            return res.status(400).json({ 
                error: "Se requiere un parámetro", 
                ejemplos: [
                    "/api/utility/binario?texto=Hola mundo", 
                    "/api/utility/binario?binario=01001000 01101111 01101100 01100001"
                ]
            });
        }

        // Convertir texto a binario
        if (texto) {
            const resultado = textToBinary(texto);
            return res.json({
                success: true,
                original: texto,
                binario: resultado,
                caracteres: texto.length,
                bits: resultado.replace(/\s/g, '').length
            });
        }

        // Convertir binario a texto
        if (binario) {
            try {
                const resultado = binaryToText(binario);
                return res.json({
                    success: true,
                    original: binario,
                    texto: resultado,
                    bits: binario.replace(/\s/g, '').length,
                    caracteres: resultado.length
                });
            } catch (error) {
                return res.status(400).json({
                    error: "Código binario inválido",
                    detalle: error.message
                });
            }
        }

    } catch (error) {
        console.error("Error en API Binario:", error);
        res.status(500).json({ 
            error: "Error al procesar la solicitud",
            detalle: error.message
        });
    }
});

/**
 * Convierte una cadena de texto a su representación binaria
 * @param {string} text - Texto a convertir
 * @returns {string} - Representación binaria con espacios entre cada byte
 */
function textToBinary(text) {
    let binary = '';
    
    for (let i = 0; i < text.length; i++) {
        // Obtener el código ASCII/Unicode del carácter
        const charCode = text.charCodeAt(i);
        
        // Convertir a binario y asegurar que tenga 8 bits (rellenando con ceros)
        const byte = charCode.toString(2).padStart(8, '0');
        
        // Añadir al resultado con un espacio entre bytes
        binary += byte + ' ';
    }
    
    return binary.trim();
}

/**
 * Convierte una cadena de código binario a texto
 * @param {string} binary - Código binario (con o sin espacios)
 * @returns {string} - Texto resultante
 */
function binaryToText(binary) {
    // Eliminar caracteres que no sean 0, 1 o espacio
    const cleanBinary = binary.replace(/[^01\s]/g, '');
    
    // Dividir por espacios o en grupos de 8 bits si no hay espacios
    let bytes;
    if (cleanBinary.includes(' ')) {
        bytes = cleanBinary.split(' ');
    } else {
        // Si no hay espacios, dividir la cadena en grupos de 8 caracteres
        bytes = cleanBinary.match(/.{1,8}/g) || [];
    }
    
    // Convertir cada byte a su carácter correspondiente
    let text = '';
    for (const byte of bytes) {
        // Verificar que el byte tenga un formato válido
        if (!/^[01]{1,8}$/.test(byte)) {
            continue; // Ignorar bytes inválidos
        }
        
        // Convertir de binario a decimal y luego a carácter
        const charCode = parseInt(byte, 2);
        text += String.fromCharCode(charCode);
    }
    
    return text;
}

module.exports = router;
