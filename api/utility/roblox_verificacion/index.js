const express = require("express");
const axios = require("axios");
const router = express.Router();

/**
 * API de Verificación Roblox - Versión mejorada
 * Verifica diversos aspectos del perfil de un usuario de Roblox
 */
router.get("/", async (req, res) => {
    try {
        const { 
            id, 
            descripcion, 
            item_id, 
            item_type, 
            gamepass_id, 
            grupo_id, 
            juego_id,
            juego_favorito_id
        } = req.query;

        // Verificar al menos un parámetro válido
        if (!id) {
            return res.status(400).json({ 
                error: "Debes proporcionar un ID de usuario de Roblox.",
                ejemplo: "/api/utility/roblox_verificacion?id=92895595&descripcion=texto"
            });
        }

        // Respuesta completa
        const respuesta = {
            usuario_id: id,
            verificaciones: {}
        };

        // 1. Verificación de descripción
        if (descripcion) {
            try {
                const userResponse = await axios.get(`https://users.roblox.com/v1/users/${id}`);
                
                if (userResponse.data && userResponse.data.description !== undefined) {
                    respuesta.verificaciones.descripcion = {
                        coincide: userResponse.data.description.trim() === descripcion.trim(),
                        descripcion_actual: userResponse.data.description
                    };
                } else {
                    respuesta.verificaciones.descripcion = { 
                        error: "Usuario no encontrado o sin descripción"
                    };
                }
            } catch (error) {
                respuesta.verificaciones.descripcion = { 
                    error: "Error al verificar descripción", 
                    detalles: error.message 
                };
            }
        }

        // 2. Verificación de item (ropa: camisa/pantalón/etc)
        if (item_id && item_type) {
            try {
                // Obtener el inventario del usuario según el tipo de item
                let itemTypeId;
                
                // Mapear tipos de items a sus IDs en la API de Roblox
                switch(item_type.toLowerCase()) {
                    case 'camisa': 
                    case 'shirt': 
                        itemTypeId = 11; 
                        break;
                    case 'pantalon': 
                    case 'pants': 
                        itemTypeId = 12; 
                        break;
                    case 'cara': 
                    case 'face': 
                        itemTypeId = 18; 
                        break;
                    case 'accesorio': 
                    case 'accessory': 
                        itemTypeId = 8; 
                        break;
                    case 'cabeza': 
                    case 'head': 
                        itemTypeId = 17; 
                        break;
                    default:
                        itemTypeId = 8; // Accesorios en general por defecto
                }
                
                const inventoryResponse = await axios.get(
                    `https://inventory.roblox.com/v1/users/${id}/items/${itemTypeId}/is-owned?itemIds=${item_id}`
                );
                
                respuesta.verificaciones.item = {
                    tipo: item_type,
                    id: item_id,
                    posee: inventoryResponse.data && inventoryResponse.data.data && inventoryResponse.data.data.length > 0 && 
                           inventoryResponse.data.data[0].owned === true
                };
            } catch (error) {
                respuesta.verificaciones.item = { 
                    error: "Error al verificar item", 
                    detalles: error.message 
                };
            }
        }

        // 3. Verificación de gamepass
        if (gamepass_id) {
            try {
                // Verificar si el usuario tiene un gamepass específico
                const gamepassResponse = await axios.get(
                    `https://inventory.roblox.com/v1/users/${id}/items/GamePass/${gamepass_id}`
                );
                
                respuesta.verificaciones.gamepass = {
                    id: gamepass_id,
                    posee: gamepassResponse.data && gamepassResponse.data.data && gamepassResponse.data.data.length > 0
                };
            } catch (error) {
                respuesta.verificaciones.gamepass = { 
                    error: "Error al verificar gamepass", 
                    detalles: error.message 
                };
            }
        }

        // 4. Verificación de pertenencia a grupo
        if (grupo_id) {
            try {
                const grupoResponse = await axios.get(
                    `https://groups.roblox.com/v1/users/${id}/groups/roles`
                );
                
                let pertenece = false;
                let rolEnGrupo = null;
                
                if (grupoResponse.data && grupoResponse.data.data) {
                    const grupo = grupoResponse.data.data.find(g => g.group.id.toString() === grupo_id.toString());
                    if (grupo) {
                        pertenece = true;
                        rolEnGrupo = {
                            nombre: grupo.role.name,
                            rango: grupo.role.rank
                        };
                    }
                }
                
                respuesta.verificaciones.grupo = {
                    id: grupo_id,
                    pertenece: pertenece,
                    rol: rolEnGrupo
                };
            } catch (error) {
                respuesta.verificaciones.grupo = { 
                    error: "Error al verificar pertenencia a grupo", 
                    detalles: error.message 
                };
            }
        }

        // 5. Verificación de juegos jugados (Esta API podría estar limitada)
        if (juego_id) {
            try {
                // Intentar obtener datos del juego del usuario
                // Nota: Esta API podría estar limitada o no ser pública
                const gameInfoResponse = await axios.get(
                    `https://games.roblox.com/v2/users/${id}/games/votes?sortOrder=Desc&limit=50`
                );
                
                let haJugado = false;
                
                // Buscar el juego en los juegos votados
                if (gameInfoResponse.data && gameInfoResponse.data.data) {
                    haJugado = gameInfoResponse.data.data.some(g => g.id.toString() === juego_id.toString());
                }
                
                respuesta.verificaciones.juego = {
                    id: juego_id,
                    ha_jugado: haJugado,
                    nota: "Esta verificación se basa en votos y podría no ser 100% precisa"
                };
            } catch (error) {
                respuesta.verificaciones.juego = { 
                    error: "Error o limitación al verificar juegos jugados", 
                    detalles: error.message 
                };
            }
        }

        // 6. Verificación de juegos favoritos
        if (juego_favorito_id) {
            try {
                // Obtener juegos favoritos del usuario
                const favoritesResponse = await axios.get(
                    `https://games.roblox.com/v2/users/${id}/favorite/games?sortOrder=Desc&limit=50`
                );
                
                let esFavorito = false;
                
                if (favoritesResponse.data && favoritesResponse.data.data) {
                    esFavorito = favoritesResponse.data.data.some(g => g.id.toString() === juego_favorito_id.toString());
                }
                
                respuesta.verificaciones.juego_favorito = {
                    id: juego_favorito_id,
                    es_favorito: esFavorito
                };
            } catch (error) {
                respuesta.verificaciones.juego_favorito = { 
                    error: "Error al verificar juegos favoritos", 
                    detalles: error.message 
                };
            }
        }

        // Verificar si se realizó al menos una verificación
        if (Object.keys(respuesta.verificaciones).length === 0) {
            return res.status(400).json({ 
                error: "Debes proporcionar al menos un parámetro de verificación válido.", 
                parametros_disponibles: [
                    "descripcion - Verifica si la descripción del perfil coincide",
                    "item_id + item_type - Verifica si posee un item específico (tipos: camisa, pantalon, cara, accesorio, cabeza)",
                    "gamepass_id - Verifica si posee un gamepass",
                    "grupo_id - Verifica pertenencia a un grupo",
                    "juego_id - Verifica si ha jugado un juego (basado en votos)",
                    "juego_favorito_id - Verifica si tiene un juego como favorito"
                ]
            });
        }

        // Obtener información general del usuario
        try {
            const userInfoResponse = await axios.get(`https://users.roblox.com/v1/users/${id}`);
            if (userInfoResponse.data) {
                respuesta.info_usuario = {
                    nombre: userInfoResponse.data.name,
                    id: userInfoResponse.data.id,
                    created: userInfoResponse.data.created,
                    isBanned: userInfoResponse.data.isBanned || false
                };
            }
        } catch (error) {
            console.error("Error obteniendo información del usuario:", error.message);
            // No es crítico, continuamos sin esta info
        }

        // Responder con todos los resultados
        res.json(respuesta);

    } catch (error) {
        console.error("Error general en verificación Roblox:", error);
        res.status(500).json({ 
            error: "Error general al procesar la verificación.", 
            detalles: error.message 
        });
    }
});

module.exports = router;
