// api/fun/emojify/emoji-modes.js
const { getEmojisForWord } = require("./emoji-map");

/**
 * Convierte texto a emojis según el modo especificado
 */
const convertToEmoji = async (texto, modo, idioma, intensidad) => {
    // Preparar el resultado
    const result = {
        texto: "",
        emojisUsados: new Set(),
        contadorEmojis: 0,
        porcentajeConversion: 0
    };
    
    // Dividir el texto en palabras
    const palabras = texto.split(/\b/);
    const palabrasSinEspacios = texto.split(/\s+/).filter(w => w.length > 0);
    
    switch (modo) {
        case "sustitucion":
            result.texto = convertSustitucion(palabras, idioma, intensidad, result);
            break;
            
        case "combinado":
            result.texto = convertCombinado(palabras, idioma, intensidad, result);
            break;
            
        case "intercalado":
            result.texto = convertIntercalado(palabras, idioma, intensidad, result);
            break;
            
        case "palabra_por_palabra":
            result.texto = convertPalabraPorPalabra(palabras, idioma, intensidad, result);
            break;
            
        case "emojipasta":
            result.texto = convertEmojipasta(palabras, idioma, intensidad, result);
            break;
            
        default:
            result.texto = convertCombinado(palabras, idioma, intensidad, result);
    }
    
    // Calcular estadísticas
    result.porcentajeConversion = Math.round((result.contadorEmojis / palabrasSinEspacios.length) * 100);
    
    // Convertir set a array para la respuesta
    result.emojisUsados = Array.from(result.emojisUsados);
    
    return result;
};

/**
 * Modo 1: Sustituye algunas palabras por emojis completamente
 */
const convertSustitucion = (palabras, idioma, intensidad, result) => {
    const probabilidadSustitucion = getIntensidadProbabilidad(intensidad);
    
    return palabras.map(palabra => {
        if (palabra.trim() === "") return palabra;
        
        // Decide si sustituir esta palabra según intensidad
        if (Math.random() < probabilidadSustitucion) {
            const emojis = getEmojisForWord(palabra, idioma, intensidad);
            if (emojis) {
                // Añadir a las estadísticas
                emojis.forEach(e => result.emojisUsados.add(e));
                result.contadorEmojis++;
                
                return emojis.join("");
            }
        }
        
        return palabra;
    }).join("");
};

/**
 * Modo 2: Combina palabras con sus emojis asociados
 */
const convertCombinado = (palabras, idioma, intensidad, result) => {
    const probabilidadCombinacion = getIntensidadProbabilidad(intensidad);
    
    return palabras.map(palabra => {
        if (palabra.trim() === "") return palabra;
        
        if (Math.random() < probabilidadCombinacion) {
            const emojis = getEmojisForWord(palabra, idioma, intensidad);
            if (emojis) {
                // Añadir estadísticas
                emojis.forEach(e => result.emojisUsados.add(e));
                result.contadorEmojis++;
                
                return `${palabra} ${emojis.join("")}`;
            }
        }
        
        return palabra;
    }).join("");
};

/**
 * Modo 3: Intercala emojis entre palabras
 */
const convertIntercalado = (palabras, idioma, intensidad, result) => {
    let texto = "";
    let ultimaPalabraConEmoji = false;
    
    for (let i = 0; i < palabras.length; i++) {
        const palabra = palabras[i];
        texto += palabra;
        
        // Si no es un espacio y la última palabra no tuvo emoji
        if (palabra.trim() !== "" && !ultimaPalabraConEmoji) {
            const emojis = getEmojisForWord(palabra, idioma, intensidad);
            if (emojis) {
                // Añadir emoji entre palabras
                const emojiSeleccionado = emojis[0];
                texto += ` ${emojiSeleccionado} `;
                
                // Estadísticas
                result.emojisUsados.add(emojiSeleccionado);
                result.contadorEmojis++;
                ultimaPalabraConEmoji = true;
            } else {
                ultimaPalabraConEmoji = false;
            }
        } else {
            ultimaPalabraConEmoji = false;
        }
    }
    
    return texto;
};

/**
 * Modo 4: Sustituye cada palabra por un emoji aproximado si está disponible
 */
const convertPalabraPorPalabra = (palabras, idioma, intensidad, result) => {
    return palabras.map(palabra => {
        if (palabra.trim() === "") return palabra;
        
        const emojis = getEmojisForWord(palabra, idioma, intensidad);
        if (emojis) {
            // Añadir estadísticas
            emojis.forEach(e => result.emojisUsados.add(e));
            result.contadorEmojis++;
            return emojis[0];
        }
        
        return palabra;
    }).join("");
};

/**
 * Modo 5: Genera texto sobrecargado de emojis (estilo emojipasta)
 */
const convertEmojipasta = (palabras, idioma, intensidad, result) => {
    // En emojipasta queremos muchos emojis repetidos
    const repeating = intensidad === "alta" ? 3 : (intensidad === "media" ? 2 : 1);
    
    return palabras.map(palabra => {
        if (palabra.trim() === "") return palabra;
        
        const emojis = getEmojisForWord(palabra, idioma, intensidad);
        if (emojis) {
            // Para emojipasta, repetimos cada emoji según intensidad
            let emojiGroup = [];
            for (let i = 0; i < Math.min(emojis.length, repeating); i++) {
                const repeatedEmojis = Array(Math.floor(Math.random() * 3) + 1).fill(emojis[i]);
                emojiGroup = [...emojiGroup, ...repeatedEmojis];
            }
            
            // Añadir estadísticas
            emojiGroup.forEach(e => result.emojisUsados.add(e));
            result.contadorEmojis += emojiGroup.length;
            
            // En emojipasta, algunos emojis van antes y otros después
            if (Math.random() > 0.5) {
                return `${emojiGroup.join("")} ${palabra}`;
            } else {
                return `${palabra} ${emojiGroup.join("")}`;
            }
        }
        
        return palabra;
    }).join("");
};

/**
 * Obtener probabilidad según intensidad
 */
const getIntensidadProbabilidad = (intensidad) => {
    switch (intensidad) {
        case "baja": return 0.25;    // 25% de probabilidad 
        case "alta": return 0.75;    // 75% de probabilidad
        case "media":                // Entre 40-50% de probabilidad
        default: return 0.45;
    }
};

module.exports = {
    convertToEmoji
};
