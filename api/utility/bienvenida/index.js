// index.js - Archivo básico para servir el HTML
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static('.'));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor iniciado en puerto ${port}`);
});
