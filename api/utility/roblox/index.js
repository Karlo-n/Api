const express = require("express");
const axios = require("axios");
const puppeteer = require("puppeteer-core");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { usuario, inventario, grupo, musica, item, foto } = req.query;

        if (!usuario && !inventario && !grupo && !musica && !item) {
            return res.status(400).json({ error: "Debes proporcionar al menos un parámetro (usuario, inventario, grupo, música o ítem)" });
        }

        // 📸 Captura de pantalla opcional
        if (foto === "true") {
            let url = "";
            if (usuario) {
                const userData = await axios.get(`https://users.roblox.com/v1/users/search?keyword=${usuario}&limit=1`);
                if (userData.data.data.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
                url = `https://www.roblox.com/users/${userData.data.data[0].id}/profile`;
            } else if (grupo) {
                url = `https://www.roblox.com/groups/${grupo}`;
            } else if (item) {
                url = `https://www.roblox.com/catalog/${item}`;
            } else if (inventario) {
                url = `https://www.roblox.com/users/${inventario}/inventory`;
            } else if (musica) {
                url = `https://www.roblox.com/users/${musica}/inventory#!/audio`;
            } else {
                return res.status(400).json({ error: "No se puede tomar captura sin un usuario, grupo, ítem o inventario" });
            }

            // **Optimización para Railway**
            const browser = await puppeteer.launch({
                executablePath: "/usr/bin/google-chrome", // Usa Chrome del sistema
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });

            const page = await browser.newPage();
            await page.goto(url, { waitUntil: "networkidle2" });

            const screenshot = await page.screenshot({ fullPage: true });
            await browser.close();

            res.setHeader("Content-Type", "image/png");
            return res.send(screenshot);
        }

        // 📝 Obtener datos según la consulta
        let responseData = {};

        if (usuario) {
            const userData = await axios.get(`https://users.roblox.com/v1/users/search?keyword=${usuario}&limit=1`);
            if (userData.data.data.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
            const user = userData.data.data[0];

            responseData = {
                username: user.name,
                displayName: user.displayName,
                id: user.id,
                avatarUrl: `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`,
                profileUrl: `https://www.roblox.com/users/${user.id}/profile`
            };
        }

        if (inventario) {
            const inventoryData = await axios.get(`https://www.roblox.com/users/inventory/json?userId=${inventario}&assetTypeId=2`);
            responseData.items = inventoryData.data.Data.Items.slice(0, 5);
        }

        if (grupo) {
            const groupData = await axios.get(`https://groups.roblox.com/v2/users/${grupo}/groups/roles`);
            responseData.groups = groupData.data.data.map(g => ({ name: g.group.name, role: g.role.name }));
        }

        if (musica) {
            const audioData = await axios.get(`https://www.roblox.com/users/inventory/json?userId=${musica}&assetTypeId=3`);
            responseData.audios = audioData.data.Data.Items.slice(0, 5);
        }

        if (item) {
            const itemData = await axios.get(`https://economy.roblox.com/v1/assets/${item}/details`);
            responseData = {
                itemName: itemData.data.Name,
                creator: itemData.data.Creator.Name,
                price: itemData.data.PriceInRobux,
                assetId: itemData.data.AssetId,
                imageUrl: `https://www.roblox.com/asset-thumbnail/image?assetId=${itemData.data.AssetId}&width=420&height=420&format=png`
            };
        }

        res.json(responseData);
    } catch (error) {
        console.error("❌ Error en la API de Roblox:", error);
        res.status(500).json({ error: "Error al obtener datos de Roblox" });
    }
});

module.exports = router;
