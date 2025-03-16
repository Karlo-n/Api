// Código JavaScript para manejar la interfaz de usuario del creador de ranked
document.addEventListener('DOMContentLoaded', function() {
    // Inicialización
    loadBackgroundImages();
    initFormListeners();
    
    // Cargar fondos disponibles
    function loadBackgroundImages() {
        const container = document.querySelector('.bg-image-grid');
        container.innerHTML = '';
        
        // Cargar 10 imágenes de fondo
        for (let i = 1; i <= 10; i++) {
            const bgOption = document.createElement('div');
            bgOption.className = 'bg-image-option';
            bgOption.dataset.bg = i;
            
            const img = document.createElement('img');
            img.src = `/api/utility/ranked/backgrounds/bg${i}.png`;
            img.alt = `Fondo ${i}`;
            img.onerror = () => { img.src = '/placeholder.png'; };
            
            bgOption.appendChild(img);
            container.appendChild(bgOption);
            
            bgOption.addEventListener('click', function() {
                document.querySelectorAll('.bg-image-option').forEach(el => el.classList.remove('selected'));
                this.classList.add('selected');
                updatePreview();
            });
        }
    }
    
    // Inicializar listeners para los campos del formulario
    function initFormListeners() {
        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                const tabId = tab.dataset.tab + '-tab';
                document.getElementById(tabId).classList.add('active');
            });
        });
        
        // Tipo de tarjeta
        document.getElementById('cardType').addEventListener('change', function() {
            const type = this.value;
            
            // Mostrar/ocultar opciones según el tipo
            document.getElementById('levelOptions').style.display = type === 'level' ? 'block' : 'none';
            document.getElementById('classificationOptions').style.display = type === 'classification' ? 'block' : 'none';
            document.getElementById('rankOptions').style.display = type === 'rank' ? 'block' : 'none';
            
            updatePreview();
        });
        
        // Tipo de fondo
        document.getElementById('backgroundType').addEventListener('change', function() {
            const type = this.value;
            
            document.getElementById('backgroundColorOptions').style.display = type === 'color' ? 'block' : 'none';
            document.getElementById('backgroundImageOptions').style.display = type === 'image' ? 'block' : 'none';
            document.getElementById('customBgOptions').style.display = type === 'custom' ? 'block' : 'none';
            
            updatePreview();
        });
        
        // Shadow options toggle
        document.getElementById('shadowEnabled').addEventListener('change', function() {
            document.getElementById('shadowOptions').style.display = this.checked ? 'block' : 'none';
            updatePreview();
        });
        
        // Botón de generar
        document.getElementById('generateBtn').addEventListener('click', generateApiUrl);
        
        // Botón de copiar
        document.getElementById('copyBtn').addEventListener('click', function() {
            const urlOutput = document.getElementById('apiUrlOutput');
            
            // Crear un elemento de entrada temporal
            const tempInput = document.createElement('input');
            tempInput.value = urlOutput.textContent;
            document.body.appendChild(tempInput);
            
            // Seleccionar y copiar
            tempInput.select();
            document.execCommand('copy');
            
            // Eliminar el elemento temporal
            document.body.removeChild(tempInput);
            
            // Mostrar confirmación
            this.textContent = '¡Copiado!';
            setTimeout(() => { this.textContent = 'Copiar al Portapapeles'; }, 2000);
        });
        
        // Añadir listeners para todos los campos de formulario
        document.querySelectorAll('input, select, textarea').forEach(element => {
            element.addEventListener('change', updatePreview);
            if (element.type === 'range') {
                element.addEventListener('input', function() {
                    const valueDisplay = this.nextElementSibling;
                    if (valueDisplay && valueDisplay.classList.contains('range-value')) {
                        valueDisplay.textContent = `${this.value}px`;
                    }
                    updatePreview();
                });
            }
        });
    }
    
    // Actualizar la vista previa
    function updatePreview() {
        const previewContent = document.getElementById('previewContent');
        previewContent.innerHTML = '<div style="padding: 20px; text-align: center; color: white;">Se ha actualizado la vista previa. Usa "Generar URL de API" para ver tu tarjeta.</div>';
    }
    
    // Generar URL de API
    function generateApiUrl() {
        // Base URL
        let baseUrl = '/api/utility/ranked/generate?';
        const params = new URLSearchParams();
        
        // Tipo de tarjeta
        const cardType = document.getElementById('cardType').value;
        params.append('type', cardType);
        
        // Dimensiones
        params.append('width', document.getElementById('cardWidth').value);
        params.append('height', document.getElementById('cardHeight').value);
        
        // Información de usuario
        params.append('username', document.getElementById('username').value);
        if (document.getElementById('avatarUrl').value) {
            params.append('avatar', document.getElementById('avatarUrl').value);
        }
        
        // Fondo
        const bgType = document.getElementById('backgroundType').value;
        if (bgType === 'color') {
            params.append('bgColor', document.getElementById('backgroundColor').value.replace('#', ''));
        } else if (bgType === 'image') {
            const selectedBg = document.querySelector('.bg-image-option.selected');
            if (selectedBg) {
                params.append('background', selectedBg.dataset.bg);
            }
        } else if (bgType === 'custom') {
            const customUrl = document.getElementById('customBgUrl').value;
            if (customUrl) {
                params.append('background', customUrl);
            }
        }
        
        // Colores
        params.append('textColor', document.getElementById('textColor').value.replace('#', ''));
        params.append('accentColor', document.getElementById('accentColor').value.replace('#', ''));
        params.append('progressColor', document.getElementById('progressColor').value.replace('#', ''));
        params.append('progressBgColor', document.getElementById('progressBgColor').value.replace('#', ''));
        
        // Opciones de estilo
        params.append('borderRadius', document.getElementById('borderRadius').value);
        params.append('borderWidth', document.getElementById('borderWidth').value);
        params.append('borderColor', document.getElementById('borderColor').value.replace('#', ''));
        params.append('shadowEnabled', document.getElementById('shadowEnabled').checked);
        
        if (document.getElementById('shadowEnabled').checked) {
            params.append('shadowBlur', document.getElementById('shadowBlur').value);
            params.append('shadowColor', document.getElementById('shadowColor').value.replace('#', ''));
        }
        
        // Opciones específicas según el tipo
        if (cardType === 'level') {
            params.append('level', document.getElementById('level').value);
            params.append('xp', document.getElementById('xp').value);
            params.append('nextLevel', document.getElementById('nextLevel').value);
            params.append('rank', document.getElementById('rank').value);
        } else if (cardType === 'classification') {
            params.append('level', document.getElementById('classLevel').value);
            params.append('classification', document.getElementById('classification').value);
            params.append('rank', document.getElementById('classRank').value);
            if (document.getElementById('badgeUrl').value) {
                params.append('badge', document.getElementById('badgeUrl').value);
            }
        } else if (cardType === 'rank') {
            params.append('level', document.getElementById('rankLevel').value);
            params.append('rank', document.getElementById('rankName').value);
            params.append('customText', document.getElementById('customText').value);
        }
        
        // Generar URL final
        const apiUrl = baseUrl + params.toString();
        
        // Mostrar resultado
        const apiUrlOutput = document.getElementById('apiUrlOutput');
        apiUrlOutput.textContent = apiUrl;
        document.getElementById('apiUrlContainer').style.display = 'block';
        
        // Cargar la imagen de vista previa
        const previewContent = document.getElementById('previewContent');
        previewContent.innerHTML = `<img src="${apiUrl}" alt="Vista previa de tarjeta ranked" style="max-width: 100%; border-radius: 10px;">`;
        
        // Desplazarse al contenedor de URL
        document.getElementById('apiUrlContainer').scrollIntoView({ behavior: 'smooth' });
    }
});
