const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Importar rutas
const qrRouter = require("./api/utility/qr/index");
const boostCardRouter = require("./api/utility/boostcard/index");

// Usar rutas
app.use("/api/utility/qr", qrRouter);
app.use("/api/utility/boostcard", boostCardRouter);

// Ruta principal para listar endpoints
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Bienvenido a API Karl - Lista de Endpoints Disponibles",
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
