const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path"); // Asegúrate de tener esta importación

// Servir archivos estáticos desde la carpeta public
app.use(express.static('public'));

// Importar rutas
const shipRouter = require("./api/fun/ship");
const kissRouter = require("./api/fun/kiss");
const magik = require("./api/fun/magik");
const byn = require("./api/fun/byn");
const invertir = require("./api/fun/invertir");
const pixelArtRoutes = require('./api/fun/pixel');
const comicFilter = require("./api/fun/comic");
const juego21Router = require("./api/fun/21");
const triviaRouter = require("./api/fun/trivia");
const wouldYouRatherRouter = require('./api/fun/would-you-rather');
const ruletaRouter = require("./api/fun/ruleta");
const sleepingRouter = require("./api/fun/sleeping");
const akinator = require("./api/fun/akinator");
const twitterCardRouter = require("./api/fun/twitter");
const bienvenidaRouter = require('./api/utility/bienvenida');
const qrRouter = require("./api/utility/qr");
const boostCardRouter = require("./api/utility/boostcard");
const traductorRouter = require("./api/utility/traductor");
const robloxRouter = require("./api/utility/roblox");
const robloxVerificacionRouter = require("./api/utility/roblox_verificacion");
const screenshotRouter = require("./api/utility/screenshot");
const deepseekAI = require("./api/utility/deepseek");
const ip = require("./api/utility/ip");
const youtube = require("./api/utility/youtube");
const binarioRouter = require("./api/utility/binario");
const invertidoRouter = require("./api/utility/invertido");
const obfuscarRouter = require("./api/utility/obfuscar");
const captchaRouter = require("./api/utility/captcha");

// Usar rutas
app.use("/api/fun/ship", shipRouter);
app.use("/api/fun/kiss", kissRouter);
app.use("/api/fun/magik", magik);
app.use("/api/fun/byn", byn);
app.use("/api/fun/invertir", invertir);
app.use('/api/fun/pixel', pixelArtRoutes);
app.use("/api/fun/comic", comicFilter);
app.use("/api/fun/21", juego21Router);
app.use("/api/fun/trivia", triviaRouter);
app.use("/api/fun/would-you-rather", wouldYouRatherRouter);
app.use("/api/fun/ruleta", ruletaRouter);
app.use("/api/fun/sleeping", sleepingRouter);
app.use("/api/fun/akinator", akinator);
app.use("/api/fun/twitter", twitterCardRouter);
app.use('/api/utility/bienvenida', bienvenidaRouter);
app.use("/api/utility/qr", qrRouter);
app.use("/api/utility/boostcard", boostCardRouter);
app.use("/api/utility/traductor", traductorRouter);
app.use("/api/utility/roblox", robloxRouter);
app.use("/api/utility/roblox_verificacion", robloxVerificacionRouter);
app.use("/api/utility/screenshot", screenshotRouter);
app.use("/api/utility/deepseek", deepseekAI);
app.use("/api/utility/ip", ip);
app.use("/api/utility/youtube", youtube);
app.use("/api/utility/binario", binarioRouter);
app.use("/api/utility/invertido", invertidoRouter);
app.use("/api/utility/obfuscar", obfuscarRouter);
app.use("/api/utility/captcha", captchaRouter);

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
    "/api/fun/byn",
    "/api/fun/invertir",
    "/api/fun/pixel",
    "/api/fun/comic",
    "/api/fun/21",
    "/api/fun/trivia",
    "/api/fun/would-you-rather",
    "/api/fun/ruleta",
    "/api/fun/sleeping",
    "/api/fun/akinator",
    "/api/fun/twitter",
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
    "/api/utility/binario",
    "/api/utility/captcha"
]
    }, null, 4)); // <--- Aquí está bien formateado
});

// NUEVO: Manejador de errores 404
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    // Para rutas de API, devuelve error JSON
    return res.status(404).json({
      error: true,
      code: 404,
      message: "El endpoint solicitado no existe",
      documentacion: "https://apikarl.com/docs"
    });
  }
  
  // Para rutas web, sirve la página 404
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
