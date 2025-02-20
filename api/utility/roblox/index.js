const express = require("express");
const axios = require("axios");
const puppeteer = require("puppeteer");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { usuario, grupo, item, foto } = req.query;

        if (!usuario && !grupo && !item) {
            return res.status(400).json({ error: "Debes proporcionar al menos un parámetro (usuario, grupo o item) con un ID válido." });
        }

        // 📸 Captura de pantalla de la página
        if (foto === "true") {
            let url = "";
            if (usuario) {
                url = `https://www.roblox.com/users/${usuario}/profile`;
            } else if (grupo) {
                url = `https://www.roblox.com/groups/${grupo}`;
            } else if (item) {
                url = `https://www.roblox.com/catalog/${item}`;
            } else {
                return res.status(400).json({ error: "No se puede tomar captura sin un ID válido de usuario, grupo o ítem." });
            }

            const browser = await puppeteer.launch({ headless: "new" });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: "networkidle2" });
            const screenshot = await page.screenshot({ fullPage: true });

            await browser.close();
            res.setHeader("Content-Type", "image/png");
            return res.send(screenshot);
        }

        // 📝 Obtener datos según el ID proporcionado
        let responseData = {};
        
        if (usuario) {
            const userData = await axios.get(`https://users.roblox.com/v1/users/${usuario}`);
            responseData = {
                username: userData.data.name,
                displayName: userData.data.displayName,
                id: userData.data.id,
                avatarUrl: `https://www.roblox.com/headshot-thumbnail/image?userId=${userData.data.id}&width=420&height=420&format=png`,
                profileUrl: `https://www.roblox.com/users/${userData.data.id}/profile`
            };
        }

        if (grupo) {
            const groupData = await axios.get(`https://groups.roblox.com/v1/groups/${grupo}`);
            responseData = {
                name: groupData.data.name,
                owner: groupData.data.owner ? groupData.data.owner.username : "No tiene dueño",
                memberCount: groupData.data.memberCount,
                description: groupData.data.description
            };
        }

        if (item) {
            const itemData = await axios.get(`https://economy.roblox.com/v1/assets/${item}/details`);
            responseData = {
                itemName: itemData.data.Name,
                creator: itemData.data.Creator.Name,
                price: itemData.data.PriceInRobux || "Gratis",
                assetId: itemData.data.AssetId,
                imageUrl: `https://www.roblox.com/asset-thumbnail/image?assetId=${itemData.data.AssetId}&width=420&height=420&format=png`
            };
        }

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener datos de Roblox. Verifica que el ID ingresado sea válido." });
    }
});

module.exports = router;
