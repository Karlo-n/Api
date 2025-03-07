<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visualizador de Audio</title>
    <style>
        :root {
            --primary-color: #3498db;
            --secondary-color: #2980b9;
            --background-color: #f5f5f5;
            --card-color: #ffffff;
            --text-color: #333333;
            --border-color: #dddddd;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--background-color);
            color: var(--text-color);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .container {
            max-width: 900px;
            width: 100%;
            padding: 20px;
            box-sizing: border-box;
        }

        header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background-color: var(--primary-color);
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 100%;
        }

        h1 {
            margin: 0;
            font-size: 2.2rem;
        }

        .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
            margin-top: 10px;
        }

        .card {
            background-color: var(--card-color);
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            overflow: hidden;
        }

        .card-header {
            background-color: var(--primary-color);
            color: white;
            padding: 15px 20px;
            font-weight: bold;
            font-size: 1.2rem;
        }

        .card-body {
            padding: 20px;
        }

        .upload-area {
            border: 2px dashed var(--border-color);
            border-radius: 8px;
            padding: 40px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 20px;
            position: relative;
            overflow: hidden;
        }

        .upload-area:hover, .upload-area.dragover {
            border-color: var(--primary-color);
            background-color: rgba(52, 152, 219, 0.05);
        }

        .upload-area input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
        }

        .upload-icon {
            font-size: 48px;
            color: var(--primary-color);
            margin-bottom: 15px;
        }

        .btn {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            transition: background-color 0.3s;
        }

        .btn:hover {
            background-color: var(--secondary-color);
        }

        .btn:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }

        .form-group {
            margin-bottom: 15px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }

        select, input[type="color"] {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-size: 1rem;
        }

        .status {
            margin-top: 15px;
            padding: 15px;
            border-radius: 4px;
            display: none;
        }

        .status.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            display: block;
        }

        .status.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            display: block;
        }

        .file-info {
            margin-top: 10px;
            font-size: 0.9rem;
            color: #666;
        }

        .visualizer-container {
            margin-top: 20px;
            width: 100%;
            display: none;
        }

        canvas {
            width: 100%;
            height: 150px;
            background-color: #000;
            border-radius: 4px;
        }

        .controls {
            margin-top: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .play-button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.5rem;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .play-button:hover {
            background-color: var(--secondary-color);
        }

        .volume-control {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .volume-icon {
            font-size: 1.5rem;
            color: var(--primary-color);
        }

        .progress-container {
            flex-grow: 1;
            margin: 0 15px;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background-color: #ddd;
            border-radius: 3px;
            cursor: pointer;
            position: relative;
        }

        .progress {
            height: 100%;
            background-color: var(--primary-color);
            border-radius: 3px;
            width: 0;
        }

        .time-display {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
            display: flex;
            justify-content: space-between;
        }

        .actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }

        .download-btn {
            background-color: #28a745;
        }

        .download-btn:hover {
            background-color: #218838;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .controls {
                flex-direction: column;
                gap: 15px;
            }
            
            .volume-control {
                width: 100%;
            }
            
            .actions {
                flex-direction: column;
            }
            
            .btn {
                width: 100%;
            }
        }

        .loader {
            border: 5px solid #f3f3f3;
            border-top: 5px solid var(--primary-color);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 20px auto;
            display: none;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Visualizador de Audio</h1>
            <div class="subtitle">Crea visualizaciones para archivos MP3 y MP4</div>
        </header>

        <div class="card">
            <div class="card-header">Subir Archivo</div>
            <div class="card-body">
                <div class="upload-area" id="upload-area">
                    <div class="upload-icon">📁</div>
                    <h3>Arrastra y suelta tu archivo aquí</h3>
                    <p>o haz clic para seleccionar un archivo MP3 o MP4</p>
                    <input type="file" id="file-input" accept=".mp3,.mp4">
                </div>
                <div id="file-info" class="file-info"></div>
                
                <div class="form-group">
                    <label for="visualizer-type">Tipo de Visualización:</label>
                    <select id="visualizer-type">
                        <option value="bars">Barras</option>
                        <option value="wave">Onda</option>
                        <option value="circle">Círculo</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="visualizer-color">Color de Visualización:</label>
                    <input type="color" id="visualizer-color" value="#3498db">
                </div>
                
                <div class="form-group">
                    <label for="background-color">Color de Fondo:</label>
                    <input type="color" id="background-color" value="#000000">
                </div>
                
                <button id="generate-btn" class="btn" disabled>Generar Visualización</button>
                <div id="status" class="status"></div>
                <div id="loader" class="loader"></div>
            </div>
        </div>

        <div class="visualizer-container" id="visualizer-container">
            <div class="card">
                <div class="card-header">Visualización</div>
                <div class="card-body">
                    <canvas id="visualizer"></canvas>
                    
                    <div class="controls">
                        <button id="play-btn" class="play-button">▶</button>
                        
                        <div class="progress-container">
                            <div class="progress-bar" id="progress-bar">
                                <div class="progress" id="progress"></div>
                            </div>
                            <div class="time-display">
                                <span id="current-time">0:00</span>
                                <span id="duration">0:00</span>
                            </div>
                        </div>
                        
                        <div class="volume-control">
                            <span class="volume-icon">🔊</span>
                            <input type="range" id="volume" min="0" max="1" step="0.1" value="1">
                        </div>
                    </div>
                    
                    <div class="actions">
                        <button id="download-btn" class="btn download-btn">Descargar Visualización</button>
                        <button id="share-btn" class="btn">Compartir</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Variables globales
        let audioContext;
        let audioSource;
        let analyser;
        let audioBuffer;
        let mediaElement;
        let animationId;
        let isPlaying = false;
        let canvasCtx;
        let currentFile = null;
        let videoRecorder = null;
        let mediaStream = null;
        let videoChunks = [];
        
        // Elementos del DOM
        const fileInput = document.getElementById('file-input');
        const fileInfo = document.getElementById('file-info');
        const generateBtn = document.getElementById('generate-btn');
        const uploadArea = document.getElementById('upload-area');
        const statusEl = document.getElementById('status');
        const loaderEl = document.getElementById('loader');
        const visualizerContainer = document.getElementById('visualizer-container');
        const visualizerCanvas = document.getElementById('visualizer');
        const playBtn = document.getElementById('play-btn');
        const progressBar = document.getElementById('progress-bar');
        const progress = document.getElementById('progress');
        const currentTimeEl = document.getElementById('current-time');
        const durationEl = document.getElementById('duration');
        const volumeControl = document.getElementById('volume');
        const downloadBtn = document.getElementById('download-btn');
        const shareBtn = document.getElementById('share-btn');
        const visualizerType = document.getElementById('visualizer-type');
        const visualizerColor = document.getElementById('visualizer-color');
        const backgroundColor = document.getElementById('background-color');
        
        // Inicializar Canvas
        canvasCtx = visualizerCanvas.getContext('2d');
        
        // Funciones auxiliares
        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            seconds = Math.floor(seconds % 60);
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
        
        function showStatus(message, type) {
            statusEl.textContent = message;
            statusEl.className = `status ${type}`;
            statusEl.style.display = 'block';
        }
        
        function hideStatus() {
            statusEl.style.display = 'none';
        }
        
        function showLoader() {
            loaderEl.style.display = 'block';
        }
        
        function hideLoader() {
            loaderEl.style.display = 'none';
        }
        
        // Manejo de eventos para la zona de arrastrar y soltar
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            uploadArea.classList.add('dragover');
        }
        
        function unhighlight() {
            uploadArea.classList.remove('dragover');
        }
        
        uploadArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length) {
                fileInput.files = files;
                handleFileSelect();
            }
        }
        
        // Manejar la selección de archivos
        fileInput.addEventListener('change', handleFileSelect);
        
        function handleFileSelect() {
            if (fileInput.files.length === 0) return;
            
            const file = fileInput.files[0];
            
            // Verificar que sea un archivo de audio o video
            if (!file.type.match('audio.*') && !file.type.match('video.*')) {
                showStatus('Solo se permiten archivos MP3 y MP4', 'error');
                return;
            }
            
            currentFile = file;
            
            // Mostrar información del archivo
            const fileSize = (file.size / (1024 * 1024)).toFixed(2);
            fileInfo.textContent = `${file.name} (${fileSize} MB)`;
            
            // Habilitar botón de generación
            generateBtn.disabled = false;
            
            hideStatus();
        }
        
        // Generar la visualización
        generateBtn.addEventListener('click', generateVisualization);
        
        async function generateVisualization() {
            if (!currentFile) return;
            
            showLoader();
            hideStatus();
            
            try {
                // Crear contexto de audio si no existe
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                // Limpiar cualquier visualización anterior
                stopVisualization();
                
                // Es un archivo de video MP4
                if (currentFile.type.match('video.*')) {
                    await loadVideoFile(currentFile);
                } 
                // Es un archivo de audio MP3
                else if (currentFile.type.match('audio.*')) {
                    await loadAudioFile(currentFile);
                }
                
                // Configurar analizador
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                
                // Conectar la fuente al analizador
                if (audioSource) {
                    audioSource.connect(analyser);
                    analyser.connect(audioContext.destination);
                }
                
                // Configurar canvas
                visualizerCanvas.width = visualizerCanvas.offsetWidth;
                visualizerCanvas.height = visualizerCanvas.offsetHeight;
                
                // Mostrar el contenedor de visualización
                visualizerContainer.style.display = 'block';
                
                // Iniciar visualización
                startVisualization();
                
                // Desplazarse al visualizador
                visualizerContainer.scrollIntoView({ behavior: 'smooth' });
                
                showStatus('Visualización generada correctamente', 'success');
            } catch (error) {
                console.error('Error generando visualización:', error);
                showStatus('Error al generar la visualización: ' + error.message, 'error');
            } finally {
                hideLoader();
            }
        }
        
        // Cargar archivo de audio
        async function loadAudioFile(file) {
            return new Promise((resolve, reject) => {
                // Crear elemento de audio
                if (mediaElement) {
                    mediaElement.pause();
                    mediaElement.remove();
                }
                
                mediaElement = new Audio();
                mediaElement.controls = false;
                
                // Crear objeto URL
                const objectUrl = URL.createObjectURL(file);
                mediaElement.src = objectUrl;
                
                // Cuando los metadatos están cargados, actualizar la duración
                mediaElement.addEventListener('loadedmetadata', () => {
                    durationEl.textContent = formatTime(mediaElement.duration);
                });
                
                // Actualizar la barra de progreso
                mediaElement.addEventListener('timeupdate', updateProgress);
                
                // Detectar cuando termina la reproducción
                mediaElement.addEventListener('ended', () => {
                    playBtn.innerHTML = '▶';
                    isPlaying = false;
                });
                
                // Conectar al contexto de audio
                if (audioSource) {
                    audioSource.disconnect();
                }
                
                mediaElement.addEventListener('canplaythrough', () => {
                    audioSource = audioContext.createMediaElementSource(mediaElement);
                    resolve();
                });
                
                mediaElement.addEventListener('error', (e) => {
                    reject(new Error('Error al cargar el archivo de audio'));
                });
            });
        }
        
        // Cargar archivo de video
        async function loadVideoFile(file) {
            return new Promise((resolve, reject) => {
                // Crear elemento de video (oculto)
                if (mediaElement) {
                    mediaElement.pause();
                    mediaElement.remove();
                }
                
                const videoEl = document.createElement('video');
                videoEl.style.display = 'none';
                document.body.appendChild(videoEl);
                
                mediaElement = videoEl;
                mediaElement.controls = false;
                
                // Crear objeto URL
                const objectUrl = URL.createObjectURL(file);
                mediaElement.src = objectUrl;
                
                // Cuando los metadatos están cargados, actualizar la duración
                mediaElement.addEventListener('loadedmetadata', () => {
                    durationEl.textContent = formatTime(mediaElement.duration);
                });
                
                // Actualizar la barra de progreso
                mediaElement.addEventListener('timeupdate', updateProgress);
                
                // Detectar cuando termina la reproducción
                mediaElement.addEventListener('ended', () => {
                    playBtn.innerHTML = '▶';
                    isPlaying = false;
                });
                
                mediaElement.addEventListener('canplaythrough', () => {
                    audioSource = audioContext.createMediaElementSource(mediaElement);
                    resolve();
                });
                
                mediaElement.addEventListener('error', (e) => {
                    reject(new Error('Error al cargar el archivo de video'));
                });
            });
        }
        
        // Actualizar la barra de progreso
        function updateProgress() {
            if (!mediaElement) return;
            
            const percent = (mediaElement.currentTime / mediaElement.duration) * 100;
            progress.style.width = `${percent}%`;
            currentTimeEl.textContent = formatTime(mediaElement.currentTime);
        }
        
        // Iniciar visualización
        function startVisualization() {
            if (!analyser) return;
            
            // Iniciar la animación
            renderFrame();
        }
        
        // Detener visualización
        function stopVisualization() {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            
            if (audioSource) {
                audioSource.disconnect();
                audioSource = null;
            }
            
            if (mediaElement) {
                mediaElement.pause();
            }
            
            isPlaying = false;
            playBtn.innerHTML = '▶';
        }
        
        // Renderizar un frame de la visualización
        function renderFrame() {
            animationId = requestAnimationFrame(renderFrame);
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Obtener datos de frecuencia
            analyser.getByteFrequencyData(dataArray);
            
            // Limpiar canvas
            canvasCtx.fillStyle = backgroundColor.value;
            canvasCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
            
            // Dibujar visualización según el tipo seleccionado
            const type = visualizerType.value;
            const color = visualizerColor.value;
            
            switch (type) {
                case 'bars':
                    drawBars(dataArray, bufferLength, color);
                    break;
                case 'wave':
                    drawWave(dataArray, bufferLength, color);
                    break;
                case 'circle':
                    drawCircle(dataArray, bufferLength, color);
                    break;
            }
        }
        
        // Dibujar visualización de barras
        function drawBars(dataArray, bufferLength, color) {
            const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * visualizerCanvas.height;
                
                canvasCtx.fillStyle = color;
                canvasCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        }
        
        // Dibujar visualización de onda
        function drawWave(dataArray, bufferLength, color) {
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = color;
            canvasCtx.beginPath();
            
            const sliceWidth = visualizerCanvas.width / bufferLength;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * visualizerCanvas.height / 2;
                
                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            canvasCtx.lineTo(visualizerCanvas.width, visualizerCanvas.height / 2);
            canvasCtx.stroke();
        }
        
        // Dibujar visualización circular
        function drawCircle(dataArray, bufferLength, color) {
            const centerX = visualizerCanvas.width / 2;
            const centerY = visualizerCanvas.height / 2;
            const radius = Math.min(centerX, centerY) - 10;
            
            canvasCtx.beginPath();
            canvasCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            canvasCtx.lineWidth = 1;
            canvasCtx.stroke();
            
            for (let i = 0; i < bufferLength; i++) {
                const percent = i / bufferLength;
                const angle = percent * Math.PI * 2;
                
                const amplitude = dataArray[i] / 255;
                const barHeight = radius * amplitude * 0.5;
                
                const x1 = centerX + Math.cos(angle) * radius;
                const y1 = centerY + Math.sin(angle) * radius;
                const x2 = centerX + Math.cos(angle) * (radius + barHeight);
                const y2 = centerY + Math.sin(angle) * (radius + barHeight);
                
                canvasCtx.beginPath();
                canvasCtx.lineWidth = 2;
                canvasCtx.strokeStyle = color;
                canvasCtx.moveTo(x1, y1);
                canvasCtx.lineTo(x2, y2);
                canvasCtx.stroke();
            }
        }
        
        // Botón de reproducción/pausa
        playBtn.addEventListener('click', togglePlay);
        
        function togglePlay() {
            if (!mediaElement) return;
            
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            if (isPlaying) {
                mediaElement.pause();
                playBtn.innerHTML = '▶';
            } else {
                mediaElement.play();
                playBtn.innerHTML = '⏸';
            }
            
            isPlaying = !isPlaying;
        }
        
        // Control de volumen
        volumeControl.addEventListener('input', changeVolume);
        
        function changeVolume() {
            if (!mediaElement) return;
            
            mediaElement.volume = volumeControl.value;
        }
        
        // Clic en la barra de progreso
        progressBar.addEventListener('click', seek);
        
        function seek(e) {
            if (!mediaElement) return;
            
            const percent = e.offsetX / progressBar.offsetWidth;
            mediaElement.currentTime = percent * mediaElement.duration;
            updateProgress();
        }
        
        // Botón de descarga
        downloadBtn.addEventListener('click', startRecording);
        
        // Grabar la visualización
        async function startRecording() {
            if (!mediaElement || !visualizerCanvas) return;
            
            showStatus('Preparando grabación...', 'success');
            
            try {
                // Reiniciar la reproducción
                mediaElement.currentTime = 0;
                
                // Preparar para la grabación
                videoChunks = [];
                
                // Obtener el stream del canvas
                mediaStream = visualizerCanvas.captureStream(30);
                
                // Si tenemos audio, añadirlo al stream
                if (audioSource) {
                    const audioDestination = audioContext.createMediaStreamDestination();
                    audioSource.connect(audioDestination);
                    
                    // Añadir las pistas de audio al stream
                    audioDestination.stream.getAudioTracks().forEach(track => {
                        mediaStream.addTrack(track);
                    });
                }
                
                // Configurar el grabador
                videoRecorder = new MediaRecorder(mediaStream, {
                    mimeType: 'video/webm;codecs=vp9'
                });
                
                // Recolectar los datos
                videoRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        videoChunks.push(e.data);
                    }
                };
                
                // Cuando termina la grabación
                videoRecorder.onstop = () => {
                    const blob = new Blob(videoChunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    
                    // Crear enlace de descarga
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `visualizacion-${Date.now()}.webm`;
                    a.click();
                    
                    showStatus('Visualización descargada correctamente', 'success');
                };
                
                // Iniciar grabación y reproducción
                videoRecorder.start();
                mediaElement.play();
                isPlaying = true;
                playBtn.innerHTML = '⏸';
                
                showStatus('Grabando visualización...', 'success');
                
                // Esperar a que termine la reproducción o después de 30 segundos máximo
                const maxDuration = Math.min(mediaElement.duration * 1000, 30000);
                
                mediaElement.onended = () => {
                    if (videoRecorder.state === 'recording') {
                        videoRecorder.stop();
                        mediaElement.onended = null;
                    }
                };
                
                // Como respaldo, detener después del tiempo máximo
                setTimeout(() => {
                    if (videoRecorder.state === 'recording') {
                        mediaElement.pause();
                        videoRecorder.stop();
                    }
                }, maxDuration);
                
            } catch (error) {
                console.error('Error al grabar:', error);
                showStatus('Error al grabar la visualización: ' + error.message, 'error');
            }
        }
        
        // Botón compartir
        shareBtn.addEventListener('click', shareVisualization);
        
        async function shareVisualization() {
            showStatus('La función de compartir no está disponible actualmente.', 'error');
            // Esta funcionalidad requeriría un backend para almacenar el video
        }
        
        // Cambiar tipo de visualización
        visualizerType.addEventListener('change', () => {
            if (analyser && canvasCtx) {
                // La visualización se actualizará en el próximo frame
            }
        });
        
        // Cambiar colores
        visualizerColor.addEventListener('input', () => {
            if (analyser && canvasCtx) {
                // La visualización se actualizará en el próximo frame
            }
        });
        
        backgroundColor.addEventListener('input', () => {
            if (analyser && canvasCtx) {
                // La visualización se actualizará en el próximo frame
            }
        });
        
        // Limpiar al salir
        window.addEventListener('beforeunload', () => {
            if (audioContext) {
                audioContext.close();
            }
            
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
            
            if (videoRecorder && videoRecorder.state === 'recording') {
                videoRecorder.stop();
            }
        });
    </script>
</body>
</html>
