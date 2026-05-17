import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { Innertube } from 'youtubei.js';
import yts from 'yt-search';
import axios from 'axios';
import ytdl from '@distube/ytdl-core';
import { YouTubeScraper } from './src/lib/youtubeScraper';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Initialize YouTube InnerTube
  let yt: Innertube | null = null;
  const initInnertube = async () => {
    try {
      yt = await Innertube.create({ generate_session_locally: true });
      console.log("[Server] YouTube InnerTube initialized");
    } catch (err) {
      console.error("[Server] Failed to initialize InnerTube:", err);
    }
  };
  await initInnertube();

  const getYT = async () => {
    if (!yt) await initInnertube();
    return yt;
  };

  const normalizeVideoData = (raw: any) => {
    if (!raw) return null;
    
    // Support yts, InnerTube, and Scraper formats
    const id = raw.id || raw.videoId || raw.v || (raw.navigationEndpoint?.watchEndpoint?.videoId);
    const title = raw.title?.toString() || raw.title?.simpleText || raw.text || raw.title?.runs?.[0]?.text || "Untitled";
    
    // Thumbnail extraction
    let thumbnail = "";
    if (raw.thumbnails && raw.thumbnails.length > 0) thumbnail = raw.thumbnails[0].url;
    else if (raw.thumbnail) thumbnail = raw.thumbnail;
    else if (raw.image) thumbnail = raw.image;
    else if (raw.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url) thumbnail = raw.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails[0].url;
    
    // Channel name
    const channelName = raw.author?.name || raw.author || raw.channelName || raw.ownerText?.runs?.[0]?.text || raw.shortBylineText?.runs?.[0]?.text || "YouTube Music";
    
    // Stats
    const views = raw.view_count?.toString() || raw.viewCountText?.simpleText || raw.flexColumns?.[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "0 views";
    const duration = raw.duration?.toString() || raw.lengthText?.simpleText || raw.timestamp || "0:00";
    
    return {
      id,
      title,
      thumbnail,
      channelName,
      views,
      uploadedAt: raw.published?.toString() || raw.publishedTimeText?.simpleText || "Recently",
      duration
    };
  };

  app.use(cors());
  app.use(express.json());

  const apiRouter = express.Router();

  // Middleware for all API routes
  apiRouter.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Health
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Trending
  apiRouter.get("/trending", async (req, res) => {
    try {
      console.log("[API] Trending requested");
      let items = await YouTubeScraper.getTrending();
      
      if (items.length === 0) {
        console.warn("[API] Scraper failed, falling back to InnerTube");
        const client = await getYT();
        if (client) {
          const trending = await client.getTrending();
          const videos = trending.videos;
          if (videos && videos.length > 0) items = videos.map(normalizeVideoData);
        }
      }

      if (items.length === 0) {
        console.warn("[API] All methods failed, using yt-search");
        const results = await yts({ query: "trending music videos", type: 'video' });
        items = results.videos.map(normalizeVideoData);
      }

      res.json({ items: items.slice(0, 50) });
    } catch (error: any) {
      console.error("[API] Trending error:", error);
      res.status(500).json({ items: [], error: error.message });
    }
  });

  // Search
  apiRouter.get("/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });
      
      console.log(`[API] Search for: ${query}`);
      let items = await YouTubeScraper.search(query);
      
      if (items.length === 0) {
        console.warn("[API] Scraper failed, falling back to InnerTube");
        const client = await getYT();
        if (client) {
          const search = await client.search(query, { type: 'video' });
          items = search.results?.map(normalizeVideoData) || [];
        }
      }

      if (items.length === 0) {
        const results = await yts(query);
        items = results.videos.map(normalizeVideoData);
      }

      res.json({ items: items.slice(0, 50) });
    } catch (error: any) {
      console.error("[API] Search error:", error);
      res.status(500).json({ items: [], error: error.message });
    }
  });

  // Video Info
  apiRouter.get("/video-info", async (req, res) => {
    const videoId = (req.query.id as string) || (req.params.id as string);
    const isNative = req.headers['x-native-mode'] === 'true' || req.query.native === 'true';
    
    try {
      if (!videoId) return res.status(400).json({ error: "Video ID required" });
      console.log(`[API] Info for: ${videoId}`);
      
      const playerResponse = await YouTubeScraper.getVideoInfo(videoId);
      if (playerResponse && playerResponse.videoDetails) {
        const sd = playerResponse.streamingData || {};
        const formats = [...(sd.formats || []), ...(sd.adaptiveFormats || [])];
        const processScrapedFormat = (f: any) => ({
          url: f.url || f.signatureCipher || f.cipher,
          proxyUrl: (f.url || f.signatureCipher || f.cipher) ? `/api/stream?url=${encodeURIComponent(f.url || f.signatureCipher || f.cipher)}${isNative ? '&native=true' : ''}` : "",
          quality: f.qualityLabel || f.quality || 'Standard',
          container: f.mimeType,
          bitrate: f.bitrate,
          id: f.itag
        });

        return res.json({
          ...normalizeVideoData(playerResponse.videoDetails),
          formats: {
            audio: formats.filter(f => f.mimeType?.includes('audio')).map(processScrapedFormat),
            video: formats.filter(f => f.mimeType?.includes('video')).map(processScrapedFormat)
          }
        });
      }

      const client = await getYT();
      let info = await client?.getInfo(videoId);
      if (info) {
        const streamingData = info.streaming_data || info.playability_status?.streaming_data;
        const adaptiveFormats = streamingData?.adaptive_formats || [];
        const processFormat = (f: any) => ({
          url: f.url || "",
          proxyUrl: f.url ? `/api/stream?url=${encodeURIComponent(f.url)}${isNative ? '&native=true' : ''}` : "",
          quality: f.quality_label || f.quality || 'Standard',
          container: f.mime_type
        });
        return res.json({
          ...normalizeVideoData(info.basic_info),
          formats: {
            audio: adaptiveFormats.filter((f: any) => f.has_audio && !f.has_video).map(processFormat),
            video: adaptiveFormats.filter((f: any) => f.has_video).map(processFormat)
          }
        });
      }

      res.status(404).json({ error: "Could not extract video info" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stream proxy
  apiRouter.get("/stream", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).send("URL required");
      const isNative = req.headers['x-native-mode'] === 'true' || req.query.native === 'true';
      
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        headers: {
          'User-Agent': isNative ? 'com.google.android.youtube/19.11.38 (Linux; U; Android 14; en_US) gzip' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Range': req.headers.range || 'bytes=0-',
          'Referer': 'https://www.youtube.com/'
        },
        timeout: 20000
      });

      res.status(response.status);
      ['content-type', 'content-length', 'accept-ranges', 'content-range'].forEach(h => {
        if (response.headers[h]) res.setHeader(h, response.headers[h] as string);
      });
      response.data.pipe(res);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  });

  app.use("/api", apiRouter);

  // Final Error Handler for API
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[API Global Error] ${req.url}:`, err);
    res.status(500).json({ error: "Internal Server Error", message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  });

  // Fallback for unmatched API routes
  app.all("/api/*", (req, res) => {
    console.log(`[API 404] ${req.url}`);
    res.status(404).json({ error: "API route not found" });
  });

  // Static files & SPA
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Don't serve index.html for missed API calls
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] YouTube Music Proxy running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
