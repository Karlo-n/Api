// State Management
const state = {
    history: [],
    currentState: null,
    future: [],
    maxTextElements: 10,
    textCount: 0
};

// Initialize with default state
function initializeState() {
    state.currentState = {
        canvas: {
            width: 800,
            height: 400
        },
        background: {
            type: 'color',
            color: '#1e1e2e',
            gradientStart: '#1e1e2e',
            gradientEnd: '#2d2b42',
            gradientDirection: 'to right',
            imageUrl: '',
            imageOpacity: 0.5
        },
        border: {
            radius: 25,
            color: '#bd5dff',
            width: 3
        },
        mainAvatar: {
            url: '',
            x: 400,
            y: 133,
            size: 80,
            shape: 'circle',
            borderColor: '#ffffff',
            glow: true
        },
        extraAvatars: [
            {
                url: '',
                x: 200,
                y: 200,
                size: 50,
                shape: 'circle'
            },
            {
                url: '',
                x: 300,
                y: 300,
                size: 50,
                shape: 'circle'
            },
            {
                url: '',
                x: 500,
                y: 300,
                size: 50,
                shape: 'circle'
            },
            {
                url: '',
                x: 600,
                y: 200,
                size: 50,
                shape: 'circle'
            }
        ],
        textElements: [],
        effects: {
            type: 'none',
            intensity: 0.5,
            color1: '#9966ff',
            color2: '#66ccff'
        }
    };
    saveState();
    updateUI();
}

// Save current state to history
function saveState() {
    state.history.push(JSON.stringify(state.currentState));
    state.future = [];
    updateUndoRedoButtons();
}

// Undo the last action
function undo() {
    if (state.history.length > 1) {
        state.future.push(state.history.pop());
        state.currentState = JSON.parse(state.history[state.history.length - 1]);
        updateUI();
        updateUndoRedoButtons();
    }
}

// Redo the last undone action
function redo() {
    if (state.future.length > 0) {
        const nextState = state.future.pop();
        state.history.push(nextState);
        state.currentState = JSON.parse(nextState);
        updateUI();
        updateUndoRedoButtons();
    }
}

// Update the UI based on the current state
function updateUI() {
    // Update canvas dimensions
    document.getElementById('canvasWidth').value = state.currentState.canvas.width;
    document.getElementById('canvasHeight').value = state.currentState.canvas.height;
    document.getElementById('previewCanvas').style.width = state.currentState.canvas.width + 'px';
    document.getElementById('previewCanvas').style.height = state.currentState.canvas.height + 'px';
    
    // Update background
    document.getElementById('bgType').value = state.currentState.background.type;
    document.getElementById('bgColor').value = state.currentState.background.color;
    document.getElementById('bgGradientStart').value = state.currentState.background.gradientStart;
    document.getElementById('bgGradientEnd').value = state.currentState.background.gradientEnd;
    document.getElementById('bgGradientDirection').value = state.currentState.background.gradientDirection;
    document.getElementById('bgImageUrl').value = state.currentState.background.imageUrl;
    document.getElementById('bgImageOpacity').value = state.currentState.background.imageOpacity;
    
    // Toggle background options
    document.getElementById('bgColorOptions').style.display = state.currentState.background.type === 'color' ? 'block' : 'none';
    document.getElementById('bgGradientOptions').style.display = state.currentState.background.type === 'gradient' ? 'block' : 'none';
    document.getElementById('bgImageOptions').style.display = state.currentState.background.type === 'image' ? 'block' : 'none';
    
    // Update border
    document.getElementById('borderRadius').value = state.currentState.border.radius;
    document.getElementById('borderColor').value = state.currentState.border.color;
    document.getElementById('borderWidth').value = state.currentState.border.width;
    
    // Update main avatar
    document.getElementById('mainAvatarUrl').value = state.currentState.mainAvatar.url;
    document.getElementById('mainAvatarX').value = state.currentState.mainAvatar.x;
    document.getElementById('mainAvatarY').value = state.currentState.mainAvatar.y;
    document.getElementById('mainAvatarSize').value = state.currentState.mainAvatar.size;
    document.getElementById('mainAvatarShape').value = state.currentState.mainAvatar.shape;
    document.getElementById('mainAvatarBorderColor').value = state.currentState.mainAvatar.borderColor;
    document.getElementById('mainAvatarGlow').checked = state.currentState.mainAvatar.glow;
    
    // Update extra avatars
    state.currentState.extraAvatars.forEach((avatar, index) => {
        document.getElementById(`avatarUrl${index+1}`).value = avatar.url;
        document.getElementById(`avatarX${index+1}`).value = avatar.x;
        document.getElementById(`avatarY${index+1}`).value = avatar.y;
        document.getElementById(`avatarSize${index+1}`).value = avatar.size;
        document.getElementById(`avatarShape${index+1}`).value = avatar.shape;
    });
    
    // Update effects
    document.getElementById('globalEffect').value = state.currentState.effects.type;
    document.getElementById('effectIntensitySlider').value = state.currentState.effects.intensity;
    document.getElementById('effectColor1').value = state.currentState.effects.color1;
    document.getElementById('effectColor2').value = state.currentState.effects.color2;
    
    // Update range value displays
    document.querySelectorAll('input[type="range"]').forEach(input => {
        const valueDisplay = input.nextElementSibling;
        if (valueDisplay && valueDisplay.classList.contains('range-value')) {
            valueDisplay.textContent = input.id.includes('Opacity') ? input.value : `${input.value}px`;
        }
    });
    
    // Rebuild text elements section
    rebuildTextElements();
    
    // Update the preview
    updatePreview();
}

// Update undo/redo buttons
function updateUndoRedoButtons() {
    document.getElementById('undoBtn').disabled = state.history.length <= 1;
    document.getElementById('redoBtn').disabled = state.future.length === 0;
}

// Rebuild text elements UI
function rebuildTextElements() {
    const container = document.getElementById('textElements');
    container.innerHTML = '';
    state.textCount = state.currentState.textElements.length;
    
    state.currentState.textElements.forEach((textEl, index) => {
        const element = document.createElement('div');
        element.className = 'text-element';
        element.dataset.index = index;
        
        element.innerHTML = `
            <div class="text-element-header">
                <h4>Texto ${index + 1}</h4>
                <button class="remove-btn" data-index="${index}">×</button>
            </div>
            <div class="form-group">
                <label for="textContent${index}">Contenido:</label>
                <input type="text" id="textContent${index}" value="${textEl.content}" placeholder="Contenido del texto">
            </div>
            <div class="form-group">
                <label for="textX${index}">Posición X:</label>
                <input type="range" id="textX${index}" min="0" max="${state.currentState.canvas.width}" value="${textEl.x}">
                <div class="range-value">${textEl.x}px</div>
            </div>
            <div class="form-group">
                <label for="textY${index}">Posición Y:</label>
                <input type="range" id="textY${index}" min="0" max="${state.currentState.canvas.height}" value="${textEl.y}">
                <div class="range-value">${textEl.y}px</div>
            </div>
            <div class="form-group">
                <label for="textSize${index}">Tamaño:</label>
                <input type="range" id="textSize${index}" min="10" max="80" value="${textEl.size}">
                <div class="range-value">${textEl.size}px</div>
            </div>
            <div class="form-group">
                <label for="textColor${index}">Color:</label>
                <input type="color" id="textColor${index}" value="${textEl.color}">
            </div>
            <div class="form-group">
                <label for="textFont${index}">Fuente:</label>
                <select id="textFont${index}">
                    <option value="Arial" ${textEl.font === 'Arial' ? 'selected' : ''}>Arial</option>
                    <option value="Verdana" ${textEl.font === 'Verdana' ? 'selected' : ''}>Verdana</option>
                    <option value="Georgia" ${textEl.font === 'Georgia' ? 'selected' : ''}>Georgia</option>
                    <option value="Times New Roman" ${textEl.font === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                    <option value="Courier New" ${textEl.font === 'Courier New' ? 'selected' : ''}>Courier New</option>
                    <option value="Impact" ${textEl.font === 'Impact' ? 'selected' : ''}>Impact</option>
                    <option value="Comic Sans MS" ${textEl.font === 'Comic Sans MS' ? 'selected' : ''}>Comic Sans MS</option>
                    <option value="Oswald" ${textEl.font === 'Oswald' ? 'selected' : ''}>Oswald</option>
                    <option value="Roboto" ${textEl.font === 'Roboto' ? 'selected' : ''}>Roboto</option>
                    <option value="Montserrat" ${textEl.font === 'Montserrat' ? 'selected' : ''}>Montserrat</option>
                </select>
            </div>
            <div class="form-group">
                <label for="textStyle${index}">Estilo:</label>
                <select id="textStyle${index}">
                    <option value="normal" ${textEl.style === 'normal' ? 'selected' : ''}>Normal</option>
                    <option value="italic" ${textEl.style === 'italic' ? 'selected' : ''}>Cursiva</option>
                    <option value="bold" ${textEl.style === 'bold' ? 'selected' : ''}>Negrita</option>
                    <option value="bold italic" ${textEl.style === 'bold italic' ? 'selected' : ''}>Negrita Cursiva</option>
                </select>
            </div>
            <div class="form-group">
                <label for="textShadow${index}">Sombra:</label>
                <input type="checkbox" id="textShadow${index}" ${textEl.shadow ? 'checked' : ''}>
            </div>
        `;
        
        container.appendChild(element);
        
        // Add event listeners for the text element
        const textContent = document.getElementById(`textContent${index}`);
        textContent.addEventListener('change', () => {
            state.currentState.textElements[index].content = textContent.value;
            saveState();
            updatePreview();
        });
        
        const textX = document.getElementById(`textX${index}`);
        textX.addEventListener('input', () => {
            state.currentState.textElements[index].x = parseInt(textX.value);
            textX.nextElementSibling.textContent = `${textX.value}px`;
            updatePreview();
        });
        textX.addEventListener('change', () => {
            saveState();
        });
        
        const textY = document.getElementById(`textY${index}`);
        textY.addEventListener('input', () => {
            state.currentState.textElements[index].y = parseInt(textY.value);
            textY.nextElementSibling.textContent = `${textY.value}px`;
            updatePreview();
        });
        textY.addEventListener('change', () => {
            saveState();
        });
        
        const textSize = document.getElementById(`textSize${index}`);
        textSize.addEventListener('input', () => {
            state.currentState.textElements[index].size = parseInt(textSize.value);
            textSize.nextElementSibling.textContent = `${textSize.value}px`;
            updatePreview();
        });
        textSize.addEventListener('change', () => {
            saveState();
        });
        
        const textColor = document.getElementById(`textColor${index}`);
        textColor.addEventListener('change', () => {
            state.currentState.textElements[index].color = textColor.value;
            saveState();
            updatePreview();
        });
        
        const textFont = document.getElementById(`textFont${index}`);
        textFont.addEventListener('change', () => {
            state.currentState.textElements[index].font = textFont.value;
            saveState();
            updatePreview();
        });
        
        const textStyle = document.getElementById(`textStyle${index}`);
        textStyle.addEventListener('change', () => {
            state.currentState.textElements[index].style = textStyle.value;
            saveState();
            updatePreview();
        });
        
        const textShadow = document.getElementById(`textShadow${index}`);
        textShadow.addEventListener('change', () => {
            state.currentState.textElements[index].shadow = textShadow.checked;
            saveState();
            updatePreview();
        });
        
        // Add remove button event listener
        const removeBtn = element.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            state.currentState.textElements.splice(index, 1);
            saveState();
            rebuildTextElements();
            updatePreview();
        });
    });
    
    // Update the "Add Text" button state
    document.getElementById('addTextBtn').disabled = state.textCount >= state.maxTextElements;
}

// Add a new text element
function addTextElement() {
    if (state.textCount < state.maxTextElements) {
        const newText = {
            content: `Texto ${state.textCount + 1}`,
            x: state.currentState.canvas.width / 2,
            y: 200 + (state.textCount * 30),
            size: 30,
            color: '#ffffff',
            font: 'Arial',
            style: 'normal',
            shadow: false
        };
        
        state.currentState.textElements.push(newText);
        saveState();
        rebuildTextElements();
        updatePreview();
    }
}

// Update the preview with current state
function updatePreview() {
    const canvas = document.getElementById('previewCanvas');
    canvas.style.width = state.currentState.canvas.width + 'px';
    canvas.style.height = state.currentState.canvas.height + 'px';
    canvas.style.borderRadius = state.currentState.border.radius + 'px';
    
    // Update background
    const bgDiv = document.getElementById('previewBackground');
    switch (state.currentState.background.type) {
        case 'color':
            bgDiv.style.background = state.currentState.background.color;
            break;
        case 'gradient':
            bgDiv.style.background = `linear-gradient(${state.currentState.background.gradientDirection}, ${state.currentState.background.gradientStart}, ${state.currentState.background.gradientEnd})`;
            break;
        case 'image':
            if (state.currentState.background.imageUrl) {
                bgDiv.style.background = `url(${state.currentState.background.imageUrl})`;
                bgDiv.style.backgroundSize = 'cover';
                bgDiv.style.backgroundPosition = 'center';
                bgDiv.style.opacity = state.currentState.background.imageOpacity;
            } else {
                bgDiv.style.background = 'none';
            }
            break;
    }
    
    // Update border
    canvas.style.border = `${state.currentState.border.width}px solid ${state.currentState.border.color}`;
    
    // Update text elements
    const textsDiv = document.getElementById('previewTexts');
    textsDiv.innerHTML = '';
    
    state.currentState.textElements.forEach(text => {
        const textDiv = document.createElement('div');
        textDiv.style.position = 'absolute';
        textDiv.style.left = `${text.x}px`;
        textDiv.style.top = `${text.y}px`;
        textDiv.style.transform = 'translate(-50%, -50%)';
        textDiv.style.fontFamily = text.font;
        textDiv.style.fontSize = `${text.size}px`;
        textDiv.style.color = text.color;
        textDiv.style.fontStyle = text.style.includes('italic') ? 'italic' : 'normal';
        textDiv.style.fontWeight = text.style.includes('bold') ? 'bold' : 'normal';
        
        if (text.shadow) {
            textDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        }
        
        textDiv.textContent = text.content;
        textsDiv.appendChild(textDiv);
    });
    
    // Update avatars
    const avatarsDiv = document.getElementById('previewAvatars');
    avatarsDiv.innerHTML = '';
    
    // Main avatar
    if (state.currentState.mainAvatar.url) {
        const mainAvatarDiv = document.createElement('div');
        mainAvatarDiv.style.position = 'absolute';
        mainAvatarDiv.style.left = `${state.currentState.mainAvatar.x}px`;
        mainAvatarDiv.style.top = `${state.currentState.mainAvatar.y}px`;
        mainAvatarDiv.style.width = `${state.currentState.mainAvatar.size * 2}px`;
        mainAvatarDiv.style.height = `${state.currentState.mainAvatar.size * 2}px`;
        mainAvatarDiv.style.transform = 'translate(-50%, -50%)';
        mainAvatarDiv.style.border = `3px solid ${state.currentState.mainAvatar.borderColor}`;
        
        // Apply different shapes
        applyAvatarShape(mainAvatarDiv, state.currentState.mainAvatar.shape);
        
        // Add background image
        mainAvatarDiv.style.backgroundImage = `url(${state.currentState.mainAvatar.url})`;
        mainAvatarDiv.style.backgroundSize = 'cover';
        mainAvatarDiv.style.backgroundPosition = 'center';
        
        // Add glow effect if enabled
        if (state.currentState.mainAvatar.glow) {
            mainAvatarDiv.style.boxShadow = '0 0 15px rgba(153, 102, 255, 0.7), 0 0 30px rgba(102, 204, 255, 0.5)';
        }
        
        avatarsDiv.appendChild(mainAvatarDiv);
    }
    
    // Extra avatars
    state.currentState.extraAvatars.forEach((avatar, index) => {
        if (avatar.url) {
            const avatarDiv = document.createElement('div');
            avatarDiv.style.position = 'absolute';
            avatarDiv.style.left = `${avatar.x}px`;
            avatarDiv.style.top = `${avatar.y}px`;
            avatarDiv.style.width = `${avatar.size * 2}px`;
            avatarDiv.style.height = `${avatar.size * 2}px`;
            avatarDiv.style.transform = 'translate(-50%, -50%)';
            avatarDiv.style.border = '2px solid white';
            
            // Apply different shapes
            applyAvatarShape(avatarDiv, avatar.shape);
            
            // Add background image
            avatarDiv.style.backgroundImage = `url(${avatar.url})`;
            avatarDiv.style.backgroundSize = 'cover';
            avatarDiv.style.backgroundPosition = 'center';
            
            avatarsDiv.appendChild(avatarDiv);
        }
    });
    
    // Apply effects
    updateEffects();
}

// Apply avatar shape
function applyAvatarShape(element, shape) {
    switch (shape) {
        case 'circle':
            element.style.borderRadius = '50%';
            element.style.clipPath = 'none';
            break;
        case 'square':
            element.style.borderRadius = '0%';
            element.style.clipPath = 'none';
            break;
        case 'triangle':
            element.style.borderRadius = '0%';
            element.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
            break;
        case 'pentagon':
            element.style.clipPath = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
            break;
        case 'hexagon':
            element.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
            break;
        case 'octagon':
            element.style.clipPath = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
            break;
        case 'star':
            element.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
            break;
        case 'heart':
            element.style.clipPath = 'path("M0 200 v-200 h200 a100,100 90 0,1 0,200 a100,100 90 0,1 -200,0 z")';
            break;
        case 'diamond':
            element.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
            break;
        case 'custom':
            // More complex shapes could be added here
            element.style.clipPath = 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)';
            break;
    }
}

// Generate the API URL
function generateApiUrl() {
    // URL base con el dominio completo
    let baseUrl = 'https://api.apikarl.com/api/utility/bienvenida/bienvenida-styled?';
    const params = [];
    
    // Add avatar URL - Manejo especial para variables BDFD
    if (state.currentState.mainAvatar.url) {
        // Comprobar si es una variable BDFD (comienza con $)
        if (state.currentState.mainAvatar.url.startsWith('$')) {
            // No codificar las variables BDFD, pasarlas directamente
            params.push(`avatar=${state.currentState.mainAvatar.url}`);
        } else {
            params.push(`avatar=${encodeURIComponent(state.currentState.mainAvatar.url)}`);
        }
    } else {
        alert('¡Necesitas proporcionar una URL para el avatar principal!');
        return;
    }
    
    // Add background settings - Manejo especial para variables BDFD
    if (state.currentState.background.type === 'image' && state.currentState.background.imageUrl) {
        if (state.currentState.background.imageUrl.startsWith('$')) {
            params.push(`background=${state.currentState.background.imageUrl}`);
        } else {
            params.push(`background=${encodeURIComponent(state.currentState.background.imageUrl)}`);
        }
    } else if (state.currentState.background.type === 'color') {
        params.push(`bgColor=${encodeURIComponent(state.currentState.background.color.replace('#', ''))}`);
    } else if (state.currentState.background.type === 'gradient') {
        params.push(`bgGradient=${encodeURIComponent(state.currentState.background.gradientStart.replace('#', ''))}:${encodeURIComponent(state.currentState.background.gradientEnd.replace('#', ''))}`);
        params.push(`bgGradientDir=${encodeURIComponent(state.currentState.background.gradientDirection)}`);
    }
    
    // Add text elements (up to 3 for the basic API) - Manejo especial para variables BDFD
    for (let i = 0; i < Math.min(3, state.currentState.textElements.length); i++) {
        const textContent = state.currentState.textElements[i].content;
        if (textContent.includes('$')) {
            // Si contiene variables BDFD, no codificar el texto completo
            params.push(`texto${i+1}=${textContent}`);
        } else {
            params.push(`texto${i+1}=${encodeURIComponent(textContent)}`);
        }
    }
    
    // If less than 3 text elements, add empty ones
    for (let i = state.currentState.textElements.length; i < 3; i++) {
        params.push(`texto${i+1}=`);
    }
    
    // Add additional parameters
    params.push(`borderRadius=${state.currentState.border.radius}`);
    params.push(`borderColor=${encodeURIComponent(state.currentState.border.color.replace('#', ''))}`);
    params.push(`borderWidth=${state.currentState.border.width}`);
    params.push(`avatarSize=${state.currentState.mainAvatar.size}`);
    params.push(`avatarShape=${state.currentState.mainAvatar.shape}`);
    params.push(`effectType=${state.currentState.effects.type}`);
    params.push(`effectIntensity=${state.currentState.effects.intensity}`);
    
    // Include extra avatars if they have URLs - Manejo especial para variables BDFD
    state.currentState.extraAvatars.forEach((avatar, index) => {
        if (avatar.url) {
            if (avatar.url.startsWith('$')) {
                params.push(`extraAvatar${index+1}=${avatar.url}`);
            } else {
                params.push(`extraAvatar${index+1}=${encodeURIComponent(avatar.url)}`);
            }
            params.push(`extraAvatarX${index+1}=${avatar.x}`);
            params.push(`extraAvatarY${index+1}=${avatar.y}`);
            params.push(`extraAvatarSize${index+1}=${avatar.size}`);
            params.push(`extraAvatarShape${index+1}=${avatar.shape}`);
        }
    });
    
    // Include additional text parameters
    state.currentState.textElements.forEach((text, index) => {
        params.push(`textX${index+1}=${text.x}`);
        params.push(`textY${index+1}=${text.y}`);
        params.push(`textSize${index+1}=${text.size}`);
        params.push(`textColor${index+1}=${encodeURIComponent(text.color.replace('#', ''))}`);
        params.push(`textFont${index+1}=${encodeURIComponent(text.font)}`);
        params.push(`textStyle${index+1}=${encodeURIComponent(text.style)}`);
        if (text.shadow) {
            params.push(`textShadow${index+1}=true`);
        }
    });
    
    const apiUrl = baseUrl + params.join('&');
    
    // Show the generated URL
    const apiUrlOutput = document.getElementById('apiUrlOutput');
    apiUrlOutput.textContent = apiUrl;
    document.getElementById('apiUrlContainer').style.display = 'block';
    
    // Scroll to the URL container
    document.getElementById('apiUrlContainer').scrollIntoView({ behavior: 'smooth' });
}

// Update the effects
function updateEffects() {
    const effectsDiv = document.getElementById('previewEffects');
    const effectOverlay = document.getElementById('imageEffectOverlay');
    effectsDiv.innerHTML = '';
    effectOverlay.innerHTML = '';
    effectOverlay.style = ''; // Reset previous styles
    
    // Apply global effect
    switch (state.currentState.effects.type) {
        case 'glow':
            effectOverlay.style.boxShadow = `inset 0 0 ${30 * state.currentState.effects.intensity}px ${state.currentState.effects.color1}, 0 0 ${20 * state.currentState.effects.intensity}px ${state.currentState.effects.color2}`;
            break;
        case 'sparkle':
            // Create sparkle effect
            const numSparkles = Math.floor(20 * state.currentState.effects.intensity);
            
            for (let i = 0; i < numSparkles; i++) {
                const sparkle = document.createElement('div');
                const size = Math.random() * 5 + 2;
                sparkle.style.position = 'absolute';
                sparkle.style.width = `${size}px`;
                sparkle.style.height = `${size}px`;
                sparkle.style.backgroundColor = Math.random() > 0.5 ? state.currentState.effects.color1 : state.currentState.effects.color2;
                sparkle.style.borderRadius = '50%';
                sparkle.style.left = `${Math.random() * 100}%`;
                sparkle.style.top = `${Math.random() * 100}%`;
                sparkle.style.boxShadow = `0 0 ${size * 2}px ${sparkle.style.backgroundColor}`;
                sparkle.style.animation = `sparkle ${Math.random() * 3 + 1}s infinite alternate`;
                effectOverlay.appendChild(sparkle);
            }
            
            // Add keyframes for sparkle animation
            if (!document.getElementById('sparkleAnimation')) {
                const style = document.createElement('style');
                style.id = 'sparkleAnimation';
                style.innerHTML = `
                    @keyframes sparkle {
                        0% { opacity: 0.2; transform: scale(1); }
                        100% { opacity: 1; transform: scale(1.5); }
                    }
                `;
                document.head.appendChild(style);
            }
            break;
        case 'gradient':
            // Create a gradient overlay
            const intensityHex = Math.floor(state.currentState.effects.intensity * 80).toString(16).padStart(2, '0');
            effectOverlay.style.background = `linear-gradient(135deg, ${state.currentState.effects.color1}${intensityHex}, ${state.currentState.effects.color2}${intensityHex})`;
            effectOverlay.style.mixBlendMode = 'overlay';
            break;
        case 'noise':
            // Create canvas for noise effect
            if (!document.getElementById('noiseCanvas')) {
                const canvas = document.createElement('canvas');
                canvas.id = 'noiseCanvas';
                canvas.width = 200;
                canvas.height = 200;
                document.body.appendChild(canvas);
                
                const ctx = canvas.getContext('2d');
                const imgData = ctx.createImageData(200, 200);
                const data = imgData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    const value = Math.floor(Math.random() * 255);
                    data[i] = value;
                    data[i + 1] = value;
                    data[i + 2] = value;
                    data[i + 3] = Math.random() * 50;
                }
                
                ctx.putImageData(imgData, 0, 0);
                canvas.style.display = 'none';
            }
            
            effectOverlay.style.backgroundImage = 'url(' + document.getElementById('noiseCanvas').toDataURL() + ')';
            effectOverlay.style.opacity = state.currentState.effects.intensity;
            effectOverlay.style.mixBlendMode = 'overlay';
            break;
        case 'vignette':
            effectOverlay.style.boxShadow = `inset 0 0 ${150 * state.currentState.effects.intensity}px rgba(0,0,0,0.8)`;
            break;
        case 'rays':
            const numRays = Math.floor(12 * state.currentState.effects.intensity);
            
            for (let i = 0; i < numRays; i++) {
                const ray = document.createElement('div');
                ray.style.position = 'absolute';
                ray.style.width = '3px';
                ray.style.height = '100%';
                ray.style.left = '50%';
                ray.style.top = '0';
                ray.style.backgroundColor = Math.random() > 0.5 ? state.currentState.effects.color1 : state.currentState.effects.color2;
                ray.style.transform = `rotate(${(i * 360 / numRays)}deg)`;
                ray.style.transformOrigin = 'center center';
                ray.style.opacity = '0.3';
                effectOverlay.appendChild(ray);
            }
            break;
        case 'grid':
            // Create a grid overlay
            const gridSize = Math.floor(20 / state.currentState.effects.intensity);
            effectOverlay.style.backgroundImage = `
                linear-gradient(to right, ${state.currentState.effects.color1}20 1px, transparent 1px),
                linear-gradient(to bottom, ${state.currentState.effects.color2}20 1px, transparent 1px)
            `;
            effectOverlay.style.backgroundSize = `${gridSize}px ${gridSize}px`;
            break;
        case 'cyberpunk':
            // Create cyberpunk effect with glitchy scanlines
            effectOverlay.style.background = `
                linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%),
                linear-gradient(90deg, ${state.currentState.effects.color1}10, ${state.currentState.effects.color2}10)
            `;
            effectOverlay.style.backgroundSize = `100% 4px, 100% 100%`;
            
            // Add horizontal color bars
            const glitchBar = document.createElement('div');
            glitchBar.style.position = 'absolute';
            glitchBar.style.width = '100%';
            glitchBar.style.height = '5px';
            glitchBar.style.top = `${Math.random() * 100}%`;
            glitchBar.style.backgroundColor = state.currentState.effects.color1;
            glitchBar.style.opacity = '0.7';
            effectOverlay.appendChild(glitchBar);
            
            const glitchBar2 = document.createElement('div');
            glitchBar2.style.position = 'absolute';
            glitchBar2.style.width = '100%';
            glitchBar2.style.height = '3px';
            glitchBar2.style.top = `${Math.random() * 100}%`;
            glitchBar2.style.backgroundColor = state.currentState.effects.color2;
            glitchBar2.style.opacity = '0.5';
            effectOverlay.appendChild(glitchBar2);
            break;
        case 'retro':
            // Create retro wave sun and grid effect
            const sunDiv = document.createElement('div');
            sunDiv.style.position = 'absolute';
            sunDiv.style.width = '300px';
            sunDiv.style.height = '150px';
            sunDiv.style.bottom = '0';
            sunDiv.style.left = '50%';
            sunDiv.style.transform = 'translateX(-50%)';
            sunDiv.style.background = `radial-gradient(ellipse at center, ${state.currentState.effects.color1} 0%, transparent 70%)`;
            sunDiv.style.opacity = state.currentState.effects.intensity.toString();
            effectOverlay.appendChild(sunDiv);
            
            // Add grid perspective
            const gridDiv = document.createElement('div');
            gridDiv.style.position = 'absolute';
            gridDiv.style.width = '100%';
            gridDiv.style.height = '50%';
            gridDiv.style.bottom = '0';
            gridDiv.style.perspective = '500px';
            
            const innerGrid = document.createElement('div');
            innerGrid.style.width = '100%';
            innerGrid.style.height = '100%';
            innerGrid.style.background = `
                linear-gradient(to right, ${state.currentState.effects.color2}40 1px, transparent 1px),
                linear-gradient(to bottom, ${state.currentState.effects.color2}40 1px, transparent 1px)
            `;
            innerGrid.style.backgroundSize = '40px 40px';
            innerGrid.style.transform = 'rotateX(60deg)';
            innerGrid.style.transformOrigin = 'center bottom';
            
            gridDiv.appendChild(innerGrid);
            effectOverlay.appendChild(gridDiv);
            break;
    }
}

// Copy API URL to clipboard
function copyApiUrl() {
    const apiUrl = document.getElementById('apiUrlOutput').textContent;
    
    // Create a temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = apiUrl;
    document.body.appendChild(tempInput);
    
    // Select and copy the URL
    tempInput.select();
    document.execCommand('copy');
    
    // Remove the temporary input element
    document.body.removeChild(tempInput);
    
    // Change button text temporarily
    const copyBtn = document.getElementById('copyBtn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '¡Copiado!';
    
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
}

// === Event listeners setup ===
document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Show the corresponding tab content
            const tabId = tab.dataset.tab + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Background type change
    document.getElementById('bgType').addEventListener('change', function() {
        document.getElementById('bgColorOptions').style.display = this.value === 'color' ? 'block' : 'none';
        document.getElementById('bgGradientOptions').style.display = this.value === 'gradient' ? 'block' : 'none';
        document.getElementById('bgImageOptions').style.display = this.value === 'image' ? 'block' : 'none';
        
        state.currentState.background.type = this.value;
        saveState();
        updatePreview();
    });
    
    // Canvas dimensions
    document.getElementById('canvasWidth').addEventListener('change', function() {
        state.currentState.canvas.width = parseInt(this.value);
        saveState();
        updatePreview();
    });
    
    document.getElementById('canvasHeight').addEventListener('change', function() {
        state.currentState.canvas.height = parseInt(this.value);
        saveState();
        updatePreview();
    });
    
    // Background color
    document.getElementById('bgColor').addEventListener('change', function() {
        state.currentState.background.color = this.value;
        saveState();
        updatePreview();
    });
    
    // Background gradient
    document.getElementById('bgGradientStart').addEventListener('change', function() {
        state.currentState.background.gradientStart = this.value;
        saveState();
        updatePreview();
    });
    
    document.getElementById('bgGradientEnd').addEventListener('change', function() {
        state.currentState.background.gradientEnd = this.value;
        saveState();
        updatePreview();
    });
    
    document.getElementById('bgGradientDirection').addEventListener('change', function() {
        state.currentState.background.gradientDirection = this.value;
        saveState();
        updatePreview();
    });
    
    // Background image
    document.getElementById('bgImageUrl').addEventListener('change', function() {
        state.currentState.background.imageUrl = this.value;
        saveState();
        updatePreview();
    });
    
    document.getElementById('bgImageOpacity').addEventListener('input', function() {
        state.currentState.background.imageOpacity = parseFloat(this.value);
        this.nextElementSibling.textContent = this.value;
        updatePreview();
    });
    
    document.getElementById('bgImageOpacity').addEventListener('change', function() {
        saveState();
    });
    
    // Border settings
    document.getElementById('borderRadius').addEventListener('input', function() {
        state.currentState.border.radius = parseInt(this.value);
        this.nextElementSibling.textContent = `${this.value}px`;
        updatePreview();
    });
    
    document.getElementById('borderRadius').addEventListener('change', function() {
        saveState();
    });
    
    document.getElementById('borderColor').addEventListener('change', function() {
        state.currentState.border.color = this.value;
        saveState();
        updatePreview();
    });
    
    document.getElementById('borderWidth').addEventListener('input', function() {
        state.currentState.border.width = parseInt(this.value);
        this.nextElementSibling.textContent = `${this.value}px`;
        updatePreview();
    });
    
    document.getElementById('borderWidth').addEventListener('change', function() {
        saveState();
    });
    
    // Main avatar settings
    document.getElementById('mainAvatarUrl').addEventListener('change', function() {
        state.currentState.mainAvatar.url = this.value;
        saveState();
        updatePreview();
    });
    
    document.getElementById('mainAvatarX').addEventListener('input', function() {
        state.currentState.mainAvatar.x = parseInt(this.value);
        this.nextElementSibling.textContent = `${this.value}px`;
        updatePreview();
    });
    
    document.getElementById('mainAvatarX').addEventListener('change', function() {
        saveState();
    });
    
    document.getElementById('mainAvatarY').addEventListener('input', function() {
        state.currentState.mainAvatar.y = parseInt(this.value);
        this.nextElementSibling.textContent = `${this.value}px`;
        updatePreview();
    });
    
    document.getElementById('mainAvatarY').addEventListener('change', function() {
        saveState();
    });
    
    document.getElementById('mainAvatarSize').addEventListener('input', function() {
        state.currentState.mainAvatar.size = parseInt(this.value);
        this.nextElementSibling.textContent = `${this.value}px`;
        updatePreview();
    });
    
    document.getElementById('mainAvatarSize').addEventListener('change', function() {
        saveState();
    });
    
    document.getElementById('mainAvatarShape').addEventListener('change', function() {
        state.currentState.mainAvatar.shape = this.value;
        saveState();
        updatePreview();
    });
    
    document.getElementById('mainAvatarBorderColor').addEventListener('change', function() {
        state.currentState.mainAvatar.borderColor = this.value;
        saveState();
        updatePreview();
    });
    
    document.getElementById('mainAvatarGlow').addEventListener('change', function() {
        state.currentState.mainAvatar.glow = this.checked;
        saveState();
        updatePreview();
    });
    
    // Extra avatar settings
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`avatarUrl${i}`).addEventListener('change', function() {
            state.currentState.extraAvatars[i-1].url = this.value;
            saveState();
            updatePreview();
        });
        
        document.getElementById(`avatarX${i}`).addEventListener('input', function() {
            state.currentState.extraAvatars[i-1].x = parseInt(this.value);
            this.nextElementSibling.textContent = `${this.value}px`;
            updatePreview();
        });
        
        document.getElementById(`avatarX${i}`).addEventListener('change', function() {
            saveState();
        });
        
        document.getElementById(`avatarY${i}`).addEventListener('input', function() {
            state.currentState.extraAvatars[i-1].y = parseInt(this.value);
            this.nextElementSibling.textContent = `${this.value}px`;
            updatePreview();
        });
        
        document.getElementById(`avatarY${i}`).addEventListener('change', function() {
            saveState();
        });
        
        document.getElementById(`avatarSize${i}`).addEventListener('input', function() {
            state.currentState.extraAvatars[i-1].size = parseInt(this.value);
            this.nextElementSibling.textContent = `${this.value}px`;
            updatePreview();
        });
        
        document.getElementById(`avatarSize${i}`).addEventListener('change', function() {
            saveState();
        });
        
        document.getElementById(`avatarShape${i}`).addEventListener('change', function() {
            state.currentState.extraAvatars[i-1].shape = this.value;
            saveState();
            updatePreview();
        });
    }
    
    // Effects settings
    document.getElementById('globalEffect').addEventListener('change', function() {
        state.currentState.effects.type = this.value;
        saveState();
        updatePreview();
    });
    
    document.getElementById('effectIntensitySlider').addEventListener('input', function() {
        state.currentState.effects.intensity = parseFloat(this.value);
        this.nextElementSibling.textContent = this.value;
        updatePreview();
    });
    
    document.getElementById('effectIntensitySlider').addEventListener('change', function() {
        saveState();
    });
    
    document.getElementById('effectColor1').addEventListener('change', function() {
        state.currentState.effects.color1 = this.value;
        saveState();
        updatePreview();
    });
    
    document.getElementById('effectColor2').addEventListener('change', function() {
        state.currentState.effects.color2 = this.value;
        saveState();
        updatePreview();
    });
    
    // Button listeners
    document.getElementById('addTextBtn').addEventListener('click', addTextElement);
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);
    document.getElementById('generateBtn').addEventListener('click', generateApiUrl);
    document.getElementById('copyBtn').addEventListener('click', copyApiUrl);
    
    // Initialize the app
    initializeState();
});
