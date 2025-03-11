const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

const router = express.Router();

// Registrar fuente para Discord - idealmente usar Whitney, pero usamos una alternativa
registerFont(path.join(__dirname, 'Oswald-VariableFont_wght.ttf'), { family: 'Oswald' });

// Función para validar URL
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

// Estilos para el texto (solo el morado-azul que siempre se usará)
const ESTILOS_TEXTO = {
    // Estilo morado-azul (único estilo que se usará)
    moradoAzul: {
        usuario: {
            // Una fuente más ornamentada para el nombre de usuario
            fuente: "bold 18px 'Oswald'",
            color: "#9966ff", // Morado
            sombra: "0 0 5px #5500ff"
        },
        mensaje: {
            // Una fuente diferente para el texto de mensaje
            fuente: "italic 15px 'Oswald'",
            color: "#66ccff", // Azul claro
            sombra: "0 0 3px #0066ff"
        }
    }
};

// Función para dibujar pequeños boosts en el fondo
function dibujarMiniBoosters(ctx, ancho, alto, colores = ["#ff73fa", "#bd5dff"]) {
    // Crear varios mini diamantes de boost en el fondo
    const miniBoosts = [
        { x: ancho * 0.15, y: alto * 0.25, tamaño: 8 },
        { x: ancho * 0.25, y: alto * 0.75, tamaño: 6 },
        { x: ancho * 0.45, y: alto * 0.35, tamaño: 5 },
        { x: ancho * 0.65, y: alto * 0.65, tamaño: 7 },
        { x: ancho * 0.75, y: alto * 0.15, tamaño: 6 },
        { x: ancho * 0.85, y: alto * 0.85, tamaño: 5 },
        { x: ancho * 0.35, y: alto * 0.55, tamaño: 4 },
        { x: ancho * 0.55, y: alto * 0.25, tamaño: 6 },
        { x: ancho * 0.72, y: alto * 0.45, tamaño: 5 },
        { x: ancho * 0.92, y: alto * 0.35, tamaño: 4 },
    ];
    
    miniBoosts.forEach(boost => {
        // Mini diamante
        ctx.globalAlpha = 0.3; // Transparente para no distraer
        ctx.beginPath();
        ctx.moveTo(boost.x, boost.y + boost.tamaño * 0.5);
        ctx.lineTo(boost.x - boost.tamaño * 0.4, boost.y);
        ctx.lineTo(boost.x, boost.y - boost.tamaño * 0.5);
        ctx.lineTo(boost.x + boost.tamaño * 0.4, boost.y);
        ctx.closePath();
        
        const gradiente = ctx.createLinearGradient(
            boost.x - boost.tamaño * 0.4, boost.y - boost.tamaño * 0.5,
            boost.x + boost.tamaño * 0.4, boost.y + boost.tamaño * 0.5
        );
        gradiente.addColorStop(0, colores[0]);
        gradiente.addColorStop(1, colores[1]);
        
        ctx.fillStyle = gradiente;
        ctx.fill();
        
        // Resetear alpha
        ctx.globalAlpha = 1.0;
    });
}

// Función para crear fondo en estilo morado-azul
function crearFondoMoradoAzul(ctx, ancho, alto) {
    // Colores fijos para el tema morado-azul
    const colores = ["#6600ff", "#00ccff"]; // Morado a azul
    
    // Crear degradado base
    const gradient = ctx.createLinearGradient(0, 0, ancho, alto);
    gradient.addColorStop(0, colores[0]);
    gradient.addColorStop(1, colores[1]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ancho, alto);
    
    // Añadir patrón de diamantes
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    
    const tamañoDiamante = 40;
    for (let y = -tamañoDiamante; y < alto + tamañoDiamante; y += tamañoDiamante) {
        for (let x = -tamañoDiamante; x < ancho + tamañoDiamante; x += tamañoDiamante) {
            ctx.beginPath();
            ctx.moveTo(x, y + tamañoDiamante/2);
            ctx.lineTo(x + tamañoDiamante/2, y);
            ctx.lineTo(x + tamañoDiamante, y + tamañoDiamante/2);
            ctx.lineTo(x + tamañoDiamante/2, y + tamañoDiamante);
            ctx.closePath();
            ctx.stroke();
        }
    }
    
    // Añadir brillos/partículas
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * ancho;
        const y = Math.random() * alto;
        const tamaño = Math.random() * 3 + 1;
        
        // Brillo con resplandor
        const gradiente = ctx.createRadialGradient(x, y, 0, x, y, tamaño * 4);
        gradiente.addColorStop(0, "rgba(255,255,255,0.8)");
        gradiente.addColorStop(0.5, "rgba(255,255,255,0.2)");
        gradiente.addColorStop(1, "rgba(255,255,255,0)");
        
        ctx.beginPath();
        ctx.arc(x, y, tamaño * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradiente;
        ctx.fill();
        
        // Punto central brillante
        ctx.beginPath();
        ctx.arc(x, y, tamaño, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();
    }
    
    // Añadir viñeta para dar profundidad
    const viñeta = ctx.createRadialGradient(
        ancho / 2, alto / 2, alto / 3,
        ancho / 2, alto / 2, alto
    );
    viñeta.addColorStop(0, "rgba(0,0,0,0)");
    viñeta.addColorStop(1, "rgba(0,0,0,0.5)");
    
    ctx.fillStyle = viñeta;
    ctx.fillRect(0, 0, ancho, alto);
    
    // Líneas decorativas en las esquinas
    ctx.strokeStyle = "rgba(180,230,255,0.5)";
    ctx.lineWidth = 2;
    
    // Tamaño de las líneas decorativas
    const long = 25;
    
    // Esquina superior izquierda
    ctx.beginPath();
    ctx.moveTo(0, long);
    ctx.lineTo(0, 0);
    ctx.lineTo(long, 0);
    ctx.stroke();
    
    // Esquina superior derecha
    ctx.beginPath();
    ctx.moveTo(ancho - long, 0);
    ctx.lineTo(ancho, 0);
    ctx.lineTo(ancho, long);
    ctx.stroke();
    
    // Esquina inferior izquierda
    ctx.beginPath();
    ctx.moveTo(0, alto - long);
    ctx.lineTo(0, alto);
    ctx.lineTo(long, alto);
    ctx.stroke();
    
    // Esquina inferior derecha
    ctx.beginPath();
    ctx.moveTo(ancho - long, alto);
    ctx.lineTo(ancho, alto);
    ctx.lineTo(ancho, alto - long);
    ctx.stroke();
    
    return colores;
}

// Función para crear efectos de brillo en los bordes
function crearEfectosBorde(ctx, ancho, alto) {
    // Crear gradiente en los bordes para dar efecto iluminado
    const altoBorde = 8; // Aumentado para más brillo
    const gradienteSuperior = ctx.createLinearGradient(0, 0, 0, altoBorde);
    gradienteSuperior.addColorStop(0, "rgba(255,115,250,0.8)");
    gradienteSuperior.addColorStop(1, "rgba(255,115,250,0)");
    
    ctx.fillStyle = gradienteSuperior;
    ctx.fillRect(0, 0, ancho, altoBorde);
    
    const gradienteInferior = ctx.createLinearGradient(0, alto - altoBorde, 0, alto);
    gradienteInferior.addColorStop(0, "rgba(255,115,250,0)");
    gradienteInferior.addColorStop(1, "rgba(255,115,250,0.8)");
    
    ctx.fillStyle = gradienteInferior;
    ctx.fillRect(0, alto - altoBorde, ancho, altoBorde);
    
    const anchoLateral = 8; // Aumentado para más brillo
    const gradienteIzquierdo = ctx.createLinearGradient(0, 0, anchoLateral, 0);
    gradienteIzquierdo.addColorStop(0, "rgba(255,115,250,0.8)");
    gradienteIzquierdo.addColorStop(1, "rgba(255,115,250,0)");
    
    ctx.fillStyle = gradienteIzquierdo;
    ctx.fillRect(0, 0, anchoLateral, alto);
    
    const gradienteDerecho = ctx.createLinearGradient(ancho - anchoLateral, 0, ancho, 0);
    gradienteDerecho.addColorStop(0, "rgba(255,115,250,0)");
    gradienteDerecho.addColorStop(1, "rgba(255,115,250,0.8)");
    
    ctx.fillStyle = gradienteDerecho;
    ctx.fillRect(ancho - anchoLateral, 0, anchoLateral, alto);
    
    // Añadir un resplandor adicional en las esquinas
    const radioEsquina = 20;
    const esquinas = [
        { x: 0, y: 0 },                // Superior izquierda
        { x: ancho, y: 0 },            // Superior derecha
        { x: 0, y: alto },             // Inferior izquierda
        { x: ancho, y: alto }          // Inferior derecha
    ];
    
    esquinas.forEach(esquina => {
        const gradienteEsquina = ctx.createRadialGradient(
            esquina.x, esquina.y, 0,
            esquina.x, esquina.y, radioEsquina
        );
        gradienteEsquina.addColorStop(0, "rgba(255,115,250,0.9)"); // Más intenso
        gradienteEsquina.addColorStop(0.6, "rgba(189,93,255,0.5)"); // Transición a morado
        gradienteEsquina.addColorStop(1, "rgba(189,93,255,0)");
        
        ctx.fillStyle = gradienteEsquina;
        ctx.fillRect(
            Math.max(0, esquina.x - radioEsquina),
            Math.max(0, esquina.y - radioEsquina),
            radioEsquina * (esquina.x === 0 ? 1 : -1) + (esquina.x === 0 ? 0 : ancho),
            radioEsquina * (esquina.y === 0 ? 1 : -1) + (esquina.y === 0 ? 0 : alto)
        );
    });
}

// Función para dividir el texto en múltiples líneas con control estricto de límites
function dividirTexto(ctx, texto, anchoMaximo, tamaño) {
    // Establecer la fuente para medir el texto
    ctx.font = `${tamaño}px Oswald`;
    
    // Si el texto es muy corto, devolverlo sin cambios
    if (ctx.measureText(texto).width <= anchoMaximo) {
        return [texto];
    }
    
    // Dividir el texto en palabras
    const palabras = texto.split(' ');
    const lineas = [];
    let lineaActual = '';
    
    // Verificar si todo el texto es demasiado largo incluso con el tamaño más pequeño
    // Si es así, truncarlo antes de procesar
    const textoTruncadoIndice = determinarLongitudMaxima(ctx, texto, anchoMaximo * 2.5, tamaño);
    const textoTruncado = textoTruncadoIndice < texto.length ? 
                           texto.substring(0, textoTruncadoIndice) + '...' : 
                           texto;
    
    // Procesar cada palabra del texto potencialmente truncado
    const palabrasTruncadas = textoTruncado.split(' ');
    
    for (const palabra of palabrasTruncadas) {
        const lineaTentativa = lineaActual.length === 0 ? palabra : `${lineaActual} ${palabra}`;
        const medidaTexto = ctx.measureText(lineaTentativa).width;
        
        if (medidaTexto <= anchoMaximo) {
            lineaActual = lineaTentativa;
        } else {
            // Si una sola palabra es más larga que el ancho máximo, dividirla
            if (lineaActual.length === 0) {
                let palabraParcial = '';
                for (let i = 0; i < palabra.length; i++) {
                    const tentativo = palabraParcial + palabra[i];
                    if (ctx.measureText(tentativo).width <= anchoMaximo) {
                        palabraParcial = tentativo;
                    } else {
                        if (palabraParcial.length > 0) {
                            lineas.push(palabraParcial);
                        }
                        palabraParcial = palabra[i];
                    }
                }
                if (palabraParcial.length > 0) {
                    lineaActual = palabraParcial;
                }
            } else {
                lineas.push(lineaActual);
                lineaActual = palabra;
            }
            
            // Si ya tenemos demasiadas líneas, parar el procesamiento
            if (lineas.length >= 1) { // Solo permitir 2 líneas en total (1 + la actual)
                if (palabra !== palabrasTruncadas[palabrasTruncadas.length - 1]) {
                    lineaActual += '...';
                }
                break;
            }
        }
    }
    
    // Añadir la última línea si queda algo
    if (lineaActual.length > 0) {
        lineas.push(lineaActual);
    }
    
    return lineas;
}

// Función auxiliar para determinar cuántos caracteres caben en el espacio disponible
function determinarLongitudMaxima(ctx, texto, anchoMaximo, tamaño) {
    ctx.font = `${tamaño}px Oswald`;
    
    if (ctx.measureText(texto).width <= anchoMaximo) {
        return texto.length;
    }
    
    // Búsqueda binaria para determinar cuántos caracteres caben
    let min = 0;
    let max = texto.length;
    let mid;
    
    while (min < max - 1) {
        mid = Math.floor((min + max) / 2);
        const subTexto = texto.substring(0, mid);
        
        if (ctx.measureText(subTexto).width <= anchoMaximo) {
            min = mid;
        } else {
            max = mid;
        }
    }
    
    return min;
}

// Función para crear efectos especiales adicionales para morado-azul
function crearEfectosEspeciales(ctx, ancho, alto) {
    // Crear efecto de luz horizontal central
    const altoLuz = 15;
    const yPosicion = alto / 2;
    const gradienteLuz = ctx.createLinearGradient(0, yPosicion - altoLuz/2, ancho, yPosicion + altoLuz/2);
    gradienteLuz.addColorStop(0, "rgba(102, 0, 255, 0)"); // Morado
    gradienteLuz.addColorStop(0.5, "rgba(102, 102, 255, 0.1)"); // Mezcla
    gradienteLuz.addColorStop(1, "rgba(0, 204, 255, 0)"); // Azul
    
    ctx.fillStyle = gradienteLuz;
    ctx.fillRect(0, yPosicion - altoLuz/2, ancho, altoLuz);
    
    // Ondas de luz sutiles en tonos azul y morado
    const numOndas = 3;
    for (let i = 0; i < numOndas; i++) {
        const yOnda = alto * (i + 1) / (numOndas + 1);
        
        ctx.beginPath();
        ctx.moveTo(0, yOnda);
        
        // Crear una onda sinusoidal
        for (let x = 0; x < ancho; x += 5) {
            const amplitud = 2;
            const frecuencia = 0.02;
            const y = yOnda + Math.sin(x * frecuencia) * amplitud;
            ctx.lineTo(x, y);
        }
        
        // Alternar colores entre morado y azul
        ctx.strokeStyle = i % 2 === 0 ? 
            "rgba(102, 0, 255, 0.1)" : // Morado
            "rgba(0, 204, 255, 0.1)";  // Azul
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Función para crear efectos de brillo en los bordes específicos para morado-azul
function crearEfectosBorde(ctx, ancho, alto) {
    // Crear gradiente en los bordes para dar efecto iluminado
    const altoBorde = 8;
    const gradienteSuperior = ctx.createLinearGradient(0, 0, 0, altoBorde);
    gradienteSuperior.addColorStop(0, "rgba(102,0,255,0.8)"); // Morado
    gradienteSuperior.addColorStop(1, "rgba(102,0,255,0)");
    
    ctx.fillStyle = gradienteSuperior;
    ctx.fillRect(0, 0, ancho, altoBorde);
    
    const gradienteInferior = ctx.createLinearGradient(0, alto - altoBorde, 0, alto);
    gradienteInferior.addColorStop(0, "rgba(0,204,255,0)"); // Azul
    gradienteInferior.addColorStop(1, "rgba(0,204,255,0.8)");
    
    ctx.fillStyle = gradienteInferior;
    ctx.fillRect(0, alto - altoBorde, ancho, altoBorde);
    
    const anchoLateral = 8;
    const gradienteIzquierdo = ctx.createLinearGradient(0, 0, anchoLateral, 0);
    gradienteIzquierdo.addColorStop(0, "rgba(102,0,255,0.8)"); // Morado
    gradienteIzquierdo.addColorStop(1, "rgba(102,0,255,0)");
    
    ctx.fillStyle = gradienteIzquierdo;
    ctx.fillRect(0, 0, anchoLateral, alto);
    
    const gradienteDerecho = ctx.createLinearGradient(ancho - anchoLateral, 0, ancho, 0);
    gradienteDerecho.addColorStop(0, "rgba(0,204,255,0)"); // Azul
    gradienteDerecho.addColorStop(1, "rgba(0,204,255,0.8)");
    
    ctx.fillStyle = gradienteDerecho;
    ctx.fillRect(ancho - anchoLateral, 0, anchoLateral, alto);
    
    // Añadir un resplandor adicional en las esquinas
    const radioEsquina = 25;
    const esquinas = [
        { x: 0, y: 0, color: "rgba(102,0,255,0.9)" },      // Superior izquierda - Morado
        { x: ancho, y: 0, color: "rgba(102,204,255,0.9)" }, // Superior derecha - Azul claro
        { x: 0, y: alto, color: "rgba(102,0,255,0.9)" },    // Inferior izquierda - Morado
        { x: ancho, y: alto, color: "rgba(0,204,255,0.9)" } // Inferior derecha - Azul
    ];
    
    esquinas.forEach(esquina => {
        const gradienteEsquina = ctx.createRadialGradient(
            esquina.x, esquina.y, 0,
            esquina.x, esquina.y, radioEsquina
        );
        gradienteEsquina.addColorStop(0, esquina.color);
        gradienteEsquina.addColorStop(0.6, "rgba(102,102,255,0.3)"); // Mezcla morado-azul
        gradienteEsquina.addColorStop(1, "rgba(102,102,255,0)");
        
        ctx.fillStyle = gradienteEsquina;
        ctx.fillRect(
            Math.max(0, esquina.x - radioEsquina),
            Math.max(0, esquina.y - radioEsquina),
            radioEsquina * (esquina.x === 0 ? 1 : -1) + (esquina.x === 0 ? 0 : ancho),
            radioEsquina * (esquina.y === 0 ? 1 : -1) + (esquina.y === 0 ? 0 : alto)
        );
    });
}

router.get('/', async (req, res) => {
    try {
        // Extraer parámetros - solo los necesarios
        const { avatar, texto, username } = req.query;
        
        // Verificar parámetros mínimos
        if (!avatar) {
            return res.status(400).json({ 
                error: 'Falta el parámetro avatar en la URL',
                ejemplo: '/boostcard?avatar=https://tu-avatar.jpg&username=User123&texto=¡Muchas gracias por el boost!' 
            });
        }
        
        // Validar URL de avatar
        if (!isValidUrl(avatar)) {
            return res.status(400).json({ error: 'La URL del avatar no es válida' });
        }
        
        // Valores predeterminados
        const nombreUsuario = username || 'User.Bot';
        const mensajeTexto = texto || '¡Muchas gracias por apoyar nuestro server con tu boost!';
        
        // Dimensiones de la tarjeta
        const ANCHO = 550;
        const ALTO = 90;
        
        // Crear canvas
        const canvas = createCanvas(ANCHO, ALTO);
        const ctx = canvas.getContext('2d');
        
        // Dibujar fondo negro con bordes redondeados
        ctx.fillStyle = "#1e1e2e"; // Fondo discord oscuro
        
        // Dibujar rectángulo con esquinas redondeadas
        const radioEsquina = 18;
        ctx.beginPath();
        ctx.moveTo(radioEsquina, 0);
        ctx.lineTo(ANCHO - radioEsquina, 0);
        ctx.quadraticCurveTo(ANCHO, 0, ANCHO, radioEsquina);
        ctx.lineTo(ANCHO, ALTO - radioEsquina);
        ctx.quadraticCurveTo(ANCHO, ALTO, ANCHO - radioEsquina, ALTO);
        ctx.lineTo(radioEsquina, ALTO);
        ctx.quadraticCurveTo(0, ALTO, 0, ALTO - radioEsquina);
        ctx.lineTo(0, radioEsquina);
        ctx.quadraticCurveTo(0, 0, radioEsquina, 0);
        ctx.closePath();
        ctx.fill();
        
        // Aplicar fondo morado-azul
        const colores = crearFondoMoradoAzul(ctx, ANCHO, ALTO);
        
        // Añadir borde brillante
        ctx.strokeStyle = colores[0]; // Morado
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // Añadir efectos decorativos
        crearEfectosBorde(ctx, ANCHO, ALTO);
        crearEfectosEspeciales(ctx, ANCHO, ALTO);
        dibujarMiniBoosters(ctx, ANCHO, ALTO, colores);
        dibujarDestellos(ctx, ANCHO, ALTO);
        
        // Cargar imagen de avatar
        const imagenAvatar = await loadImage(avatar);
        
        // Tamaño y posición del avatar
        const radioAvatar = ALTO / 2 - 13;
        const xAvatar = 35;
        const yAvatar = ALTO / 2;
        
        // Dibujar resplandor alrededor del avatar
        dibujarResplandorAvatar(ctx, xAvatar, yAvatar, radioAvatar);
        
        // Crear recorte circular para el avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(xAvatar, yAvatar, radioAvatar, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Dibujar avatar dentro del círculo
        ctx.drawImage(imagenAvatar, xAvatar - radioAvatar, yAvatar - radioAvatar, radioAvatar * 2, radioAvatar * 2);
        ctx.restore();
        
        // Añadir borde al avatar
        ctx.beginPath();
        ctx.arc(xAvatar, yAvatar, radioAvatar, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Dibujar nombre de usuario con estilo morado
        // Los estilos están definidos manualmente aquí en lugar de usar la variable ESTILOS_TEXTO
        // Estilo morado para el usuario
        ctx.font = "bold 18px 'Oswald'";
        ctx.fillStyle = "#9966ff"; // Morado
        ctx.textAlign = "left";
        
        // Aplicar sombra
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillText(nombreUsuario, xAvatar + radioAvatar + 20, yAvatar - 10);
        
        // Resetear sombra
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Calcular el espacio disponible para el texto
        const inicioTextoX = xAvatar + radioAvatar + 20;
        const finTextoX = ANCHO - 75;
        const anchoDisponible = finTextoX - inicioTextoX;
        
        // Dividir el texto si es necesario y ajustar tamaño
        let tamañoFuente = 15;
        // Reducir el tamaño si el texto es muy largo
        if (mensajeTexto.length > 150) {
            tamañoFuente = 12;
        } else if (mensajeTexto.length > 100) {
            tamañoFuente = 13;
        } else if (mensajeTexto.length > 60) {
            tamañoFuente = 14;
        }
        
        const lineasTexto = dividirTexto(ctx, mensajeTexto, anchoDisponible, tamañoFuente);
        const lineasMostradas = lineasTexto;
        
        // Dibujar cada línea de texto con estilo azul
        // Estilo azul para el mensaje
        ctx.font = `italic ${tamañoFuente}px 'Oswald'`;
        ctx.fillStyle = "#66ccff"; // Azul claro
        
        // Aplicar sombra
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        lineasMostradas.forEach((linea, indice) => {
            const yTexto = yAvatar + 5 + (indice * (tamañoFuente + 2));
            ctx.fillText(linea, inicioTextoX, yTexto);
        });
        
        // Resetear sombra
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Dibujar diamante de Discord Boost con colores morado-rosa fijos
        dibujarDiamante(ctx, ANCHO - 40, ALTO / 2, 35, ["#ff73fa", "#bd5dff", "#a93efd"]);
        
        // Enviar imagen
        res.setHeader('Content-Type', 'image/png');
        res.end(canvas.toBuffer());
    } catch (error) {
        console.error('Error en la generación de la tarjeta:', error);
        res.status(500).json({ 
            error: 'Error al generar la imagen', 
            details: error.message
        });
    }
});

module.exports = router;
