// index.js
const express = require('express');
const axios = require('axios');
const { google } = require('googleapis');
const youtube = google.youtube('v3');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la API de YouTube
const API_KEY = process.env.YOUTUBE_API_KEY; // Deberás crear este API_KEY en Google Cloud Console

app.get('/api/youtube', async (req, res) => {
  try {
    // Parámetros obligatorios
    const channelQuery = req.query.channel; // Nombre del canal o URL
    const foto = req.query.foto?.toLowerCase() === 'si';
    
    if (!channelQuery) {
      return res.status(400).json({ error: 'Se requiere el parámetro "channel"' });
    }
    
    // Obtener ID del canal
    const channelId = await getChannelId(channelQuery);
    
    if (!channelId) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }
    
    // Si se solicita una captura de pantalla
    if (foto) {
      const channelUrl = `https://www.youtube.com/channel/${channelId}`;
      const screenshotUrl = `https://api.apikarl.com/api/utility/screenshot?url=${encodeURIComponent(channelUrl)}`;
      
      // Redireccionar a la API de captura de pantalla
      return res.redirect(screenshotUrl);
    }
    
    // Parámetros opcionales
    const videoType = req.query.tipo; // 'reciente', 'famoso', 'short_reciente', 'short_famoso', 'tiktok'
    
    // Si no hay tipo especificado, devolver un video aleatorio
    if (!videoType) {
      const randomVideo = await getRandomVideo(channelId);
      return res.json(randomVideo);
    }
    
    // Procesar según el tipo de video solicitado
    let result;
    switch (videoType.toLowerCase()) {
      case 'reciente':
        result = await getRecentVideo(channelId);
        break;
      case 'famoso':
        result = await getPopularVideo(channelId);
        break;
      case 'short_reciente':
        result = await getRecentShort(channelId);
        break;
      case 'short_famoso':
        result = await getPopularShort(channelId);
        break;
      case 'tiktok':
        result = await getTikTokFromChannel(channelId);
        break;
      default:
        return res.status(400).json({ error: 'Tipo de video no válido' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error en el servidor', details: error.message });
  }
});

// Función para obtener el ID del canal a partir del nombre o URL
async function getChannelId(channelQuery) {
  try {
    // Si es una URL, extraer el nombre del canal o ID
    let channelName = channelQuery;
    if (channelQuery.includes('youtube.com')) {
      // Extraer el nombre o ID del canal de la URL
      const urlParts = new URL(channelQuery);
      if (urlParts.pathname.includes('/channel/')) {
        // Es una URL de canal con ID
        return urlParts.pathname.split('/channel/')[1];
      } else if (urlParts.pathname.includes('/c/') || urlParts.pathname.includes('/@')) {
        // Es una URL de canal con nombre personalizado
        channelName = urlParts.pathname.split('/').pop();
      }
    }
    
    // Buscar el canal por nombre
    const response = await youtube.search.list({
      key: API_KEY,
      part: 'snippet',
      q: channelName,
      type: 'channel',
      maxResults: 1
    });
    
    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].snippet.channelId;
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener ID del canal:', error);
    return null;
  }
}

// Función para obtener un video aleatorio del canal
async function getRandomVideo(channelId) {
  try {
    // Obtener videos del canal
    const response = await youtube.search.list({
      key: API_KEY,
      part: 'snippet',
      channelId: channelId,
      maxResults: 50,
      type: 'video'
    });
    
    if (response.data.items && response.data.items.length > 0) {
      // Seleccionar un video aleatorio
      const randomIndex = Math.floor(Math.random() * response.data.items.length);
      const randomVideo = response.data.items[randomIndex];
      
      // Obtener más detalles del video
      const videoDetails = await getVideoDetails(randomVideo.id.videoId);
      
      return {
        title: randomVideo.snippet.title,
        description: randomVideo.snippet.description,
        publishedAt: randomVideo.snippet.publishedAt,
        thumbnail: randomVideo.snippet.thumbnails.high.url,
        videoUrl: `https://www.youtube.com/watch?v=${randomVideo.id.videoId}`,
        ...videoDetails
      };
    }
    
    return { error: 'No se encontraron videos en este canal' };
  } catch (error) {
    console.error('Error al obtener video aleatorio:', error);
    throw error;
  }
}

// Función para obtener el video más reciente
async function getRecentVideo(channelId) {
  try {
    const response = await youtube.search.list({
      key: API_KEY,
      part: 'snippet',
      channelId: channelId,
      maxResults: 1,
      type: 'video',
      order: 'date'
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const recentVideo = response.data.items[0];
      const videoDetails = await getVideoDetails(recentVideo.id.videoId);
      
      return {
        title: recentVideo.snippet.title,
        description: recentVideo.snippet.description,
        publishedAt: recentVideo.snippet.publishedAt,
        thumbnail: recentVideo.snippet.thumbnails.high.url,
        videoUrl: `https://www.youtube.com/watch?v=${recentVideo.id.videoId}`,
        ...videoDetails
      };
    }
    
    return { error: 'No se encontraron videos recientes' };
  } catch (error) {
    console.error('Error al obtener video reciente:', error);
    throw error;
  }
}

// Función para obtener el video más popular
async function getPopularVideo(channelId) {
  try {
    const response = await youtube.search.list({
      key: API_KEY,
      part: 'snippet',
      channelId: channelId,
      maxResults: 1,
      type: 'video',
      order: 'viewCount'
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const popularVideo = response.data.items[0];
      const videoDetails = await getVideoDetails(popularVideo.id.videoId);
      
      return {
        title: popularVideo.snippet.title,
        description: popularVideo.snippet.description,
        publishedAt: popularVideo.snippet.publishedAt,
        thumbnail: popularVideo.snippet.thumbnails.high.url,
        videoUrl: `https://www.youtube.com/watch?v=${popularVideo.id.videoId}`,
        ...videoDetails
      };
    }
    
    return { error: 'No se encontraron videos populares' };
  } catch (error) {
    console.error('Error al obtener video popular:', error);
    throw error;
  }
}

// Función para obtener el short más reciente
async function getRecentShort(channelId) {
  try {
    // Primero obtenemos varios videos recientes
    const response = await youtube.search.list({
      key: API_KEY,
      part: 'snippet',
      channelId: channelId,
      maxResults: 50,
      type: 'video',
      order: 'date'
    });
    
    if (response.data.items && response.data.items.length > 0) {
      // Filtrar para encontrar shorts (videos verticales cortos)
      for (const item of response.data.items) {
        const videoDetails = await getVideoDetails(item.id.videoId);
        
        // Los shorts generalmente tienen una duración menor a 60 segundos
        // y una relación de aspecto vertical (alto > ancho)
        if (videoDetails.duration < 60 && 
            videoDetails.height > videoDetails.width) {
          return {
            title: item.snippet.title,
            description: item.snippet.description,
            publishedAt: item.snippet.publishedAt,
            thumbnail: item.snippet.thumbnails.high.url,
            videoUrl: `https://www.youtube.com/shorts/${item.id.videoId}`,
            ...videoDetails
          };
        }
      }
    }
    
    return { error: 'No se encontraron shorts recientes' };
  } catch (error) {
    console.error('Error al obtener short reciente:', error);
    throw error;
  }
}

// Función para obtener el short más popular
async function getPopularShort(channelId) {
  try {
    // Primero obtenemos varios videos populares
    const response = await youtube.search.list({
      key: API_KEY,
      part: 'snippet',
      channelId: channelId,
      maxResults: 50,
      type: 'video',
      order: 'viewCount'
    });
    
    if (response.data.items && response.data.items.length > 0) {
      // Filtrar para encontrar shorts (videos verticales cortos)
      for (const item of response.data.items) {
        const videoDetails = await getVideoDetails(item.id.videoId);
        
        // Los shorts generalmente tienen una duración menor a 60 segundos
        // y una relación de aspecto vertical (alto > ancho)
        if (videoDetails.duration < 60 && 
            videoDetails.height > videoDetails.width) {
          return {
            title: item.snippet.title,
            description: item.snippet.description,
            publishedAt: item.snippet.publishedAt,
            thumbnail: item.snippet.thumbnails.high.url,
            videoUrl: `https://www.youtube.com/shorts/${item.id.videoId}`,
            ...videoDetails
          };
        }
      }
    }
    
    return { error: 'No se encontraron shorts populares' };
  } catch (error) {
    console.error('Error al obtener short popular:', error);
    throw error;
  }
}

// Función para buscar menciones o enlaces a TikTok en la descripción de videos recientes
async function getTikTokFromChannel(channelId) {
  try {
    // Obtener videos recientes del canal
    const response = await youtube.search.list({
      key: API_KEY,
      part: 'snippet',
      channelId: channelId,
      maxResults: 50,
      type: 'video',
      order: 'date'
    });
    
    if (response.data.items && response.data.items.length > 0) {
      // Buscar videos que mencionen TikTok en la descripción o título
      for (const item of response.data.items) {
        const description = item.snippet.description.toLowerCase();
        const title = item.snippet.title.toLowerCase();
        
        // Buscar enlaces de TikTok o menciones en la descripción
        if (description.includes('tiktok.com') || 
            title.includes('tiktok') ||
            description.includes('tiktok')) {
          
          // Intentar extraer la URL de TikTok de la descripción
          let tiktokUrl = null;
          const tiktokRegex = /(https?:\/\/(?:www\.|vm\.)?tiktok\.com\/[^\s]+)/;
          const match = description.match(tiktokRegex);
          
          if (match) {
            tiktokUrl = match[0];
          }
          
          const videoDetails = await getVideoDetails(item.id.videoId);
          
          return {
            title: item.snippet.title,
            description: item.snippet.description,
            publishedAt: item.snippet.publishedAt,
            thumbnail: item.snippet.thumbnails.high.url,
            videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            tiktokUrl: tiktokUrl,
            ...videoDetails
          };
        }
      }
    }
    
    return { error: 'No se encontraron referencias a TikTok en los videos recientes' };
  } catch (error) {
    console.error('Error al buscar TikTok en el canal:', error);
    throw error;
  }
}

// Función para obtener detalles adicionales de un video
async function getVideoDetails(videoId) {
  try {
    const response = await youtube.videos.list({
      key: API_KEY,
      part: 'contentDetails,statistics',
      id: videoId
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const videoInfo = response.data.items[0];
      
      // Convertir duración de ISO 8601 a segundos
      const duration = parseDuration(videoInfo.contentDetails.duration);
      
      return {
        duration: duration,
        views: parseInt(videoInfo.statistics.viewCount || 0),
        likes: parseInt(videoInfo.statistics.likeCount || 0),
        comments: parseInt(videoInfo.statistics.commentCount || 0),
        height: videoInfo.contentDetails.definition === 'hd' ? 1080 : 720,
        width: videoInfo.contentDetails.definition === 'hd' ? 1920 : 1280,
      };
    }
    
    return {};
  } catch (error) {
    console.error('Error al obtener detalles del video:', error);
    return {};
  }
}

// Función para convertir duración ISO 8601 a segundos
function parseDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt((match[1] || '0H').slice(0, -1));
  const minutes = parseInt((match[2] || '0M').slice(0, -1));
  const seconds = parseInt((match[3] || '0S').slice(0, -1));
  
  return hours * 3600 + minutes * 60 + seconds;
}

app.listen(port, () => {
  console.log(`API de YouTube ejecutándose en http://localhost:${port}`);
});
