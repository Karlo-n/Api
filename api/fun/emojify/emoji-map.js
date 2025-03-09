// api/fun/emojify/emoji-map.js

// Mapeo básico por categorías - Se puede expandir a cientos de palabras
const emojiMapES = {
    // Emociones
    "feliz": ["😄", "😊", "🙂", "😁"],
    "triste": ["😢", "😭", "😔", "😞"],
    "enojado": ["😠", "😡", "🤬", "😤"],
    "amor": ["❤️", "💕", "😍", "🥰"],
    "sorprendido": ["😮", "😲", "😯", "😱"],
    
    // Naturaleza
    "sol": ["☀️", "🌞", "😎"],
    "luna": ["🌙", "🌛", "🌜"],
    "estrella": ["⭐", "🌟", "✨"],
    "lluvia": ["🌧️", "☔", "⛈️"],
    "nieve": ["❄️", "☃️", "⛄"],
    "fuego": ["🔥", "🧯", "🥵"],
    "agua": ["💧", "🌊", "🚿"],
    "árbol": ["🌳", "🌲", "🌴"],
    "flor": ["🌸", "🌹", "🌺", "🌻"],
    
    // Animales
    "perro": ["🐶", "🐕", "🦮"],
    "gato": ["🐱", "🐈", "😺"],
    "pájaro": ["🐦", "🦜", "🦢"],
    "pez": ["🐠", "🐟", "🐡"],
    "vaca": ["🐄", "🐮"],
    "cerdo": ["🐷", "🐽", "🐖"],
    
    // Comida
    "pizza": ["🍕"],
    "hamburguesa": ["🍔"],
    "taco": ["🌮"],
    "burrito": ["🌯"],
    "helado": ["🍦", "🍨", "🍧"],
    "café": ["☕"],
    "cerveza": ["🍺", "🍻"],
    "vino": ["🍷", "🍇"],
    
    // Tecnología
    "teléfono": ["📱", "☎️", "📞"],
    "computadora": ["💻", "🖥️", "⌨️"],
    "cámara": ["📷", "📸", "🎥"],
    "música": ["🎵", "🎶", "🎸", "🎹"],
    "televisión": ["📺", "🎬"],
    
    // Lugares
    "casa": ["🏠", "🏡", "🏘️"],
    "escuela": ["🏫", "🎓", "📚"],
    "hospital": ["🏥", "👨‍⚕️", "👩‍⚕️"],
    "oficina": ["🏢", "👨‍💼", "👩‍💼"],
    "restaurante": ["🍽️", "🍴", "🥄"],
    
    // Transporte
    "coche": ["🚗", "🚙", "🚘"],
    "bicicleta": ["🚲", "🚵"],
    "avión": ["✈️", "🛩️", "🛫"],
    "barco": ["🚢", "⛵", "🛥️"],
    "tren": ["🚆", "🚄", "🚂"],
    
    // Actividades
    "correr": ["🏃", "👟", "💨"],
    "nadar": ["🏊", "🏄", "🌊"],
    "bailar": ["💃", "🕺", "🎵"],
    "cantar": ["🎤", "🎵", "🎶"],
    "leer": ["📚", "📖", "📕"],
    "escribir": ["✍️", "📝", "🖊️"],
    "jugar": ["🎮", "🎯", "🎲"],
    
    // Tiempo
    "mañana": ["🌅", "🌄", "☀️"],
    "tarde": ["🌇", "🌆"],
    "noche": ["🌃", "🌙", "🌜"],
    "hora": ["⏰", "⌚", "⏱️"],
    
    // Conectores y comunes (para emojipasta)
    "y": ["➕", "🔄", "〰️"],
    "de": ["📥", "🔄"],
    "con": ["🤝", "🔗"],
    "por": ["⬅️", "↔️"],
    "para": ["📬", "🎁"],
    "en": ["📍", "🎯"]
};

// Versión en inglés del mapa
const emojiMapEN = {
    // Emotions
    "happy": ["😄", "😊", "🙂", "😁"],
    "sad": ["😢", "😭", "😔", "😞"],
    "angry": ["😠", "😡", "🤬", "😤"],
    "love": ["❤️", "💕", "😍", "🥰"],
    "surprised": ["😮", "😲", "😯", "😱"],
    
    // Nature
    "sun": ["☀️", "🌞", "😎"],
    "moon": ["🌙", "🌛", "🌜"],
    "star": ["⭐", "🌟", "✨"],
    "rain": ["🌧️", "☔", "⛈️"],
    "snow": ["❄️", "☃️", "⛄"],
    "fire": ["🔥", "🧯", "🥵"],
    "water": ["💧", "🌊", "🚿"],
    "tree": ["🌳", "🌲", "🌴"],
    "flower": ["🌸", "🌹", "🌺", "🌻"],
    
    // Animals (continuar el patrón)
    "dog": ["🐶", "🐕", "🦮"],
    "cat": ["🐱", "🐈", "😺"],
    "bird": ["🐦", "🦜", "🦢"],
    "fish": ["🐠", "🐟", "🐡"],
    
    // Añadir resto de categorías en inglés...
};

// Función para normalizar texto (quitar acentos, minúsculas)
const normalizeText = (text) => {
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quitar acentos
};

// Función para obtener emoji(s) según la palabra y modo
const getEmojisForWord = (word, idioma = "es", intensidad = "media") => {
    const normalizedWord = normalizeText(word);
    const map = idioma === "en" ? emojiMapEN : emojiMapES;
    
    // Buscar coincidencia directa
    if (map[normalizedWord]) {
        const emojis = map[normalizedWord];
        // Según intensidad, devolver más o menos emojis
        if (intensidad === "baja") {
            return [emojis[0]]; // Solo 1 emoji
        } else if (intensidad === "media") {
            return emojis.slice(0, Math.min(2, emojis.length)); // Hasta 2 emojis
        } else { // alta
            return emojis; // Todos los emojis disponibles
        }
    }
    
    // Buscar coincidencia parcial (si la palabra contiene alguna palabra clave)
    for (const [key, emojis] of Object.entries(map)) {
        if (normalizedWord.includes(key)) {
            if (intensidad === "baja") {
                return [emojis[0]];
            } else if (intensidad === "media") {
                return [emojis[0]];
            } else { // alta
                return emojis.slice(0, 2);
            }
        }
    }
    
    // No se encontró coincidencia
    return null;
};

module.exports = {
    emojiMapES,
    emojiMapEN,
    getEmojisForWord,
    normalizeText
};
