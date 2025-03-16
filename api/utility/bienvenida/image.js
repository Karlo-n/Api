// image.js - Genera la imagen exacta según la configuración del usuario
document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const previewCanvas = document.getElementById('previewCanvas');
    const previewBackground = document.getElementById('previewBackground');
    const previewAvatar = document.getElementById('previewAvatar');
    const generateImageBtn = document.getElementById('generateImageBtn');
    const generateUrlBtn = document.getElementById('generateUrlBtn');
    const copyUrlBtn = document.getElementById('copyUrlBtn');
    const downloadImageBtn = document.getElementById('downloadImageBtn');
    const resultContainer = document.getElementById('resultContainer');
    const apiUrlOutput = document.getElementById('apiUrlOutput');
    const generatedImageContainer = document.getElementById('generatedImageContainer');

    // Función principal para generar la imagen de bienvenida
    function generateWelcomeImage() {
        // Obtener la configuración actual del usuario
        const config = {
            background: {
                color: document.getElementById('bgColor').value
            },
            avatar: {
                url: document.getElementById('avatarUrl').value,
                x: parseInt(document.getElementById('avatarX').value),
                y: parseInt(document.getElementById('avatarY').value),
                size: parseInt(document.getElementById('avatarSize').value),
                shape: document.getElementById('avatarShape').value,
                glow: document.getElementById('avatarGlow').checked
            },
            border: {
                radius: parseInt(document.getElementById('borderRadius').value),
                color: document.getElementById('borderColor').value,
                width: parseInt(document.getElementById('borderWidth').value)
            }
        };

        // Crear un canvas para generar la imagen
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        
        // Dibujar el fondo
        ctx.fillStyle = config.background.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar el borde
        ctx.strokeStyle = config.border.color;
        ctx.lineWidth = config.border.width;
        const borderOffset = config.border.width / 2;
        
        // Crear rectángulo redondeado para el borde
        ctx.beginPath();
        ctx.moveTo(borderOffset + config.border.radius, borderOffset);
        ctx.lineTo(canvas.width - borderOffset - config.border.radius, borderOffset);
        ctx.quadraticCurveTo(canvas.width - borderOffset, borderOffset, canvas.width - borderOffset, borderOffset + config.border.radius);
        ctx.lineTo(canvas.width - borderOffset, canvas.height - borderOffset - config.border.radius);
        ctx.quadraticCurveTo(canvas.width - borderOffset, canvas.height - borderOffset, canvas.width - borderOffset - config.border.radius, canvas.height - borderOffset);
        ctx.lineTo(borderOffset + config.border.radius, canvas.height - borderOffset);
        ctx.quadraticCurveTo(borderOffset, canvas.height - borderOffset, borderOffset, canvas.height - borderOffset - config.border.radius);
        ctx.lineTo(borderOffset, borderOffset + config.border.radius);
        ctx.quadraticCurveTo(borderOffset, borderOffset, borderOffset + config.border.radius, borderOffset);
        ctx.closePath();
        ctx.stroke();
        
        // Dibujar avatar si se proporciona una URL
        if (config.avatar.url) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Guardar el estado actual
                ctx.save();
                
                // Crear ruta de recorte para la forma del avatar
                ctx.beginPath();
                const x = config.avatar.x;
                const y = config.avatar.y;
                const radius = config.avatar.size / 2;
                
                if (config.avatar.shape === 'circle') {
                    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
                } else {
                    ctx.rect(x - radius, y - radius, config.avatar.size, config.avatar.size);
                }
                ctx.closePath();
                ctx.clip();
                
                // Dibujar imagen del avatar
                ctx.drawImage(
                    img,
                    x - radius,
                    y - radius,
                    config.avatar.size,
                    config.avatar.size
                );
                
                // Restaurar el estado
                ctx.restore();
                
                // Dibujar efecto de resplandor si está habilitado
                if (config.avatar.glow) {
                    ctx.save();
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = 'rgba(189, 93, 255, 0.7)';
                    
                    ctx.beginPath();
                    if (config.avatar.shape === 'circle') {
                        ctx.arc(x, y, radius, 0, Math.PI * 2, false);
                    } else {
                        ctx.rect(x - radius, y - radius, config.avatar.size, config.avatar.size);
                    }
                    ctx.strokeStyle = 'rgba(189, 93, 255, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();
                }
                
                // Convertir canvas a imagen
                const imageUrl = canvas.toDataURL('image/png');
                
                // Mostrar la imagen generada
                generatedImageContainer.innerHTML = '';
                const imgElement = document.createElement('img');
                imgElement.src = imageUrl;
                imgElement.style.maxWidth = '100%';
                imgElement.style.borderRadius = '8px';
                generatedImageContainer.appendChild(imgElement);
                
                // Actualizar enlace de descarga
                downloadImageBtn.href = imageUrl;
                
                // Mostrar contenedor de resultados
                resultContainer.style.display = 'block';
            };
            
            img.onerror = () => {
                alert('Error al cargar la imagen del avatar. Verifica la URL.');
            };
            
            img.src = config.avatar.url;
        } else {
            // Si no hay avatar, mostrar solo la tarjeta con fondo y borde
            const imageUrl = canvas.toDataURL('image/png');
            
            // Mostrar la imagen generada
            generatedImageContainer.innerHTML = '';
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.style.maxWidth = '100%';
            imgElement.style.borderRadius = '8px';
            generatedImageContainer.appendChild(imgElement);
            
            // Actualizar enlace de descarga
            downloadImageBtn.href = imageUrl;
            
            // Mostrar contenedor de resultados
            resultContainer.style.display = 'block';
        }
    }

    // Función para generar la URL de la API
    function generateApiUrl() {
        // Construir URL base de la API con el dominio correcto
        const baseUrl = 'https://apikarl.com/api/welcome';
        const params = new URLSearchParams();
        
        // Añadir parámetros de fondo
        params.append('bg', document.getElementById('bgColor').value.replace('#', ''));
        
        // Añadir parámetros de avatar
        const avatarUrl = document.getElementById('avatarUrl').value;
        if (avatarUrl) {
            params.append('avatar', encodeURIComponent(avatarUrl));
            params.append('x', document.getElementById('avatarX').value);
            params.append('y', document.getElementById('avatarY').value);
            params.append('size', document.getElementById('avatarSize').value);
            params.append('shape', document.getElementById('avatarShape').value);
            params.append('glow', document.getElementById('avatarGlow').checked ? '1' : '0');
        }
        
        // Añadir parámetros de borde
        params.append('radius', document.getElementById('borderRadius').value);
        params.append('color', document.getElementById('borderColor').value.replace('#', ''));
        params.append('width', document.getElementById('borderWidth').value);
        
        // Construir URL completa
        const apiUrl = `${baseUrl}?${params.toString()}`;
        
        // Formatear URL para mostrarla en el contenedor de forma más legible
        const formattedUrl = `${baseUrl}?\n` + 
            `bg=${document.getElementById('bgColor').value.replace('#', '')}\n` +
            (avatarUrl ? `avatar=${encodeURIComponent(avatarUrl)}\n` : '') +
            (avatarUrl ? `x=${document.getElementById('avatarX').value}\n` : '') +
            (avatarUrl ? `y=${document.getElementById('avatarY').value}\n` : '') +
            (avatarUrl ? `size=${document.getElementById('avatarSize').value}\n` : '') +
            (avatarUrl ? `shape=${document.getElementById('avatarShape').value}\n` : '') +
            (avatarUrl ? `glow=${document.getElementById('avatarGlow').checked ? '1' : '0'}\n` : '') +
            `radius=${document.getElementById('borderRadius').value}\n` +
            `color=${document.getElementById('borderColor').value.replace('#', '')}\n` +
            `width=${document.getElementById('borderWidth').value}`;
        
        apiUrlOutput.textContent = formattedUrl;
        resultContainer.style.display = 'block';
        
        // Guardar la URL completa para copiar
        apiUrlOutput.dataset.fullUrl = apiUrl;
    }

    // Función para copiar la URL de la API al portapapeles
    function copyApiUrl() {
        // Usamos la URL completa guardada en el dataset, no el texto formateado
        const apiUrl = apiUrlOutput.dataset.fullUrl || apiUrlOutput.textContent;
        navigator.clipboard.writeText(apiUrl)
            .then(() => {
                alert('URL copiada al portapapeles');
            })
            .catch(err => {
                console.error('Error al copiar URL: ', err);
            });
    }

    // Inicializar vista previa interactiva
    function initPreview() {
        // Función para actualizar la vista previa en tiempo real
        function updatePreview() {
            // Actualizar fondo
            previewBackground.style.backgroundColor = document.getElementById('bgColor').value;
            
            // Actualizar avatar
            const avatarUrl = document.getElementById('avatarUrl').value;
            const avatarX = parseInt(document.getElementById('avatarX').value);
            const avatarY = parseInt(document.getElementById('avatarY').value);
            const avatarSize = parseInt(document.getElementById('avatarSize').value);
            const avatarShape = document.getElementById('avatarShape').value;
            const avatarGlow = document.getElementById('avatarGlow').checked;
            
            if (avatarUrl) {
                previewAvatar.style.backgroundImage = `url(${avatarUrl})`;
                previewAvatar.style.left = `${avatarX - (avatarSize / 2)}px`;
                previewAvatar.style.top = `${avatarY - (avatarSize / 2)}px`;
                previewAvatar.style.width = `${avatarSize}px`;
                previewAvatar.style.height = `${avatarSize}px`;
                previewAvatar.style.borderRadius = avatarShape === 'circle' ? '50%' : '0';
                previewAvatar.style.boxShadow = avatarGlow ? '0 0 20px rgba(189, 93, 255, 0.7)' : 'none';
                previewAvatar.style.display = 'block';
                previewAvatar.style.backgroundSize = 'cover';
                previewAvatar.style.backgroundPosition = 'center';
            } else {
                previewAvatar.style.display = 'none';
            }
            
            // Actualizar borde
            previewCanvas.style.borderRadius = `${document.getElementById('borderRadius').value}px`;
            previewCanvas.style.borderColor = document.getElementById('borderColor').value;
            previewCanvas.style.borderWidth = `${document.getElementById('borderWidth').value}px`;
        }
        
        // Sincronizar inputs de coordenadas de avatar
        function syncCoordinateInputs() {
            document.getElementById('avatarXInput').value = document.getElementById('avatarX').value;
            document.getElementById('avatarYInput').value = document.getElementById('avatarY').value;
        }
        
        // Configurar event listeners para inputs
        document.getElementById('bgColor').addEventListener('input', updatePreview);
        document.getElementById('avatarUrl').addEventListener('input', updatePreview);
        document.getElementById('avatarX').addEventListener('input', () => {
            syncCoordinateInputs();
            updatePreview();
        });
        document.getElementById('avatarY').addEventListener('input', () => {
            syncCoordinateInputs();
            updatePreview();
        });
        document.getElementById('avatarXInput').addEventListener('input', () => {
            document.getElementById('avatarX').value = document.getElementById('avatarXInput').value;
            updatePreview();
        });
        document.getElementById('avatarYInput').addEventListener('input', () => {
            document.getElementById('avatarY').value = document.getElementById('avatarYInput').value;
            updatePreview();
        });
        document.getElementById('avatarSize').addEventListener('input', updatePreview);
        document.getElementById('avatarShape').addEventListener('change', updatePreview);
        document.getElementById('avatarGlow').addEventListener('change', updatePreview);
        document.getElementById('borderRadius').addEventListener('input', updatePreview);
        document.getElementById('borderColor').addEventListener('input', updatePreview);
        document.getElementById('borderWidth').addEventListener('input', updatePreview);
        
        // Inicializar vista previa
        updatePreview();
        syncCoordinateInputs();
    }

    // Configurar event listeners para botones
    generateImageBtn.addEventListener('click', generateWelcomeImage);
    generateUrlBtn.addEventListener('click', generateApiUrl);
    copyUrlBtn.addEventListener('click', copyApiUrl);
    
    // Inicializar interfaz
    initPreview();
});
