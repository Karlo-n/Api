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

// Fondos predeterminados para usar aleatoriamente
const FONDOS_PREDETERMINADOS = [
    'https://i.imgur.com/jC4GRlV.jpg',  // Fondo oscuro con degradado azul
    'https://i.imgur.com/OqHVDhM.jpg',  // Fondo púrpura abstracto
    'https://i.imgur.com/nSqcXQl.jpg',  // Fondo con estrellas
    'https://i.imgur.com/x1KUd5G.jpg',  // Fondo de neón
    'https://i.imgur.com/Z3sR4O0.jpg'   // Fondo geométrico
];

// Función para dibujar avatar con efectos
function dibujarAvatar(ctx, imagen, x, y, tamaño) {
    // Guardar estado del contexto
    ctx.save();
    
    // Añadir sombra
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    
    // Crear máscara para bordes redondeados
    ctx.beginPath();
    ctx.arc(x + tamaño/2, y + tamaño/2, tamaño/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Dibujar imagen
    ctx.drawImage(imagen, x, y, tamaño, tamaño);
    
    // Dibujar borde
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Restaurar estado del contexto
    ctx.restore();
}

// Función para dibujar texto con ajuste automático de tamaño
function dibujarTextoAjustado(ctx, texto, x, y, anchoMaximo) {
    // Tamaño inicial de la fuente
    let tamañoFuente = 36;
    
    // Establecer límite de caracteres
    const LIMITE_CARACTERES = 100;
    if (texto.length > LIMITE_CARACTERES) {
        texto = texto.substring(0, LIMITE_CARACTERES) + '...';
    }
    
    // Ajustar tamaño de fuente según longitud del texto
    if (texto.length > 60) {
        tamañoFuente = 24;
    } else if (texto.length > 40) {
        tamañoFuente = 28;
    } else if (texto.length > 20) {
        tamañoFuente = 32;
    }
    
    // Dividir el texto en líneas para que quepa en el ancho
    ctx.font = `${tamañoFuente}px Oswald`;
    
    // Dividir texto en palabras
    const palabras = texto.split(' ');
    const lineas = [];
    let lineaActual = '';
    
    // Agrupar palabras en líneas que quepan en el ancho máximo
    for (const palabra of palabras) {
        const lineaTentativa = lineaActual.length === 0 ? palabra : `${lineaActual} ${palabra}`;
        const medidaTexto = ctx.measureText(lineaTentativa).width;
        
        if (medidaTexto <= anchoMaximo) {
            lineaActual = lineaTentativa;
        } else {
            lineas.push(lineaActual);
            lineaActual = palabra;
        }
    }
    
    // Añadir la última línea
    if (lineaActual.length > 0) {
        lineas.push(lineaActual);
    }
    
    // Limitar a 3 líneas máximo
    if (lineas.length > 3) {
        lineas.splice(3);
        lineas[2] += '...';
    }
    
    // Dibujar cada línea con efectos
    lineas.forEach((linea, index) => {
        // Añadir sombra al texto
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        
        // Dibujar un contorno
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(linea, x, y + (index * (tamañoFuente + 8)));
        
        // Dibujar el texto
        ctx.fillStyle = '#ffffff';
        ctx.fillText(linea, x, y + (index * (tamañoFuente + 8)));
    });
    
    // Devolver el alto total del texto
    return lineas.length * (tamañoFuente + 8);
}

// Función para dibujar fondo de texto para mejor legibilidad
function dibujarFondoTexto(ctx, x, y, ancho, alto) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    const radio = 15;
    
    // Dibujar rectángulo con esquinas redondeadas
    ctx.moveTo(x + radio, y);
    ctx.lineTo(x + ancho - radio, y);
    ctx.quadraticCurveTo(x + ancho, y, x + ancho, y + radio);
    ctx.lineTo(x + ancho, y + alto - radio);
    ctx.quadraticCurveTo(x + ancho, y + alto, x + ancho - radio, y + alto);
    ctx.lineTo(x + radio, y + alto);
    ctx.quadraticCurveTo(x, y + alto, x, y + alto - radio);
    ctx.lineTo(x, y + radio);
    ctx.quadraticCurveTo(x, y, x + radio, y);
    ctx.closePath();
    
    ctx.fill();
}

router.get('/', async (req, res) => {
    try {
        // Extraer parámetros
        const { avatar, texto } = req.query;
        
        // Verificar parámetros mínimos
        if (!avatar) {
            return res.status(400).json({ 
                error: 'Falta el parámetro avatar en la URL',
                ejemplo: '/boostcard?avatar=https://tu-avatar.jpg&texto=¡Gracias por el boost!' 
            });
        }
        
        // Validar URL de avatar
        if (!isValidUrl(avatar)) {
            return res.status(400).json({ error: 'La URL del avatar no es válida' });
        }
        
        // Texto predeterminado
        const mensajeTexto = texto || '¡Gracias por el boost!';
        
        // Dimensiones de la tarjeta
        const ANCHO = 800;
        const ALTO = 400;
        
        // Crear canvas
        const canvas = createCanvas(ANCHO, ALTO);
        const ctx = canvas.getContext('2d');
        
        // Seleccionar un fondo aleatorio
        const fondoAleatorio = FONDOS_PREDETERMINADOS[Math.floor(Math.random() * FONDOS_PREDETERMINADOS.length)];
        
        // Cargar imágenes
        const imagenFondo = await loadImage(fondoAleatorio);
        const imagenAvatar = await loadImage(avatar);
        
        // Dibujar fondo
        ctx.drawImage(imagenFondo, 0, 0, ANCHO, ALTO);
        
        // Añadir un overlay para mejorar contraste
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, 0, ANCHO, ALTO);
        
        // Dibujar avatar (centrado horizontalmente en la parte superior)
        const tamañoAvatar = 150;
        const posXAvatar = (ANCHO - tamañoAvatar) / 2;
        const posYAvatar = 60;
        dibujarAvatar(ctx, imagenAvatar, posXAvatar, posYAvatar, tamañoAvatar);
        
        // Dibujar texto de agradecimiento
        // Primero dibujamos el fondo del texto
        const margenTexto = 40;
        const posXTexto = margenTexto;
        const posYTexto = posYAvatar + tamañoAvatar + 50;
        const anchoTextoMax = ANCHO - (margenTexto * 2);
        
        // Medir texto para crear fondo
        ctx.font = '36px Oswald';
        const altoTextoEstimado = Math.min(dibujarTextoAjustado(ctx, '', posXTexto, posYTexto, anchoTextoMax) + 40, 150);
        
        // Dibujar fondo para el texto
        dibujarFondoTexto(ctx, posXTexto - 20, posYTexto - 35, anchoTextoMax + 40, altoTextoEstimado);
        
        // Dibujar texto real
        dibujarTextoAjustado(ctx, mensajeTexto, posXTexto, posYTexto, anchoTextoMax);
        
        // Firma discreta en la esquina
        ctx.font = '16px Oswald';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('Boost Card', ANCHO - 80, ALTO - 20);
        
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
