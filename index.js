const express = require('express');
const cors = require('cors');
const shipRoute = require('./api/utility/ship/index');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/utility/ship', shipRoute);

app.get('/', (req, res) => {
    res.send('🚀 API Karl está funcionando!');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
