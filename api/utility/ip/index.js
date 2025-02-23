const express = require("express");
const axios = require("axios");
const router = express.Router();

// 📌 Ruta de la API para obtener datos de una IP
router.get("/", async (req, res) => {
    try {
        let { ip } = req.query;

        // Si no se proporciona IP, se usa la IP del usuario
        if (!ip) {
            ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        }

        // 🌐 API para obtener datos de la IP
        const response = await axios.get(`https://ipapi.co/${ip}/json/`);

        if (!response.data) {
            return res.status(404).json({ error: "❌ No se encontraron datos para esta IP." });
        }

        const data = response.data;

        // 📋 Estructura de respuesta con 20+ datos
        const resultado = {
            "🌍 IP Pública": data.ip,
            "📡 ISP (Proveedor de Internet)": data.org,
            "🏳️ País": data.country_name,
            "🔠 Código de País": data.country,
            "🌆 Región": data.region,
            "🔢 Código de Región": data.region_code,
            "🏙️ Ciudad": data.city,
            "📍 Latitud": data.latitude,
            "📍 Longitud": data.longitude,
            "⏰ Zona Horaria": data.timezone,
            "📮 Código Postal": data.postal,
            "💰 Moneda": data.currency_name,
            "💲 Código de Moneda": data.currency,
            "🚀 Velocidad de Conexión": data.asn ? `AS${data.asn}` : "No disponible",
            "🕵️ VPN/Proxy Detectado": data.proxy ? "Sí" : "No",
            "🌐 Dominio del ISP": data.asn_domain || "No disponible",
            "📡 Tipo de Conexión": data.network ? data.network.type : "No disponible",
            "📊 Empresa Proveedora": data.network ? data.network.name : "No disponible",
            "🏢 Hosting Detectado": data.network ? data.network.hosting : "No disponible",
            "🖥️ Navegador": req.headers["user-agent"],
            "🛑 Red TOR": data.tor ? "Sí" : "No",
            "🇺🇳 Región Geopolítica": data.continent_code
        };

        res.json(resultado);
    } catch (error) {
        console.error("❌ Error al obtener datos de la IP:", error.message);
        res.status(500).json({ error: "❌ No se pudo obtener información de la IP." });
    }
});

module.exports = router;
