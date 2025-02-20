const express = require("express");
const axios = require("axios");
const puppeteer = require("puppeteer-core");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { usuario, grupo, item, decal, audio, foto } = req.query;

        if (!usuario && !grupo && !item && !decal && !audio) {
            return res.status(400).json({ error: "Debes proporcionar un ID válido para usuario, grupo, item, decal o audio." });
        }

        // 📸 Captura de pantalla con Puppeteer-Core
        if (foto === "true") {
            let url = "";
            if (usuario) {
                url = `https://www.roblox.com/users/${usuario}/profile`;
            } else if (grupo) {
                url = `https://www.roblox.com/groups/${grupo}`;
            } else if (item) {
                url = `https://www.roblox.com/catalog/${item}`;
            } else {
                return res.status(400).json({ error: "No se puede tomar captura sin un ID válido." });
            }

            const browser = await puppeteer.launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
                headless: "new"
            });

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

        if (decal) {
            const decalData = await axios.get(`https://economy.roblox.com/v1/assets/${decal}/details`);
            responseData = {
                decalName: decalData.data.Name,
                creator: decalData.data.Creator.Name,
                assetId: decalData.data.AssetId,
                imageUrl: `https://www.roblox.com/asset-thumbnail/image?assetId=${decalData.data.AssetId}&width=420&height=420&format=png`
            };
        }

        if (audio) {
            const audioData = await axios.get(`https://economy.roblox.com/v1/assets/${audio}/details`);
            responseData = {
                audioName: audioData.data.Name,
                creator: audioData.data.Creator.Name,
                price: audioData.data.PriceInRobux || "Gratis",
                assetId: audioData.data.AssetId,
                audioUrl: `https://www.roblox.com/library/${audioData.data.AssetId}`
            };
        }

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener datos de Roblox. Verifica que el ID ingresado sea válido." });
    }
});

module.exports = router;
