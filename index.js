const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Importar rutas
const shipRouter = require("./api/fun/ship");
const kissRouter = require("./api/fun/kiss");
const magik = require("./api/fun/magik");
const byn = require("./api/fun/byn");
const invertir = require("./api/fun/invertir");
const qrRouter = require("./api/utility/qr");
const boostCardRouter = require("./api/utility/boostcard");
const traductorRouter = require("./api/utility/traductor");
const bienvenidaRouter = require("./api/utility/bienvenida");
const robloxRouter = require("./api/utility/roblox");
const robloxVerificacionRouter = require("./api/utility/roblox_verificacion");
const screenshotRouter = require("./api/utility/screenshot");
const rankedRouter = require("./api/utility/ranked");
const deepseekAI = require("./api/utility/deepseek");
const ip = require("./api/utility/ip");
const youtube = require("./api/utility/youtube");
const binarioRouter = require("./api/utility/binario");
const invertidoRouter = require("./api/utility/invertido");
const obfuscarRouter = require("./api/utility/obfuscar");

// Usar rutas
app.use("/api/fun/ship", shipRouter);
app.use("/api/fun/kiss", kissRouter);
app.use("/api/fun/magik", magik);
app.use("/api/fun/byn", byn);
app.use("/api/fun/invertir", invertir);
app.use("/api/utility/bienvenida", bienvenidaRouter);
app.use("/api/utility/qr", qrRouter);
app.use("/api/utility/boostcard", boostCardRouter);
app.use("/api/utility/traductor", traductorRouter);
app.use("/api/utility/roblox", robloxRouter);
app.use("/api/utility/roblox_verificacion", robloxVerificacionRouter);
app.use("/api/utility/screenshot", screenshotRouter);
app.use("/api/utility/ranked", rankedRouter);
app.use("/api/utility/deepseek", deepseekAI);
app.use("/api/utility/ipdetector", ip);
app.use("/api/utility/youtube", youtube);
app.use("/api/utility/binario", binarioRouter);
app.use("/api/utility/invertido", invertidoRouter);
app.use("/api/utility/obfuscar", obfuscarRouter);

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
    "/api/fun/magik",
    "/api/fun/byn",  // <-- Añadido aquí
    "/api/fun/invertir",
    "/api/utility/boostcard",
    "/api/utility/traductor",
    "/api/utility/bienvenida",
    "/api/utility/qr",
    "/api/utility/carta_ranked",
    "/api/utility/carta_nivel",
    "/api/utility/roblox",
    "/api/utility/roblox_verificacion",
    "/api/utility/screenshot",
    "/api/utility/deepseek",
    "/api/utility/ip",
    "/api/utility/youtube",
    "/api/utility/binario"
]
    }, null, 4)); // <--- Aquí está bien formateado
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
