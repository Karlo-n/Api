const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Ruta principal con formato bonito
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        message: '🚀 Bienvenido a API Karl - Lista de Endpoints Disponibles',
        endpoints: [
            "/api/fun/kiss",
            "/api/fun/slap",
            "/api/fun/ship",
            "/api/fun/jail",
            "/api/fun/lyric",
            "/api/utility/boostcard",
            "/api/utility/traductor",
            "/api/utility/bienvenida",
            "/api/utility/qr",
            "/api/utility/carta_ranked",
            "/api/utility/carta_nivel",
            "/api/utility/instragam",
            "/api/utility/twitter"
        ]
    }, null, 4)); // <-- Esto lo indenta bonito
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
