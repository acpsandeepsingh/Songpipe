import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { Innertube } from 'youtubei.js';
import yts from 'yt-search';
import axios from 'axios';
import ytdl from '@distube/ytdl-core';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  let yt: Innertube | null = null;
  const initInnertube = async () => {
    try {
      // Basic initialization often works better than with many flags that can go stale
      yt = await Innertube.create({
        generate_session_locally: true,
      });
      console.log("YouTube InnerTube initialized");
    } catch (err) {
      console.error("Failed to initialize InnerTube:", err);
    }
  };
  await initInnertube();

  app.use(cors());
  app.use(express.json());
  
  // Global API Routing Protection & Logger
  app.use('/api', (req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.url}`);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    next();
  });

  // Helper to ensure yt is ready
  const getYT = async () => {
    if (!yt) {
      try {
        yt = await Innertube.create({
           generate_session_locally: true,
           fetch: (input: any, init: any) => fetch(input, { ...init, timeout: 15000 })
        });
      } catch (e) {
        console.error("Innertube init failed:", e);
      }
    }
    return yt;
  };

  // Trending Music Endpoint
  app.get("/api/trending", async (req, res) => {
    try {
      console.log("Fetching trending results via yt-search...");
      let results: any;
      try {
        results = await yts("trending songs 2024 music");
      } catch (err) {
        console.warn("yt-search failed for trending, trying fallback query...");
        results = await yts("latest hindi and english music 2024");
      }
      
      if (!results || !results.videos || results.videos.length === 0) {
        // Ultimate fallback: Try Innertube
        try {
          const client = await getYT();
          const search = await client.search("trending music", { type: 'video' });
          const items = search.results?.map((v: any) => ({
            id: v.id,
            title: v.title?.toString(),
            thumbnail: v.thumbnails?.[0]?.url,
            channelName: v.author?.name || 'YouTube',
            views: v.view_count?.toString() || '0 views',
            uploadedAt: v.published?.toString() || 'Trending',
            duration: v.duration?.toString() || '0:00'
          })) || [];
          
          if (items.length > 0) return res.json({ items });
        } catch (innerErr) {
          console.error("Innertube trending fallback failed:", innerErr);
        }

        // Even more ultimate fallback: Raw fetch and scrape (Simulated for this demo)
        return res.json({ 
          items: [
            { id: 'dQw4w9WgXcQ', title: 'Trending Fallback: Rick Astley', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', channelName: 'Official', views: '1B views', uploadedAt: '1 year ago', duration: '3:32' }
          ] 
        });
      }
      
      const items = (results.videos || []).slice(0, 40).map((v: any) => ({
        id: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail || v.image,
        channelName: v.author?.name || 'Unknown',
        channelAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(v.author?.name || 'YouTube')}`,
        views: (v.views || 0).toLocaleString() + ' views',
        uploadedAt: v.ago || 'Trending',
        duration: v.timestamp || '0:00'
      }));

      res.json({ items });
    } catch (error: any) {
      console.error("Trending fetch critical failure:", error);
      res.json({ items: [], error: error.message });
    }
  });

  // Search Endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });
      
      console.log(`Searching for: ${query} via yt-search`);
      let results: any;
      try {
        results = await yts(query);
      } catch (err) {
        console.warn("yt-search failed for search, trying Innertube...");
        const client = await getYT();
        const search = await client.search(query, { type: 'video' });
        const items = search.results?.map((v: any) => ({
          id: v.id,
          title: v.title?.toString(),
          thumbnail: v.thumbnails?.[0]?.url,
          channelName: v.author?.name || 'YouTube',
          views: v.view_count?.toString() || '0 views',
          uploadedAt: v.published?.toString() || 'Recently',
          duration: v.duration?.toString() || '0:00'
        })) || [];
        return res.json({ items });
      }
      
      const items = (results.videos || []).map((v: any) => ({
        type: 'video',
        id: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail || v.image,
        channelName: v.author?.name || 'Unknown',
        channelAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(v.author?.name || 'YouTube')}`,
        views: (v.views || 0).toLocaleString() + ' views',
        uploadedAt: v.ago || 'Recently',
        duration: v.timestamp || '0:00'
      }));

      res.json({ items });
    } catch (error: any) {
      console.error("Search critical failure:", error);
      res.json({ items: [], error: error.message });
    }
  });

  // Stream Proxy Endpoint (NewPipe style)
  app.get("/api/stream", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).send("URL required");

      const isNative = req.headers['x-native-mode'] === 'true' || req.query.native === 'true';
      console.log(`Proxying stream ${isNative ? '[NATIVE]' : ''}: ${url.substring(0, 100)}...`);

      // Add retry logic for proxying
      let attempt = 0;
      const maxAttempts = 2;
      
      while (attempt < maxAttempts) {
        try {
          const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
              'User-Agent': isNative 
                ? 'com.google.android.youtube/19.11.38 (Linux; U; Android 14; en_US) gzip'
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
              'Connection': 'keep-alive',
              'Range': req.headers.range || 'bytes=0-',
              'Referer': 'https://www.youtube.com/',
              'X-YouTube-Client-Name': '3',
              'X-YouTube-Client-Version': '2.20240210.00.00'
            },
            timeout: 25000 
          });

          // Transfer headers meticulously
          const headersToForward = [
            'content-type',
            'content-length',
            'accept-ranges',
            'content-range',
            'cache-control'
          ];

          headersToForward.forEach(h => {
            if (response.headers[h]) res.setHeader(h, response.headers[h]);
          });
          
          if (!res.getHeader('accept-ranges')) res.setHeader('Accept-Ranges', 'bytes');
          
          res.status(response.status || (req.headers.range ? 206 : 200));

          response.data.pipe(res);
          return;
        } catch (streamErr: any) {
          attempt++;
          console.warn(`Stream proxy attempt ${attempt} failed:`, streamErr.message);
          if (attempt >= maxAttempts) throw streamErr;
        }
      }
    } catch (error: any) {
      console.error("Stream Proxy Critical Error:", error.message);
      res.status(500).send(error.message);
    }
  });

  // Video Info & Extraction Endpoint
  app.post("/api/video-info-native", async (req, res) => {
    const { videoId, playerResponse } = req.body;
    try {
      if (!videoId) return res.status(400).json({ error: "Video ID required" });
      if (!playerResponse) return res.status(400).json({ error: "Player response required" });

      console.log(`Parsing native response for: ${videoId}`);
      const client = await getYT();
      
      // Parse the player response - Innertube can handle this
      const info = new (client as any).actions.constructor.Parser.Response(JSON.parse(playerResponse));
      const streamingData = info.streaming_data;
      
      // We still need some basic info that might be missing from just playerResponse
      // but let's try to build the response
      
      const processFormat = (f: any) => {
        let directUrl = "";
        try {
          directUrl = f.decipher ? f.decipher(client.session.player) : (f.url || "");
        } catch (e) {
          directUrl = f.url || "";
        }
        
        return {
          url: directUrl,
          proxyUrl: directUrl ? `/api/stream?url=${encodeURIComponent(directUrl)}&native=true` : "",
          quality: f.quality_label || f.audio_quality || f.quality || 'Standard',
          container: f.mime_type || 'video/mp4',
          bitrate: f.bitrate,
          id: f.itag
        };
      };

      const adaptiveFormats = streamingData?.adaptive_formats || [];
      const regularFormats = streamingData?.formats || [];
      const audioFormats = adaptiveFormats.filter((f: any) => f.has_audio && !f.has_video).map(processFormat);
      const videoFormats = [...regularFormats, ...adaptiveFormats.filter((f: any) => f.has_video)].map(processFormat);

      res.json({
        id: videoId,
        title: "Native Extracted Video",
        formats: {
          audio: audioFormats.length > 0 ? audioFormats : regularFormats.map(processFormat),
          video: videoFormats
        }
      });
    } catch (error: any) {
      console.error("Native parse failed:", error.message);
      res.status(500).json({ error: "Parse failed", message: error.message });
    }
  });

  app.get("/api/video-info", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const videoId = req.query.id as string;
    const isNative = req.headers['x-native-mode'] === 'true' || req.query.native === 'true';
    
    try {
      if (!videoId) return res.status(400).json({ error: "Video ID required" });

      console.log(`Extracting ${isNative ? '[NATIVE]' : ''} for: ${videoId}`);
      const client = await getYT();
      if (!client) throw new Error("YouTube client unavailable");
      
      let info: any;
      try {
        info = await client.getInfo(videoId);
      } catch (e: any) {
        console.warn(`Innertube failed for ${videoId}, trying ytdl-core fallback...`);
        // We'll fall back to search later if ytdl also fails
      }

      if (info) {
        const streamingData = info.streaming_data || (info as any).playability_status?.streaming_data;
        const basicInfo = info.basic_info;
        const adaptiveFormats = streamingData?.adaptive_formats || [];
        const regularFormats = streamingData?.formats || [];

        const processFormat = (f: any) => {
          let directUrl = "";
          try {
            directUrl = f.decipher ? f.decipher(client.session.player) : (f.url || "");
          } catch (e) {
            directUrl = f.url || "";
          }
          const proxyUrl = directUrl 
            ? `/api/stream?url=${encodeURIComponent(directUrl)}${isNative ? '&native=true' : ''}` 
            : "";
          return {
            url: directUrl,
            proxyUrl: proxyUrl,
            quality: f.quality_label || f.audio_quality || f.quality || 'Standard',
            container: f.mime_type || 'video/mp4',
            bitrate: f.bitrate,
            id: f.itag
          };
        };

        const audioFormats = adaptiveFormats.filter((f: any) => f.has_audio && !f.has_video).map(processFormat);
        const videoFormats = [...regularFormats, ...adaptiveFormats.filter((f: any) => f.has_video)].map(processFormat);

        return res.json({
          id: videoId,
          title: basicInfo?.title || "Untitled Video",
          description: basicInfo?.short_description || basicInfo?.description || "",
          thumbnails: basicInfo?.thumbnail || [],
          author: {
            name: basicInfo?.author || "Unknown Artist",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(basicInfo?.author || 'YouTube')}`
          },
          viewCount: basicInfo?.view_count || "0",
          publishDate: basicInfo?.is_live ? 'LIVE' : 'Recently',
          formats: {
            audio: audioFormats.length > 0 ? audioFormats : regularFormats.map(processFormat),
            video: videoFormats
          }
        });
      }

      // If we got here, Innertube failed. Try YTDL
      try {
        const ytdlInfo = await ytdl.getInfo(videoId);
        const formats = ytdlInfo.formats || [];
        return res.json({
          id: videoId,
          title: ytdlInfo.videoDetails.title,
          formats: {
            audio: formats.filter(f => f.hasAudio && !f.hasVideo).map(f => ({
              url: f.url,
              proxyUrl: `/api/stream?url=${encodeURIComponent(f.url || '')}`,
              quality: f.audioQuality || 'Standard',
              container: f.mimeType || 'audio/mp4',
              id: f.itag
            })),
            video: formats.filter(f => f.hasVideo).map(f => ({
              url: f.url,
              proxyUrl: `/api/stream?url=${encodeURIComponent(f.url || '')}`,
              quality: f.qualityLabel || 'Standard',
              container: f.mimeType || 'video/mp4',
              id: f.itag
            }))
          }
        });
      } catch (yerr) {}

      // Final fallback: Search metadata only
      const searchRes = await yts({ videoId });
      if (searchRes) {
        return res.json({
          id: videoId,
          title: (searchRes as any).title,
          thumbnails: [{ url: (searchRes as any).thumbnail }],
          error: true,
          message: "Streams unavailable on server. Please use native mode.",
          isMetadataOnly: true
        });
      }
      
      throw new Error("All extraction methods failed");
    } catch (error: any) {
      console.error(`Final extraction failure for ${videoId}:`, error.message);
      res.status(500).json({ 
        error: "Extraction failed", 
        message: error.message,
        videoId 
      });
    }
  });

  // API 404 handler to prevent HTML responses for API calls
  app.all('/api/*', (req, res, next) => {
    if (res.headersSent) return next();
    res.status(404).json({ error: 'API route not found', path: req.path });
  });

  // Global Error Handler for API
  app.use('/api', (err: any, req: any, res: any, next: any) => {
    console.error("Global API Error:", err);
    if (res.headersSent) return next(err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message,
      path: req.path
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
