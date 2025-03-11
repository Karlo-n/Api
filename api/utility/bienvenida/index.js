const express = require("express");
const { createCanvas, loadImage, registerFont } = require("canvas");
const axios = require("axios");
const path = require("path");
const router = express.Router();

// Register fonts
const oswaldFontPath = path.join(process.cwd(), "Oswald-VariableFont_wght.ttf");
const nexaFontPath = path.join(process.cwd(), "Nexa-Heavy.ttf");
registerFont(nexaFontPath, { family: "Nexa" });
registerFont(oswaldFontPath, { family: "Oswald" });

// Función para validar URL
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

// Función para dividir el texto en múltiples líneas
function dividirTexto(ctx, texto, anchoMaximo, tamaño, fuente = "Oswald") {
    // Establecer la fuente para medir el texto
    ctx.font = `${tamaño}px ${fuente}`;
    
    // Si el texto es muy corto, devolverlo sin cambios
    if (ctx.measureText(texto).width <= anchoMaximo) {
        return [texto];
    }
    
    // Dividir el texto en palabras
    const palabras = texto.split(' ');
    const lineas = [];
    let lineaActual = '';
    
    for (const palabra of palabras) {
        const lineaTentativa = lineaActual.length === 0 ? palabra : `${lineaActual} ${palabra}`;
        const medidaTexto = ctx.measureText(lineaTentativa).width;
        
        if (medidaTexto <= anchoMaximo) {
            lineaActual = lineaTentativa;
        } else {
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
            if (lineas.length >= 2) { // Permitir 3 líneas en total (2 + la actual)
                if (palabra !== palabras[palabras.length - 1]) {
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
        { x: ancho * 0.6, y: alto * 0.85, tamaño: 2 }
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
        { x: ancho * 0.4, y: alto * 0.7, tamaño: 1 }
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

// Ruta para generar la tarjeta de bienvenida estilizada
router.get("/", async (req, res) => {
    try {
        const { 
            avatar, 
            texto1, 
            texto2, 
            texto3, 
            background
        } = req.query;

        // Validar parámetros obligatorios - todos son requeridos
        if (!avatar || !background || !texto1 || !texto2 || !texto3) {
            return res.status(400).json({ 
                error: "Faltan parámetros obligatorios. Todos los parámetros son obligatorios: avatar, background, texto1, texto2, texto3", 
                ejemplo: "/bienvenida-styled?avatar=https://tu-avatar.jpg&background=https://imagen-fondo.jpg&texto1=¡Bienvenido!&texto2=Usuario&texto3=Al servidor"
            });
        }

        // Validar URL de avatar
        if (!isValidUrl(avatar)) {
            return res.status(400).json({ error: "La URL del avatar no es válida" });
        }

        // Cargar imágenes de forma segura
        const loadImageSafe = async (url) => {
            try {
                const response = await axios.get(url, { responseType: "arraybuffer" });
                return await loadImage(Buffer.from(response.data));
            } catch (error) {
                console.error(`Error al cargar la imagen: ${url}`, error);
                return null;
            }
        };

        // Dimensiones de la tarjeta
        const ANCHO = 800;
        const ALTO = 400;

        // Crear canvas
        const canvas = createCanvas(ANCHO, ALTO);
        const ctx = canvas.getContext("2d");

        // ========== ESTILO FANCY (Estilo BoostCard) ==========
            
        // Fondo con gradiente azul-morado
        const gradienteFondo = ctx.createLinearGradient(0, 0, ANCHO, ALTO);
        gradienteFondo.addColorStop(0, "#1e1e2e");
        gradienteFondo.addColorStop(1, "#2d2b42");
            
            // Dibujar rectángulo con esquinas redondeadas
            const radioEsquina = 25;
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
            
            ctx.fillStyle = gradienteFondo;
            ctx.fill();
            
            // Aplicar borde estilizado
            ctx.strokeStyle = "#bd5dff"; 
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Añadir efectos decorativos
            crearEfectosBorde(ctx, ANCHO, ALTO);
            crearEfectosEspeciales(ctx, ANCHO, ALTO);
            dibujarDestellos(ctx, ANCHO, ALTO);
            
            // Si hay un fondo personalizado, lo dibujamos con opacidad
            if (background && isValidUrl(background)) {
                const backgroundImage = await loadImageSafe(background);
                if (backgroundImage) {
                    // Preservar el recorte de bordes redondeados
                    ctx.save();
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
                    ctx.clip();
                    
                    // Dibujar imagen con opacidad
                    ctx.globalAlpha = 0.2;
                    ctx.drawImage(backgroundImage, 0, 0, ANCHO, ALTO);
                    ctx.globalAlpha = 1.0;
                    ctx.restore();
                    
                    // Restaurar los efectos
                    crearEfectosBorde(ctx, ANCHO, ALTO);
                }
            }
            
            // Cargar imagen de avatar
            const avatarImage = await loadImageSafe(avatar);
            if (!avatarImage) {
                return res.status(500).json({ error: "Error al cargar la imagen de avatar." });
            }
            
            // Tamaño y posición del avatar
            const radioAvatar = 80;
            const xAvatar = ANCHO / 2;
            const yAvatar = ALTO / 3;
            
            // Dibujar resplandor alrededor del avatar
            dibujarResplandorAvatar(ctx, xAvatar, yAvatar, radioAvatar);
            
            // Dibujar el avatar con recorte circular
            ctx.save();
            ctx.beginPath();
            ctx.arc(xAvatar, yAvatar, radioAvatar, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatarImage, xAvatar - radioAvatar, yAvatar - radioAvatar, radioAvatar * 2, radioAvatar * 2);
            ctx.restore();
            
            // Añadir borde al avatar
            ctx.beginPath();
            ctx.arc(xAvatar, yAvatar, radioAvatar, 0, Math.PI * 2);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Definir el color del texto (siempre usando colores atractivos)
            const textColor = "#ffffff";
            
            // Dibujar texto1 con estilo grande y sombra (Bienvenido)
            ctx.font = "bold 45px 'Oswald'";
            ctx.fillStyle = "#9966ff"; // Morado
            ctx.textAlign = "center";
            
            // Añadir sombra
            ctx.shadowColor = "rgba(0,0,0,0.7)";
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            // Dividir texto1 si es necesario
            const lineasTexto1 = dividirTexto(ctx, texto1, ANCHO - 100, 45, "Oswald");
            lineasTexto1.forEach((linea, indice) => {
                ctx.fillText(linea, ANCHO / 2, yAvatar + radioAvatar + 80 + (indice * 50));
            });
            
            // Dibujar texto2 con estilo diferente (Nombre del usuario)
            if (texto2) {
                ctx.font = "bold 35px 'Nexa'";
                ctx.fillStyle = "#66ccff"; // Azul brillante
                ctx.fillText(texto2, ANCHO / 2, yAvatar + radioAvatar + 140);
            }
            
            // Dibujar texto3 con otro estilo (Mensaje adicional)
            if (texto3) {
                ctx.font = "italic 30px 'Oswald'";
                ctx.fillStyle = textColor;
                ctx.fillText(texto3, ANCHO / 2, yAvatar + radioAvatar + 190);
            }
            
            // Resetear sombra
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            


        // Enviar la imagen generada
        res.setHeader("Content-Type", "image/png");
        canvas.createPNGStream().pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al generar la imagen de bienvenida estilizada." });
    }
});

module.exports = router;
