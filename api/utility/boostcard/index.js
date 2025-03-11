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

// Función para dibujar el diamante de Discord Boost
function dibujarDiamante(ctx, x, y, tamaño) {
    // Color base del diamante (morado/rosa de Discord)
    const colorDiamante = "#ff73fa";
    
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

// Función para dibujar estrellas y destellos
function dibujarDestellos(ctx, ancho, alto) {
    // Dibujar varias estrellas pequeñas
    const estrellas = [
        { x: ancho - 30, y: alto / 2 - 10, tamaño: 3 },
        { x: ancho - 40, y: alto / 2 + 15, tamaño: 2 },
        { x: ancho - 15, y: alto / 2 + 5, tamaño: 4 },
        { x: ancho - 50, y: alto / 2 - 15, tamaño: 2 },
        // Añadir más estrellas por toda la tarjeta
        { x: ancho * 0.1, y: alto * 0.2, tamaño: 2 },
        { x: ancho * 0.2, y: alto * 0.8, tamaño: 3 },
        { x: ancho * 0.8, y: alto * 0.3, tamaño: 2 },
        { x: ancho * 0.7, y: alto * 0.7, tamaño: 3 },
        { x: ancho * 0.5, y: alto * 0.15, tamaño: 4 },
        { x: ancho * 0.6, y: alto * 0.85, tamaño: 2 },
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

// Función para crear efectos de brillo en los bordes
function crearEfectosBorde(ctx, ancho, alto) {
    // Crear gradiente en los bordes para dar efecto iluminado
    const altoBorde = 5;
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
    
    const anchoLateral = 5;
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
}

router.get('/', async (req, res) => {
    try {
        // Extraer parámetros
        const { avatar, texto, username } = req.query;
        
        // Verificar parámetros mínimos
        if (!avatar) {
            return res.status(400).json({ 
                error: 'Falta el parámetro avatar en la URL',
                ejemplo: '/boostcard?avatar=https://tu-avatar.jpg&username=User123&texto=Just Boosted' 
            });
        }
        
        // Validar URL de avatar
        if (!isValidUrl(avatar)) {
            return res.status(400).json({ error: 'La URL del avatar no es válida' });
        }
        
        // Valores predeterminados
        const nombreUsuario = username || 'User.Bot';
        const mensajeTexto = texto || 'Just Boosted';
        
        // Dimensiones de la tarjeta (horizontal al estilo de notificación Discord)
        const ANCHO = 400;
        const ALTO = 70;
        
        // Crear canvas
        const canvas = createCanvas(ANCHO, ALTO);
        const ctx = canvas.getContext('2d');
        
        // Dibujar fondo negro con bordes redondeados
        ctx.fillStyle = "#1e1e2e"; // Fondo discord oscuro
        
        // Dibujar rectángulo con esquinas redondeadas
        const radioEsquina = 15;
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
        
        // Añadir borde morado brillante
        ctx.strokeStyle = "#bd5dff";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Cargar imagen de avatar
        const imagenAvatar = await loadImage(avatar);
        
        // Dibujar avatar en círculo
        const radioAvatar = ALTO / 2 - 10;
        const xAvatar = 30;
        const yAvatar = ALTO / 2;
        
        // Crear recorte circular para el avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(xAvatar, yAvatar, radioAvatar, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Dibujar avatar dentro del círculo
        ctx.drawImage(imagenAvatar, xAvatar - radioAvatar, yAvatar - radioAvatar, radioAvatar * 2, radioAvatar * 2);
        ctx.restore();
        
        // Añadir efectos decorativos
        crearEfectosBorde(ctx, ANCHO, ALTO);
        dibujarDestellos(ctx, ANCHO, ALTO);
        
        // Dibujar nombre de usuario
        ctx.font = "bold 16px Oswald";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.fillText(nombreUsuario, xAvatar + radioAvatar + 15, yAvatar - 5);
        
        // Dibujar texto "Just Boosted"
        ctx.font = "14px Oswald";
        ctx.fillStyle = "#cccccc";
        ctx.fillText(mensajeTexto, xAvatar + radioAvatar + 15, yAvatar + 15);
        
        // Dibujar diamante de Discord Boost
        dibujarDiamante(ctx, ANCHO - 35, ALTO / 2, 30);
        
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
