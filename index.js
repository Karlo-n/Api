const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Ruta principal que muestra los endpoints disponibles
app.get('/', (req, res) => {
    res.json({
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
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
