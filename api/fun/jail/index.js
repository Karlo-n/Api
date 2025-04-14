const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Configuración
const TEMP_DIR = path.join(__dirname, "temp");
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * API JAIL PREMIUM - Genera imágenes avanzadas de avatares tras las rejas
 * 
 * Parámetros:
 * @param {string} avatar1 - URL del avatar principal (obligatorio)
 * @param {string} nombre - Nombre del prisionero
 * @param {string} razon - Razón del arresto
 * @param {string} precio - Precio de la fianza
 * @param {string} fecha - Fecha del arresto
 * @param {string} id - ID del prisionero
 * @param {string} estilo - Estilo visual: "clasico", "oscuro", "vintage" (por defecto: "clasico")
 * @param {string} efecto - Efecto para el avatar: "sepia", "grises", "ninguno" (por defecto: "sepia")
 * @param {string} intensidad - Intensidad del efecto: "baja", "media", "alta" (por defecto: "media")
 * @param {string} formato - Formato de salida: "png", "json" (por defecto: "png")
 */
router.get("/", async (req, res) => {
    try {
        // Extraer y validar parámetros
        const { 
            avatar1, 
            nombre, 
            razon, 
            precio, 
            fecha, 
            id,
            estilo = "clasico",
            efecto = "sepia",
            intensidad = "media",
            formato = "png"
        } = req.query;

        // Validar parámetro obligatorio
        if (!avatar1) {
            return res.status(400).json({ 
                error: "Se requiere una URL de avatar", 
                ejemplo: "/api/fun/jail?avatar1=https://ejemplo.com/avatar.jpg&nombre=Usuario&estilo=oscuro" 
            });
        }
        
        // Verificar formato solicitado
        if (formato === "json") {
            return res.json({
                success: true,
                mensaje: "Datos de prisión generados",
                datos: {
                    avatar: avatar1,
                    nombre: nombre || "Prisionero",
                    razon: razon || "Delito sin especificar",
                    precio: precio || "$1000",
                    fecha: fecha || obtenerFechaActual(),
                    id: id || generarIdPrisionero(),
                    estilo: estilo,
                    efecto: efecto,
                    intensidad: intensidad
                },
                recursos: {
                    imagen_url: `${req.protocol}://${req.get('host')}/api/fun/jail?${new URLSearchParams({
                        avatar1, nombre, razon, precio, fecha, id, estilo, efecto, intensidad, formato: "png"
                    }).toString()}`
                }
            });
        }

        // Cargar avatar
        let avatarImg;
        try {
            const avatarResponse = await axios.get(avatar1, { 
                responseType: "arraybuffer",
                timeout: 8000
            });
            
            avatarImg = await loadImage(Buffer.from(avatarResponse.data));
        } catch (loadError) {
            return res.status(400).json({ 
                error: "No se pudo cargar la imagen del avatar", 
                detalle: loadError.message 
            });
        }
        
        // Generar la imagen según el estilo elegido
        const nombrePrisionero = nombre || "Prisionero";
        const razonArresto = razon || "Delito sin especificar";
        const fianza = precio || "$1000";
        const fechaArresto = fecha || obtenerFechaActual();
        const idPrisionero = id || generarIdPrisionero();
        
        // Obtener la configuración de estilo
        const configuracion = obtenerConfiguracionEstilo(estilo, efecto, intensidad);
        
        // Generar la imagen
        const canvas = await generarImagenJailPremium(
            avatarImg,
            nombrePrisionero,
            razonArresto,
            fianza,
            fechaArresto,
            idPrisionero,
            configuracion
        );
        
        // Devolver la imagen
        res.setHeader('Content-Type', 'image/png');
        canvas.createPNGStream().pipe(res);
        
    } catch (error) {
        console.error("Error en API JAIL:", error);
        res.status(500).json({ 
            error: "Error al generar la imagen", 
            detalle: error.message 
        });
    }
});

/**
 * Genera un ID de prisionero aleatorio
 */
function generarIdPrisionero() {
    const part1 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const part2 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${part1}-${part2}`;
}

/**
 * Obtiene la fecha actual en formato DD/MM/YYYY
 */
function obtenerFechaActual() {
    const fecha = new Date();
    return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
}

/**
 * Obtiene la configuración según el estilo seleccionado
 */
function obtenerConfiguracionEstilo(estilo, efecto, intensidad) {
    // Configuraciones base para cada estilo
    const estilos = {
        // Estilo clásico
        clasico: {
            colorFondo: '#2c2c2c',
            colorPared: '#333333',
            colorTexto: '#FFFFFF',
            colorDestacado: '#FFCC00',
            fuenteTitulo: 'bold 28px Arial',
            fuenteTexto: '22px Arial',
            tieneRegla: true,
            tieneID: true,
            tienePared: true
        },
        
        // Estilo oscuro/nocturno
        oscuro: {
            colorFondo: '#121212',
            colorPared: '#1a1a1a',
            colorTexto: '#E0E0E0',
            colorDestacado: '#BB86FC',
            fuenteTitulo: 'bold 28px Arial',
            fuenteTexto: '22px Arial',
            tieneRegla: true,
            tieneID: true,
            tienePared: true,
            iluminacionNocturna: true
        },
        
        // Estilo vintage/antiguo
        vintage: {
            colorFondo: '#342E1E',
            colorPared: '#403A2E',
            colorTexto: '#EFEFEF',
            colorDestacado: '#BFA77B',
            fuenteTitulo: 'bold 28px "Times New Roman"',
            fuenteTexto: '22px "Times New Roman"',
            tieneRegla: true,
            tieneID: true,
            tienePared: true,
            efectoVintage: true,
            texturaPapel: true
        },
        
        // Estilo moderno simplificado
        moderno: {
            colorFondo: '#222222',
            colorPared: '#2a2a2a',
            colorTexto: '#FFFFFF',
            colorDestacado: '#4ECCA3',
            fuenteTitulo: 'bold 28px Arial',
            fuenteTexto: '22px Arial',
            tieneRegla: false,
            tieneID: true,
            tienePared: false,
            tieneGradiente: true
        },
        
        // Estilo institucional/policial
        policial: {
            colorFondo: '#1E293B',
            colorPared: '#334155',
            colorTexto: '#F1F5F9',
            colorDestacado: '#EF4444',
            fuenteTitulo: 'bold 28px "Courier New"',
            fuenteTexto: '22px "Courier New"',
            tieneRegla: true,
            tieneID: true,
            tienePared: true,
            tieneSellos: true
        }
    };
    
    // Si el estilo no existe, usar el clásico
    const configuracion = estilos[estilo] || estilos.clasico;
    
    // Configurar efecto
    configuracion.efecto = efecto || "sepia";
    
    // Configurar intensidad del efecto
    const intensidades = {
        baja: 0.3,
        media: 0.6,
        alta: 1.0
    };
    configuracion.intensidadEfecto = intensidades[intensidad] || intensidades.media;
    
    return configuracion;
}

/**
 * Genera la imagen mejorada con los efectos visuales según la configuración
 */
async function generarImagenJailPremium(avatarImg, nombre, razon, precio, fecha, id, config) {
    // Dimensiones
    const width = 600;
    const height = 600;
    
    // Crear canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Dibujar fondo según configuración
    ctx.fillStyle = config.colorFondo;
    ctx.fillRect(0, 0, width, height);
    
    // Aplicar efectos de fondo según estilo
    if (config.tieneGradiente) {
        // Gradiente para fondo moderno
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, config.colorFondo);
        gradient.addColorStop(1, adjustColor(config.colorFondo, 30));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    
    if (config.iluminacionNocturna) {
        // Efecto de luz tenue para estilo oscuro
        const radialGradient = ctx.createRadialGradient(
            width/2, height/2, 50,
            width/2, height/2, width
        );
        radialGradient.addColorStop(0, 'rgba(30, 30, 30, 0)');
        radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        ctx.fillStyle = radialGradient;
        ctx.fillRect(0, 0, width, height);
    }
    
    if (config.texturaPapel) {
        // Efecto de textura de papel viejo para estilo vintage
        dibujarTexturaVintage(ctx, width, height, 0.2);
    }
    
    // Dibujar pared de celda si corresponde
    if (config.tienePared) {
        dibujarTexturaParedes(ctx, width, height, config.colorPared);
    }
    
    // Dibujar ID y fecha
    if (config.tieneID) {
        dibujarEncabezado(ctx, width, id, fecha, config);
    }
    
    // Dibujar avatar
    const avatarSize = 300;
    const avatarX = (width - avatarSize) / 2;
    const avatarY = (height - avatarSize) / 2 - 10;
    
    // Crear máscara circular para el avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 10, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Dibujar avatar dentro del círculo
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    
    // Aplicar efecto al avatar según configuración
    aplicarEfectoAvatar(ctx, avatarX, avatarY, avatarSize, avatarSize, config.efecto, config.intensidadEfecto);
    ctx.restore();
    
    // Dibujar borde del avatar
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 10, avatarSize / 2 + 4, 0, Math.PI * 2);
    ctx.stroke();
    
    // Dibujar regla de medición si corresponde
    if (config.tieneRegla) {
        dibujarReglaMedicion(ctx, width, height, config);
    }
    
    // Cargar y dibujar barras de la celda
    try {
        const barsSvgPath = path.join(__dirname, "jail_bars.svg");
        const rejasImg = await loadImage(barsSvgPath);
        ctx.drawImage(rejasImg, 0, 0, width, height);
    } catch (svgError) {
        console.error("Error cargando SVG de rejas:", svgError);
        // En caso de error, dibujar barras simples
        dibujarBarrasSimples(ctx, width, height);
    }
    
    // Sellos policiales para estilo institucional
    if (config.tieneSellos) {
        dibujarSellosInstitucionales(ctx, width, height);
    }
    
    // Dibujar área de texto
    const textBgHeight = 140;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, height - textBgHeight, width, textBgHeight);
    
    // Línea divisoria
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - textBgHeight);
    ctx.lineTo(width, height - textBgHeight);
    ctx.stroke();
    
    // Dibujar textos
    dibujarTextos(ctx, width, height, nombre, razon, precio, textBgHeight, config);
    
    // Añadir efectos finales específicos por estilo
    if (config.efectoVintage) {
        aplicarEfectoVintage(ctx, width, height);
    }
    
    // Marca de agua sutil
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'right';
    ctx.fillText('JailAPI Premium', width - 10, height - 10);
    
    return canvas;
}

/**
 * Dibuja un encabezado con ID y fecha
 */
function dibujarEncabezado(ctx, width, id, fecha, config) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, 50);
    
    // Añadir textura/patrón si es estilo vintage
    if (config.efectoVintage) {
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 100; i++) {
            ctx.fillStyle = '#000000';
            const x = Math.random() * width;
            const y = Math.random() * 50;
            const size = Math.random() * 2 + 0.5;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1.0;
    }
    
    ctx.font = '18px Arial';
    ctx.fillStyle = config.colorTexto;
    ctx.textAlign = 'left';
    ctx.fillText(`ID: ${id}`, 20, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`FECHA: ${fecha}`, width - 20, 30);
    
    // Línea decorativa bajo el encabezado
    ctx.strokeStyle = config.colorDestacado;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(width, 50);
    ctx.stroke();
}

/**
 * Aplica efectos al avatar
 */
function aplicarEfectoAvatar(ctx, x, y, width, height, efecto, intensidad) {
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    
    // Factor de intensidad (0-1)
    const factor = intensidad;
    
    for (let i = 0; i < data.length; i += 4) {
        switch (efecto) {
            case "sepia":
                // Convertir a escala de grises
                const avg = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
                
                // Aplicar tono sepia con factor de intensidad
                const r = avg * (1 + 0.2 * factor);
                const g = avg * (1 + 0.0 * factor);
                const b = avg * (1 - 0.2 * factor);
                
                // Mezclar con el color original basado en intensidad
                data[i] = Math.min(255, r * factor + data[i] * (1 - factor));
                data[i + 1] = Math.min(255, g * factor + data[i + 1] * (1 - factor));
                data[i + 2] = Math.min(255, b * factor + data[i + 2] * (1 - factor));
                break;
                
            case "grises":
                // Convertir a escala de grises con factor de intensidad
                const gray = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
                data[i] = gray * factor + data[i] * (1 - factor);
                data[i + 1] = gray * factor + data[i + 1] * (1 - factor);
                data[i + 2] = gray * factor + data[i + 2] * (1 - factor);
                break;
                
            case "ninguno":
                // Sin efecto
                break;
        }
    }
    
    // Añadir ruido y efectos de foto antigua si es un estilo que lo requiere
    if (efecto === "sepia") {
        // Añadir ruido de foto antigua
        agregarRuidoFotoAntigua(data, intensidad);
    }
    
    ctx.putImageData(imageData, x, y);
}

/**
 * Añade ruido a los datos de la imagen para efecto de foto antigua
 */
function agregarRuidoFotoAntigua(data, intensidad) {
    for (let i = 0; i < data.length; i += 4) {
        // Solo aplicar a píxeles no transparentes
        if (data[i + 3] > 0) {
            // Añadir efecto de película antigua - rayas y puntos aleatorios
            if (Math.random() < 0.03 * intensidad) {
                const noise = Math.random() * 50 * intensidad - 25 * intensidad;
                data[i] = Math.max(0, Math.min(255, data[i] + noise));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
            }
            
            // Ocasionalmente añadir rasguños
            if (Math.random() < 0.001 * intensidad) {
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
                data[i + 3] = 180;
            }
        }
    }
}

/**
 * Dibuja textura de paredes de celda
 */
function dibujarTexturaParedes(ctx, width, height, colorBase) {
    // Color base de la pared
    ctx.fillStyle = colorBase;
    ctx.fillRect(0, 0, width, height);
    
    // Patrón de ladrillos
    const colorLadrillo = adjustColor(colorBase, -10);
    ctx.fillStyle = colorLadrillo;
    
    const ladrilloAncho = 60;
    const ladrilloAlto = 30;
    
    for (let y = 0; y < height; y += ladrilloAlto) {
        const offsetX = (Math.floor(y / ladrilloAlto) % 2) * (ladrilloAncho / 2);
        
        for (let x = -ladrilloAncho/2; x < width; x += ladrilloAncho) {
            // Variar ligeramente el color para dar textura
            const brillo = Math.random() * 0.1 - 0.05;
            const colorVariado = adjustColor(colorLadrillo, brillo * 255);
            ctx.fillStyle = colorVariado;
            
            // Dibujar ladrillo con borde redondeado
            ctx.beginPath();
            roundRect(ctx, x + offsetX, y, ladrilloAncho - 2, ladrilloAlto - 2, 2);
            ctx.fill();
            
            // Agregar línea de mortero
            ctx.strokeStyle = adjustColor(colorBase, -20);
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
    
    // Agregar sombras en las esquinas
    const gradient = ctx.createRadialGradient(
        width/2, height/2, height/3,
        width/2, height/2, height
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

/**
 * Dibuja una textura de papel vintage
 */
function dibujarTexturaVintage(ctx, width, height, intensidad) {
    // Crear textura de papel antiguo
    ctx.fillStyle = '#F5F5DC'; // Beige claro
    ctx.globalAlpha = intensidad;
    ctx.fillRect(0, 0, width, height);
    
    // Agregar manchas y arrugas
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 20 + 5;
        const color = `rgba(139, 69, 19, ${Math.random() * 0.1})`;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }
    
    // Añadir patrón de ruido
    for (let i = 0; i < width * height / 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 0.5;
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.05})`;
        ctx.fillRect(x, y, size, size);
    }
    
    ctx.globalAlpha = 1.0;
}

/**
 * Aplica un efecto de película antigua a toda la imagen
 */
function aplicarEfectoVintage(ctx, width, height) {
    // Aplicar un tono sepia a toda la imagen
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // Solo procesar píxeles no transparentes
            // Convertir a escala de grises
            const avg = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
            
            // Aplicar tono sepia
            data[i] = Math.min(255, avg * 1.2);
            data[i + 1] = Math.min(255, avg * 1.0);
            data[i + 2] = Math.min(255, avg * 0.8);
        }
    }
    
    // Añadir viñeta
    const viñeta = ctx.createRadialGradient(
        width/2, height/2, height/3,
        width/2, height/2, height
    );
    viñeta.addColorStop(0, 'rgba(0,0,0,0)');
    viñeta.addColorStop(1, 'rgba(0,0,0,0.7)');
    
    ctx.putImageData(imageData, 0, 0);
    ctx.fillStyle = viñeta;
    ctx.fillRect(0, 0, width, height);
    
    // Añadir rasguños y manchas
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const w = Math.random() * 2 + 1;
        const h = Math.random() * 100 + 50;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
        ctx.fillRect(x, y, w, h);
    }
}

/**
 * Dibuja una regla de medición estilo mugshot
 */
function dibujarReglaMedicion(ctx, width, height, config) {
    // Posición de la regla
    const reglaPosX = width - 60;
    const reglaPosY = height/2 - 120;
    const reglaAltura = 240;
    
    // Fondo de la regla
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(reglaPosX, reglaPosY, 24, reglaAltura);
    
    // Marcas de la regla
    ctx.fillStyle = '#000000';
    for (let y = 0; y <= reglaAltura; y += 10) {
        const markerWidth = (y % 50 === 0) ? 15 : (y % 20 === 0) ? 10 : 5;
        ctx.fillRect(reglaPosX, reglaPosY + y, markerWidth, 2);
        
        if (y % 50 === 0) {
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText((y/10).toString(), reglaPosX - 5, reglaPosY + y + 5);
        }
    }
}

/**
 * Dibuja barras simples (fallback si falla el SVG)
 */
function dibujarBarrasSimples(ctx, width, height) {
    // Barras verticales
    for (let i = 0; i < 9; i++) {
        const x = 60 + i * 60;
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, 0, 16, height);
    }
    
    // Barras horizontales
    const barrasY = [100, 300, 500];
    for (const y of barrasY) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, y, width, 14);
    }
}

/**
 * Dibuja sellos institucionales (estilo policial)
 */
function dibujarSellosInstitucionales(ctx, width, height) {
    // Sello circular tipo policial
    ctx.save();
    ctx.globalAlpha = 0.2;
    
    // Primer sello
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.2, 60, 0, Math.PI * 2);
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#FF0000';
    ctx.textAlign = 'center';
    ctx.fillText('DEPARTAMENTO', width * 0.8, height * 0.18);
    ctx.fillText('DE POLICÍA', width * 0.8, height * 0.22);
    
    // Segundo sello
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.75, 50, 0, Math.PI * 2);
    ctx.strokeStyle = '#0000FF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#0000FF';
    ctx.textAlign = 'center';
    ctx.fillText('CONFIDENCIAL', width * 0.25, height * 0.75);
    
    ctx.restore();
}

/**
 * Dibuja los textos en la parte inferior
 */
function dibujarTextos(ctx, width, height, nombre, razon, precio, textBgHeight, config) {
    // Nombre del prisionero
    ctx.font = config.fuenteTitulo;
    ctx.fillStyle = config.colorTexto;
    ctx.textAlign = 'center';
    ctx.fillText(nombre, width / 2, height - textBgHeight + 30);
    
    // Razón del arresto
    ctx.font = config.fuenteTexto;
    const palabras = razon.split(' ');
    let linea = '';
    let yPos = height - textBgHeight + 65;
    
    for (let i = 0; i < palabras.length; i++) {
        const testLinea = linea + palabras[i] + ' ';
        const metrica = ctx.measureText(testLinea);
        
        if (metrica.width > width - 40 && i > 0) {
            ctx.fillText(linea, width / 2, yPos);
            linea = palabras[i] + ' ';
            yPos += 30;
            
            // Si se sale del espacio, cortar el texto
            if (yPos > height - 40) {
                ctx.fillText(linea + '...', width / 2, yPos);
                break;
            }
        } else {
            linea = testLinea;
        }
        
        // Última línea
        if (i === palabras.length - 1) {
            ctx.fillText(linea, width / 2, yPos);
        }
    }
    
    // Dibujar precio de fianza (si existe)
    if (precio) {
        // Usar el color destacado del tema
        ctx.font = 'bold 24px Arial';
        const precioTexto = `FIANZA: ${precio}`;
        const precioMetrica = ctx.measureText(precioTexto);
        const precioWidth = precioMetrica.width + 40;
        
        // Fondo para el precio
        ctx.fillStyle = config.colorDestacado;
        ctx.globalAlpha = 0.8;
        roundRect(ctx, (width - precioWidth) / 2, height - 45, precioWidth, 32, 5);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Borde para el precio
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        roundRect(ctx, (width - precioWidth) / 2, height - 45, precioWidth, 32, 5);
        ctx.stroke();
        
        // Texto del precio
        ctx.fillStyle = '#000000';
        ctx.fillText(precioTexto, width / 2, height - 25);
    }
}

/**
 * Función auxiliar para dibujar rectángulos redondeados
 */
function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'undefined') radius = 5;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    return ctx;
}

/**
 * Ajusta un color haciéndolo más claro o más oscuro
 */
function adjustColor(color, amount) {
    // Quitar el # si existe
    color = color.replace(/^#/, '');
    
    // Asegurar que tenemos 6 dígitos
    if (color.length === 3) {
        color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    
    // Convertir a RGB
    let r = parseInt(color.substring(0, 2), 16);
    let g = parseInt(color.substring(2, 4), 16);
    let b = parseInt(color.substring(4, 6), 16);
    
    // Ajustar valores
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    // Convertir de vuelta a hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Limpiar archivos temporales cada hora
setInterval(() => {
    try {
        const files = fs.readdirSync(TEMP_DIR);
        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(TEMP_DIR, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtimeMs;
            
            // Eliminar archivos mayores a 1 hora
            if (fileAge > 60 * 60 * 1000) {
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        console.error("Error en limpieza de archivos temporales:", error);
    }
}, 60 * 60 * 1000);

module.exports = router;
