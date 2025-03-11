const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

const router = express.Router();

// Registrar fuente Oswald
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

// Función para dibujar el diamante de Discord Boost
function dibujarDiamante(ctx, x, y, tamaño) {
    // Dibujar forma principal del diamante
    ctx.beginPath();
    ctx.moveTo(x, y + tamaño * 0.5); // Punto superior
    ctx.lineTo(x - tamaño * 0.4, y); // Punto izquierdo
    ctx.lineTo(x, y - tamaño * 0.5); // Punto inferior
    ctx.lineTo(x + tamaño * 0.4, y); // Punto derecho
    ctx.closePath();
    
    // Añadir gradiente para dar profundidad
    const gradiente = ctx.createLinearGradient(x - tamaño * 0.4, y - tamaño * 0.5, x + tamaño * 0.4, y + tamaño * 0.5);
    gradiente.addColorStop(0, "#ff73fa");    // Rosa intenso
    gradiente.addColorStop(0.5, "#bd5dff");  // Morado más claro
    gradiente.addColorStop(1, "#a93efd");    // Morado más oscuro
    
    ctx.fillStyle = gradiente;
    ctx.fill();
    
    // Añadir brillo en el diamante
    ctx.beginPath();
    ctx.moveTo(x - tamaño * 0.1, y);
    ctx.lineTo(x, y - tamaño * 0.2);
    ctx.lineTo(x + tamaño * 0.1, y);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fill();
    
    // Añadir borde sutil
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Añadir "+" en la esquina superior derecha
    ctx.font = "bold " + (tamaño * 0.3) + "px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("+", x + tamaño * 0.35, y - tamaño * 0.4);
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

// Función para crear efectos especiales adicionales
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

// Función para dibujar estrellas y destellos
function dibujarDestellos(ctx, ancho, alto) {
    // Dibujar varias estrellas pequeñas
    const estrellas = [
        { x: ancho - 30, y: alto / 2 - 10, tamaño: 3 },
        { x: ancho - 40, y: alto / 2 + 15, tamaño: 2 },
        { x: ancho - 15, y: alto / 2 + 5, tamaño: 4 },
        { x: ancho - 50, y: alto / 2 - 15, tamaño: 2 },
        { x: ancho * 0.1, y: alto * 0.2, tamaño: 2 },
        { x: ancho * 0.2, y: alto * 0.8, tamaño: 3 },
        { x: ancho * 0.8, y: alto * 0.3, tamaño: 2 },
        { x: ancho * 0.7, y: alto * 0.7, tamaño: 3 },
        { x: ancho * 0.5, y: alto * 0.15, tamaño: 4 },
        { x: ancho * 0.6, y: alto * 0.85, tamaño: 2 },
        // Añadir más estrellas
        { x: ancho * 0.15, y: alto * 0.5, tamaño: 3 },
        { x: ancho * 0.85, y: alto * 0.5, tamaño: 2 },
        { x: ancho * 0.3, y: alto * 0.15, tamaño: 3 },
        { x: ancho * 0.4, y: alto * 0.85, tamaño: 2 },
        { x: ancho * 0.65, y: alto * 0.25, tamaño: 3 },
        { x: ancho * 0.75, y: alto * 0.75, tamaño: 2 },
    ];
    
    estrellas.forEach(estrella => {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const radio = i % 2 === 0 ? estrella.tamaño : estrella.tamaño / 2;
            const angulo = (Math.PI * 2 * i) / 10 - Math.PI / 2;
            const x = estrella.x + radio * Math.cos(angulo);
            const y = estrella.y + radio * Math.sin(angulo);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    });
    
    // Añadir destellos brillantes (círculos con resplandor)
    const destellos = [
        { x: ancho - 20, y: alto / 2 + 25, tamaño: 1.5 },
        { x: ancho - 60, y: alto / 2 - 5, tamaño: 1 },
        { x: ancho * 0.3, y: alto * 0.3, tamaño: 1 },
        { x: ancho * 0.75, y: alto * 0.5, tamaño: 1.5 },
        { x: ancho * 0.4, y: alto * 0.7, tamaño: 1 },
        // Añadir más destellos
        { x: ancho * 0.1, y: alto * 0.4, tamaño: 1.2 },
        { x: ancho * 0.2, y: alto * 0.6, tamaño: 0.8 },
        { x: ancho * 0.8, y: alto * 0.2, tamaño: 1.3 },
        { x: ancho * 0.9, y: alto * 0.8, tamaño: 1 },
        { x: ancho * 0.5, y: alto * 0.3, tamaño: 1.2 },
        { x: ancho * 0.6, y: alto * 0.7, tamaño: 0.9 },
    ];
    
    destellos.forEach(destello => {
        // Resplandor
        const gradiente = ctx.createRadialGradient(
            destello.x, destello.y, 0,
            destello.x, destello.y, destello.tamaño * 6
        );
        gradiente.addColorStop(0, "rgba(255,255,255,0.8)");
        gradiente.addColorStop(0.5, "rgba(255,255,255,0.2)");
        gradiente.addColorStop(1, "rgba(255,255,255,0)");
        
        ctx.beginPath();
        ctx.arc(destello.x, destello.y, destello.tamaño * 6, 0, Math.PI * 2);
        ctx.fillStyle = gradiente;
        ctx.fill();
        
        // Centro brillante
        ctx.beginPath();
        ctx.arc(destello.x, destello.y, destello.tamaño, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    });
}

// Función para dibujar pequeños boosts en el fondo
function dibujarMiniBoosters(ctx, ancho, alto, colores = ["#6600ff", "#00ccff"]) {
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

// Función para dibujar resplandor alrededor del avatar
function dibujarResplandorAvatar(ctx, x, y, radio) {
    // Dos resplandores combinados, uno morado y otro azul
    
    // Primer resplandor (morado)
    const gradiente1 = ctx.createRadialGradient(
        x, y, radio * 0.9,
        x, y, radio * 1.3
    );
    gradiente1.addColorStop(0, "rgba(153, 102, 255, 0.5)"); // Morado
    gradiente1.addColorStop(1, "rgba(153, 102, 255, 0)");
    
    ctx.beginPath();
    ctx.arc(x, y, radio * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = gradiente1;
    ctx.fill();
    
    // Segundo resplandor (azul)
    const gradiente2 = ctx.createRadialGradient(
        x, y, radio * 0.9,
        x, y, radio * 1.2
    );
    gradiente2.addColorStop(0, "rgba(102, 204, 255, 0.3)"); // Azul
    gradiente2.addColorStop(1, "rgba(102, 204, 255, 0)");
    
    ctx.beginPath();
    ctx.arc(x, y, radio * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = gradiente2;
    ctx.fill();
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
        
        // Aplicar borde morado
        ctx.strokeStyle = "#bd5dff"; 
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // Añadir efectos decorativos
        crearEfectosBorde(ctx, ANCHO, ALTO);
        crearEfectosEspeciales(ctx, ANCHO, ALTO);
        dibujarMiniBoosters(ctx, ANCHO, ALTO, ["#6600ff", "#00ccff"]);
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
        
        // Dibujar cada línea de texto con estilo azul
        ctx.font = `italic ${tamañoFuente}px 'Oswald'`;
        ctx.fillStyle = "#66ccff"; // Azul claro
        
        // Aplicar sombra
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        lineasTexto.forEach((linea, indice) => {
            const yTexto = yAvatar + 5 + (indice * (tamañoFuente + 2));
            ctx.fillText(linea, inicioTextoX, yTexto);
        });
        
        // Resetear sombra
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Dibujar diamante de Discord Boost
        dibujarDiamante(ctx, ANCHO - 40, ALTO / 2, 35);
        
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
