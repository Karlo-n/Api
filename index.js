const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Importar rutas
const qrRouter = require("./api/utility/qr/index");
const boostCardRouter = require("./api/utility/boostcard/index");
const traductorRouter = require("./api/utility/traductor/index");
const bienvenidaRouter = require("./api/utility/bienvenida/index");
const shipRouter = require("./api/fun/ship/index");
const kissRouter = require("./api/fun/kiss");
const robloxRouter = require("./api/utility/roblox/index");

// Usar rutas
app.use("/api/utility/qr", qrRouter);
app.use("/api/utility/boostcard", boostCardRouter);
app.use("/api/utility/traductor", traductorRouter);
app.use("/api/fun/ship", shipRouter);
app.use("/api/utility/bienvenida", bienvenidaRouter);
app.use("/api/fun/kiss", kissRouter);

// Ruta principal para listar endpoints con formato bonito
app.get("/", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify({
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
    }, null, 4)); // <--- Aquí está bien formateado
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
