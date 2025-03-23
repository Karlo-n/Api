// script.js - Creador de API de Imágenes de Bienvenida

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    const apiBaseUrl = window.location.origin + '/api/utility/bienvenida/bienvenida-styled';
    let configHistory = [];
    let historyPosition = -1;
    let currentConfig = {};

    // Referencias DOM
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const textElements = document.getElementById('textElements');
    const addTextBtn = document.getElementById('addTextBtn');
    const previewCanvas = document.getElementById('previewCanvas');
    const previewTexts = document.getElementById('previewTexts');
    const previewAvatars = document.getElementById('previewAvatars');
    const previewEffects = document.getElementById('previewEffects');
    const generateBtn = document.getElementById('generateBtn');
    const apiUrlOutput = document.getElementById('apiUrlOutput');
    const copyBtn = document.getElementById('copyBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    // Estado inicial
    const defaultTexts = [
        { id: 1, text: 'Bienvenido', x: 400, y: 180, size: 40, color: '#ffffff', font: 'Arial', style: 'bold', shadow: true },
        { id: 2, text: '@usuario', x: 400, y: 230, size: 30, color: '#ffffff', font: 'Arial', style: 'normal', shadow: true },
        { id: 3, text: 'a nuestro servidor', x: 400, y: 280, size: 20, color: '#aaaaaa', font: 'Arial', style: 'normal', shadow: true }
    ];
    
    // Configuración inicial
    let activeTextElements = [...defaultTexts];
    
    // Inicialización
    init();
    
    // Funciones de inicialización
    function init() {
        setupTabs();
        setupFormListeners();
        setupTextElements();
        setupAvatarElements();
        setupEffectsElements();
        setupButtons();
        updatePreview();
        saveCurrentState();
    }
    
    // Configuración de pestañas
    function setupTabs() {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabName = tab.getAttribute('data-tab');
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabName}-tab`) {
                        content.classList.add('active');
                    }
                });
            });
        });
    }
    
    // Configuración de listeners para los formularios
    function setupFormListeners() {
        // Tipo de fondo
        const bgType = document.getElementById('bgType');
        const bgColorOptions = document.getElementById('bgColorOptions');
        const bgGradientOptions = document.getElementById('bgGradientOptions');
        const bgImageOptions = document.getElementById('bgImageOptions');
        
        bgType.addEventListener('change', () => {
            bgColorOptions.style.display = 'none';
            bgGradientOptions.style.display = 'none';
            bgImageOptions.style.display = 'none';
            
            switch (bgType.value) {
                case 'color':
                    bgColorOptions.style.display = 'block';
                    break;
                case 'gradient':
                    bgGradientOptions.style.display = 'block';
                    break;
                case 'image':
                    bgImageOptions.style.display = 'block';
                    break;
            }
            
            updatePreview();
        });
        
        // Rangos con valores visuales
        document.querySelectorAll('input[type="range"]').forEach(range => {
            const valueDisplay = range.nextElementSibling;
            if (valueDisplay && valueDisplay.classList.contains('range-value')) {
                range.addEventListener('input', () => {
                    valueDisplay.textContent = range.value + (range.id.includes('Size') || range.id.includes('Radius') || range.id.includes('Width') ? 'px' : '');
                    updatePreview();
                });
            }
        });
        
        // Todos los inputs y selects para actualizar la vista previa
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => {
                updatePreview();
                saveCurrentState();
            });
            
            if (input.type !== 'range') {
                input.addEventListener('input', () => {
                    updatePreview();
                });
            }
        });
    }
    
    // Configuración de elementos de texto
    function setupTextElements() {
        // Limpiar elementos existentes
        textElements.innerHTML = '';
        
        // Agregar los elementos de texto predeterminados
        activeTextElements.forEach((textElement, index) => {
            addTextElement(textElement, index + 1);
        });
        
        // Evento para agregar nuevo elemento de texto
        addTextBtn.addEventListener('click', () => {
            const newId = activeTextElements.length > 0 ? Math.max(...activeTextElements.map(el => el.id)) + 1 : 1;
            const newTextElement = {
                id: newId,
                text: 'Nuevo Texto',
                x: 400,
                y: 200,
                size: 24,
                color: '#ffffff',
                font: 'Arial',
                style: 'normal',
                shadow: false
            };
            
            activeTextElements.push(newTextElement);
            addTextElement(newTextElement, activeTextElements.length);
            updatePreview();
            saveCurrentState();
        });
    }
    
    // Agregar un elemento de texto al DOM
    function addTextElement(textElement, index) {
        const textElementDiv = document.createElement('div');
        textElementDiv.className = 'text-element';
        textElementDiv.setAttribute('data-id', textElement.id);
        
        textElementDiv.innerHTML = `
            <div class="text-element-header">
                <h4 class="text-element-title">Texto ${index}</h4>
                <button class="remove-text-btn" title="Eliminar este texto">&times;</button>
            </div>
            <div class="form-group">
                <label for="text${textElement.id}">Texto:</label>
                <input type="text" id="text${textElement.id}" value="${textElement.text}" class="text-input">
            </div>
            <div class="form-group">
                <label for="textX${textElement.id}">Posición X:</label>
                <input type="range" id="textX${textElement.id}" min="0" max="800" value="${textElement.x}" class="text-x">
                <div class="range-value">${textElement.x}px</div>
            </div>
            <div class="form-group">
                <label for="textY${textElement.id}">Posición Y:</label>
                <input type="range" id="textY${textElement.id}" min="0" max="400" value="${textElement.y}" class="text-y">
                <div class="range-value">${textElement.y}px</div>
            </div>
            <div class="form-group">
                <label for="textSize${textElement.id}">Tamaño:</label>
                <input type="range" id="textSize${textElement.id}" min="10" max="72" value="${textElement.size}" class="text-size">
                <div class="range-value">${textElement.size}px</div>
            </div>
            <div class="form-group">
                <label for="textColor${textElement.id}">Color:</label>
                <input type="color" id="textColor${textElement.id}" value="${textElement.color}" class="text-color">
            </div>
            <div class="form-group">
                <label for="textFont${textElement.id}">Fuente:</label>
                <select id="textFont${textElement.id}" class="text-font">
                    <option value="Arial" ${textElement.font === 'Arial' ? 'selected' : ''}>Arial</option>
                    <option value="Verdana" ${textElement.font === 'Verdana' ? 'selected' : ''}>Verdana</option>
                    <option value="Times New Roman" ${textElement.font === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                    <option value="Courier New" ${textElement.font === 'Courier New' ? 'selected' : ''}>Courier New</option>
                    <option value="Georgia" ${textElement.font === 'Georgia' ? 'selected' : ''}>Georgia</option>
                    <option value="Tahoma" ${textElement.font === 'Tahoma' ? 'selected' : ''}>Tahoma</option>
                    <option value="Impact" ${textElement.font === 'Impact' ? 'selected' : ''}>Impact</option>
                </select>
            </div>
            <div class="form-group">
                <label for="textStyle${textElement.id}">Estilo:</label>
                <select id="textStyle${textElement.id}" class="text-style">
                    <option value="normal" ${textElement.style === 'normal' ? 'selected' : ''}>Normal</option>
                    <option value="bold" ${textElement.style === 'bold' ? 'selected' : ''}>Negrita</option>
                    <option value="italic" ${textElement.style === 'italic' ? 'selected' : ''}>Cursiva</option>
                    <option value="bold italic" ${textElement.style === 'bold italic' ? 'selected' : ''}>Negrita Cursiva</option>
                </select>
            </div>
            <div class="form-group">
                <label for="textShadow${textElement.id}">Sombra:</label>
                <input type="checkbox" id="textShadow${textElement.id}" ${textElement.shadow ? 'checked' : ''} class="text-shadow">
            </div>
        `;
        
        textElements.appendChild(textElementDiv);
        
        // Configurar evento para eliminar texto
        const removeBtn = textElementDiv.querySelector('.remove-text-btn');
        removeBtn.addEventListener('click', () => {
            const textId = parseInt(textElementDiv.getAttribute('data-id'));
            activeTextElements = activeTextElements.filter(el => el.id !== textId);
            textElementDiv.remove();
            updatePreview();
            saveCurrentState();
            
            // Renumerar los elementos de texto restantes
            document.querySelectorAll('.text-element').forEach((el, idx) => {
                el.querySelector('.text-element-title').textContent = `Texto ${idx + 1}`;
            });
        });
        
        // Configurar eventos para actualizar en tiempo real
        const textInputs = textElementDiv.querySelectorAll('input, select');
        textInputs.forEach(input => {
            input.addEventListener('input', () => {
                updateTextElement(textElement.id);
                updatePreview();
            });
            
            input.addEventListener('change', () => {
                updateTextElement(textElement.id);
                updatePreview();
                saveCurrentState();
            });
        });
    }
    
    // Actualizar un elemento de texto desde los inputs
    function updateTextElement(id) {
        const element = document.querySelector(`.text-element[data-id="${id}"]`);
        if (!element) return;
        
        const textElement = activeTextElements.find(el => el.id === id);
        if (!textElement) return;
        
        textElement.text = element.querySelector(`.text-input`).value;
        textElement.x = parseInt(element.querySelector(`.text-x`).value);
        textElement.y = parseInt(element.querySelector(`.text-y`).value);
        textElement.size = parseInt(element.querySelector(`.text-size`).value);
        textElement.color = element.querySelector(`.text-color`).value;
        textElement.font = element.querySelector(`.text-font`).value;
        textElement.style = element.querySelector(`.text-style`).value;
        textElement.shadow = element.querySelector(`.text-shadow`).checked;
    }
    
    // Configuración de elementos de avatar
    function setupAvatarElements() {
        document.getElementById('mainAvatarShape').addEventListener('change', updatePreview);
        document.getElementById('mainAvatarGlow').addEventListener('change', updatePreview);
        
        // Manejar cambios en la URL del avatar
        document.getElementById('mainAvatarUrl').addEventListener('change', () => {
            updatePreview();
            saveCurrentState();
        });
        
        // Manejar cambios en las URLs de avatares adicionales
        for (let i = 1; i <= 4; i++) {
            const avatarUrl = document.getElementById(`avatarUrl${i}`);
            if (avatarUrl) {
                avatarUrl.addEventListener('change', () => {
                    updatePreview();
                    saveCurrentState();
                });
            }
        }
    }
    
    // Configuración de elementos de efectos
    function setupEffectsElements() {
        const globalEffect = document.getElementById('globalEffect');
        const effectIntensity = document.getElementById('effectIntensity');
        
        globalEffect.addEventListener('change', () => {
            effectIntensity.style.display = 'flex';
            updatePreview();
            saveCurrentState();
        });
        
        document.getElementById('effectIntensitySlider').addEventListener('input', updatePreview);
        document.getElementById('effectColor1').addEventListener('input', updatePreview);
        document.getElementById('effectColor2').addEventListener('input', updatePreview);
    }
    
    // Configuración de botones
    function setupButtons() {
        // Botón generar
        generateBtn.addEventListener('click', generateApiUrl);
        
        // Botón copiar
        copyBtn.addEventListener('click', () => {
            const urlText = apiUrlOutput.textContent;
            if (urlText) {
                navigator.clipboard.writeText(urlText)
                    .then(() => {
                        showCopyMessage(copyBtn, 'Copiado!');
                    })
                    .catch(err => {
                        console.error('Error al copiar: ', err);
                        showCopyMessage(copyBtn, 'Error al copiar');
                    });
            }
        });
        
        // Botones deshacer/rehacer
        undoBtn.addEventListener('click', undo);
        redoBtn.addEventListener('click', redo);
    }
    
    // Mostrar mensaje de copiado
    function showCopyMessage(button, message) {
        const originalText = button.textContent;
        button.textContent = message;
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 1500);
    }
    
    // Actualizar la vista previa
    function updatePreview() {
        updateCanvasSize();
        updateBackground();
        updateBorder();
        updateTexts();
        updateAvatars();
        updateEffects();
    }
    
    // Actualizar tamaño del canvas
    function updateCanvasSize() {
        const width = parseInt(document.getElementById('canvasWidth').value);
        const height = parseInt(document.getElementById('canvasHeight').value);
        
        previewCanvas.style.width = width + 'px';
        previewCanvas.style.height = height + 'px';
    }
    
    // Actualizar fondo
    function updateBackground() {
        const bgType = document.getElementById('bgType').value;
        const background = previewCanvas.querySelector('div:first-child');
        
        switch (bgType) {
            case 'color':
                const bgColor = document.getElementById('bgColor').value;
                background.style.background = bgColor;
                break;
            case 'gradient':
                const startColor = document.getElementById('bgGradientStart').value;
                const endColor = document.getElementById('bgGradientEnd').value;
                const direction = document.getElementById('bgGradientDirection').value;
                background.style.background = `linear-gradient(${direction}, ${startColor}, ${endColor})`;
                break;
            case 'image':
                const imageUrl = document.getElementById('bgImageUrl').value;
                if (imageUrl) {
                    background.style.background = `url(${imageUrl}) center/cover no-repeat`;
                    const opacity = document.getElementById('bgImageOpacity').value;
                    background.style.opacity = opacity;
                }
                break;
        }
    }
    
    // Actualizar borde
    function updateBorder() {
        const borderRadius = document.getElementById('borderRadius').value;
        const borderColor = document.getElementById('borderColor').value;
        const borderWidth = document.getElementById('borderWidth').value;
        
        previewCanvas.style.borderRadius = borderRadius + 'px';
        
        const background = previewCanvas.querySelector('div:first-child');
        background.style.borderRadius = borderRadius + 'px';
        background.style.border = `${borderWidth}px solid ${borderColor}`;
    }
    
    // Actualizar textos
    function updateTexts() {
        previewTexts.innerHTML = '';
        
        activeTextElements.forEach(textElement => {
            const textDiv = document.createElement('div');
            textDiv.style.position = 'absolute';
            textDiv.style.left = textElement.x + 'px';
            textDiv.style.top = textElement.y + 'px';
            textDiv.style.transform = 'translate(-50%, -50%)';
            textDiv.style.color = textElement.color;
            textDiv.style.fontSize = textElement.size + 'px';
            textDiv.style.fontFamily = textElement.font;
            textDiv.style.fontWeight = textElement.style.includes('bold') ? 'bold' : 'normal';
            textDiv.style.fontStyle = textElement.style.includes('italic') ? 'italic' : 'normal';
            textDiv.style.textAlign = 'center';
            
            if (textElement.shadow) {
                textDiv.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
            }
            
            textDiv.textContent = textElement.text;
            previewTexts.appendChild(textDiv);
        });
    }
    
    // Actualizar avatares
    function updateAvatars() {
        previewAvatars.innerHTML = '';
        
        // Avatar principal
        const mainAvatarUrl = document.getElementById('mainAvatarUrl').value;
        if (mainAvatarUrl) {
            const avatarX = parseInt(document.getElementById('mainAvatarX').value);
            const avatarY = parseInt(document.getElementById('mainAvatarY').value);
            const avatarSize = parseInt(document.getElementById('mainAvatarSize').value);
            const avatarShape = document.getElementById('mainAvatarShape').value;
            const avatarBorderColor = document.getElementById('mainAvatarBorderColor').value;
            const avatarGlow = document.getElementById('mainAvatarGlow').checked;
            
            const avatarDiv = document.createElement('div');
            avatarDiv.style.position = 'absolute';
            avatarDiv.style.left = avatarX + 'px';
            avatarDiv.style.top = avatarY + 'px';
            avatarDiv.style.width = (avatarSize * 2) + 'px';
            avatarDiv.style.height = (avatarSize * 2) + 'px';
            avatarDiv.style.transform = 'translate(-50%, -50%)';
            avatarDiv.style.backgroundImage = `url(${mainAvatarUrl})`;
            avatarDiv.style.backgroundSize = 'cover';
            avatarDiv.style.backgroundPosition = 'center';
            avatarDiv.style.border = `3px solid ${avatarBorderColor}`;
            
            // Aplicar forma
            switch (avatarShape) {
                case 'circle':
                    avatarDiv.style.borderRadius = '50%';
                    break;
                case 'square':
                    avatarDiv.style.borderRadius = '0';
                    break;
                case 'triangle':
                    avatarDiv.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
                    break;
                case 'pentagon':
                    avatarDiv.style.clipPath = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
                    break;
                case 'hexagon':
                    avatarDiv.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
                    break;
                case 'octagon':
                    avatarDiv.style.clipPath = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
                    break;
                case 'star':
                    avatarDiv.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                    break;
                case 'heart':
                    avatarDiv.style.clipPath = 'path("M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z")';
                    break;
                case 'diamond':
                    avatarDiv.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
                    break;
            }
            
            // Aplicar efecto de brillo
            if (avatarGlow) {
                avatarDiv.style.boxShadow = '0 0 15px rgba(153, 102, 255, 0.7)';
            }
            
            previewAvatars.appendChild(avatarDiv);
        }
        
        // Avatares adicionales
        for (let i = 1; i <= 4; i++) {
            const avatarUrl = document.getElementById(`avatarUrl${i}`);
            if (avatarUrl && avatarUrl.value) {
                const avatarX = parseInt(document.getElementById(`avatarX${i}`).value);
                const avatarY = parseInt(document.getElementById(`avatarY${i}`).value);
                const avatarSize = parseInt(document.getElementById(`avatarSize${i}`).value);
                const avatarShape = document.getElementById(`avatarShape${i}`).value;
                
                const avatarDiv = document.createElement('div');
                avatarDiv.style.position = 'absolute';
                avatarDiv.style.left = avatarX + 'px';
                avatarDiv.style.top = avatarY + 'px';
                avatarDiv.style.width = (avatarSize * 2) + 'px';
                avatarDiv.style.height = (avatarSize * 2) + 'px';
                avatarDiv.style.transform = 'translate(-50%, -50%)';
                avatarDiv.style.backgroundImage = `url(${avatarUrl.value})`;
                avatarDiv.style.backgroundSize = 'cover';
                avatarDiv.style.backgroundPosition = 'center';
                avatarDiv.style.border = '2px solid #ffffff';
                
                // Aplicar forma
                switch (avatarShape) {
                    case 'circle':
                        avatarDiv.style.borderRadius = '50%';
                        break;
                    case 'square':
                        avatarDiv.style.borderRadius = '0';
                        break;
                    case 'triangle':
                        avatarDiv.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
                        break;
                    case 'pentagon':
                        avatarDiv.style.clipPath = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
                        break;
                    case 'hexagon':
                        avatarDiv.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
                        break;
                    case 'octagon':
                        avatarDiv.style.clipPath = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
                        break;
                    case 'star':
                        avatarDiv.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                        break;
                    case 'heart':
                        avatarDiv.style.clipPath = 'path("M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z")';
                        break;
                    case 'diamond':
                        avatarDiv.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
                        break;
                }
                
                previewAvatars.appendChild(avatarDiv);
            }
        }
    }
    
    // Actualizar efectos
    function updateEffects() {
        previewEffects.innerHTML = '';
        
        const effectType = document.getElementById('globalEffect').value;
        if (effectType === 'none') return;
        
        const intensity = parseFloat(document.getElementById('effectIntensitySlider').value);
        const color1 = document.getElementById('effectColor1').value;
        const color2 = document.getElementById('effectColor2').value;
        
        const effectDiv = document.createElement('div');
        effectDiv.style.position = 'absolute';
        effectDiv.style.width = '100%';
        effectDiv.style.height = '100%';
        effectDiv.style.pointerEvents = 'none';
        
        switch (effectType) {
            case 'glow':
                previewCanvas.style.boxShadow = `0 0 ${20 * intensity}px rgba(153, 102, 255, 0.7)`;
                break;
            case 'sparkle':
                // Simulación simple de destellos
                for (let i = 0; i < 20; i++) {
                    const sparkle = document.createElement('div');
                    sparkle.style.position = 'absolute';
                    sparkle.style.width = '4px';
                    sparkle.style.height = '4px';
                    sparkle.style.borderRadius = '50%';
                    sparkle.style.backgroundColor = Math.random() > 0.5 ? color1 : color2;
                    sparkle.style.left = Math.random() * 100 + '%';
                    sparkle.style.top = Math.random() * 100 + '%';
                    sparkle.style.opacity = intensity;
                    sparkle.style.animation = `sparkle ${1 + Math.random()}s infinite`;
                    effectDiv.appendChild(sparkle);
                }
                break;
            case 'gradient':
                effectDiv.style.background = `linear-gradient(135deg, ${color1}33, ${color2}33)`;
                effectDiv.style.mixBlendMode = 'overlay';
                effectDiv.style.opacity = intensity;
                break;
            case 'noise':
                effectDiv.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")';
                effectDiv.style.opacity = intensity * 0.3;
                effectDiv.style.mixBlendMode = 'overlay';
                break;
            case 'vignette':
                effectDiv.style.background = 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.8) 150%)';
                effectDiv.style.opacity = intensity;
                break;
            case 'rays':
                effectDiv.style.background = `linear-gradient(45deg, ${color1}00, ${color1}ff)`;
                effectDiv.style.opacity = intensity * 0.5;
                effectDiv.style.backgroundSize = '200% 200%';
                effectDiv.style.animation = 'rays 3s ease infinite';
                effectDiv.style.mixBlendMode = 'overlay';
                break;
            case 'grid':
                effectDiv.style.backgroundImage = `linear-gradient(0deg, transparent 95%, ${color1} 100%), linear-gradient(90deg, transparent 95%, ${color1} 100%)`;
                effectDiv.style.backgroundSize = `${Math.floor(20 / intensity)}px ${Math.floor(20 / intensity)}px`;
                effectDiv.style.opacity = intensity * 0.3;
                break;
            case 'cyberpunk':
                effectDiv.style.borderTop = `2px solid ${color1}`;
                effectDiv.style.borderBottom = `2px solid ${color2}`;
                effectDiv.style.background = `
                    linear-gradient(90deg, ${color1}00 0%, ${color1}22 49%, ${color1}44 51%, ${color1}00 100%),
                    linear-gradient(0deg, ${color2}00 0%, ${color2}22 49%, ${color2}44 51%, ${color2}00 100%)
                `;
                effectDiv.style.backgroundSize = '100% 10px, 10px 100%';
                effectDiv.style.opacity = intensity * 0.7;
                effectDiv.style.mixBlendMode = 'overlay';
                break;
            case 'retro':
                const stripeCount = Math.floor(10 / intensity);
                let gradientString = '';
                for (let i = 0; i < stripeCount; i++) {
                    const percent = (i / stripeCount) * 100;
                    const nextPercent = ((i + 1) / stripeCount) * 100;
                    gradientString += `${color1} ${percent}%, ${color2} ${nextPercent}%, `;
                }
                effectDiv.style.background = `linear-gradient(0deg, ${gradientString.slice(0, -2)})`;
                effectDiv.style.opacity = intensity * 0.3;
                effectDiv.style.mixBlendMode = 'overlay';
                break;
        }
        
        previewEffects.appendChild(effectDiv);
    }
    
    // Generar URL de API
    function generateApiUrl() {
        // Obtener todos los parámetros configurados
        const params = new URLSearchParams();
        
        // Dimensiones
        params.append('width', document.getElementById('canvasWidth').value);
        params.append('height', document.getElementById('canvasHeight').value);
        
        // Fondo
        const bgType = document.getElementById('bgType').value;
        switch (bgType) {
            case 'color':
                params.append('bgColor', document.getElementById('bgColor').value.replace('#', ''));
                break;
            case 'gradient':
                const startColor = document.getElementById('bgGradientStart').value.replace('#', '');
                const endColor = document.getElementById('bgGradientEnd').value.replace('#', '');
                params.append('bgGradient', `${startColor}:${endColor}`);
                params.append('bgGradientDir', document.getElementById('bgGradientDirection').value);
                break;
            case 'image':
                const bgImageUrl = document.getElementById('bgImageUrl').value;
                if (bgImageUrl) {
                    params.append('background', bgImageUrl);
                }
                break;
        }
        
        // Borde - CORREGIDO
        params.append('borderRadius', document.getElementById('borderRadius').value);
        params.append('borderColor', document.getElementById('borderColor').value.replace('#', ''));
        params.append('borderWidth', document.getElementById('borderWidth').value);
        
        // Textos - CORREGIDO para que coincida con imageGenerator.js
        activeTextElements.forEach((textElement, index) => {
            const num = index + 1;
            params.append(`texto${num}`, textElement.text);
            params.append(`textX${num}`, textElement.x);
            params.append(`textY${num}`, textElement.y);
            params.append(`textSize${num}`, textElement.size);
            params.append(`textColor${num}`, textElement.color.replace('#', ''));
            params.append(`textFont${num}`, textElement.font);
            params.append(`textStyle${num}`, textElement.style);
            if (textElement.shadow) {
                params.append(`textShadow${num}`, 'true');
            }
        });
        
        // Avatar principal - CORREGIDO
        const mainAvatarUrl = document.getElementById('mainAvatarUrl').value;
        if (mainAvatarUrl) {
            params.append('avatar', mainAvatarUrl);
            params.append('avatarX', document.getElementById('mainAvatarX').value);
            params.append('avatarY', document.getElementById('mainAvatarY').value);
            params.append('avatarSize', document.getElementById('mainAvatarSize').value);
            params.append('avatarShape', document.getElementById('mainAvatarShape').value);
            params.append('avatarBorderColor', document.getElementById('mainAvatarBorderColor').value.replace('#', ''));
            if (document.getElementById('mainAvatarGlow').checked) {
                params.append('avatarGlow', 'true');
            }
        }
        
        // Avatares adicionales
        for (let i = 1; i <= 4; i++) {
            const avatarUrl = document.getElementById(`avatarUrl${i}`);
            if (avatarUrl && avatarUrl.value) {
                params.append(`extraAvatar${i}`, avatarUrl.value);
                params.append(`extraAvatarX${i}`, document.getElementById(`avatarX${i}`).value);
                params.append(`extraAvatarY${i}`, document.getElementById(`avatarY${i}`).value);
                params.append(`extraAvatarSize${i}`, document.getElementById(`avatarSize${i}`).value);
                params.append(`extraAvatarShape${i}`, document.getElementById(`avatarShape${i}`).value);
            }
        }
        
        // Efectos - CORREGIDO
        const effectType = document.getElementById('globalEffect').value;
        if (effectType !== 'none') {
            params.append('effectType', effectType);
            params.append('effectIntensity', document.getElementById('effectIntensitySlider').value);
            // Añadir colores de efectos también para algunos tipos de efectos
            if (['gradient', 'sparkle', 'rays', 'cyberpunk', 'retro', 'grid'].includes(effectType)) {
                params.append('effectColor1', document.getElementById('effectColor1').value.replace('#', ''));
                params.append('effectColor2', document.getElementById('effectColor2').value.replace('#', ''));
            }
        }
        
        // Generar la URL
        const apiUrl = `${apiBaseUrl}?${params.toString()}`;
        apiUrlOutput.textContent = apiUrl;
        
        // Mostrar el contenedor de la URL
        document.getElementById('apiUrlContainer').style.display = 'block';
        
        // Animar para atraer la atención
        apiUrlOutput.classList.add('fadeIn');
        setTimeout(() => {
            apiUrlOutput.classList.remove('fadeIn');
        }, 500);
    }
    
    // Guardar el estado actual para deshacer/rehacer
    function saveCurrentState() {
        // Recolectar el estado actual del formulario
        const state = {
            canvasWidth: document.getElementById('canvasWidth').value,
            canvasHeight: document.getElementById('canvasHeight').value,
            bgType: document.getElementById('bgType').value,
            bgColor: document.getElementById('bgColor').value,
            bgGradientStart: document.getElementById('bgGradientStart').value,
            bgGradientEnd: document.getElementById('bgGradientEnd').value,
            bgGradientDirection: document.getElementById('bgGradientDirection').value,
            bgImageUrl: document.getElementById('bgImageUrl').value,
            bgImageOpacity: document.getElementById('bgImageOpacity').value,
            borderRadius: document.getElementById('borderRadius').value,
            borderColor: document.getElementById('borderColor').value,
            borderWidth: document.getElementById('borderWidth').value,
            textElements: JSON.parse(JSON.stringify(activeTextElements)),
            mainAvatarUrl: document.getElementById('mainAvatarUrl').value,
            mainAvatarX: document.getElementById('mainAvatarX').value,
            mainAvatarY: document.getElementById('mainAvatarY').value,
            mainAvatarSize: document.getElementById('mainAvatarSize').value,
            mainAvatarShape: document.getElementById('mainAvatarShape').value,
            mainAvatarBorderColor: document.getElementById('mainAvatarBorderColor').value,
            mainAvatarGlow: document.getElementById('mainAvatarGlow').checked,
            extraAvatars: [],
            globalEffect: document.getElementById('globalEffect').value,
            effectIntensity: document.getElementById('effectIntensitySlider').value,
            effectColor1: document.getElementById('effectColor1').value,
            effectColor2: document.getElementById('effectColor2').value
        };
        
        // Recolectar avatares adicionales
        for (let i = 1; i <= 4; i++) {
            const avatarUrl = document.getElementById(`avatarUrl${i}`);
            if (avatarUrl) {
                state.extraAvatars.push({
                    id: i,
                    url: avatarUrl.value,
                    x: document.getElementById(`avatarX${i}`).value,
                    y: document.getElementById(`avatarY${i}`).value,
                    size: document.getElementById(`avatarSize${i}`).value,
                    shape: document.getElementById(`avatarShape${i}`).value
                });
            }
        }
        
        // Si estamos en un punto diferente al final de la historia, eliminar los estados posteriores
        if (historyPosition !== configHistory.length - 1 && historyPosition !== -1) {
            configHistory = configHistory.slice(0, historyPosition + 1);
        }
        
        // Guardar el estado
        configHistory.push(JSON.parse(JSON.stringify(state)));
        historyPosition = configHistory.length - 1;
        
        // Habilitar/deshabilitar botones deshacer/rehacer
        updateUndoRedoButtons();
    }
    
    // Deshacer último cambio
    function undo() {
        if (historyPosition <= 0) return;
        
        historyPosition--;
        loadState(configHistory[historyPosition]);
        updateUndoRedoButtons();
    }
    
    // Rehacer cambio deshecho
    function redo() {
        if (historyPosition >= configHistory.length - 1) return;
        
        historyPosition++;
        loadState(configHistory[historyPosition]);
        updateUndoRedoButtons();
    }
    
    // Cargar un estado guardado
    function loadState(state) {
        // Restaurar dimensiones
        document.getElementById('canvasWidth').value = state.canvasWidth;
        document.getElementById('canvasHeight').value = state.canvasHeight;
        
        // Restaurar fondo
        document.getElementById('bgType').value = state.bgType;
        document.getElementById('bgColor').value = state.bgColor;
        document.getElementById('bgGradientStart').value = state.bgGradientStart;
        document.getElementById('bgGradientEnd').value = state.bgGradientEnd;
        document.getElementById('bgGradientDirection').value = state.bgGradientDirection;
        document.getElementById('bgImageUrl').value = state.bgImageUrl;
        document.getElementById('bgImageOpacity').value = state.bgImageOpacity;
        
        // Mostrar/ocultar opciones de fondo según el tipo
        document.getElementById('bgColorOptions').style.display = 'none';
        document.getElementById('bgGradientOptions').style.display = 'none';
        document.getElementById('bgImageOptions').style.display = 'none';
        
        switch (state.bgType) {
            case 'color':
                document.getElementById('bgColorOptions').style.display = 'block';
                break;
            case 'gradient':
                document.getElementById('bgGradientOptions').style.display = 'block';
                break;
            case 'image':
                document.getElementById('bgImageOptions').style.display = 'block';
                break;
        }
        
        // Restaurar borde
        document.getElementById('borderRadius').value = state.borderRadius;
        document.getElementById('borderRadius').nextElementSibling.textContent = state.borderRadius + 'px';
        document.getElementById('borderColor').value = state.borderColor;
        document.getElementById('borderWidth').value = state.borderWidth;
        document.getElementById('borderWidth').nextElementSibling.textContent = state.borderWidth + 'px';
        
        // Restaurar textos
        activeTextElements = JSON.parse(JSON.stringify(state.textElements));
        textElements.innerHTML = '';
        activeTextElements.forEach((textElement, index) => {
            addTextElement(textElement, index + 1);
        });
        
        // Restaurar avatar principal
        document.getElementById('mainAvatarUrl').value = state.mainAvatarUrl;
        document.getElementById('mainAvatarX').value = state.mainAvatarX;
        document.getElementById('mainAvatarX').nextElementSibling.textContent = state.mainAvatarX + 'px';
        document.getElementById('mainAvatarY').value = state.mainAvatarY;
        document.getElementById('mainAvatarY').nextElementSibling.textContent = state.mainAvatarY + 'px';
        document.getElementById('mainAvatarSize').value = state.mainAvatarSize;
        document.getElementById('mainAvatarSize').nextElementSibling.textContent = state.mainAvatarSize + 'px';
        document.getElementById('mainAvatarShape').value = state.mainAvatarShape;
        document.getElementById('mainAvatarBorderColor').value = state.mainAvatarBorderColor;
        document.getElementById('mainAvatarGlow').checked = state.mainAvatarGlow;
        
        // Restaurar avatares adicionales
        state.extraAvatars.forEach(avatar => {
            document.getElementById(`avatarUrl${avatar.id}`).value = avatar.url;
            document.getElementById(`avatarX${avatar.id}`).value = avatar.x;
            document.getElementById(`avatarX${avatar.id}`).nextElementSibling.textContent = avatar.x + 'px';
            document.getElementById(`avatarY${avatar.id}`).value = avatar.y;
            document.getElementById(`avatarY${avatar.id}`).nextElementSibling.textContent = avatar.y + 'px';
            document.getElementById(`avatarSize${avatar.id}`).value = avatar.size;
            document.getElementById(`avatarSize${avatar.id}`).nextElementSibling.textContent = avatar.size + 'px';
            document.getElementById(`avatarShape${avatar.id}`).value = avatar.shape;
        });
        
        // Restaurar efectos
        document.getElementById('globalEffect').value = state.globalEffect;
        document.getElementById('effectIntensitySlider').value = state.effectIntensity;
        document.getElementById('effectIntensitySlider').nextElementSibling.textContent = state.effectIntensity;
        document.getElementById('effectColor1').value = state.effectColor1;
        document.getElementById('effectColor2').value = state.effectColor2;
        
        // Actualizar vista previa
        updatePreview();
    }
    
    // Actualizar estado de botones deshacer/rehacer
    function updateUndoRedoButtons() {
        undoBtn.disabled = historyPosition <= 0;
        redoBtn.disabled = historyPosition >= configHistory.length - 1;
    }
    
    // CSS keyframes para animaciones
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes sparkle {
            0% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0); }
        }
        
        @keyframes rays {
            0% { background-position: 0% 0%; }
            50% { background-position: 100% 100%; }
            100% { background-position: 0% 0%; }
        }
    `;
    document.head.appendChild(styleSheet);
});
