const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const router = express.Router();

/**
 * API de Verificación Roblox - Versión mejorada con verificación de contacto
 * Verifica diversos aspectos del perfil de un usuario de Roblox,
 * incluyendo verificación de correo o teléfono mediante código
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
            juego_favorito_id,
            contacto,
            codigo_verificacion,
            generar_codigo
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

        // 7. Verificación de contacto (email/teléfono)
        if (contacto && codigo_verificacion) {
            try {
                // Generar hash del contacto para comparar con el código de verificación
                const contactoHash = generarHashContacto(contacto, id);
                const prefijo = contactoHash.substring(0, 8);
                
                // Verificar si el código proporcionado coincide con el esperado
                const codigoValido = codigo_verificacion === prefijo;
                
                respuesta.verificaciones.contacto = {
                    contacto_parcial: ocultarContacto(contacto),
                    codigo_valido: codigoValido
                };
            } catch (error) {
                respuesta.verificaciones.contacto = { 
                    error: "Error al verificar contacto", 
                    detalles: error.message 
                };
            }
        } else if (contacto && generar_codigo === "true") {
            try {
                // Generar un código para verificación basado en el contacto y el id de usuario
                const contactoHash = generarHashContacto(contacto, id);
                const codigo = contactoHash.substring(0, 8);
                
                respuesta.verificaciones.contacto = {
                    contacto_parcial: ocultarContacto(contacto),
                    codigo_generado: codigo,
                    instrucciones: "Agrega este código a la descripción del usuario para verificar que tienes acceso al contacto"
                };
            } catch (error) {
                respuesta.verificaciones.contacto = { 
                    error: "Error al generar código de verificación", 
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
                    "juego_favorito_id - Verifica si tiene un juego como favorito",
                    "contacto + codigo_verificacion - Verifica si el código corresponde al contacto indicado",
                    "contacto + generar_codigo=true - Genera un código de verificación para el contacto"
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

/**
 * Función para generar un hash de un contacto combinado con el ID de usuario
 * Esto crea un código único para cada combinación de contacto+usuario
 */
function generarHashContacto(contacto, userId) {
    // Normalizar contacto (eliminar espacios, convertir a minúsculas)
    const contactoNormalizado = contacto.trim().toLowerCase();
    
    // Combinar con el ID de usuario para hacerlo único por usuario
    const datos = `${contactoNormalizado}:${userId}`;
    
    // Generar hash SHA-256 y devolver en hexadecimal
    return crypto.createHash('sha256').update(datos).digest('hex');
}

/**
 * Función para ocultar parcialmente un contacto (email/teléfono)
 * para mostrar en respuestas sin exponer datos sensibles
 */
function ocultarContacto(contacto) {
    if (!contacto) return null;
    
    // Detectar si es email o teléfono
    if (contacto.includes('@')) {
        // Es un email
        const [usuario, dominio] = contacto.split('@');
        const usuarioOculto = usuario.substring(0, 1) + '*'.repeat(usuario.length - 1);
        const dominioPartes = dominio.split('.');
        const dominioOculto = dominioPartes.map(parte => 
            parte.substring(0, 1) + '*'.repeat(parte.length - 1)
        ).join('.');
        
        return `${usuarioOculto}@${dominioOculto}`;
    } else {
        // Asumir que es un teléfono
        const visible = contacto.substring(0, 2);
        const oculto = '*'.repeat(contacto.length - 4);
        const ultimos = contacto.substring(contacto.length - 2);
        
        return `${visible}${oculto}${ultimos}`;
    }
}

module.exports = router;
