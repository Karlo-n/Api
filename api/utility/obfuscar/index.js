// api/utility/obfuscar/index.js
const express = require("express");
const router = express.Router();

/**
 * API Obfuscador - Convierte texto normal en texto obfuscado
 * Endpoint: /api/utility/obfuscar?texto=Hola mundo
 */
router.get("/", async (req, res) => {
    try {
        const { texto, nivel } = req.query;
        
        if (!texto) {
            return res.status(400).json({ 
                error: "Se requiere un texto para obfuscar", 
                ejemplo: "/api/utility/obfuscar?texto=Hola mundo&nivel=2" 
            });
        }
        
        // Nivel de obfuscación (1-3, por defecto 2)
        const nivelObfuscacion = parseInt(nivel) || 2;
        
        if (nivelObfuscacion < 1 || nivelObfuscacion > 3) {
            return res.status(400).json({ 
                error: "El nivel de obfuscación debe estar entre 1 y 3", 
                ejemplo: "/api/utility/obfuscar?texto=Hola mundo&nivel=2" 
            });
        }
        
        // Obfuscar el texto según el nivel
        const textoObfuscado = obfuscarTexto(texto, nivelObfuscacion);
        
        // Responder con JSON
        return res.json({
            success: true,
            original: texto,
            obfuscado: textoObfuscado,
            nivel: nivelObfuscacion
        });

    } catch (error) {
        console.error("Error en API Obfuscador:", error);
        res.status(500).json({ 
            error: "Error al obfuscar el texto",
            detalle: error.message
        });
    }
});

/**
 * Obfusca un texto según el nivel especificado
 * @param {string} texto - El texto a obfuscar
 * @param {number} nivel - Nivel de obfuscación (1-3)
 * @returns {string} - Texto obfuscado
 */
function obfuscarTexto(texto, nivel) {
    // Caracteres de reemplazo según el nivel
    const charSets = {
        // Nivel 1: Cambios simples de letras por símbolos similares
        1: {
            a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', 
            A: '4', E: '3', I: '1', O: '0', S: '5', T: '7'
        },
        // Nivel 2: Cambios más complejos con caracteres especiales
        2: {
            a: '@', b: '8', c: '(', d: 'd', e: '€', f: 'f', g: 'g', h: '#', i: '!', j: 'j', 
            k: 'k', l: '1', m: 'm', n: 'n', o: '0', p: 'p', q: 'q', r: 'r', s: '$', t: '+', 
            u: 'u', v: 'v', w: 'w', x: 'x', y: 'y', z: 'z',
            A: '@', B: '8', C: '(', D: 'D', E: '€', F: 'F', G: 'G', H: '#', I: '!', J: 'J', 
            K: 'K', L: '1', M: 'M', N: 'N', O: '0', P: 'P', Q: 'Q', R: 'R', S: '$', T: '+', 
            U: 'U', V: 'V', W: 'W', X: 'X', Y: 'Y', Z: 'Z'
        },
        // Nivel 3: Sustitución con caracteres Unicode y símbolos exóticos
        3: {
            a: 'α', b: 'β', c: '¢', d: 'δ', e: 'ε', f: 'ƒ', g: 'g', h: 'н', i: 'ι', j: 'נ', 
            k: 'κ', l: 'ℓ', m: 'м', n: 'η', o: 'σ', p: 'ρ', q: 'q', r: 'я', s: 'ѕ', t: 'τ', 
            u: 'μ', v: 'ν', w: 'ω', x: 'χ', y: 'γ', z: 'ζ',
            A: 'Δ', B: 'Ᏼ', C: 'Ç', D: 'Ð', E: 'Є', F: 'Ŧ', G: 'Ǥ', H: 'Ħ', I: 'Ɨ', J: 'Ĵ', 
            K: 'Ҝ', L: 'Ł', M: 'Μ', N: 'Ñ', O: 'Ø', P: 'Ƥ', Q: 'Ǫ', R: 'Я', S: 'Ŝ', T: 'Ŧ', 
            U: 'Ữ', V: 'V', W: 'Ŵ', X: 'Ж', Y: 'Ұ', Z: 'Ž'
        }
    };
    
    // Obtener el conjunto de caracteres para el nivel
    const charSet = charSets[nivel];
    
    // Convertir el texto a un array para procesarlo
    let result = '';
    
    for (let i = 0; i < texto.length; i++) {
        const char = texto[i];
        // Reemplazar el carácter si existe en el charSet, de lo contrario mantenerlo
        result += charSet[char] || char;
    }
    
    // Nivel 3: Añadir caracteres aleatorios entre palabras
    if (nivel === 3) {
        const specialChars = ['×', '†', '§', '∆', '√', '∑', '≈', '∞', '≠', '≤', '≥'];
        
        // Insertar símbolos aleatorios entre palabras
        result = result.replace(/\s/g, (match) => {
            const randomChar = specialChars[Math.floor(Math.random() * specialChars.length)];
            return ` ${randomChar} `;
        });
    }
    
    return result;
}

module.exports = router;
