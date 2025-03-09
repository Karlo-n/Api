// api/fun/emojify/emoji-utils.js

/**
 * Valida y normaliza los parámetros de entrada
 */
const validateInput = (texto, modo, idioma, intensidad) => {
    // Validar longitud máxima
    if (texto.length > 500) {
        return {
            error: "El texto excede el límite de 500 caracteres",
            longitud_actual: texto.length,
            maximo_permitido: 500
        };
    }
    
    // Validar y normalizar modo
    const modosValidos = ["sustitucion", "combinado", "intercalado", "palabra_por_palabra", "emojipasta"];
    let modoNormalizado = modo.toLowerCase();
    
    if (!modosValidos.includes(modoNormalizado)) {
        modoNormalizado = "combinado"; // Modo por defecto
    }
    
    // Validar y normalizar idioma
    const idiomasValidos = ["es", "en"];
    let idiomaNormalizado = idioma.toLowerCase();
    
    if (!idiomasValidos.includes(idiomaNormalizado)) {
        idiomaNormalizado = "es"; // Idioma por defecto
    }
    
    // Validar y normalizar intensidad
    const intensidadesValidas = ["baja", "media", "alta"];
    let intensidadNormalizada = intensidad.toLowerCase();
    
    if (!intensidadesValidas.includes(intensidadNormalizada)) {
        intensidadNormalizada = "media"; // Intensidad por defecto
    }
    
    return {
        modo: modoNormalizado,
        idioma: idiomaNormalizado,
        intensidad: intensidadNormalizada
    };
};

module.exports = {
    validateInput
};
