const express = require("express");
const axios = require("axios");
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { usuario, grupo, item, decal, audio, foto, descargar } = req.query;

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
                profileUrl: `https://www.roblox.com/users/${userData.data.id}/profile`,
                created: userData.data.created, // Fecha de creación del usuario
                isBanned: userData.data.isBanned ? "Sí" : "No"
            };
        }

        if (grupo) {
            const groupData = await axios.get(`https://groups.roblox.com/v1/groups/${grupo}`);
            responseData = {
                name: groupData.data.name,
                owner: groupData.data.owner ? groupData.data.owner.username : "No tiene dueño",
                memberCount: groupData.data.memberCount,
                description: groupData.data.description,
                publicEntryAllowed: groupData.data.publicEntryAllowed ? "Sí" : "No",
                isVerified: groupData.data.hasVerifiedBadge ? "Sí" : "No"
            };
        }

        if (item) {
            const itemData = await axios.get(`https://economy.roblox.com/v1/assets/${item}/details`);
            responseData = {
                itemName: itemData.data.Name,
                creator: itemData.data.Creator.Name,
                creatorType: itemData.data.Creator.Type,
                price: itemData.data.PriceInRobux || "Gratis",
                assetId: itemData.data.AssetId,
                limited: itemData.data.IsLimited ? "Sí" : "No",
                limitedUnique: itemData.data.IsLimitedUnique ? "Sí" : "No",
                saleStatus: itemData.data.IsForSale ? "En venta" : "No disponible",
                imageUrl: `https://www.roblox.com/asset-thumbnail/image?assetId=${itemData.data.AssetId}&width=420&height=420&format=png`
            };
        }

        if (decal) {
            const decalData = await axios.get(`https://economy.roblox.com/v1/assets/${decal}/details`);
            responseData = {
                decalName: decalData.data.Name,
                creator: decalData.data.Creator.Name,
                assetId: decalData.data.AssetId,
                price: decalData.data.PriceInRobux || "Gratis",
                imageUrl: `https://www.roblox.com/asset-thumbnail/image?assetId=${decalData.data.AssetId}&width=420&height=420&format=png`
            };
        }

        if (audio) {
            try {
                const audioData = await axios.get(`https://economy.roblox.com/v1/assets/${audio}/details`);
                if (!audioData.data.AssetId) return res.status(404).json({ error: "Audio no encontrado" });

                const audioDownloadUrl = `https://media.roblox.com/asset/?id=${audioData.data.AssetId}`;

                if (descargar === "true") {
                    // 📥 **Descargar y enviar el archivo de audio**
                    const audioResponse = await axios.get(audioDownloadUrl, { responseType: "arraybuffer" });
                    const fileName = `${audioData.data.Name.replace(/[^a-zA-Z0-9]/g, "_")}.mp3`;
                    const filePath = path.join(__dirname, fileName);

                    // Guardar archivo temporalmente
                    fs.writeFileSync(filePath, audioResponse.data);

                    // Enviar el archivo al usuario y eliminarlo después
                    res.download(filePath, fileName, (err) => {
                        fs.unlinkSync(filePath); // Borrar archivo después de la descarga
                    });
                } else {
                    responseData = {
                        audioName: audioData.data.Name,
                        creator: audioData.data.Creator.Name,
                        price: audioData.data.PriceInRobux || "Gratis",
                        duration: audioData.data.DurationInSeconds ? `${audioData.data.DurationInSeconds} segundos` : "Desconocido",
                        isForSale: audioData.data.IsForSale ? "Sí" : "No",
                        audioUrl: audioDownloadUrl
                    };
                }
            } catch (error) {
                console.error("Error obteniendo audio:", error);
                return res.status(500).json({ error: "No se pudo obtener el audio, verifica que la ID sea correcta." });
            }
        }

        if (!descargar) {
            res.json(responseData);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener datos de Roblox. Verifica que el ID ingresado sea válido." });
    }
});

module.exports = router;
