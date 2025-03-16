// Generador de tarjetas de bienvenida preciso
// Este script crea una imagen exactamente igual a la previsualización

// Objeto global para mantener la configuración de la tarjeta
let cardConfig = null;

// Función para capturar la configuración actual de la tarjeta
function captureCardConfig() {
    // Obtener la configuración actual del objeto state
    if (typeof state !== 'undefined' && state.currentState) {
        cardConfig = JSON.parse(JSON.stringify(state.currentState));
    } else {
        console.error("No se pudo acceder al estado del generador");
        return null;
    }
    return cardConfig;
}

// Función para generar una imagen de la tarjeta de bienvenida
// Esta función crea una imagen exactamente igual a lo que se ve en el preview
async function generateWelcomeCard() {
    try {
        // Capturar la configuración actual
        const config = captureCardConfig();
        if (!config) return null;
        
        // Crear un canvas para generar la imagen
        const canvas = document.createElement('canvas');
        canvas.width = config.canvas.width;
        canvas.height = config.canvas.height;
        const ctx = canvas.getContext('2d');
        
        // Aplicar borde redondeado si corresponde
        if (config.border.radius > 0) {
            ctx.beginPath();
            ctx.moveTo(config.border.radius, 0);
            ctx.lineTo(canvas.width - config.border.radius, 0);
            ctx.quadraticCurveTo(canvas.width, 0, canvas.width, config.border.radius);
            ctx.lineTo(canvas.width, canvas.height - config.border.radius);
            ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - config.border.radius, canvas.height);
            ctx.lineTo(config.border.radius, canvas.height);
            ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - config.border.radius);
            ctx.lineTo(0, config.border.radius);
            ctx.quadraticCurveTo(0, 0, config.border.radius, 0);
            ctx.closePath();
            ctx.clip();
        }
        
        // Dibujar el fondo
        switch (config.background.type) {
            case 'color':
                ctx.fillStyle = config.background.color;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                break;
                
            case 'gradient':
                const gradient = createGradient(ctx, config.background.gradientDirection, 
                                              config.background.gradientStart, 
                                              config.background.gradientEnd,
                                              canvas.width, canvas.height);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                break;
                
            case 'image':
                if (config.background.imageUrl) {
                    await drawImageWithOpacity(ctx, config.background.imageUrl, 
                                            0, 0, canvas.width, canvas.height, 
                                            config.background.imageOpacity);
                } else {
                    // Si no hay imagen, usamos un color de respaldo
                    ctx.fillStyle = '#1e1e2e';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                break;
        }
        
        // Aplicar efectos visuales
        applyEffects(ctx, config.effects, canvas.width, canvas.height);
        
        // Dibujar avatares adicionales primero (para que aparezcan detrás del avatar principal)
        for (const avatar of config.extraAvatars) {
            if (avatar.url) {
                await drawAvatar(ctx, avatar);
            }
        }
        
        // Dibujar avatar principal
        if (config.mainAvatar.url) {
            await drawAvatar(ctx, config.mainAvatar, true);
        }
        
        // Dibujar textos
        for (const text of config.textElements) {
            drawText(ctx, text);
        }
        
        // Dibujar borde (después del clip)
        if (config.border.width > 0) {
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = canvas.width + (config.border.width * 2);
            finalCanvas.height = canvas.height + (config.border.width * 2);
            const finalCtx = finalCanvas.getContext('2d');
            
            // Dibujar el borde
            finalCtx.fillStyle = config.border.color;
            
            if (config.border.radius > 0) {
                // Borde redondeado
                const outerRadius = config.border.radius + config.border.width;
                finalCtx.beginPath();
                finalCtx.moveTo(outerRadius, 0);
                finalCtx.lineTo(finalCanvas.width - outerRadius, 0);
                finalCtx.quadraticCurveTo(finalCanvas.width, 0, finalCanvas.width, outerRadius);
                finalCtx.lineTo(finalCanvas.width, finalCanvas.height - outerRadius);
                finalCtx.quadraticCurveTo(finalCanvas.width, finalCanvas.height, finalCanvas.width - outerRadius, finalCanvas.height);
                finalCtx.lineTo(outerRadius, finalCanvas.height);
                finalCtx.quadraticCurveTo(0, finalCanvas.height, 0, finalCanvas.height - outerRadius);
                finalCtx.lineTo(0, outerRadius);
                finalCtx.quadraticCurveTo(0, 0, outerRadius, 0);
                finalCtx.closePath();
                finalCtx.fill();
                
                // Recortar la parte interna
                finalCtx.globalCompositeOperation = 'destination-out';
                finalCtx.beginPath();
                finalCtx.moveTo(config.border.width + config.border.radius, config.border.width);
                finalCtx.lineTo(finalCanvas.width - config.border.width - config.border.radius, config.border.width);
                finalCtx.quadraticCurveTo(finalCanvas.width - config.border.width, config.border.width, 
                                        finalCanvas.width - config.border.width, config.border.width + config.border.radius);
                finalCtx.lineTo(finalCanvas.width - config.border.width, finalCanvas.height - config.border.width - config.border.radius);
                finalCtx.quadraticCurveTo(finalCanvas.width - config.border.width, finalCanvas.height - config.border.width, 
                                        finalCanvas.width - config.border.width - config.border.radius, finalCanvas.height - config.border.width);
                finalCtx.lineTo(config.border.width + config.border.radius, finalCanvas.height - config.border.width);
                finalCtx.quadraticCurveTo(config.border.width, finalCanvas.height - config.border.width, 
                                        config.border.width, finalCanvas.height - config.border.width - config.border.radius);
                finalCtx.lineTo(config.border.width, config.border.width + config.border.radius);
                finalCtx.quadraticCurveTo(config.border.width, config.border.width, 
                                        config.border.width + config.border.radius, config.border.width);
                finalCtx.closePath();
                finalCtx.fill();
            } else {
                // Borde sin redondear
                finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
                finalCtx.clearRect(config.border.width, config.border.width, 
                                canvas.width, canvas.height);
            }
            
            // Restaurar modo de composición
            finalCtx.globalCompositeOperation = 'source-over';
            
            // Dibujar el canvas original sobre el nuevo canvas
            finalCtx.drawImage(canvas, config.border.width, config.border.width);
            
            // Usar el nuevo canvas como resultado final
            return finalCanvas.toDataURL('image/png');
        }
        
        // Devolver la imagen generada (sin borde)
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error("Error generando la tarjeta:", error);
        return null;
    }
}

// Función para crear un gradiente según la dirección
function createGradient(ctx, direction, startColor, endColor, width, height) {
    let gradient;
    
    switch (direction) {
        case 'to right':
            gradient = ctx.createLinearGradient(0, 0, width, 0);
            break;
        case 'to left':
            gradient = ctx.createLinearGradient(width, 0, 0, 0);
            break;
        case 'to bottom':
            gradient = ctx.createLinearGradient(0, 0, 0, height);
            break;
        case 'to top':
            gradient = ctx.createLinearGradient(0, height, 0, 0);
            break;
        case 'to bottom right':
            gradient = ctx.createLinearGradient(0, 0, width, height);
            break;
        case 'to bottom left':
            gradient = ctx.createLinearGradient(width, 0, 0, height);
            break;
        case 'to top right':
            gradient = ctx.createLinearGradient(0, height, width, 0);
            break;
        case 'to top left':
            gradient = ctx.createLinearGradient(width, height, 0, 0);
            break;
        default:
            gradient = ctx.createLinearGradient(0, 0, width, 0);
    }
    
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    
    return gradient;
}

// Función para dibujar una imagen con opacidad específica
async function drawImageWithOpacity(ctx, url, x, y, width, height, opacity) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
            ctx.globalAlpha = opacity;
            ctx.drawImage(img, x, y, width, height);
            ctx.globalAlpha = 1.0;
            resolve();
        };
        
        img.onerror = (err) => {
            console.error("Error cargando imagen:", err);
            reject(err);
        };
        
        // Si la URL es una variable BDFD, usamos un placeholder
        if (url.startsWith('$')) {
            img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%236633cc"/><text x="50" y="50" font-size="12" font-family="Arial" fill="white" text-anchor="middle" dominant-baseline="middle">' + url + '</text></svg>';
        } else {
            img.src = url;
        }
    });
}

// Función para aplicar una forma específica a un avatar
function applyAvatarShape(ctx, x, y, width, height, shape) {
    ctx.beginPath();
    
    switch (shape) {
        case 'circle':
            ctx.arc(x + width/2, y + height/2, width/2, 0, Math.PI * 2);
            break;
        case 'square':
            ctx.rect(x, y, width, height);
            break;
        case 'triangle':
            ctx.moveTo(x + width/2, y);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x + width, y + height);
            break;
        case 'pentagon':
            const pentRadius = width / 2;
            const pentCenterX = x + width / 2;
            const pentCenterY = y + height / 2;
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                const px = pentCenterX + pentRadius * Math.cos(angle);
                const py = pentCenterY + pentRadius * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            break;
        case 'hexagon':
            const hexRadius = width / 2;
            const hexCenterX = x + width / 2;
            const hexCenterY = y + height / 2;
            for (let i = 0; i < 6; i++) {
                const angle = (i * 2 * Math.PI / 6);
                const px = hexCenterX + hexRadius * Math.cos(angle);
                const py = hexCenterY + hexRadius * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            break;
        case 'octagon':
            const octRadius = width / 2;
            const octCenterX = x + width / 2;
            const octCenterY = y + height / 2;
            for (let i = 0; i < 8; i++) {
                const angle = (i * 2 * Math.PI / 8);
                const px = octCenterX + octRadius * Math.cos(angle);
                const py = octCenterY + octRadius * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            break;
        case 'star':
            const starOuterRadius = width / 2;
            const starInnerRadius = starOuterRadius / 2;
            const starCenterX = x + width / 2;
            const starCenterY = y + height / 2;
            
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI / 5) - Math.PI / 2;
                const radius = i % 2 === 0 ? starOuterRadius : starInnerRadius;
                const px = starCenterX + radius * Math.cos(angle);
                const py = starCenterY + radius * Math.sin(angle);
                
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            break;
        case 'diamond':
            ctx.moveTo(x + width/2, y);
            ctx.lineTo(x + width, y + height/2);
            ctx.lineTo(x + width/2, y + height);
            ctx.lineTo(x, y + height/2);
            break;
        default:
            ctx.rect(x, y, width, height);
    }
    
    ctx.closePath();
}

// Función para dibujar un avatar
async function drawAvatar(ctx, avatar, isMain = false) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
            // Aplicar la forma del avatar
            ctx.save();
            const x = avatar.x - avatar.size;
            const y = avatar.y - avatar.size;
            const width = avatar.size * 2;
            const height = avatar.size * 2;
            
            applyAvatarShape(ctx, x, y, width, height, avatar.shape);
            ctx.clip();
            
            // Dibujar la imagen del avatar
            ctx.drawImage(img, x, y, width, height);
            ctx.restore();
            
            // Dibujar el borde
            ctx.save();
            ctx.strokeStyle = isMain ? avatar.borderColor : '#ffffff';
            ctx.lineWidth = isMain ? 3 : 2;
            
            applyAvatarShape(ctx, x, y, width, height, avatar.shape);
            ctx.stroke();
            ctx.restore();
            
            // Añadir resplandor si es el avatar principal y tiene resplandor activado
            if (isMain && avatar.glow) {
                ctx.save();
                ctx.shadowColor = 'rgba(153, 102, 255, 0.7)';
                ctx.shadowBlur = 15;
                ctx.strokeStyle = 'rgba(153, 102, 255, 0.1)';
                ctx.lineWidth = 1;
                
                applyAvatarShape(ctx, x, y, width, height, avatar.shape);
                ctx.stroke();
                
                ctx.shadowColor = 'rgba(102, 204, 255, 0.5)';
                ctx.shadowBlur = 30;
                
                applyAvatarShape(ctx, x, y, width, height, avatar.shape);
                ctx.stroke();
                ctx.restore();
            }
            
            resolve();
        };
        
        img.onerror = (err) => {
            console.error("Error cargando imagen de avatar:", err);
            resolve(); // Continuamos incluso con error
        };
        
        // Si la URL es una variable BDFD, usamos un placeholder
        if (avatar.url.startsWith('$')) {
            img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%236633cc"/><text x="100" y="100" font-size="20" font-family="Arial" fill="white" text-anchor="middle" dominant-baseline="middle">' + avatar.url + '</text></svg>';
        } else {
            img.src = avatar.url;
        }
    });
}

// Función para dibujar un texto
function drawText(ctx, text) {
    ctx.save();
    
    // Configurar estilo de texto
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = text.color;
    
    let fontStyle = '';
    if (text.style.includes('italic')) fontStyle += 'italic ';
    if (text.style.includes('bold')) fontStyle += 'bold ';
    if (!fontStyle) fontStyle = 'normal ';
    
    ctx.font = `${fontStyle}${text.size}px "${text.font}"`;
    
    // Aplicar sombra si está activada
    if (text.shadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    }
    
    // Dibujar el texto
    ctx.fillText(text.content, text.x, text.y);
    
    ctx.restore();
}

// Función para aplicar efectos visuales al canvas
function applyEffects(ctx, effects, width, height) {
    if (effects.type === 'none') return;
    
    ctx.save();
    
    switch (effects.type) {
        case 'glow':
            // Aplicar resplandor con sombra interna
            ctx.shadowColor = effects.color1;
            ctx.shadowBlur = 30 * effects.intensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.01)';
            ctx.lineWidth = 1;
            ctx.strokeRect(5, 5, width - 10, height - 10);
            
            // Segunda sombra para efecto dual
            ctx.shadowColor = effects.color2;
            ctx.shadowBlur = 20 * effects.intensity;
            ctx.strokeRect(5, 5, width - 10, height - 10);
            break;
            
        case 'gradient':
            // Superposición de gradiente con opacidad
            const intensity = Math.floor(effects.intensity * 80).toString(16).padStart(2, '0');
            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, effects.color1 + intensity);
            grad.addColorStop(1, effects.color2 + intensity);
            
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            break;
            
        case 'vignette':
            // Efecto viñeta
            const radialGrad = ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.max(width, height) / 1.5
            );
            radialGrad.addColorStop(0, 'rgba(0,0,0,0)');
            radialGrad.addColorStop(1, `rgba(0,0,0,${effects.intensity * 0.8})`);
            
            ctx.fillStyle = radialGrad;
            ctx.fillRect(0, 0, width, height);
            break;
            
        case 'cyberpunk':
            // Efecto cyberpunk con líneas de escaneo
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            const scanlineHeight = 4;
            for (let y = 0; y < height; y += scanlineHeight * 2) {
                ctx.fillRect(0, y, width, scanlineHeight);
            }
            
            // Barras de colores horizontales
            ctx.fillStyle = effects.color1;
            ctx.globalAlpha = 0.7 * effects.intensity;
            ctx.fillRect(0, Math.random() * height, width, 5);
            
            ctx.fillStyle = effects.color2;
            ctx.globalAlpha = 0.5 * effects.intensity;
            ctx.fillRect(0, Math.random() * height, width, 3);
            break;
            
        case 'retro':
            // Sol retrowave
            const sunGrad = ctx.createRadialGradient(
                width / 2, height, 0,
                width / 2, height, 200
            );
            sunGrad.addColorStop(0, effects.color1);
            sunGrad.addColorStop(1, 'transparent');
            
            ctx.globalAlpha = effects.intensity;
            ctx.fillStyle = sunGrad;
            ctx.fillRect(0, 0, width, height);
            
            // Rejilla en perspectiva
            ctx.globalAlpha = 0.3 * effects.intensity;
            ctx.strokeStyle = effects.color2;
            ctx.lineWidth = 1;
            
            // Dibujar líneas horizontales en perspectiva
            const horizonY = height * 0.6;
            const vanishingPointX = width / 2;
            
            for (let y = horizonY; y <= height; y += 20) {
                const t = (y - horizonY) / (height - horizonY);
                
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
            
            // Dibujar líneas verticales en perspectiva
            const gridCount = 10;
            for (let i = 0; i <= gridCount; i++) {
                const startX = (width / gridCount) * i;
                
                ctx.beginPath();
                ctx.moveTo(startX, horizonY);
                ctx.lineTo(vanishingPointX, height);
                ctx.stroke();
            }
            break;
    }
    
    ctx.restore();
}

// Función para generar la imagen y colocarla en un elemento img
async function generateAndDisplayImage() {
    try {
        // Generar la imagen
        const imgData = await generateWelcomeCard();
        if (!imgData) {
            console.error("No se pudo generar la imagen");
            return;
        }
        
        // Crear un elemento img para la previsualización
        const previewImg = document.createElement('img');
        previewImg.src = imgData;
        previewImg.style.maxWidth = '100%';
        previewImg.style.border = '1px solid #555';
        previewImg.style.borderRadius = '5px';
        
        // Crear un enlace de descarga
        const downloadLink = document.createElement('a');
        downloadLink.href = imgData;
        downloadLink.download = 'tarjeta-bienvenida.png';
        downloadLink.textContent = 'Descargar Imagen';
        downloadLink.className = 'btn';
        downloadLink.style.display = 'inline-block';
        downloadLink.style.margin = '10px 0';
        downloadLink.style.textDecoration = 'none';
        downloadLink.style.backgroundColor = '#6633cc';
        downloadLink.style.color = 'white';
        downloadLink.style.padding = '8px 15px';
        downloadLink.style.borderRadius = '5px';
        
        // Crear un contenedor para la previsualización
        const previewContainer = document.getElementById('apiUrlContainer');
        if (previewContainer) {
            // Añadir título
            const title = document.createElement('h3');
            title.innerHTML = '<i class="fas fa-image"></i> Vista Previa Exacta';
            title.style.marginTop = '20px';
            
            // Limpiar contenedor y añadir elementos
            previewContainer.appendChild(title);
            previewContainer.appendChild(previewImg);
            previewContainer.appendChild(downloadLink);
        }
    } catch (error) {
        console.error("Error al generar y mostrar la imagen:", error);
    }
}

// Botón para generar la imagen exacta
function addExactImageButton() {
    // Crear el botón
    const exactButton = document.createElement('button');
    exactButton.id = 'generateExactBtn';
    exactButton.className = 'btn';
    exactButton.innerHTML = '<i class="fas fa-image"></i> Generar Imagen Exacta';
    exactButton.style.backgroundColor = '#33aaff';
    exactButton.style.marginLeft = '10px';
    
    // Añadir evento
    exactButton.addEventListener('click', generateAndDisplayImage);
    
    // Añadir al DOM después del botón de API URL
    const buttonsContainer = document.querySelector('.buttons');
    if (buttonsContainer) {
        buttonsContainer.appendChild(exactButton);
    } else {
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn && generateBtn.parentNode) {
            generateBtn.parentNode.appendChild(exactButton);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Agregar el botón para generar imagen exacta
    setTimeout(addExactImageButton, 1000); // Pequeño retraso para asegurar que todo está cargado
});
