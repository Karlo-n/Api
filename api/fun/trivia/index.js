// api/fun/trivia/index.js
const express = require("express");
const router = express.Router();

/**
 * API TRIVIA GENERATOR - Genera preguntas de trivia en diversas categorías
 * 
 * Funcionalidades:
 * - Múltiples categorías (anime, videojuegos, películas, ciencia, etc.)
 * - Diferentes niveles de dificultad
 * - Tipos de preguntas (opción múltiple, verdadero/falso)
 * - Explicaciones detalladas para respuestas
 * - Evita repetición de preguntas
 */

// Categorías disponibles
const CATEGORIAS = {
    ANIME: "anime",
    VIDEOJUEGOS: "videojuegos",
    PELICULAS: "peliculas",
    SERIES: "series",
    CIENCIA: "ciencia",
    HISTORIA: "historia",
    GEOGRAFIA: "geografia",
    MUSICA: "musica",
    DEPORTES: "deportes",
    TECNOLOGIA: "tecnologia",
    RANDOM: "random"  // Categoría especial: cualquier tema
};

// Dificultades disponibles
const DIFICULTADES = {
    FACIL: "facil",
    MEDIO: "medio",
    DIFICIL: "dificil",
    EXPERTO: "experto",
    RANDOM: "random"  // Dificultad aleatoria
};

// Tipos de preguntas
const TIPOS = {
    OPCION_MULTIPLE: "opcion_multiple",
    VERDADERO_FALSO: "verdadero_falso",
    RANDOM: "random"  // Tipo aleatorio
};

// Ubicación de la imagen de trivia (accesible desde el index.js principal)
const TRIVIA_IMAGEN = "trivia.png";

// Banco de datos de preguntas
// Estructura mínima para cada categoría para ilustrar el ejemplo
// En producción, este banco sería mucho más extenso
const BANCO_PREGUNTAS = {
    // ANIME
    [CATEGORIAS.ANIME]: [
    {
        pregunta: "¿Cuál es el nombre del protagonista de 'Naruto'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Naruto Uzumaki", "Sasuke Uchiha", "Kakashi Hatake", "Itachi Uchiha"],
        respuesta_correcta: 0,
        explicacion: "Naruto Uzumaki es el protagonista principal de la serie, un ninja de Konoha que sueña con convertirse en Hokage.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué fruta del diablo comió Monkey D. Luffy en 'One Piece'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Gomu Gomu no Mi", "Mera Mera no Mi", "Hito Hito no Mi", "Bara Bara no Mi"],
        respuesta_correcta: 0,
        explicacion: "Luffy comió la Gomu Gomu no Mi (Fruta Goma Goma), que convirtió su cuerpo en goma.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre del robot gato del futuro en el manga/anime 'Doraemon'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Doraemon", "Nobita", "Pikachú", "Astroboy"],
        respuesta_correcta: 0,
        explicacion: "Doraemon es el nombre del gato robot azul que viene del futuro para ayudar a Nobita.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En 'Dragon Ball', ¿cuántas esferas del dragón deben reunirse para invocar a Shenlong?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["7", "5", "8", "3"],
        respuesta_correcta: 0,
        explicacion: "En Dragon Ball se deben reunir 7 esferas del dragón con estrellas numeradas del 1 al 7 para invocar a Shenlong.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre del hermano de Sasuke Uchiha en 'Naruto'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Itachi", "Madara", "Obito", "Kakashi"],
        respuesta_correcta: 0,
        explicacion: "Itachi Uchiha es el hermano mayor de Sasuke, responsable de la masacre del clan Uchiha.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué anime trata sobre un cuaderno que mata personas cuando se escribe su nombre en él?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Death Note", "Code Geass", "Mirai Nikki", "Another"],
        respuesta_correcta: 0,
        explicacion: "Death Note cuenta la historia de Light Yagami, quien encuentra un cuaderno sobrenatural que permite matar a cualquier persona cuyo nombre sea escrito en él.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cómo se llama el protagonista de 'Sword Art Online'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Kirito", "Asuna", "Klein", "Heathcliff"],
        respuesta_correcta: 0,
        explicacion: "Kazuto Kirigaya, conocido como Kirito, es el protagonista principal de Sword Art Online.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre del ataque más famoso de Goku en 'Dragon Ball'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Kamehameha", "Kaioken", "Genki Dama", "Final Flash"],
        respuesta_correcta: 0,
        explicacion: "El Kamehameha es el ataque insignia de Goku, una onda de energía que dispara con ambas manos.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En 'Sailor Moon', cómo se llama la protagonista en su forma civil?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Usagi Tsukino", "Rei Hino", "Minako Aino", "Ami Mizuno"],
        respuesta_correcta: 0,
        explicacion: "Usagi Tsukino es el nombre civil de Sailor Moon, la protagonista de la serie.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el apellido de los hermanos Edward y Alphonse en 'Fullmetal Alchemist'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Elric", "Armstrong", "Mustang", "Rockbell"],
        respuesta_correcta: 0,
        explicacion: "Edward y Alphonse Elric son los hermanos protagonistas de Fullmetal Alchemist.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cómo se llama el gremio al que pertenece Natsu en 'Fairy Tail'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Fairy Tail", "Sabertooth", "Lamia Scale", "Blue Pegasus"],
        respuesta_correcta: 0,
        explicacion: "Natsu Dragneel pertenece al gremio Fairy Tail, que también da nombre a la serie.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre del protagonista de 'My Hero Academia'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Izuku Midoriya", "Katsuki Bakugo", "Shoto Todoroki", "All Might"],
        respuesta_correcta: 0,
        explicacion: "Izuku Midoriya, también conocido como Deku, es el protagonista principal de My Hero Academia.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el trabajo de Saitama en 'One Punch Man'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Héroe", "Villano", "Policía", "Vendedor"],
        respuesta_correcta: 0,
        explicacion: "Saitama es un héroe por diversión que puede derrotar a cualquier enemigo de un solo golpe.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿La serie 'Pokémon' comenzó en 1997?",
        tipo: TIPOS.VERDADERO_FALSO,
        opciones: ["Verdadero", "Falso"],
        respuesta_correcta: 0,
        explicacion: "La serie anime de Pokémon comenzó a transmitirse en Japón el 1 de abril de 1997.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En 'Attack on Titan', los titanes comen humanos para alimentarse?",
        tipo: TIPOS.VERDADERO_FALSO,
        opciones: ["Falso", "Verdadero"],
        respuesta_correcta: 0,
        explicacion: "Los titanes no necesitan comer para sobrevivir y no obtienen nutrientes de los humanos; los devoran por instinto.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre del gato mascota de Sailor Moon?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Luna", "Artemis", "Diana", "Pluto"],
        respuesta_correcta: 0,
        explicacion: "Luna es la gata negra con una marca de luna creciente en la frente que guía a Usagi en su misión como Sailor Moon.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué buscan los hermanos Elric en 'Fullmetal Alchemist'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["La piedra filosofal", "El elixir de la vida", "La fuente de la juventud", "El libro de la sabiduría"],
        respuesta_correcta: 0,
        explicacion: "Los hermanos Elric buscan la piedra filosofal para recuperar sus cuerpos originales tras un fallido intento de resurrección humana.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cómo se llama el famoso estudio de animación japonés conocido por películas como 'El viaje de Chihiro'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Studio Ghibli", "Toei Animation", "Madhouse", "Kyoto Animation"],
        respuesta_correcta: 0,
        explicacion: "Studio Ghibli fue fundado por Hayao Miyazaki y es famoso por películas como 'El viaje de Chihiro', 'Mi vecino Totoro' y 'La princesa Mononoke'.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "En 'Death Note', ¿cómo se llama el shinigami que deja caer el Death Note en el mundo humano?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ryuk", "Rem", "Sidoh", "Gelus"],
        respuesta_correcta: 0,
        explicacion: "Ryuk es el shinigami que deja caer intencionalmente su Death Note en el mundo humano por aburrimiento.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál de estos personajes NO es un Pokémon?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ash Ketchum", "Pikachu", "Bulbasaur", "Jigglypuff"],
        respuesta_correcta: 0,
        explicacion: "Ash Ketchum es el protagonista humano de la serie Pokémon, mientras que los demás son especies de Pokémon.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
            pregunta: "¿Cuál es el nombre del protagonista de 'Naruto'?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["Naruto Uzumaki", "Sasuke Uchiha", "Kakashi Hatake", "Itachi Uchiha"],
            respuesta_correcta: 0,
            explicacion: "Naruto Uzumaki es el protagonista principal de la serie, un ninja de Konoha que sueña con convertirse en Hokage.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿En 'Death Note', qué debe conocer Light para matar a alguien usando el Death Note?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["El nombre y rostro de la persona", "Solo el nombre", "Solo el rostro", "El nombre y la fecha de nacimiento"],
            respuesta_correcta: 0,
            explicacion: "Para matar a alguien con el Death Note, Light debe conocer el nombre de la persona y tener su rostro en mente al escribirlo.",
            dificultad: DIFICULTADES.MEDIO,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿'Fullmetal Alchemist: Brotherhood' está basado fielmente en el manga original?",
            tipo: TIPOS.VERDADERO_FALSO,
            opciones: ["Verdadero", "Falso"],
            respuesta_correcta: 0,
            explicacion: "A diferencia de la primera adaptación, 'Fullmetal Alchemist: Brotherhood' sigue fielmente la historia del manga de Hiromu Arakawa.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿Cuál es el nombre del ataque especial que el Capitán Levi utiliza para matar titanes en 'Attack on Titan'?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["Giro de ataque", "Corte en espiral", "Rebanada relampago", "No tiene nombre"],
            respuesta_correcta: 3,
            explicacion: "Aunque es conocido por su técnica de giro, el ataque distintivo de Levi no tiene un nombre oficial en la serie.",
            dificultad: DIFICULTADES.DIFICIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿Cuál fue el primer anime en utilizar la técnica de animación por celdas en color?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["Astro Boy", "Kimba el León Blanco", "La Princesa Caballero", "Fantasmagórico"],
            respuesta_correcta: 1,
            explicacion: "Kimba el León Blanco (1965) fue el primer anime televisivo en utilizar animación por celdas completamente a color.",
            dificultad: DIFICULTADES.EXPERTO,
            imagen: TRIVIA_IMAGEN
        },
    {
        pregunta: "¿En 'Death Note', qué debe conocer Light para matar a alguien usando el Death Note?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["El nombre y rostro de la persona", "Solo el nombre", "Solo el rostro", "El nombre y la fecha de nacimiento"],
        respuesta_correcta: 0,
        explicacion: "Para matar a alguien con el Death Note, Light debe conocer el nombre de la persona y tener su rostro en mente al escribirlo.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el verdadero nombre de L en 'Death Note'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["L Lawliet", "Light Yagami", "Ryuzaki Rue", "Eraldo Coil"],
        respuesta_correcta: 0,
        explicacion: "L Lawliet es el verdadero nombre del detective conocido como L, aunque en la serie usa varios alias.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre del ataque característico de Vegeta en 'Dragon Ball Z'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Final Flash", "Kamehameha", "Makankosappo", "Kienzan"],
        respuesta_correcta: 0,
        explicacion: "El Final Flash es el ataque característico de Vegeta, un poderoso rayo de energía que utiliza con ambas manos.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién es el creador del manga 'One Piece'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Eiichiro Oda", "Masashi Kishimoto", "Akira Toriyama", "Tite Kubo"],
        respuesta_correcta: 0,
        explicacion: "Eiichiro Oda es el creador, escritor e ilustrador del manga One Piece, que comenzó en 1997 y se ha convertido en uno de los mangas más vendidos de la historia.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el objetivo principal de Edward Elric en 'Fullmetal Alchemist'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Recuperar el cuerpo de su hermano", "Convertirse en el mejor alquimista", "Vengar la muerte de sus padres", "Encontrar el elixir de la inmortalidad"],
        respuesta_correcta: 0,
        explicacion: "El objetivo principal de Edward es recuperar el cuerpo de su hermano Alphonse, que perdió su cuerpo físico y tiene su alma atada a una armadura.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál de estos NO es un tipo de Quirk (superpoder) en 'My Hero Academia'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ninjutsu", "Emisor", "Transformación", "Mutante"],
        respuesta_correcta: 0,
        explicacion: "Los tipos de Quirk en My Hero Academia son: Emisor, Transformación y Mutante. Ninjutsu es una técnica de Naruto.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En 'Naruto', cuál es el nombre del Cuarto Hokage?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Minato Namikaze", "Kakashi Hatake", "Hiruzen Sarutobi", "Tobirama Senju"],
        respuesta_correcta: 0,
        explicacion: "Minato Namikaze fue el Cuarto Hokage de Konoha y padre de Naruto Uzumaki.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué organización busca capturar a los Jinchūriki en 'Naruto Shippuden'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Akatsuki", "ANBU", "Raíz", "Los Siete Espadachines de la Niebla"],
        respuesta_correcta: 0,
        explicacion: "Akatsuki es la organización criminal compuesta por ninjas renegados que busca capturar a todos los Jinchūriki y extraer sus Bestias con Cola.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuántas temporadas tiene la serie 'JoJo's Bizarre Adventure' hasta 2024?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["6", "4", "8", "10"],
        respuesta_correcta: 0,
        explicacion: "JoJo's Bizarre Adventure tiene 6 partes animadas: Phantom Blood, Battle Tendency, Stardust Crusaders, Diamond is Unbreakable, Golden Wind y Stone Ocean.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué raza es Piccolo en 'Dragon Ball'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Namekiano", "Saiyajin", "Androide", "Demonio"],
        respuesta_correcta: 0,
        explicacion: "Piccolo es un Namekiano, una raza alienígena del planeta Namek conocida por su piel verde y capacidad regenerativa.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre de la escuela a la que asisten los protagonistas en 'My Hero Academia'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["U.A. High School", "Shiketsu High", "Ketsubutsu Academy", "Isamu Academy"],
        respuesta_correcta: 0,
        explicacion: "U.A. High School (Yūei en japonés) es la prestigiosa academia de héroes a la que asisten Izuku Midoriya y sus compañeros.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué significa 'Shingeki no Kyojin', el título original de 'Attack on Titan'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["El Titán de Ataque", "El Ataque de los Titanes", "El Titán Atacante", "Los Titanes Atacan"],
        respuesta_correcta: 0,
        explicacion: "Shingeki no Kyojin se traduce literalmente como 'El Titán de Ataque', aunque la serie fue localizada como 'Attack on Titan' en occidente.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuántos tipos elementales de chakra básicos existen en 'Naruto'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["5", "4", "6", "7"],
        respuesta_correcta: 0,
        explicacion: "Existen 5 tipos básicos de chakra elemental: Fuego, Viento, Rayo, Tierra y Agua, que forman la base de la mayoría de las técnicas ninja.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cómo se llama la espada que utiliza Tanjiro en 'Demon Slayer'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Nichirin", "Tessaiga", "Samehada", "Muramasa"],
        respuesta_correcta: 0,
        explicacion: "Las espadas Nichirin son el arma principal de los Cazadores de Demonios, hechas de un material especial que absorbe la luz solar y puede matar demonios.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En 'One Piece', qué recompensa tenía Luffy después del arco de Whole Cake Island?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["1,500,000,000 berries", "500,000,000 berries", "3,000,000,000 berries", "900,000,000 berries"],
        respuesta_correcta: 0,
        explicacion: "Después del arco de Whole Cake Island, la recompensa de Luffy aumentó a 1,500,000,000 berries, convirtiéndolo en uno de los piratas más buscados.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué significa 'Shonen' en los mangas japoneses?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Manga para chicos adolescentes", "Manga de acción", "Manga para adultos", "Manga de aventuras"],
        respuesta_correcta: 0,
        explicacion: "Shonen significa literalmente 'joven chico' y se refiere a mangas dirigidos principalmente a adolescentes masculinos, que típicamente contienen acción, aventura y camaradería.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre real de Lelouch en 'Code Geass'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Lelouch vi Britannia", "Lelouch Lamperouge", "Zero", "R.R."],
        respuesta_correcta: 0,
        explicacion: "Lelouch vi Britannia es su nombre real como príncipe del Imperio Britannian, mientras que Lelouch Lamperouge es su alias como estudiante.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál de los siguientes animes NO pertenece al 'Big Three'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Dragon Ball Z", "Naruto", "One Piece", "Bleach"],
        respuesta_correcta: 0,
        explicacion: "El 'Big Three' es un término que se refiere a los tres mangas/animes más populares que se publicaron simultáneamente en la revista Shonen Jump: Naruto, One Piece y Bleach. Dragon Ball Z, aunque enormemente popular, precedió a esta era.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En 'Attack on Titan', a qué cuerpo militar pertenecen inicialmente Eren, Mikasa y Armin?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Cuerpo de Exploración", "Policía Militar", "Tropas Estacionarias", "Cuerpo de Reclutas"],
        respuesta_correcta: 0,
        explicacion: "Después de graduarse como reclutas, Eren, Mikasa y Armin decidieron unirse al Cuerpo de Exploración (Scout Regiment), que se aventura fuera de las murallas para combatir a los titanes.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En 'Fullmetal Alchemist', qué oculta Edward con su brazo y pierna mecánicos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Que realizó transmutación humana", "Que es un homúnculo", "Que es un quimera", "Que no puede usar alquimia"],
        respuesta_correcta: 0,
        explicacion: "Edward perdió su brazo y pierna durante el fallido intento de transmutación humana para revivir a su madre, que es tabú en la alquimia.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
{
        pregunta: "¿Cuál es el nombre del ataque especial que el Capitán Levi utiliza para matar titanes en 'Attack on Titan'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["No tiene nombre", "Giro de ataque", "Corte en espiral", "Rebanada relampago"],
        respuesta_correcta: 0,
        explicacion: "Aunque es conocido por su técnica de giro, el ataque distintivo de Levi no tiene un nombre oficial en la serie.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué año exactamente comienza la historia principal de 'Steins;Gate'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["2010", "2009", "2011", "2012"],
        respuesta_correcta: 0,
        explicacion: "La historia principal de Steins;Gate comienza el 28 de julio de 2010 en Akihabara, Tokio.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuántos minutos puede mantener Eren su forma de titán en el primer arco de 'Attack on Titan'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Aproximadamente 3 veces", "Indefinidamente", "Máximo 10 minutos", "Hasta 1 hora"],
        respuesta_correcta: 0,
        explicacion: "En el arco inicial, Eren solo puede transformarse en titán aproximadamente 3 veces seguidas antes de que su cuerpo se agote completamente.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre del autor de 'Berserk'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Kentaro Miura", "Hiromu Arakawa", "Yoshihiro Togashi", "Naoki Urasawa"],
        respuesta_correcta: 0,
        explicacion: "Kentaro Miura fue el creador, escritor y artista de Berserk hasta su fallecimiento en 2021.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el verdadero nombre de Yagami Light en el doblaje inglés oficial de 'Death Note'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Light Yagami", "Yagami Light", "Raito Yagami", "Light Turner"],
        respuesta_correcta: 0,
        explicacion: "En el doblaje inglés oficial, su nombre fue invertido al estilo occidental como Light Yagami, mientras que en japonés es Yagami Light (apellido primero).",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "En 'Sailor Moon', ¿qué personaje NO es una Sailor Scout original?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Sailor Saturn", "Sailor Mercury", "Sailor Mars", "Sailor Jupiter"],
        respuesta_correcta: 0,
        explicacion: "Las Sailor Scouts originales son Sailor Moon, Mercury, Mars, Jupiter y Venus. Sailor Saturn aparece más tarde junto con Sailor Uranus, Neptune y Pluto.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué tipo de sangre tiene Monkey D. Luffy en 'One Piece'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["F", "X", "B", "O"],
        respuesta_correcta: 0,
        explicacion: "Luffy tiene tipo de sangre F, que es un tipo ficticio creado por Eiichiro Oda para el mundo de One Piece.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre del Opening 1 de 'Neon Genesis Evangelion'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["A Cruel Angel's Thesis", "Fly Me to the Moon", "Komm, Süsser Tod", "Thanatos"],
        respuesta_correcta: 0,
        explicacion: "'A Cruel Angel's Thesis' (残酷な天使のテーゼ, Zankoku na Tenshi no Tēze) es el tema de apertura de Evangelion, interpretado por Yoko Takahashi.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué es un 'Mangaka'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Un creador de manga", "Un personaje de manga", "Un género de manga", "Una técnica de dibujo"],
        respuesta_correcta: 0,
        explicacion: "Mangaka (漫画家) es el término japonés para designar a un dibujante, escritor y creador de manga.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En 'Hunter x Hunter', cuál es la habilidad Nen especializada de Kurapika?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Emperor Time", "Chain Jail", "Dowsing Chain", "Judgment Chain"],
        respuesta_correcta: 0,
        explicacion: "Emperor Time es la habilidad que permite a Kurapika usar las cinco categorías Nen con 100% de eficiencia cuando sus ojos se vuelven escarlata.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién es el compositor principal de la música de 'Naruto' y 'Naruto Shippuden'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Toshio Masuda", "Yoko Kanno", "Hiroyuki Sawano", "Joe Hisaishi"],
        respuesta_correcta: 0,
        explicacion: "Toshio Masuda compuso la mayor parte de la música de fondo para las series de Naruto, aunque para Shippuden también trabajó junto a Yasuharu Takanashi.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué año se estrenó el primer episodio de 'Dragon Ball' en Japón?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["1986", "1984", "1989", "1991"],
        respuesta_correcta: 0,
        explicacion: "El anime Dragon Ball comenzó a emitirse en Fuji TV el 26 de febrero de 1986, basado en el manga de Akira Toriyama que inició publicación en 1984.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál de estos NO es uno de los 'Tres Grandes Doujutsu' en 'Naruto'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ketsuryugan", "Sharingan", "Byakugan", "Rinnegan"],
        respuesta_correcta: 0,
        explicacion: "Los Tres Grandes Doujutsu son Sharingan, Byakugan y Rinnegan. El Ketsuryugan es un doujutsu raro del clan Chinoike que aparece solo en novelas y anime.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cómo se llama la técnica de Kenshin Himura en 'Rurouni Kenshin' que le permite alcanzar velocidades sobrehumanas?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Shukuchi", "Battōjutsu", "Hirameki", "Ryūsōsen"],
        respuesta_correcta: 0,
        explicacion: "El Shukuchi es una técnica de movimiento a velocidad divina que elimina el espacio entre el usuario y su objetivo, dando la impresión de teletransportación.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el número total de episodios del anime 'Monster' de Naoki Urasawa?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["74", "64", "84", "94"],
        respuesta_correcta: 0,
        explicacion: "El anime Monster tiene exactamente 74 episodios que adaptan completamente el manga, sin relleno.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué significa literalmente 'Shingeki no Kyojin'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["El Titán que Avanza", "Avance de los Gigantes", "El Ataque de los Titanes", "El Gigante Atacante"],
        respuesta_correcta: 0,
        explicacion: "'Shingeki no Kyojin' se traduce más precisamente como 'El Titán que Avanza' o 'El Titán de Ataque', lo que tiene un significado especial dentro de la trama.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre de la espada de Ichigo en su estado Bankai en 'Bleach'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Tensa Zangetsu", "Zangetsu", "Hyōrinmaru", "Senbonzakura"],
        respuesta_correcta: 0,
        explicacion: "Tensa Zangetsu (天鎖斬月, 'Luna Cortante Encadenada al Cielo') es el nombre de la zanpakutō de Ichigo en su estado Bankai.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué famoso mangaka creó tanto 'Astro Boy' como 'Kimba el León Blanco'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Osamu Tezuka", "Shotaro Ishinomori", "Go Nagai", "Leiji Matsumoto"],
        respuesta_correcta: 0,
        explicacion: "Osamu Tezuka, conocido como 'el dios del manga', creó numerosas obras influyentes incluyendo Astro Boy y Kimba el León Blanco entre muchas otras.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuándo se estableció oficialmente el término 'anime' para referirse a la animación japonesa?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Años 1970", "Años 1950", "Años 1980", "Años 1990"],
        respuesta_correcta: 0,
        explicacion: "Aunque la animación japonesa existía desde antes, el término 'anime' como abreviatura de 'animēshon' se popularizó en los años 70, consolidándose en los 80 internacionalmente.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es la técnica ocular más poderosa que puede alcanzar un usuario del Sharingan en 'Naruto'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Rinnegan", "Mangekyō Sharingan Eterno", "Byakugan", "Tenseigan"],
        respuesta_correcta: 0,
        explicacion: "El Rinnegan es la evolución final del Sharingan, considerado el doujutsu más poderoso, poseído originalmente por el Sabio de los Seis Caminos.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
{
        pregunta: "¿Cuál fue el primer anime en utilizar la técnica de animación por celdas en color?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Kimba el León Blanco", "Astro Boy", "La Princesa Caballero", "Fantasmagórico"],
        respuesta_correcta: 0,
        explicacion: "Kimba el León Blanco (1965) fue el primer anime televisivo en utilizar animación por celdas completamente a color.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué estudio de animación produjo 'Serial Experiments Lain'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Triangle Staff", "Production I.G", "Madhouse", "Gainax"],
        respuesta_correcta: 0,
        explicacion: "Serial Experiments Lain fue producido por Triangle Staff, un estudio menos conocido que también trabajó en obras como Key the Metal Idol.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué año exactamente fue publicado el primer volumen del manga 'Akira' de Katsuhiro Otomo?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["1982", "1980", "1984", "1986"],
        respuesta_correcta: 0,
        explicacion: "El primer volumen de Akira fue publicado en diciembre de 1982 en la revista Young Magazine, seis años antes de que se estrenara la película animada.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién fue el director de 'Ghost in the Shell: Stand Alone Complex'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Kenji Kamiyama", "Mamoru Oshii", "Shinichirō Watanabe", "Satoshi Kon"],
        respuesta_correcta: 0,
        explicacion: "Kenji Kamiyama dirigió la serie Ghost in the Shell: Stand Alone Complex, mientras que Mamoru Oshii dirigió las películas originales.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué estudios colaboraron en la producción de la serie 'Cowboy Bebop'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Sunrise y Bones", "Madhouse y Gainax", "Production I.G y MAPPA", "Toei Animation y Pierrot"],
        respuesta_correcta: 0,
        explicacion: "Cowboy Bebop fue producido principalmente por Sunrise, con colaboración del entonces recién formado Studio Bones (fundado por ex-animadores de Sunrise).",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué compositor creó la banda sonora de 'Cowboy Bebop'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Yoko Kanno", "Joe Hisaishi", "Susumu Hirasawa", "Hiroyuki Sawano"],
        respuesta_correcta: 0,
        explicacion: "Yoko Kanno compuso la icónica banda sonora de Cowboy Bebop, fusionando jazz, blues, rock y otros estilos.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué anime tiene el récord del opening más largo sin cambios en una serie de larga duración?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Detective Conan", "One Piece", "Sazae-san", "Doraemon"],
        respuesta_correcta: 0,
        explicacion: "Detective Conan mantuvo su primer opening 'Mune ga Doki Doki' durante 142 episodios sin cambios, un récord para series de larga duración.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué término utilizan los japoneses para referirse a la animación occidental?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Yōga", "Gaijin", "Kaigai", "Seiyō"],
        respuesta_correcta: 0,
        explicacion: "Yōga (洋画) se usa para referirse a la animación occidental, en contraste con anime, que en Japón se refiere a toda la animación, incluida la japonesa.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál de estos animes está considerado el primero con una narrativa compleja para adultos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Tatami Galaxy", "Neon Genesis Evangelion", "Akira", "Ghost in the Shell"],
        respuesta_correcta: 0,
        explicacion: "Tatami Galaxy (2010) dirigido por Masaaki Yuasa, es considerado pionero en narrativa compleja para adultos con su estructura no lineal y temas psicológicos profundos.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué famoso director de anime fue también mentor de Mamoru Hosoda?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Isao Takahata", "Hayao Miyazaki", "Satoshi Kon", "Makoto Shinkai"],
        respuesta_correcta: 0,
        explicacion: "Isao Takahata, co-fundador de Studio Ghibli, fue mentor de Mamoru Hosoda durante su tiempo en Toei Animation.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué técnica de animación fue pionera en utilizar 'Belladonna of Sadness' (1973)?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Animación líquida", "Rotoscopia", "Cel shading", "Animación limitada"],
        respuesta_correcta: 0,
        explicacion: "Belladonna of Sadness utilizó una revolucionaria técnica de 'animación líquida' donde las imágenes parecen fluir y transformarse como acuarelas en movimiento.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué estudiante de Osamu Tezuka revolucionó el manga para adultos en los años 60?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Yoshihiro Tatsumi", "Shotaro Ishinomori", "Leiji Matsumoto", "Go Nagai"],
        respuesta_correcta: 0,
        explicacion: "Yoshihiro Tatsumi, estudiante de Tezuka, acuñó el término 'gekiga' (imágenes dramáticas) para distinguir sus obras oscuras y realistas del manga convencional.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de anime tiene el récord de mayor número de fotogramas dibujados a mano?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Redline", "Akira", "La princesa Mononoke", "El viaje de Chihiro"],
        respuesta_correcta: 0,
        explicacion: "Redline, dirigida por Takeshi Koike, tiene aproximadamente 100,000 fotogramas dibujados a mano y tardó siete años en completarse.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué país fue el primer mercado importante de anime fuera de Japón?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Italia", "Estados Unidos", "Francia", "España"],
        respuesta_correcta: 0,
        explicacion: "Italia fue el primer país occidental en adoptar masivamente el anime en los años 70 y 80, con numerosos programas japoneses doblados al italiano.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué innovadora técnica visual introdujo 'FLCL' (Fooly Cooly)?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Integración de manga en animación", "CGI fotorrealista", "Animación invertida", "Perspectiva en primera persona"],
        respuesta_correcta: 0,
        explicacion: "FLCL innovó al integrar directamente paneles de manga animados dentro de la animación tradicional, creando transiciones entre medios visuales.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué filme animado japonés fue el primero en ganar el Oso de Oro en el Festival de Berlín?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["La Serpiente Blanca", "La tumba de las luciérnagas", "El viaje de Chihiro", "Perfect Blue"],
        respuesta_correcta: 0,
        explicacion: "La Serpiente Blanca (白蛇伝, Hakuja den) de Toei Animation, ganó el Oso de Oro en 1958, siendo la primera película animada japonesa en recibir este prestigioso premio.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué personaje de 'One Piece' está inspirado en el actor Bunta Sugawara?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Aokiji (Kuzan)", "Crocodile", "Shanks", "Zoro"],
        respuesta_correcta: 0,
        explicacion: "El almirante Aokiji (Kuzan) está basado en el actor japonés Bunta Sugawara, famoso por sus papeles en películas yakuza, tanto en apariencia como en personalidad.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué famoso director de anime rechazó dirigir 'Neon Genesis Evangelion' antes que Hideaki Anno?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Yoshiyuki Tomino", "Mamoru Oshii", "Katsuhiro Otomo", "Isao Takahata"],
        respuesta_correcta: 0,
        explicacion: "Yoshiyuki Tomino, creador de Gundam, rechazó la oferta de dirigir Evangelion, recomendando a su amigo Hideaki Anno para el proyecto.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué estudio de animación desarrolló la técnica 'superflat' para animar secuencias de acción?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Trigger", "Ufotable", "Kyoto Animation", "A-1 Pictures"],
        respuesta_correcta: 0,
        explicacion: "Studio Trigger, fundado por ex miembros de Gainax, desarrolló y popularizó la técnica 'superflat' que utiliza colores brillantes, exageración y deformación para secuencias de acción dinámicas.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién acuñó originalmente el término 'moe' en la cultura otaku?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Shūichi Tsukamoto", "Hayao Miyazaki", "Hideaki Anno", "Toshio Okada"],
        respuesta_correcta: 0,
        explicacion: "El crítico de anime Shūichi Tsukamoto es generalmente acreditado por acuñar el término 'moe' en los años 90 para describir cierto tipo de atracción hacia personajes de anime.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
       }
    ],

    // VIDEOJUEGOS
    [CATEGORIAS.VIDEOJUEGOS]: [
        {
            pregunta: "¿Qué personaje es la mascota de Nintendo?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["Sonic", "Mario", "Link", "Pikachu"],
            respuesta_correcta: 1,
            explicacion: "Mario, el fontanero italiano, es considerado la mascota oficial de Nintendo desde los años 80.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿En qué año se lanzó el primer juego de The Legend of Zelda?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["1985", "1986", "1987", "1990"],
            respuesta_correcta: 1,
            explicacion: "The Legend of Zelda fue lanzado originalmente para la Famicom Disk System en Japón el 21 de febrero de 1986.",
            dificultad: DIFICULTADES.MEDIO,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿La frase 'War, war never changes' pertenece a la serie de juegos Fallout?",
            tipo: TIPOS.VERDADERO_FALSO,
            opciones: ["Verdadero", "Falso"],
            respuesta_correcta: 0,
            explicacion: "Esta frase icónica aparece en la introducción de casi todos los juegos de la serie Fallout, convirtiéndose en su lema característico.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿Cuál es el easter egg más antiguo en videojuegos que se ha documentado?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["'Adventure' de Atari 2600", "'Starship 1' de Atari", "El puntaje '8675309' en Ms. Pac-Man", "El modo secreto en Space Invaders"],
            respuesta_correcta: 1,
            explicacion: "Aunque el de 'Adventure' es muy conocido, el easter egg en 'Starship 1' (1977) predató a éste por casi dos años, mostrando el mensaje 'Hi Ron!' cuando se activaba una secuencia específica.",
            dificultad: DIFICULTADES.EXPERTO,
            imagen: TRIVIA_IMAGEN
        },
{
        pregunta: "¿Qué personaje es la mascota de Nintendo?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Mario", "Sonic", "Link", "Pikachu"],
        respuesta_correcta: 0,
        explicacion: "Mario, el fontanero italiano, es considerado la mascota oficial de Nintendo desde los años 80.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué objeto usa Link de 'The Legend of Zelda' para derrotar a sus enemigos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Espada", "Pistola", "Varita mágica", "Arco y flecha"],
        respuesta_correcta: 0,
        explicacion: "La Espada Maestra (Master Sword) es el arma emblemática de Link, aunque también usa otros equipamientos como arco, bombas y boomerang.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué juego aparece el personaje Solid Snake?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Metal Gear Solid", "Call of Duty", "Resident Evil", "Final Fantasy"],
        respuesta_correcta: 0,
        explicacion: "Solid Snake es el protagonista principal de la serie Metal Gear Solid, creada por Hideo Kojima.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el objetivo principal en Minecraft?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Sobrevivir y crear", "Derrotar al jefe final", "Completar misiones", "Ganar carreras"],
        respuesta_correcta: 0,
        explicacion: "Minecraft es un juego sandbox donde el objetivo principal es sobrevivir y crear estructuras, aunque también tiene objetivos secundarios como derrotar al Ender Dragon.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál de estos personajes NO pertenece a Super Mario Bros?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Sonic", "Bowser", "Luigi", "Peach"],
        respuesta_correcta: 0,
        explicacion: "Sonic the Hedgehog es la mascota de SEGA, mientras que Bowser, Luigi y Peach son personajes del universo de Super Mario Bros de Nintendo.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué tipo de juego es 'Fortnite'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Battle Royale", "RPG", "Simulador", "Plataformas"],
        respuesta_correcta: 0,
        explicacion: "Fortnite es principalmente conocido por su modo Battle Royale, donde 100 jugadores compiten hasta que solo queda uno.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál de estos juegos es un FPS (First Person Shooter)?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Call of Duty", "FIFA", "The Sims", "Tetris"],
        respuesta_correcta: 0,
        explicacion: "Call of Duty es una popular serie de juegos de disparos en primera persona (FPS).",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién es el enemigo principal en la mayoría de juegos de Mario?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Bowser", "Wario", "Donkey Kong", "Waluigi"],
        respuesta_correcta: 0,
        explicacion: "Bowser, el rey de los Koopas, es el antagonista principal en la mayoría de los juegos de Mario.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué animal es Sonic?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Erizo", "Zorro", "Equidna", "Armadillo"],
        respuesta_correcta: 0,
        explicacion: "Sonic es un erizo azul conocido por su gran velocidad, mascota de SEGA.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué plataforma debutó originalmente 'Tetris'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Electronika 60", "Nintendo Game Boy", "Atari", "Commodore 64"],
        respuesta_correcta: 0,
        explicacion: "Tetris fue creado en 1984 por Alexey Pajitnov en la Unión Soviética para la computadora Electronika 60, aunque se hizo mundialmente famoso con la versión de Game Boy.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el videojuego más vendido de la historia?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Minecraft", "Tetris", "Grand Theft Auto V", "Super Mario Bros"],
        respuesta_correcta: 0,
        explicacion: "Minecraft ha vendido más de 238 millones de copias desde su lanzamiento, siendo actualmente el videojuego más vendido de la historia.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué año se lanzó la primera PlayStation?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["1994", "1990", "1996", "2000"],
        respuesta_correcta: 0,
        explicacion: "La PlayStation original fue lanzada por Sony el 3 de diciembre de 1994 en Japón.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre del fontanero hermano de Mario?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Luigi", "Wario", "Waluigi", "Yoshi"],
        respuesta_correcta: 0,
        explicacion: "Luigi es el hermano menor de Mario, reconocible por su vestimenta verde.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué compañía desarrolló el juego 'The Last of Us'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Naughty Dog", "Ubisoft", "Electronic Arts", "Bethesda"],
        respuesta_correcta: 0,
        explicacion: "The Last of Us fue desarrollado por Naughty Dog, estudio también conocido por la serie Uncharted.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué juego popularizó el género Battle Royale?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["PlayerUnknown's Battlegrounds", "Fortnite", "Apex Legends", "Call of Duty: Warzone"],
        respuesta_correcta: 0,
        explicacion: "Aunque no fue el primero, PUBG (PlayerUnknown's Battlegrounds) popularizó el género Battle Royale a nivel masivo cuando se lanzó en 2017.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre del protagonista de 'The Legend of Zelda'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Link", "Zelda", "Ganon", "Hyrule"],
        respuesta_correcta: 0,
        explicacion: "Link es el protagonista de la saga The Legend of Zelda. Zelda es la princesa que da nombre a la serie.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué juego tiene como objetivo principal llenar líneas horizontales con bloques de diferentes formas?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Tetris", "Pac-Man", "Space Invaders", "Donkey Kong"],
        respuesta_correcta: 0,
        explicacion: "Tetris consiste en colocar piezas de diferentes formas (tetrominós) para completar líneas horizontales que desaparecen y dan puntos.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué año fue lanzado Minecraft?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["2011", "2009", "2013", "2015"],
        respuesta_correcta: 0,
        explicacion: "Aunque la versión alpha se lanzó en 2009, la versión completa de Minecraft fue lanzada oficialmente en noviembre de 2011.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué personaje amarillo come puntos en un laberinto mientras escapa de fantasmas?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Pac-Man", "Mega Man", "Bomberman", "Kirby"],
        respuesta_correcta: 0,
        explicacion: "Pac-Man es el personaje clásico amarillo que come puntos mientras evade a los fantasmas Blinky, Pinky, Inky y Clyde.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el nombre del mundo donde se desarrolla la saga The Legend of Zelda?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Hyrule", "Termina", "Midgar", "Kanto"],
        respuesta_correcta: 0,
        explicacion: "Hyrule es el reino principal donde se desarrollan la mayoría de los juegos de The Legend of Zelda.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
{
        pregunta: "¿En qué año se lanzó el primer juego de The Legend of Zelda?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["1986", "1985", "1987", "1990"],
        respuesta_correcta: 0,
        explicacion: "The Legend of Zelda fue lanzado originalmente para la Famicom Disk System en Japón el 21 de febrero de 1986.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién es el creador de la saga Metal Gear Solid?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Hideo Kojima", "Shigeru Miyamoto", "Hironobu Sakaguchi", "Todd Howard"],
        respuesta_correcta: 0,
        explicacion: "Hideo Kojima es el creador, director y guionista principal de la saga Metal Gear Solid hasta su salida de Konami en 2015.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál fue la primera consola que utilizó cartuchos de juego intercambiables?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Fairchild Channel F", "Atari 2600", "Magnavox Odyssey", "Nintendo NES"],
        respuesta_correcta: 0,
        explicacion: "Aunque muchos creen que fue la Atari 2600, la Fairchild Channel F (1976) fue la primera consola doméstica en usar cartuchos de ROM intercambiables.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué compañía desarrolló el juego 'Skyrim'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Bethesda Game Studios", "BioWare", "Ubisoft", "CD Projekt Red"],
        respuesta_correcta: 0,
        explicacion: "The Elder Scrolls V: Skyrim fue desarrollado por Bethesda Game Studios y publicado por Bethesda Softworks en 2011.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué juego presentó por primera vez al personaje de Lara Croft?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Tomb Raider (1996)", "Tomb Raider II", "Tomb Raider: The Angel of Darkness", "Tomb Raider: Anniversary"],
        respuesta_correcta: 0,
        explicacion: "Lara Croft debutó en el primer juego de Tomb Raider, lanzado en 1996 para Sega Saturn, PlayStation y PC.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuántos jugadores pueden jugar simultáneamente en un servidor estándar de Minecraft?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["20", "10", "50", "100"],
        respuesta_correcta: 0,
        explicacion: "Un servidor vanilla de Minecraft está configurado para admitir 20 jugadores simultáneos, aunque esto puede modificarse.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál fue el primer videojuego que permitió a los jugadores guardar su progreso?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["The Legend of Zelda", "Super Mario Bros", "Donkey Kong", "Metroid"],
        respuesta_correcta: 0,
        explicacion: "The Legend of Zelda (1986) fue el primer juego para consolas domésticas que incorporó una batería interna en el cartucho para guardar el progreso del jugador.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué consola se conoce por ser el mayor fracaso comercial de Nintendo?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Virtual Boy", "GameCube", "Wii U", "Nintendo 64"],
        respuesta_correcta: 0,
        explicacion: "La Virtual Boy, lanzada en 1995, fue la consola que menos vendió en la historia de Nintendo, siendo descontinuada apenas 7 meses después de su lanzamiento debido a sus pobres ventas y problemas de diseño.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué juego popularizó el género de 'Battle Royale' en los videojuegos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["PlayerUnknown's Battlegrounds", "Fortnite", "H1Z1", "Apex Legends"],
        respuesta_correcta: 0,
        explicacion: "Aunque hubo mods anteriores, PUBG fue el primer juego independiente en popularizar masivamente el concepto Battle Royale en 2017, inspirando a títulos como Fortnite y Apex Legends.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué estudio desarrolló la saga 'Assassin's Creed'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ubisoft Montreal", "EA DICE", "Rockstar Games", "BioWare"],
        respuesta_correcta: 0,
        explicacion: "La saga Assassin's Creed fue creada y principalmente desarrollada por Ubisoft Montreal, aunque otros estudios de Ubisoft han colaborado en entregas posteriores.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué año se lanzó al mercado la primera Xbox?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["2001", "1999", "2003", "2005"],
        respuesta_correcta: 0,
        explicacion: "La primera consola Xbox de Microsoft fue lanzada en Norteamérica el 15 de noviembre de 2001, compitiendo con PlayStation 2 y GameCube.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién es el villano principal en la serie Kingdom Hearts?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Xehanort", "Sephiroth", "Ansem", "Organization XIII"],
        respuesta_correcta: 0,
        explicacion: "Maestro Xehanort es el antagonista principal de toda la saga Kingdom Hearts, aunque aparece en diferentes formas y encarnaciones a lo largo de la serie.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué sistema de 'juego dentro de juego' hizo famoso a Gwent?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["The Witcher 3", "Skyrim", "Mass Effect", "Final Fantasy VIII"],
        respuesta_correcta: 0,
        explicacion: "Gwent es un juego de cartas que apareció por primera vez en The Witcher 3: Wild Hunt. Se volvió tan popular que CD Projekt Red lo desarrolló como un juego independiente.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué personaje de Street Fighter es conocido por su movimiento 'Hadoken'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ryu", "Ken", "Chun-Li", "Guile"],
        respuesta_correcta: 0,
        explicacion: "Ryu es el personaje original que utiliza el Hadoken, aunque Ken también puede ejecutarlo. Este movimiento consiste en un proyectil de energía que se lanza con las manos.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál fue el primer juego en incorporar el 'Modo Cooperativo' para dos jugadores?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Gauntlet", "Contra", "Double Dragon", "Golden Axe"],
        respuesta_correcta: 0,
        explicacion: "Gauntlet (1985) fue el primer arcade en introducir un verdadero modo cooperativo para cuatro jugadores simultáneos, revolucionando el concepto de juego en equipo.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué compañía desarrolló el motor gráfico 'Unreal Engine'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Epic Games", "Valve", "Electronic Arts", "Ubisoft"],
        respuesta_correcta: 0,
        explicacion: "El Unreal Engine fue desarrollado por Epic Games, haciendo su debut en 1998 con el juego Unreal. Actualmente está en su quinta iteración.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál fue la primera consola de videojuegos producida por Sony?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["PlayStation", "PlayStation 2", "PSX", "Sony Dreamcast"],
        respuesta_correcta: 0,
        explicacion: "La PlayStation original fue la primera consola de Sony, lanzada en Japón el 3 de diciembre de 1994, tras cancelar su colaboración con Nintendo para crear un periférico CD.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué juego popularizó el sistema de 'sandbbox' de mundo abierto moderno?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Grand Theft Auto III", "The Elder Scrolls: Morrowind", "The Sims", "Minecraft"],
        respuesta_correcta: 0,
        explicacion: "Grand Theft Auto III (2001) revolucionó los juegos de mundo abierto con su formato 3D y libertad sin precedentes, estableciendo el estándar para los sandbox modernos.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién es la protagonista de la serie Metroid?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Samus Aran", "Princess Peach", "Lara Croft", "Jill Valentine"],
        respuesta_correcta: 0,
        explicacion: "Samus Aran es la protagonista de la serie Metroid, siendo una de las primeras protagonistas femeninas en videojuegos, aunque su género no se reveló hasta el final del primer juego.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál de estos juegos se considera el primer título de 'survival horror'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Alone in the Dark", "Resident Evil", "Silent Hill", "Fatal Frame"],
        respuesta_correcta: 0,
        explicacion: "Aunque Resident Evil popularizó el término, Alone in the Dark (1992) es generalmente considerado el primer verdadero juego de survival horror en 3D.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
{
        pregunta: "¿La frase 'War, war never changes' pertenece a la serie de juegos Fallout?",
        tipo: TIPOS.VERDADERO_FALSO,
        opciones: ["Verdadero", "Falso"],
        respuesta_correcta: 0,
        explicacion: "Esta frase icónica aparece en la introducción de casi todos los juegos de la serie Fallout, convirtiéndose en su lema característico.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué famoso bug en 'Civilization' hizo que Gandhi se volviera extremadamente agresivo?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Underflow numérico", "Memoria corrupta", "Error de traducción", "Archivo dañado"],
        respuesta_correcta: 0,
        explicacion: "El 'Nuclear Gandhi' se originó por un error de underflow numérico: cuando Gandhi adoptaba democracia, su nivel de agresión bajaba de 1 a -1, pero el sistema lo interpretaba como 255, el máximo posible.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué compañía desarrolló 'Doom' en 1993?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["id Software", "Epic Games", "Valve", "Blizzard"],
        respuesta_correcta: 0,
        explicacion: "Doom fue desarrollado por id Software, un estudio fundado por John Carmack, John Romero, Tom Hall y Adrian Carmack.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué empresa fue la primera en patentar cartuchos con 'batería de respaldo' para guardar partidas?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Nintendo", "Sega", "Atari", "Namco"],
        respuesta_correcta: 0,
        explicacion: "Nintendo patentó y popularizó la tecnología de batería de respaldo en cartuchos en 1986, permitiendo guardar el progreso en juegos como The Legend of Zelda.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál fue el primer juego que utilizó motion capture para sus animaciones?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Prince of Persia", "Mortal Kombat", "Doom", "Street Fighter"],
        respuesta_correcta: 0,
        explicacion: "Prince of Persia (1989) fue el primer videojuego en utilizar rotoscopia (una forma temprana de motion capture) donde el creador Jordan Mechner filmó a su hermano realizando movimientos para animar al protagonista.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué año exactamente salió a la venta el SEGA Dreamcast en Japón?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["1998", "1999", "2000", "1997"],
        respuesta_correcta: 0,
        explicacion: "La SEGA Dreamcast salió a la venta en Japón el 27 de noviembre de 1998, siendo la última consola de videojuegos producida por SEGA antes de convertirse solo en desarrolladora.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué significa la sigla 'RPG' en los videojuegos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Role-Playing Game", "Random Pattern Generator", "Rapid Program Gaming", "Real Player Graphics"],
        respuesta_correcta: 0,
        explicacion: "RPG significa 'Role-Playing Game' (Juego de Rol), un género donde los jugadores asumen el papel de personajes en un mundo ficticio, tomando decisiones y desarrollando sus habilidades.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué estudio desarrolló el motor gráfico Source?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Valve", "Epic Games", "id Software", "Crytek"],
        respuesta_correcta: 0,
        explicacion: "El motor Source fue desarrollado por Valve Corporation y debutó con Counter-Strike: Source y Half-Life 2 en 2004.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué famoso juego contiene una ecuación matemática escondida relacionada con la velocidad terminal de caída?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Portal", "Half-Life", "BioShock", "Doom"],
        respuesta_correcta: 0,
        explicacion: "Portal contiene la ecuación para calcular la velocidad terminal (Velocidad (m/s) = √(2 * Gravedad (m/s²) * Altura (m))) escrita en una pared en uno de sus niveles, relacionada con las mecánicas de caída del juego.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién es considerado el 'padre' de los videojuegos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ralph Baer", "Nolan Bushnell", "Shigeru Miyamoto", "John Carmack"],
        respuesta_correcta: 0,
        explicacion: "Ralph Baer es considerado el 'padre de los videojuegos' por inventar el primer sistema de juegos doméstico, la Magnavox Odyssey, y patentar el concepto de videojuegos jugados en televisores.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué innovador mecanismo introdujo 'System Shock' que revolucionó los FPS narrativos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Audio logs", "Ramificación narrativa", "Elecciones morales", "Diálogos interactivos"],
        respuesta_correcta: 0,
        explicacion: "System Shock (1994) fue el primer juego en utilizar 'audio logs' para contar la historia de manera no lineal, una técnica posteriormente adoptada por juegos como BioShock, Dead Space y muchos otros títulos narrativos.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué significa 'FPS' en el contexto de rendimiento de videojuegos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Frames Per Second", "First Person Shooter", "Final Program Sequence", "Forward Processing System"],
        respuesta_correcta: 0,
        explicacion: "En el contexto de rendimiento, FPS significa 'Frames Per Second' (Cuadros Por Segundo), una medida de la fluidez con que se muestra un juego. En otro contexto, puede referirse a 'First Person Shooter' (Juego de Disparos en Primera Persona).",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué año se fundó la empresa Blizzard Entertainment?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["1991", "1989", "1993", "1995"],
        respuesta_correcta: 0,
        explicacion: "Blizzard Entertainment fue fundada en febrero de 1991 bajo el nombre de Silicon & Synapse, cambiando a Chaos Studios en 1993 y finalmente a Blizzard Entertainment en 1994.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué compañía desarrolló el primer juego de Assassin's Creed?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ubisoft Montreal", "Ubisoft Paris", "Ubisoft Quebec", "Ubisoft Toronto"],
        respuesta_correcta: 0,
        explicacion: "El primer Assassin's Creed fue desarrollado por Ubisoft Montreal y lanzado en 2007. Inicialmente era un spin-off de Prince of Persia antes de convertirse en su propia franquicia.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué innovador control introdujo la Nintendo 64 que revolucionó los juegos 3D?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Control con joystick analógico", "D-pad digital", "Touch pad", "Giroscopio"],
        respuesta_correcta: 0,
        explicacion: "El control de Nintendo 64 fue el primero en incluir un joystick analógico para consolas domésticas populares, permitiendo un control de movimiento preciso en entornos 3D, esencial para juegos como Super Mario 64.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué estudio desarrolló 'Bloodborne'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["FromSoftware", "Naughty Dog", "Platinum Games", "Team Ninja"],
        respuesta_correcta: 0,
        explicacion: "Bloodborne fue desarrollado por FromSoftware en colaboración con Japan Studio, y publicado por Sony Computer Entertainment exclusivamente para PlayStation 4 en 2015.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué empresa lanzó la primera tarjeta gráfica dedicada para juegos 3D?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["3dfx", "NVIDIA", "ATI", "Intel"],
        respuesta_correcta: 0,
        explicacion: "3dfx Interactive lanzó la Voodoo Graphics en 1996, considerada la primera tarjeta gráfica 3D dedicada para juegos que logró éxito comercial, revolucionando la industria de los juegos PC.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál fue el nombre del primer juego comercial desarrollado para una computadora?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Spacewar!", "Pong", "Computer Space", "Tennis for Two"],
        respuesta_correcta: 0,
        explicacion: "Spacewar! fue desarrollado en 1962 para la computadora PDP-1 del MIT, convirtiéndose en el primer videojuego distribuido comercialmente para una computadora, aunque inicialmente no se vendía sino que venía preinstalado.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué empresa desarrolló el formato de cartuchos 'Game Pak' para la NES?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Nintendo", "SEGA", "Atari", "SNK"],
        respuesta_correcta: 0,
        explicacion: "Nintendo desarrolló el formato Game Pak (conocido oficialmente como cartuchos de NES) que incorporaban un chip especializado (10NES) para prevenir juegos no autorizados y proteger la consola de daños eléctricos.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué organización otorga las clasificaciones de edad a los videojuegos en Estados Unidos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["ESRB", "PEGI", "CERO", "USK"],
        respuesta_correcta: 0,
        explicacion: "La ESRB (Entertainment Software Rating Board) es la organización que clasifica los videojuegos en EE.UU. según su contenido (E, T, M, etc.), mientras que PEGI es para Europa, CERO para Japón y USK para Alemania.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
{
        pregunta: "¿Cuál es el easter egg más antiguo en videojuegos que se ha documentado?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["'Starship 1' de Atari", "'Adventure' de Atari 2600", "El puntaje '8675309' en Ms. Pac-Man", "El modo secreto en Space Invaders"],
        respuesta_correcta: 0,
        explicacion: "Aunque el de 'Adventure' es muy conocido, el easter egg en 'Starship 1' (1977) predató a éste por casi dos años, mostrando el mensaje 'Hi Ron!' cuando se activaba una secuencia específica.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué desarrollador incluyó código ASCII de un gato en la ROM de Sonic the Hedgehog 3?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Yuji Naka", "Hirokazu Yasuhara", "Naoto Ohshima", "Takashi Iizuka"],
        respuesta_correcta: 0,
        explicacion: "Yuji Naka, el programador principal de Sonic 3, incluyó un ASCII art de un gato en la ROM del juego como una firma oculta, visible solo al examinar el código del juego.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué juego de arcade presentó por primera vez memoria EEPROM para guardar puntajes altos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Bubble Bobble", "Pac-Man", "Donkey Kong", "Space Invaders"],
        respuesta_correcta: 0,
        explicacion: "Bubble Bobble (1986) fue el primer juego arcade en usar memoria EEPROM para guardar puntajes altos permanentemente, incluso cuando la máquina se apagaba.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál fue el primer videojuego que implementó un soundtrack adaptativo que cambiaba según las acciones del jugador?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Otocky", "Super Mario Bros", "Legend of Zelda", "Metroid"],
        respuesta_correcta: 0,
        explicacion: "Otocky (1987) para la Famicom Disk System de Nintendo fue el primer juego con un soundtrack dinámico que se ajustaba a las acciones del jugador, mezclando el género de shoot 'em up con la creación musical.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué técnica innovadora de iluminación introdujo 'Doom 3' en 2004?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Unified lighting and shadowing", "Bump mapping", "Specular highlights", "Ray tracing"],
        respuesta_correcta: 0,
        explicacion: "Doom 3 introdujo el 'unified lighting and shadowing', una técnica pionera donde todas las luces proyectaban sombras dinámicas en tiempo real, algo revolucionario para la época.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué juego de Nintendo incluyó el primer ejemplo de un 'mini-mapa' en pantalla?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Metroid", "The Legend of Zelda", "Super Mario Bros 3", "Kid Icarus"],
        respuesta_correcta: 0,
        explicacion: "Metroid (1986) fue el primer juego de Nintendo en implementar un mini-mapa en la esquina de la pantalla, una característica que se volvería estándar en los juegos de exploración.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál fue el primer videojuego con una banda sonora compuesta enteramente en Dolby Surround?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Road Rash 3D", "Castlevania: Symphony of the Night", "Super Mario 64", "Final Fantasy VII"],
        respuesta_correcta: 0,
        explicacion: "Road Rash 3D (1998) para PlayStation fue el primer juego en presentar una banda sonora completamente en Dolby Surround, permitiendo una experiencia de audio más inmersiva en sistemas compatibles.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué compositor creó la técnica de 'composición procedural interactiva' para videojuegos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Peter McConnell", "Koji Kondo", "Jeremy Soule", "Michael Giacchino"],
        respuesta_correcta: 0,
        explicacion: "Peter McConnell desarrolló iMUSE (Interactive Music Streaming Engine) en LucasArts, el primer sistema avanzado de música procedural interactiva que se adaptaba sin problemas a las acciones del jugador.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué hardware especial necesitaba el juego 'Steel Battalion' para Xbox?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Un controlador de 40 botones", "Una pistola de luz", "Un casco VR", "Una alfombra de baile"],
        respuesta_correcta: 0,
        explicacion: "Steel Battalion venía con un enorme controlador de 40 botones, dos joysticks y tres pedales que simulaba la cabina de un mecha, siendo uno de los periféricos más complejos jamás creados para una consola.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué sistema de voz pionero introdujo 'Seaman' para Dreamcast?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Reconocimiento de voz bidireccional", "Síntesis de voz", "Muestreo de audio", "Voz pre-grabada adaptativa"],
        respuesta_correcta: 0,
        explicacion: "Seaman utilizaba un micrófono para permitir comunicación bidireccional con la criatura virtual: el juego reconocía las frases del jugador y respondía contextualmente, una tecnología muy avanzada para 1999.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué lenguaje de programación fue creado específicamente para desarrollar 'Crash Bandicoot'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["GOOL", "C++", "LISP", "Assembly"],
        respuesta_correcta: 0,
        explicacion: "GOOL (Game Oriented Object LISP) fue un lenguaje de programación creado por Andy Gavin para desarrollar Crash Bandicoot, combinando la potencia de LISP con optimizaciones específicas para PlayStation.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué juego fue el primero en implementar un sistema avanzado de física de partículas para simular humo y líquidos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Half-Life 2", "Doom 3", "Quake III", "Unreal Tournament"],
        respuesta_correcta: 0,
        explicacion: "Half-Life 2 (2004) fue pionero en usar física de partículas avanzada para simulación realista de fluidos, humo y otros efectos ambientales gracias a su motor Source.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué tecnología patentada por Namco impedía que otros desarrolladores incluyeran minijuegos en tiempos de carga?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["US Patent 5718632", "US Patent 6935954", "US Patent 7275994", "US Patent 6200138"],
        respuesta_correcta: 0,
        explicacion: "Namco patentó la idea de 'juegos jugables durante tiempos de carga' (US Patent 5718632) en 1995, evitando que otros desarrolladores pudieran incluir minijuegos durante las pantallas de carga hasta que la patente expiró en 2015.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué técnica de programación, creada para 'Elite', revolucionó la generación de mundos virtuales?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Generación procedural con semilla fija", "Mapeado isométrico", "Vector scaling", "Mode 7 rendering"],
        respuesta_correcta: 0,
        explicacion: "Elite (1984) utilizó generación procedural con semilla fija para crear 8 galaxias con 256 planetas cada una, logrando un universo virtual enorme en solo 22KB de memoria, técnica aún usada en juegos como No Man's Sky.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué innovación técnica permitió a 'Shadow of the Colossus' animar colosos gigantes en PS2?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Inverse Kinematics avanzada", "Motion capture", "Cell shading", "Rig Physics"],
        respuesta_correcta: 0,
        explicacion: "Team Ico desarrolló un sistema avanzado de Inverse Kinematics que permitía animaciones procedurales de criaturas gigantes en tiempo real, algo nunca antes visto en la limitada PS2.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué método de compresión revolucionario utilizó 'Star Fox' para funcionar en SNES?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Compresión de vértices en tiempo real", "Pre-renderizado de sprites", "Tiles escalables", "Frame interpolation"],
        respuesta_correcta: 0,
        explicacion: "Star Fox utilizaba el chip Super FX para comprimir vértices 3D en tiempo real, permitiendo gráficos poligonales en una consola de 16 bits que originalmente no estaba diseñada para ellos.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué algoritmo de inteligencia artificial avanzado se utilizó por primera vez en F.E.A.R.?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["STRIPS con planificación basada en objetivos", "A* modificado", "Redes neuronales simples", "Lógica difusa jerárquica"],
        respuesta_correcta: 0,
        explicacion: "F.E.A.R. (2005) implementó por primera vez el algoritmo STRIPS con planificación basada en objetivos para su IA, permitiendo que los enemigos coordinaran tácticas complejas en tiempo real en lugar de seguir scripts predefinidos.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué juego de 1998 fue el primero en utilizar shaders programables para efectos gráficos en tiempo real?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Evolva", "Quake III Arena", "Unreal", "Half-Life"],
        respuesta_correcta: 0,
        explicacion: "Evolva, desarrollado por Computer Artworks, fue el primer juego en implementar shaders programables (código que modifica píxeles o vértices individualmente) para efectos especiales en tiempo real, años antes de que fuera estándar en la industria.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué pionera tecnología de modelado introdujo 'Spore' para crear criaturas?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Modelado procedural con restricciones biológicas", "Ray marching volumétrico", "Mesh morphing adaptativo", "Subdivision surface modeling"],
        respuesta_correcta: 0,
        explicacion: "Spore implementó un revolucionario sistema de modelado procedural que aplicaba restricciones biológicas a las creaciones de los jugadores, permitiendo animaciones realistas sin importar cómo se construyeran las criaturas.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué juego utilizó 'Euphoria', un motor de física emergente para personajes, por primera vez?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Grand Theft Auto IV", "Half-Life 2", "Crysis", "Mass Effect"],
        respuesta_correcta: 0,
        explicacion: "Grand Theft Auto IV (2008) fue el primer juego en utilizar Euphoria, un revolucionario motor de física que permitía que los personajes reaccionaran dinámicamente al entorno, generando animaciones únicas en cada situación en lugar de reproducir animaciones pre-renderizadas.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    }
    ],

    // PELÍCULAS
    [CATEGORIAS.PELICULAS]: [
        {
            pregunta: "¿Quién dirigió la película 'Titanic' (1997)?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["Steven Spielberg", "James Cameron", "Christopher Nolan", "Martin Scorsese"],
            respuesta_correcta: 1,
            explicacion: "James Cameron dirigió 'Titanic', película que ganó 11 Premios Óscar, incluyendo Mejor Director y Mejor Película.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿En 'Star Wars: El Imperio Contraataca', cuál es la famosa revelación que hace Darth Vader a Luke Skywalker?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: [
                "Que es su padre", 
                "Que Obi-Wan lo traicionó", 
                "Que la Princesa Leia es su hermana", 
                "Que el Emperador es un Sith"
            ],
            respuesta_correcta: 0,
            explicacion: "En una de las revelaciones más famosas del cine, Darth Vader le dice a Luke: 'Yo soy tu padre', cambiando para siempre el rumbo de la saga.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿La película 'El Padrino' está basada en una historia real?",
            tipo: TIPOS.VERDADERO_FALSO,
            opciones: ["Verdadero", "Falso"],
            respuesta_correcta: 1,
            explicacion: "'El Padrino' está basada en la novela homónima de Mario Puzo, que si bien se inspiró en familias mafiosas reales como los Genovese, la historia específica es ficción.",
            dificultad: DIFICULTADES.MEDIO,
            imagen: TRIVIA_IMAGEN
        },
{
        pregunta: "¿Quién dirigió la película 'Titanic' (1997)?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["James Cameron", "Steven Spielberg", "Christopher Nolan", "Martin Scorsese"],
        respuesta_correcta: 0,
        explicacion: "James Cameron dirigió 'Titanic', película que ganó 11 Premios Óscar, incluyendo Mejor Director y Mejor Película.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué actor interpretó a Iron Man en el Universo Cinematográfico de Marvel?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Robert Downey Jr.", "Chris Evans", "Chris Hemsworth", "Mark Ruffalo"],
        respuesta_correcta: 0,
        explicacion: "Robert Downey Jr. interpretó a Tony Stark/Iron Man desde la primera película en 2008 hasta Avengers: Endgame en 2019.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál de estas películas NO pertenece a la saga de Harry Potter?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["El Señor de los Anillos", "La Piedra Filosofal", "La Cámara Secreta", "El Prisionero de Azkaban"],
        respuesta_correcta: 0,
        explicacion: "El Señor de los Anillos es una saga diferente basada en la obra de J.R.R. Tolkien, mientras que las otras opciones son títulos de la saga Harry Potter.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién es el protagonista de la película 'Forrest Gump'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Tom Hanks", "Brad Pitt", "Leonardo DiCaprio", "Johnny Depp"],
        respuesta_correcta: 0,
        explicacion: "Tom Hanks interpreta al personaje principal, Forrest Gump, papel por el que ganó el Óscar a Mejor Actor en 1995.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es la primera película de la saga 'Star Wars'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Una Nueva Esperanza", "El Imperio Contraataca", "El Retorno del Jedi", "La Amenaza Fantasma"],
        respuesta_correcta: 0,
        explicacion: "'Star Wars: Episodio IV - Una Nueva Esperanza' fue la primera película de la saga en estrenarse en 1977, aunque cronológicamente en la historia es el cuarto episodio.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de Disney tiene como protagonista a una princesa que se convierte en sirena?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["La Sirenita", "Frozen", "La Bella y la Bestia", "Mulán"],
        respuesta_correcta: 0,
        explicacion: "'La Sirenita' (1989) cuenta la historia de Ariel, una princesa sirena que sueña con convertirse en humana para conocer al príncipe Eric.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película animada tiene como protagonista a un león llamado Simba?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["El Rey León", "Madagascar", "Dumbo", "Buscando a Nemo"],
        respuesta_correcta: 0,
        explicacion: "'El Rey León' (1994) cuenta la historia de Simba, un joven león que debe reclamar su trono tras la muerte de su padre Mufasa.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál de estas películas está dirigida por Quentin Tarantino?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Pulp Fiction", "Titanic", "El Padrino", "Lo que el viento se llevó"],
        respuesta_correcta: 0,
        explicacion: "'Pulp Fiction' (1994) es una de las películas más icónicas de Quentin Tarantino, ganadora de la Palma de Oro en Cannes y del Óscar a Mejor Guion Original.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película narra la historia de un barco que se hunde en su viaje inaugural?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Titanic", "Poseidón", "Perfect Storm", "El Último Viaje"],
        respuesta_correcta: 0,
        explicacion: "'Titanic' cuenta la historia del hundimiento del RMS Titanic en 1912 durante su viaje inaugural entre Southampton y Nueva York.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué saga cinematográfica aparece el personaje Katniss Everdeen?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Los Juegos del Hambre", "Divergente", "Crepúsculo", "Maze Runner"],
        respuesta_correcta: 0,
        explicacion: "Katniss Everdeen, interpretada por Jennifer Lawrence, es la protagonista de la saga 'Los Juegos del Hambre', basada en las novelas de Suzanne Collins.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué famoso director creó 'E.T., el extraterrestre'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Steven Spielberg", "James Cameron", "George Lucas", "Tim Burton"],
        respuesta_correcta: 0,
        explicacion: "Steven Spielberg dirigió 'E.T., el extraterrestre' en 1982, una de las películas más queridas y taquilleras de todos los tiempos.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué película aparece la frase 'Luke, yo soy tu padre'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Star Wars: El Imperio Contraataca", "Star Wars: Una Nueva Esperanza", "Star Wars: El Retorno del Jedi", "Star Wars: La Amenaza Fantasma"],
        respuesta_correcta: 0,
        explicacion: "Esta famosa frase (aunque realmente es 'No, yo soy tu padre') aparece en 'Star Wars: Episodio V - El Imperio Contraataca' cuando Darth Vader revela su identidad a Luke Skywalker.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué actor interpretó a Jack Dawson en 'Titanic'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Leonardo DiCaprio", "Brad Pitt", "Tom Cruise", "Johnny Depp"],
        respuesta_correcta: 0,
        explicacion: "Leonardo DiCaprio interpretó a Jack Dawson, el joven artista que se enamora de Rose (Kate Winslet) en el trágico viaje del Titanic.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película cuenta la historia de un niño que queda solo en casa mientras su familia viaja?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Mi Pobre Angelito", "Dennis el Travieso", "Ricky Ricon", "El Pequeño Vampiro"],
        respuesta_correcta: 0,
        explicacion: "'Mi Pobre Angelito' (Home Alone, 1990) cuenta la historia de Kevin McCallister, interpretado por Macaulay Culkin, quien debe defender su casa de unos ladrones cuando su familia lo olvida al irse de vacaciones.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué superhéroe tiene un escudo hecho de vibranium?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Capitán América", "Iron Man", "Thor", "Hulk"],
        respuesta_correcta: 0,
        explicacion: "El Capitán América (Steve Rogers) utiliza un escudo circular hecho de vibranium, un metal ficticio extremadamente resistente del universo Marvel.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué película un joven descubre que es un mago y asiste a la escuela Hogwarts?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Harry Potter y la Piedra Filosofal", "El Señor de los Anillos", "Las Crónicas de Narnia", "Percy Jackson"],
        respuesta_correcta: 0,
        explicacion: "En 'Harry Potter y la Piedra Filosofal' (2001), Harry descubre que es un mago y comienza sus estudios en el Colegio Hogwarts de Magia y Hechicería.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién interpretó a Neo en la trilogía 'Matrix'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Keanu Reeves", "Tom Cruise", "Will Smith", "Brad Pitt"],
        respuesta_correcta: 0,
        explicacion: "Keanu Reeves interpretó a Neo, 'El Elegido', en la trilogía Matrix y posteriormente en 'Matrix Resurrections'.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál de estas películas trata sobre un tiburón que aterroriza a una comunidad costera?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Tiburón (Jaws)", "Pirañas", "Deep Blue Sea", "El Arrecife"],
        respuesta_correcta: 0,
        explicacion: "'Tiburón' (Jaws), dirigida por Steven Spielberg en 1975, cuenta la historia de un enorme tiburón blanco que aterroriza a la comunidad balnearia de Amity Island.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película animada de Pixar tiene como protagonistas a los juguetes de un niño?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Toy Story", "Monsters Inc.", "Buscando a Nemo", "Los Increíbles"],
        respuesta_correcta: 0,
        explicacion: "'Toy Story' (1995) fue el primer largometraje de Pixar y narra las aventuras de los juguetes de Andy que cobran vida cuando no hay humanos presentes.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película narra la historia de un joven que viaja accidentalmente al pasado en un DeLorean?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Volver al Futuro", "La Máquina del Tiempo", "El Efecto Mariposa", "12 Monos"],
        respuesta_correcta: 0,
        explicacion: "'Volver al Futuro' (Back to the Future, 1985) cuenta la historia de Marty McFly, quien viaja accidentalmente a 1955 en un DeLorean convertido en máquina del tiempo por el científico Doc Brown.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
{
        pregunta: "¿En 'Star Wars: El Imperio Contraataca', cuál es la famosa revelación que hace Darth Vader a Luke Skywalker?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: [
            "Que es su padre", 
            "Que Obi-Wan lo traicionó", 
            "Que la Princesa Leia es su hermana", 
            "Que el Emperador es un Sith"
        ],
        respuesta_correcta: 0,
        explicacion: "En una de las revelaciones más famosas del cine, Darth Vader le dice a Luke: 'No, yo soy tu padre', cambiando para siempre el rumbo de la saga.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién dirigió la película 'El Padrino'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Francis Ford Coppola", "Martin Scorsese", "Stanley Kubrick", "Steven Spielberg"],
        respuesta_correcta: 0,
        explicacion: "Francis Ford Coppola dirigió 'El Padrino' (1972), considerada una de las mejores películas de todos los tiempos, ganadora de 3 Premios Óscar incluyendo Mejor Película.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película ganó el Oscar a Mejor Película en 2020?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Parásitos", "1917", "Joker", "Había una vez en Hollywood"],
        respuesta_correcta: 0,
        explicacion: "'Parásitos' (Parasite) dirigida por Bong Joon-ho se convirtió en la primera película no hablada en inglés en ganar el Oscar a Mejor Película, además de llevarse los premios a Mejor Director, Mejor Guion Original y Mejor Película Internacional.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué actor ha interpretado a James Bond en más películas?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Roger Moore", "Sean Connery", "Daniel Craig", "Pierce Brosnan"],
        respuesta_correcta: 0,
        explicacion: "Roger Moore interpretó a James Bond en siete películas oficiales de la saga, superando a Sean Connery (6 películas oficiales + 1 no oficial), Daniel Craig (5) y Pierce Brosnan (4).",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué famoso director es conocido por películas como 'E.T.', 'Jurassic Park' y 'La Lista de Schindler'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Steven Spielberg", "James Cameron", "Christopher Nolan", "Martin Scorsese"],
        respuesta_correcta: 0,
        explicacion: "Steven Spielberg es uno de los directores más exitosos e influyentes de Hollywood, conocido por películas como 'E.T.', 'Jurassic Park', 'La Lista de Schindler', 'Salvar al Soldado Ryan' y muchas más.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de Christopher Nolan trata sobre un grupo de ladrones que roban secretos del subconsciente?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Inception", "Interstellar", "Memento", "The Prestige"],
        respuesta_correcta: 0,
        explicacion: "'Inception' (2010) sigue a Dom Cobb (Leonardo DiCaprio), un ladrón especializado en extraer secretos del subconsciente durante el estado de sueño que intenta implantar una idea en la mente de un hombre.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué director es conocido por la 'Trilogía de los Colores': Azul, Blanco y Rojo?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Krzysztof Kieślowski", "Ingmar Bergman", "Federico Fellini", "Lars von Trier"],
        respuesta_correcta: 0,
        explicacion: "El director polaco Krzysztof Kieślowski creó la aclamada 'Trilogía de los Colores' (Trois Couleurs: Bleu, Blanc, Rouge) entre 1993 y 1994, inspirada en los colores de la bandera francesa y sus ideales de libertad, igualdad y fraternidad.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de Pixar sigue la historia de un robot que limpia un planeta Tierra abandonado?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["WALL-E", "Los Increíbles", "Up", "Monsters Inc."],
        respuesta_correcta: 0,
        explicacion: "'WALL-E' (2008) cuenta la historia de un pequeño robot compactador de basura diseñado para limpiar la Tierra, que ha sido abandonada y cubierta de desechos, mientras los humanos viven en naves espaciales.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de los años 90 popularizó la frase 'La vida es como una caja de chocolates'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Forrest Gump", "El Silencio de los Corderos", "Pulp Fiction", "Titanic"],
        respuesta_correcta: 0,
        explicacion: "En 'Forrest Gump' (1994), el personaje principal dice la famosa frase: 'Mi mamá siempre decía que la vida es como una caja de chocolates, nunca sabes lo que te va a tocar'.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué actor rechazó el papel de Neo en 'Matrix' antes de que lo interpretara Keanu Reeves?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Will Smith", "Brad Pitt", "Tom Cruise", "Johnny Depp"],
        respuesta_correcta: 0,
        explicacion: "Will Smith rechazó el papel de Neo en 'Matrix' para protagonizar 'Wild Wild West', una decisión que más tarde lamentaría, ya que 'Matrix' se convirtió en un fenómeno cultural.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película inauguró el Universo Cinematográfico de Marvel (MCU)?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Iron Man", "El Increíble Hulk", "Capitán América: El Primer Vengador", "Thor"],
        respuesta_correcta: 0,
        explicacion: "'Iron Man', estrenada en 2008 y protagonizada por Robert Downey Jr., fue la primera película del MCU, iniciando una de las franquicias cinematográficas más exitosas de la historia.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿La película 'El Padrino' está basada en una historia real?",
        tipo: TIPOS.VERDADERO_FALSO,
        opciones: ["Falso", "Verdadero"],
        respuesta_correcta: 0,
        explicacion: "'El Padrino' está basada en la novela homónima de Mario Puzo, que si bien se inspiró en familias mafiosas reales como los Genovese, la historia específica es ficción.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué actor interpretó a Batman en la trilogía dirigida por Christopher Nolan?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Christian Bale", "Michael Keaton", "Ben Affleck", "George Clooney"],
        respuesta_correcta: 0,
        explicacion: "Christian Bale interpretó a Bruce Wayne/Batman en la trilogía de Christopher Nolan: 'Batman Begins' (2005), 'El Caballero Oscuro' (2008) y 'El Caballero Oscuro: La Leyenda Renace' (2012).",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué estudio de animación japonés creó 'El viaje de Chihiro'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Studio Ghibli", "Toei Animation", "Madhouse", "Kyoto Animation"],
        respuesta_correcta: 0,
        explicacion: "Studio Ghibli, fundado por Hayao Miyazaki e Isao Takahata, creó 'El viaje de Chihiro' (Spirited Away, 2001), que ganó el Óscar a Mejor Película de Animación.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué director es famoso por películas como 'Psicosis', 'Los Pájaros' y 'La Ventana Indiscreta'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Alfred Hitchcock", "Stanley Kubrick", "Orson Welles", "Billy Wilder"],
        respuesta_correcta: 0,
        explicacion: "Alfred Hitchcock, conocido como 'El Maestro del Suspense', dirigió numerosas obras maestras del cine como 'Psicosis', 'Los Pájaros', 'La Ventana Indiscreta' y 'Vértigo', entre otras.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué película un equipo de ladrones roba secretos corporativos invadiendo los sueños de sus objetivos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Inception", "Matrix", "Minority Report", "Limitless"],
        respuesta_correcta: 0,
        explicacion: "En 'Inception' (2010), dirigida por Christopher Nolan, Dom Cobb (Leonardo DiCaprio) y su equipo utilizan una tecnología que les permite entrar en los sueños de otros para robar información o implantar ideas.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de terror trata sobre una niña poseída por un demonio?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["El Exorcista", "El Resplandor", "Psicosis", "El Conjuro"],
        respuesta_correcta: 0,
        explicacion: "'El Exorcista' (1973), dirigida por William Friedkin, cuenta la historia de Regan MacNeil, una niña de 12 años poseída por un demonio, y los intentos de exorcismo realizados por dos sacerdotes.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué director mexicano ganó el Óscar a Mejor Director por 'La Forma del Agua'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Guillermo del Toro", "Alfonso Cuarón", "Alejandro González Iñárritu", "Carlos Cuarón"],
        respuesta_correcta: 0,
        explicacion: "Guillermo del Toro ganó el Óscar a Mejor Director y Mejor Película por 'La Forma del Agua' (The Shape of Water) en 2018, una fábula romántica ambientada durante la Guerra Fría.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es la película más taquillera de todos los tiempos hasta 2023?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Avatar", "Avengers: Endgame", "Titanic", "Star Wars: El Despertar de la Fuerza"],
        respuesta_correcta: 0,
        explicacion: "'Avatar' de James Cameron se mantiene como la película más taquillera de la historia con más de 2.900 millones de dólares recaudados globalmente, tras su reestreno en 2022 que le permitió superar nuevamente a 'Avengers: Endgame'.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué saga cinematográfica aparece el personaje Ethan Hunt?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Misión Imposible", "James Bond", "Bourne", "Fast & Furious"],
        respuesta_correcta: 0,
        explicacion: "Ethan Hunt, interpretado por Tom Cruise, es el protagonista de la saga 'Misión Imposible', basada en la serie de televisión de los años 60.",
        dificultad: DIFICULTADES.MEDIO,
        imagen: TRIVIA_IMAGEN
    },
{
        pregunta: "¿Quién fue el primer actor afroamericano en ganar el Oscar al Mejor Actor?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Sidney Poitier", "Denzel Washington", "Morgan Freeman", "Jamie Foxx"],
        respuesta_correcta: 0,
        explicacion: "Sidney Poitier se convirtió en el primer actor afroamericano en ganar el Oscar a Mejor Actor por su papel en 'Los lirios del valle' (1963).",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué director tiene el récord de más nominaciones al Oscar a Mejor Director?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["William Wyler", "Martin Scorsese", "Steven Spielberg", "John Ford"],
        respuesta_correcta: 0,
        explicacion: "William Wyler tiene el récord con 12 nominaciones al Oscar como Mejor Director, ganando tres veces por 'Mrs. Miniver', 'Los mejores años de nuestra vida' y 'Ben-Hur'.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película dirigida por Francis Ford Coppola se rodó en Filipinas y tuvo una producción notoriamente caótica?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Apocalypse Now", "El Padrino", "La conversación", "Drácula de Bram Stoker"],
        respuesta_correcta: 0,
        explicacion: "'Apocalypse Now' tuvo un rodaje extremadamente complicado en Filipinas: tormentas tropicales destruyeron los sets, Martin Sheen sufrió un ataque cardíaco, y Marlon Brando llegó con sobrepeso y sin haberse aprendido sus líneas.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué actor interpretó a HAL 9000 en '2001: Una odisea del espacio'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Douglas Rain", "Anthony Hopkins", "James Earl Jones", "Ian Holm"],
        respuesta_correcta: 0,
        explicacion: "Douglas Rain proporcionó la voz calmada y perturbadora de HAL 9000, la computadora asesina de '2001: Una odisea del espacio' de Stanley Kubrick.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Quién dirigió 'El gabinete del doctor Caligari', película considerada precursora del expresionismo alemán?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Robert Wiene", "F.W. Murnau", "Fritz Lang", "Georg Wilhelm Pabst"],
        respuesta_correcta: 0,
        explicacion: "Robert Wiene dirigió 'El gabinete del doctor Caligari' (1920), obra maestra del expresionismo alemán reconocida por sus decorados distorsionados y su estética alucinante.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película japonesa fue reimaginada como 'Los siete magníficos' en Hollywood?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Los siete samuráis", "Ran", "Rashomon", "Yojimbo"],
        respuesta_correcta: 0,
        explicacion: "'Los siete samuráis' (1954) de Akira Kurosawa fue adaptada como 'Los siete magníficos' (1960), trasladando la historia de samuráis en el Japón feudal a pistoleros en el Viejo Oeste americano.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película tiene el récord de mayor número de Oscars ganados?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ben-Hur, Titanic y El Señor de los Anillos: El Retorno del Rey (empatadas)", "Lo que el viento se llevó", "West Side Story", "La La Land"],
        respuesta_correcta: 0,
        explicacion: "Ben-Hur (1959), Titanic (1997) y El Señor de los Anillos: El Retorno del Rey (2003) comparten el récord con 11 Oscars cada una.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿En qué película reciente se puede ver a Brad Pitt comiendo en casi todas sus escenas?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ocean's Eleven", "Bastardos sin Gloria", "Érase una vez en Hollywood", "El Club de la Pelea"],
        respuesta_correcta: 0,
        explicacion: "En 'Ocean's Eleven', Brad Pitt interpreta a Rusty Ryan, quien aparece comiendo en casi todas sus escenas, una característica que Pitt sugirió para dar profundidad al personaje.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de Hitchcock presenta un plano secuencia que simula estar rodada en una sola toma?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["La soga", "Vértigo", "Psicosis", "Con la muerte en los talones"],
        respuesta_correcta: 0,
        explicacion: "'La soga' (1948) está filmada y editada para parecer una única toma continua, aunque debido a las limitaciones técnicas de la época, tiene cortes ocultos cuando la cámara pasa por objetos oscuros.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué director francés es conocido por películas como 'Los 400 golpes' y 'Jules et Jim'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["François Truffaut", "Jean-Luc Godard", "Claude Chabrol", "Éric Rohmer"],
        respuesta_correcta: 0,
        explicacion: "François Truffaut fue uno de los fundadores de la Nouvelle Vague francesa y director de clásicos como 'Los 400 golpes' y 'Jules et Jim', que revolucionaron el lenguaje cinematográfico.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuántos años duró el rodaje de 'Boyhood' de Richard Linklater?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["12 años", "7 años", "10 años", "15 años"],
        respuesta_correcta: 0,
        explicacion: "Richard Linklater rodó 'Boyhood' durante 12 años (2002-2013), siguiendo al actor Ellar Coltrane desde los 6 hasta los 18 años para mostrar su crecimiento real en pantalla.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de Ingmar Bergman trata sobre una isla donde la Muerte juega al ajedrez con un caballero medieval?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["El séptimo sello", "Persona", "Fresas salvajes", "Gritos y susurros"],
        respuesta_correcta: 0,
        explicacion: "'El séptimo sello' (1957) narra la historia del caballero Antonius Block que juega al ajedrez con la Muerte durante la Peste Negra, en una alegoría sobre la búsqueda de significado en la vida.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué actriz ganó un Oscar por solo 8 minutos de aparición en pantalla?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Judi Dench", "Anne Hathaway", "Beatrice Straight", "Gloria Grahame"],
        respuesta_correcta: 0,
        explicacion: "Judi Dench ganó el Oscar a Mejor Actriz de Reparto por su interpretación de la Reina Isabel I en 'Shakespeare in Love' (1998) con solo 8 minutos de tiempo en pantalla.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película ambientada en un futuro distópico acuñó el término 'replicante'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Blade Runner", "Matrix", "Minority Report", "La naranja mecánica"],
        respuesta_correcta: 0,
        explicacion: "'Blade Runner' (1982) de Ridley Scott introdujo el término 'replicante' para describir a los androides Nexus-6 casi indistinguibles de los humanos, basados en los 'androides' de la novela de Philip K. Dick.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de los años 40 es considerada precursora del cine negro y contiene la famosa frase 'La sustancia con la que están hechos los sueños'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["El halcón maltés", "Casablanca", "Gilda", "El sueño eterno"],
        respuesta_correcta: 0,
        explicacion: "'El halcón maltés' (1941), protagonizada por Humphrey Bogart, es una película fundacional del cine negro. La famosa frase se refiere a la estatuilla del halcón que todos buscan desesperadamente.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de David Lynch presenta a un personaje llamado 'El Hombre del Planeta'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Eraserhead", "Mulholland Drive", "Inland Empire", "Twin Peaks: Fire Walk with Me"],
        respuesta_correcta: 0,
        explicacion: "'Eraserhead' (1977), la perturbadora ópera prima de David Lynch, incluye al enigmático 'Hombre del Planeta', quien parece controlar el destino del protagonista mediante palancas en su desolado habitáculo.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de Andrei Tarkovsky está ambientada en 'La Zona', un área misteriosa donde supuestamente se cumplen los deseos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Stalker", "Solaris", "El espejo", "Nostalgia"],
        respuesta_correcta: 0,
        explicacion: "'Stalker' (1979) narra la historia de un guía que lleva a dos hombres a través de 'La Zona', un lugar restringido donde supuestamente existe una habitación que cumple los deseos más profundos de quien entra en ella.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué director español es conocido por su colaboración con Antonio Banderas y Penélope Cruz?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Pedro Almodóvar", "Alejandro Amenábar", "Luis Buñuel", "Carlos Saura"],
        respuesta_correcta: 0,
        explicacion: "Pedro Almodóvar ha colaborado frecuentemente con Antonio Banderas y Penélope Cruz en películas como 'Mujeres al borde de un ataque de nervios', 'Todo sobre mi madre', 'La piel que habito' y 'Dolor y gloria'.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué famoso personaje de película es conocido por la frase 'Mi precioso'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Gollum", "Hannibal Lecter", "Darth Vader", "Jack Sparrow"],
        respuesta_correcta: 0,
        explicacion: "Gollum, de 'El Señor de los Anillos', interpretado por Andy Serkis mediante captura de movimiento, es conocido por referirse al Anillo Único como 'Mi precioso' (My precious).",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué prestigioso festival de cine otorga la Palma de Oro?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Festival de Cannes", "Festival de Venecia", "Festival de Berlín", "Festival de Sundance"],
        respuesta_correcta: 0,
        explicacion: "El Festival de Cannes, celebrado anualmente en Francia, otorga la Palma de Oro (Palme d'Or) a la mejor película en competición, siendo uno de los premios más prestigiosos del cine mundial.",
        dificultad: DIFICULTADES.DIFICIL,
        imagen: TRIVIA_IMAGEN
    },
{
        pregunta: "¿Qué película muda alemana de 1927 es conocida por sus innovadores efectos especiales y su visión distópica del futuro?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Metrópolis", "Nosferatu", "El gabinete del doctor Caligari", "M, el vampiro de Düsseldorf"],
        respuesta_correcta: 0,
        explicacion: "'Metrópolis' de Fritz Lang es considerada una obra maestra del expresionismo alemán y pionera de la ciencia ficción cinematográfica, con efectos revolucionarios para su época como el efecto Schüfftan.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué técnica cinematográfica, usada por primera vez por Alfred Hitchcock en 'Vértigo', combina un zoom hacia adelante con un travelling hacia atrás?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Efecto Dolly Zoom", "Plano secuencia", "Jump cut", "Match cut"],
        respuesta_correcta: 0,
        explicacion: "El efecto Dolly Zoom (también llamado 'efecto vértigo') consiste en hacer zoom hacia adelante mientras la cámara se aleja físicamente del sujeto, creando una distorsión visual inquietante que representa perfectamente la sensación de vértigo.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de Citizen Kane utiliza extensivamente la técnica de 'profundidad de campo' para mantener todos los elementos en foco?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ciudadano Kane", "Casablanca", "Lo que el viento se llevó", "El halcón maltés"],
        respuesta_correcta: 0,
        explicacion: "Orson Welles y su director de fotografía Gregg Toland revolucionaron el cine con 'Ciudadano Kane' (1941) al utilizar la profundidad de campo para mantener enfocados elementos del primer plano y fondo simultáneamente.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de Béla Tarr contiene un famoso plano secuencia de una manada de vacas que dura más de 8 minutos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["El tango de Satán", "El caballo de Turín", "La condena", "Armonías de Werckmeister"],
        respuesta_correcta: 0,
        explicacion: "'El tango de Satán' (Sátántangó, 1994) es conocida por sus extremadamente largos planos secuencia, incluyendo la famosa escena de las vacas vagando por un pueblo desolado, característica del estilo contemplativo de Tarr.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de la Nouvelle Vague francesa utiliza por primera vez el 'jump cut' como elemento narrativo deliberado?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Al final de la escapada", "Los 400 golpes", "Cleo de 5 a 7", "Hiroshima, mi amor"],
        respuesta_correcta: 0,
        explicacion: "'Al final de la escapada' (À bout de souffle, 1960) de Jean-Luc Godard revolucionó el montaje cinematográfico al utilizar jump cuts (cortes abruptos que rompen la continuidad temporal) como elemento expresivo.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué actriz rechazó el papel protagonista en 'Chinatown' que finalmente interpretó Faye Dunaway?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Jane Fonda", "Meryl Streep", "Diane Keaton", "Julie Christie"],
        respuesta_correcta: 0,
        explicacion: "Jane Fonda rechazó el papel de Evelyn Mulwray en 'Chinatown' que posteriormente interpretó Faye Dunaway en una actuación que se considera una de las mejores de su carrera.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película experimental de Andy Warhol consiste en un plano estático del Empire State Building durante más de 8 horas?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Empire", "Sleep", "Chelsea Girls", "Blow Job"],
        respuesta_correcta: 0,
        explicacion: "'Empire' (1964) es una película experimental de Andy Warhol que consiste en 8 horas y 5 minutos de metraje del Empire State Building filmado en una sola toma estática, ejemplificando el cine estructural y minimalista.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué director escocés es conocido por su 'Trilogía del Silencio' que incluye 'Elephant', 'The Silent One' y 'Contact'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Alan Clarke", "Bill Douglas", "Lynne Ramsay", "Peter Mullan"],
        respuesta_correcta: 0,
        explicacion: "Alan Clarke creó la 'Trilogía del Silencio', tres filmes que abordan el conflicto norirlandés con un estilo minimalista, casi documental y con muy poco diálogo, destacando 'Elephant' (1989) que inspiró a Gus Van Sant para su película homónima.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película fue la primera en utilizar la tecnología de captura de movimiento facial para todos sus personajes?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["El Expreso Polar", "Avatar", "Beowulf", "El Planeta de los Simios: Revolución"],
        respuesta_correcta: 0,
        explicacion: "'El Expreso Polar' (2004) de Robert Zemeckis fue pionera en utilizar tecnología de captura de movimiento facial para todos sus personajes, incluyendo múltiples interpretaciones de Tom Hanks.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de Yasujirō Ozu está rodada enteramente desde la perspectiva a la altura de una persona sentada en el suelo?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Cuentos de Tokio", "Buenos días", "Flores de equinoccio", "La hierba errante"],
        respuesta_correcta: 0,
        explicacion: "Yasujirō Ozu filmaba frecuentemente desde una posición baja (conocida como 'plano tatami') para reflejar la perspectiva tradicional japonesa de sentarse en el suelo. 'Cuentos de Tokio' (1953) es el ejemplo más famoso de esta técnica.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué actriz ganó un Oscar por una actuación en la que no pronuncia ni una sola palabra?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Jane Wyman", "Holly Hunter", "Marlee Matlin", "Patty Duke"],
        respuesta_correcta: 0,
        explicacion: "Jane Wyman ganó el Oscar a Mejor Actriz por 'Belinda' (1948), interpretando a una joven sordomuda sin pronunciar una sola palabra en toda la película.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película fue prohibida en el Reino Unido durante 27 años debido a su controvertido contenido?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["La naranja mecánica", "El exorcista", "La matanza de Texas", "El último tango en París"],
        respuesta_correcta: 0,
        explicacion: "'La naranja mecánica' de Stanley Kubrick fue retirada de circulación en Reino Unido desde 1973 hasta 2000 por decisión del propio director tras recibir amenazas de muerte y acusaciones de inspirar crímenes violentos.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película soviética de Andrei Tarkovsky está ambientada en una zona prohibida con propiedades sobrenaturales?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Stalker", "Solaris", "Andrei Rublev", "La infancia de Iván"],
        respuesta_correcta: 0,
        explicacion: "'Stalker' (1979) narra la historia de un guía que lleva a dos hombres a través de una misteriosa área restringida conocida como 'La Zona', donde las leyes de la física no se aplican normalmente.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué cineasta español es conocido por su 'Trilogía del Apartamento' que incluye 'El ángel exterminador', 'El discreto encanto de la burguesía' y 'El fantasma de la libertad'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Luis Buñuel", "Pedro Almodóvar", "Carlos Saura", "Alejandro Amenábar"],
        respuesta_correcta: 0,
        explicacion: "Luis Buñuel, maestro del surrealismo cinematográfico, creó la 'Trilogía del Apartamento', tres películas unidas por su crítica social, elementos surrealistas y la exploración de los espacios cerrados como metáfora social.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de Kurosawa fue la inspiración directa para 'Star Wars' de George Lucas?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["La fortaleza escondida", "Los siete samuráis", "Yojimbo", "Rashomon"],
        respuesta_correcta: 0,
        explicacion: "'La fortaleza escondida' (1958) de Akira Kurosawa, con su estructura narrativa desde la perspectiva de dos campesinos cómicos y la historia de una princesa escoltada a través de territorio enemigo, fue la principal inspiración para la estructura de 'Star Wars'.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de Alain Resnais explora la memoria traumática a través de una relación entre una actriz francesa y un arquitecto japonés?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Hiroshima, mon amour", "El año pasado en Marienbad", "Providence", "La guerra ha terminado"],
        respuesta_correcta: 0,
        explicacion: "'Hiroshima, mon amour' (1959) utiliza una estructura narrativa no lineal para explorar la memoria, el trauma y las consecuencias de la guerra a través de una breve relación entre una actriz francesa y un arquitecto japonés en Hiroshima.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué director polaco es conocido por su 'Trilogía de los Tres Colores' inspirada en la bandera francesa?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Krzysztof Kieślowski", "Andrzej Wajda", "Roman Polanski", "Agnieszka Holland"],
        respuesta_correcta: 0,
        explicacion: "Krzysztof Kieślowski creó la 'Trilogía de los Tres Colores' (Azul, Blanco, Rojo), inspirada en los colores de la bandera francesa y sus valores republicanos: libertad, igualdad y fraternidad.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película de Orson Welles se perdió durante décadas y fue finalmente restaurada y estrenada en 2018?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Al otro lado del viento", "It's All True", "Don Quijote", "The Deep"],
        respuesta_correcta: 0,
        explicacion: "'Al otro lado del viento' (The Other Side of the Wind) comenzó a rodarse en 1970 pero quedó inacabada por problemas financieros y legales. Netflix adquirió los derechos y la restauró, estrenándola finalmente en 2018, 33 años después de la muerte de Welles.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué película neorrealista italiana narra la búsqueda de una bicicleta robada en la Roma de posguerra?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ladrón de bicicletas", "Roma, ciudad abierta", "El limpiabotas", "Umberto D."],
        respuesta_correcta: 0,
        explicacion: "'Ladrón de bicicletas' (Ladri di biciclette, 1948) de Vittorio De Sica es una obra maestra del neorrealismo italiano que utiliza actores no profesionales y localizaciones reales para retratar la desesperada búsqueda de un hombre por su bicicleta robada, esencial para su trabajo.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué famoso crítico de cine estadounidense perdió la capacidad de hablar debido al cáncer pero continuó escribiendo reseñas hasta su muerte?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Roger Ebert", "Pauline Kael", "Andrew Sarris", "Gene Siskel"],
        respuesta_correcta: 0,
        explicacion: "Roger Ebert, ganador del Premio Pulitzer y uno de los críticos más influyentes de la historia, perdió la capacidad de hablar en 2006 tras una cirugía por cáncer de tiroides, pero continuó escribiendo y utilizando síntesis de voz hasta su muerte en 2013.",
        dificultad: DIFICULTADES.EXPERTO,
        imagen: TRIVIA_IMAGEN
    }
    ],

    // CIENCIA
    [CATEGORIAS.CIENCIA]: [
        {
            pregunta: "¿Cuál es el elemento químico más abundante en el universo?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["Oxígeno", "Carbono", "Hidrógeno", "Helio"],
            respuesta_correcta: 2,
            explicacion: "El hidrógeno constituye aproximadamente el 75% de toda la materia bariónica del universo. Es el elemento más simple y ligero.",
            dificultad: DIFICULTADES.FACIL,
            imagen: TRIVIA_IMAGEN
        },
        {
            pregunta: "¿Cuánto tiempo tarda la luz del Sol en llegar a la Tierra?",
            tipo: TIPOS.OPCION_MULTIPLE,
            opciones: ["1 segundo", "8 minutos y 20 segundos", "1 hora", "24 horas"],
            respuesta_correcta: 1,
            explicacion: "La luz viaja a aproximadamente 300,000 km/s, y la distancia media del Sol a la Tierra es de 150 millones de km, lo que resulta en un tiempo de viaje de 8 minutos y 20 segundos.",
            dificultad: DIFICULTADES.MEDIO,
            imagen: TRIVIA_IMAGEN
        },
{
        pregunta: "¿Cuál es el elemento químico más abundante en el universo?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Hidrógeno", "Oxígeno", "Carbono", "Helio"],
        respuesta_correcta: 0,
        explicacion: "El hidrógeno constituye aproximadamente el 75% de toda la materia bariónica del universo. Es el elemento más simple y ligero.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el planeta más cercano al Sol?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Mercurio", "Venus", "Tierra", "Marte"],
        respuesta_correcta: 0,
        explicacion: "Mercurio es el planeta más cercano al Sol, con una distancia media de unos 58 millones de kilómetros.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el hueso más largo del cuerpo humano?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Fémur", "Húmero", "Tibia", "Radio"],
        respuesta_correcta: 0,
        explicacion: "El fémur, ubicado en el muslo, es el hueso más largo y fuerte del cuerpo humano, representando aproximadamente un cuarto de la altura de una persona.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué gas respiran las plantas durante la fotosíntesis?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Dióxido de carbono", "Oxígeno", "Nitrógeno", "Hidrógeno"],
        respuesta_correcta: 0,
        explicacion: "Durante la fotosíntesis, las plantas absorben dióxido de carbono (CO₂) y liberan oxígeno (O₂) como subproducto.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué órgano del cuerpo humano consume más energía?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Cerebro", "Corazón", "Hígado", "Pulmones"],
        respuesta_correcta: 0,
        explicacion: "El cerebro consume aproximadamente el 20% de la energía del cuerpo, a pesar de representar solo el 2% del peso corporal.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es la unidad básica de la vida?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Célula", "Átomo", "Molécula", "Tejido"],
        respuesta_correcta: 0,
        explicacion: "La célula es la unidad básica estructural y funcional de todos los seres vivos, desde organismos unicelulares hasta complejos organismos multicelulares.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué planeta se conoce como el 'planeta rojo'?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Marte", "Júpiter", "Venus", "Saturno"],
        respuesta_correcta: 0,
        explicacion: "Marte es conocido como el 'planeta rojo' debido al óxido de hierro (herrumbre) que predomina en su superficie, dándole su característico color rojizo.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el metal más abundante en la corteza terrestre?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Aluminio", "Hierro", "Cobre", "Oro"],
        respuesta_correcta: 0,
        explicacion: "El aluminio es el metal más abundante en la corteza terrestre, representando aproximadamente el 8.1% de su masa.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el órgano más grande del cuerpo humano?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Piel", "Hígado", "Pulmones", "Intestino delgado"],
        respuesta_correcta: 0,
        explicacion: "La piel es el órgano más grande del cuerpo humano, cubriendo una superficie de aproximadamente 2 metros cuadrados en un adulto promedio.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué científico propuso la teoría de la relatividad?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Albert Einstein", "Isaac Newton", "Galileo Galilei", "Niels Bohr"],
        respuesta_correcta: 0,
        explicacion: "Albert Einstein propuso la Teoría de la Relatividad Especial en 1905 y la Teoría de la Relatividad General en 1915, revolucionando nuestra comprensión del espacio, tiempo y gravedad.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el estado de la materia que no tiene forma ni volumen definidos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Gaseoso", "Líquido", "Sólido", "Plasma"],
        respuesta_correcta: 0,
        explicacion: "En el estado gaseoso, las partículas están muy separadas y se mueven libremente, lo que hace que los gases no tengan forma ni volumen definidos, adaptándose al recipiente que los contiene.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es el proceso por el cual las plantas fabrican su alimento?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Fotosíntesis", "Respiración", "Fermentación", "Digestión"],
        respuesta_correcta: 0,
        explicacion: "La fotosíntesis es el proceso mediante el cual las plantas, algas y algunas bacterias utilizan la energía de la luz solar para convertir dióxido de carbono y agua en glucosa y oxígeno.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál de estos animales es un mamífero?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Delfín", "Tiburón", "Cocodrilo", "Águila"],
        respuesta_correcta: 0,
        explicacion: "Los delfines son mamíferos marinos que respiran aire, tienen sangre caliente, dan a luz crías vivas y las alimentan con leche materna.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué tipo de radiación se utiliza en las cabinas de bronceado?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Ultravioleta", "Infrarroja", "Rayos X", "Microondas"],
        respuesta_correcta: 0,
        explicacion: "Las cabinas de bronceado utilizan radiación ultravioleta (UV) para estimular la producción de melanina en la piel, provocando un bronceado artificial. Esta práctica puede aumentar el riesgo de cáncer de piel.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es la fórmula química del agua?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["H₂O", "CO₂", "O₂", "H₂SO₄"],
        respuesta_correcta: 0,
        explicacion: "El agua (H₂O) está formada por dos átomos de hidrógeno (H) y uno de oxígeno (O).",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuántos huesos tiene el cuerpo humano adulto?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["206", "300", "150", "186"],
        respuesta_correcta: 0,
        explicacion: "El esqueleto humano adulto está compuesto por 206 huesos. Los bebés nacen con aproximadamente 300 huesos, pero algunos se fusionan durante el crecimiento.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Cuál es la unidad básica de medida de longitud en el Sistema Internacional?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Metro", "Kilómetro", "Centímetro", "Milla"],
        respuesta_correcta: 0,
        explicacion: "El metro (m) es la unidad básica de longitud en el Sistema Internacional de Unidades (SI). Se define actualmente en relación a la velocidad de la luz en el vacío.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué células del cuerpo humano transportan oxígeno?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Glóbulos rojos", "Glóbulos blancos", "Plaquetas", "Neuronas"],
        respuesta_correcta: 0,
        explicacion: "Los glóbulos rojos (eritrocitos) contienen hemoglobina, una proteína que les permite transportar oxígeno desde los pulmones hacia los tejidos del cuerpo.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué rama de la ciencia estudia los seres vivos?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Biología", "Química", "Física", "Geología"],
        respuesta_correcta: 0,
        explicacion: "La biología es la ciencia que estudia los seres vivos, su estructura, función, evolución, distribución y relaciones entre sí y con el medio ambiente.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },
    {
        pregunta: "¿Qué vitamina produce el cuerpo humano al exponerse al sol?",
        tipo: TIPOS.OPCION_MULTIPLE,
        opciones: ["Vitamina D", "Vitamina C", "Vitamina A", "Vitamina E"],
        respuesta_correcta: 0,
        explicacion: "La piel humana produce vitamina D cuando se expone a la radiación ultravioleta B (UVB) del sol. Esta vitamina es esencial para la absorción de calcio y la salud ósea.",
        dificultad: DIFICULTADES.FACIL,
        imagen: TRIVIA_IMAGEN
    },

    ]
};

// Cache para evitar repetición de preguntas por sesión/usuario
// En una implementación real, esto podría ser una base de datos
const preguntasUsadas = {};

/**
 * Endpoint principal de la API de Trivia
 * Genera una pregunta de trivia según los parámetros dados
 */
router.get("/", async (req, res) => {
    try {
        const { categoria, dificultad, tipo, usuario_id } = req.query;
        
        // Validar parámetros
        if (!validarParametros(categoria, dificultad, tipo)) {
            return res.status(400).json({
                error: "Parámetros inválidos",
                ejemplo: "/api/fun/trivia?categoria=anime&dificultad=medio&tipo=opcion_multiple",
                categorias_disponibles: Object.values(CATEGORIAS),
                dificultades_disponibles: Object.values(DIFICULTADES),
                tipos_disponibles: Object.values(TIPOS)
            });
        }
        
        // Convertir parámetros a valores normalizados
        const categoriaFinal = normalizarCategoria(categoria);
        const dificultadFinal = normalizarDificultad(dificultad);
        const tipoFinal = normalizarTipo(tipo);
        
        // Obtener una pregunta según los criterios
        const pregunta = obtenerPregunta(categoriaFinal, dificultadFinal, tipoFinal, usuario_id);
        
        if (!pregunta) {
            return res.status(404).json({
                error: "No se encontraron preguntas disponibles con los criterios especificados",
                sugerencia: "Intenta con diferentes parámetros o categorías"
            });
        }
        
        // Formatear respuesta según sea opción múltiple o verdadero/falso
        const respuestaFormateada = formatearRespuesta(pregunta, tipoFinal);
        
        // Enviar respuesta
        res.json(respuestaFormateada);
        
    } catch (error) {
        console.error("Error en API de Trivia:", error);
        res.status(500).json({
            error: "Error al generar pregunta de trivia",
            detalle: error.message
        });
    }
});

/**
 * Endpoint de información - Muestra datos sobre la API
 */
router.get("/info", (req, res) => {
    // Contar preguntas por categoría
    const estadisticas = Object.entries(BANCO_PREGUNTAS).reduce((acc, [categoria, preguntas]) => {
        acc[categoria] = preguntas.length;
        return acc;
    }, {});
    
    // Contar preguntas por tipo
    const tiposStats = {};
    const dificultadStats = {};
    
    Object.values(BANCO_PREGUNTAS).flat().forEach(pregunta => {
        // Contar por tipo
        tiposStats[pregunta.tipo] = (tiposStats[pregunta.tipo] || 0) + 1;
        
        // Contar por dificultad
        dificultadStats[pregunta.dificultad] = (dificultadStats[pregunta.dificultad] || 0) + 1;
    });
    
    res.json({
        nombre: "API de Trivia - Generador de Preguntas",
        endpoints: {
            principal: "/api/fun/trivia?categoria=CATEGORIA&dificultad=DIFICULTAD&tipo=TIPO",
            info: "/api/fun/trivia/info",
            categorias: "/api/fun/trivia/categorias"
        },
        categorias_disponibles: Object.values(CATEGORIAS),
        dificultades_disponibles: Object.values(DIFICULTADES),
        tipos_disponibles: Object.values(TIPOS),
        estadisticas: {
            preguntas_por_categoria: estadisticas,
            preguntas_por_tipo: tiposStats,
            preguntas_por_dificultad: dificultadStats,
            total_preguntas: Object.values(BANCO_PREGUNTAS).flat().length
        },
        ejemplos: [
            "/api/fun/trivia?categoria=anime",
            "/api/fun/trivia?categoria=videojuegos&dificultad=dificil",
            "/api/fun/trivia?categoria=random&tipo=verdadero_falso",
            "/api/fun/trivia?usuario_id=123456789" // Para seguimiento de preguntas ya usadas
        ]
    });
});

/**
 * Endpoint para listar preguntas disponibles por categoría
 */
router.get("/categorias/:categoria?", (req, res) => {
    const { categoria } = req.params;
    
    if (categoria) {
        const categoriaNormalizada = normalizarCategoria(categoria);
        
        if (!BANCO_PREGUNTAS[categoriaNormalizada]) {
            return res.status(404).json({
                error: "Categoría no encontrada",
                categorias_disponibles: Object.values(CATEGORIAS)
            });
        }
        
        // Información resumida (sin mostrar respuestas)
        const preguntasResumidas = BANCO_PREGUNTAS[categoriaNormalizada].map(pregunta => ({
            pregunta: pregunta.pregunta,
            tipo: pregunta.tipo,
            dificultad: pregunta.dificultad,
            opciones: pregunta.tipo === TIPOS.OPCION_MULTIPLE ? pregunta.opciones.length : 2
        }));
        
        return res.json({
            categoria: categoriaNormalizada,
            total_preguntas: preguntasResumidas.length,
            preguntas: preguntasResumidas
        });
    }
    
    // Si no se especifica categoría, mostrar resumen de todas
    const resumen = Object.entries(BANCO_PREGUNTAS).reduce((acc, [categoria, preguntas]) => {
        acc[categoria] = {
            total: preguntas.length,
            por_dificultad: preguntas.reduce((acc, pregunta) => {
                acc[pregunta.dificultad] = (acc[pregunta.dificultad] || 0) + 1;
                return acc;
            }, {})
        };
        return acc;
    }, {});
    
    res.json({
        categorias: resumen
    });
});

// FUNCIONES DE UTILIDAD

/**
 * Valida los parámetros de la solicitud
 */
function validarParametros(categoria, dificultad, tipo) {
    // Si no se proporciona ningún parámetro, al menos necesitamos uno válido
    if (!categoria && !dificultad && !tipo) {
        return false;
    }
    
    // Si se proporciona categoría, validar
    if (categoria && !esValorValido(categoria, CATEGORIAS)) {
        return false;
    }
    
    // Si se proporciona dificultad, validar
    if (dificultad && !esValorValido(dificultad, DIFICULTADES)) {
        return false;
    }
    
    // Si se proporciona tipo, validar
    if (tipo && !esValorValido(tipo, TIPOS)) {
        return false;
    }
    
    return true;
}

/**
 * Verifica si un valor es válido según un conjunto de constantes
 */
function esValorValido(valor, constantes) {
    const valoresValidos = Object.values(constantes);
    return valoresValidos.includes(valor.toLowerCase());
}

/**
 * Normaliza la categoría especificada, o devuelve una aleatoria si es "random"
 */
function normalizarCategoria(categoria) {
    if (!categoria) {
        return CATEGORIAS.RANDOM;
    }
    
    const categoriaNormalizada = categoria.toLowerCase();
    
    if (categoriaNormalizada === CATEGORIAS.RANDOM) {
        const categorias = Object.values(CATEGORIAS).filter(c => c !== CATEGORIAS.RANDOM);
        return categorias[Math.floor(Math.random() * categorias.length)];
    }
    
    return categoriaNormalizada;
}

/**
 * Normaliza la dificultad especificada, o devuelve una aleatoria si es "random"
 */
function normalizarDificultad(dificultad) {
    if (!dificultad) {
        return null; // Cualquier dificultad
    }
    
    const dificultadNormalizada = dificultad.toLowerCase();
    
    if (dificultadNormalizada === DIFICULTADES.RANDOM) {
        const dificultades = Object.values(DIFICULTADES).filter(d => d !== DIFICULTADES.RANDOM);
        return dificultades[Math.floor(Math.random() * dificultades.length)];
    }
    
    return dificultadNormalizada;
}

/**
 * Normaliza el tipo especificado, o devuelve uno aleatorio si es "random"
 */
function normalizarTipo(tipo) {
    if (!tipo) {
        return null; // Cualquier tipo
    }
    
    const tipoNormalizado = tipo.toLowerCase();
    
    if (tipoNormalizado === TIPOS.RANDOM) {
        const tipos = Object.values(TIPOS).filter(t => t !== TIPOS.RANDOM);
        return tipos[Math.floor(Math.random() * tipos.length)];
    }
    
    return tipoNormalizado;
}

/**
 * Obtiene una pregunta según los criterios especificados
 * Evita repetir preguntas para el mismo usuario
 */
function obtenerPregunta(categoria, dificultad, tipo, usuario_id) {
    // Obtener todas las preguntas de la categoría
    const preguntasCategoria = BANCO_PREGUNTAS[categoria];
    
    if (!preguntasCategoria || preguntasCategoria.length === 0) {
        return null;
    }
    
    // Filtrar por dificultad si se especifica
    let preguntasFiltradas = preguntasCategoria;
    
    if (dificultad) {
        preguntasFiltradas = preguntasFiltradas.filter(p => p.dificultad === dificultad);
    }
    
    // Filtrar por tipo si se especifica
    if (tipo) {
        preguntasFiltradas = preguntasFiltradas.filter(p => p.tipo === tipo);
    }
    
    if (preguntasFiltradas.length === 0) {
        return null;
    }
    
    // Si hay ID de usuario, evitar preguntas ya usadas
    if (usuario_id) {
        // Inicializar seguimiento para este usuario si no existe
        if (!preguntasUsadas[usuario_id]) {
            preguntasUsadas[usuario_id] = new Set();
        }
        
        // Filtrar preguntas ya usadas
        const preguntasDisponibles = preguntasFiltradas.filter((p, index) => {
            // Crear un identificador único para esta pregunta
            const preguntaId = `${categoria}-${index}`;
            return !preguntasUsadas[usuario_id].has(preguntaId);
        });
        
        // Si hay preguntas disponibles, seleccionar una aleatoria
        if (preguntasDisponibles.length > 0) {
            const indiceAleatorio = Math.floor(Math.random() * preguntasDisponibles.length);
            const preguntaSeleccionada = preguntasDisponibles[indiceAleatorio];
            
            // Marcar como usada
            const preguntaId = `${categoria}-${preguntasCategoria.indexOf(preguntaSeleccionada)}`;
            preguntasUsadas[usuario_id].add(preguntaId);
            
            // Si todas las preguntas han sido usadas, reiniciar
            if (preguntasUsadas[usuario_id].size >= preguntasCategoria.length) {
                preguntasUsadas[usuario_id].clear();
            }
            
            return preguntaSeleccionada;
        }
        
        // Si todas las preguntas fueron usadas, reiniciar y seleccionar cualquiera
        preguntasUsadas[usuario_id].clear();
    }
    
    // Seleccionar una pregunta aleatoria
    const indiceAleatorio = Math.floor(Math.random() * preguntasFiltradas.length);
    return preguntasFiltradas[indiceAleatorio];
}

/**
 * Formatea la respuesta para el usuario, ocultando la respuesta correcta
 */
function formatearRespuesta(pregunta, tipo) {
    // Clonar para no modificar el original
    const preguntaFormateada = { ...pregunta };
    
    // Eliminar la respuesta correcta de la pregunta devuelta
    const respuestaCorrecta = preguntaFormateada.respuesta_correcta;
    delete preguntaFormateada.respuesta_correcta;
    
    // Calcular puntos sugeridos según dificultad
    let puntosSugeridos = 1;
    switch (preguntaFormateada.dificultad) {
        case DIFICULTADES.FACIL:
            puntosSugeridos = 1;
            break;
        case DIFICULTADES.MEDIO:
            puntosSugeridos = 2;
            break;
        case DIFICULTADES.DIFICIL:
            puntosSugeridos = 3;
            break;
        case DIFICULTADES.EXPERTO:
            puntosSugeridos = 5;
            break;
    }
    
    // Añadir el índice de opciones (1, 2, 3, 4 en lugar de 0, 1, 2, 3)
    const opcionesConIndice = preguntaFormateada.opciones.map((opcion, index) => ({
        indice: index + 1,
        texto: opcion
    }));
    
    // Crear la respuesta final
    return {
        pregunta: preguntaFormateada.pregunta,
        tipo: preguntaFormateada.tipo,
        dificultad: preguntaFormateada.dificultad,
        opciones: opcionesConIndice,
        imagen: preguntaFormateada.imagen,
        puntos_sugeridos: puntosSugeridos,
        
        // Parámetros para verificar la respuesta después
        verificacion: {
            respuesta_correcta_indice: respuestaCorrecta + 1, // +1 para que coincida con los índices mostrados
            respuesta_correcta_texto: preguntaFormateada.opciones[respuestaCorrecta],
            explicacion: preguntaFormateada.explicacion
        }
    };
}

// Cada 24 horas, limpiar el caché de preguntas usadas
setInterval(() => {
    console.log("Limpiando caché de preguntas usadas en API de Trivia");
    for (const usuario_id in preguntasUsadas) {
        preguntasUsadas[usuario_id].clear();
    }
}, 24 * 60 * 60 * 1000);

module.exports = router;
