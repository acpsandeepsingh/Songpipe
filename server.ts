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

  // Data Normalizer (NewPipe Style)
  const normalizeVideoData = (raw: any) => {
    return {
      id: raw.id || raw.videoId || raw.v,
      title: raw.title?.toString() || "Untitled",
      description: raw.description || raw.short_description || "",
      thumbnail: raw.thumbnails?.[0]?.url || raw.thumbnail || raw.image || "",
      author: {
        name: raw.author?.name || raw.author || raw.channelName || "YouTube Artist",
        avatar: raw.author?.thumbnails?.[0]?.url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(raw.author?.name || raw.author || 'YT')}`
      },
      views: raw.view_count?.toString() || raw.views?.toString() || "0",
      published: raw.published?.toString() || raw.ago || "Recent",
      duration: raw.duration?.toString() || raw.timestamp || "0:00"
    };
  };

  // Helper to ensure yt is ready
  const getYT = async () => {
    if (!yt) {
      try {
        yt = await Innertube.create({
           generate_session_locally: true,
           fetch: (input: any, init: any) => fetch(input, { ...init, timeout: 15000 })
        });
        console.log("InnerTube Client Created");
      } catch (e) {
        console.error("Innertube init failed:", e);
      }
    }
    return yt;
  };

  // Trending Music Endpoint
  app.get("/api/trending", async (req, res) => {
    try {
      console.log("Fetching trending music...");
      const client = await getYT();
      
      let items: any[] = [];
      
      // Attempt 1: InnerTube Music Trending (Most accurate for music)
      try {
        if (client) {
          const trending = await client.getTrending();
          // Find the Music section
          const musicTab = trending.tabs.find((t: any) => t.title === 'Music' || t.title?.toString() === 'Music');
          const videos = musicTab ? musicTab.content?.contents : trending.videos;
          
          if (videos && videos.length > 0) {
            items = videos.map((v: any) => normalizeVideoData(v));
          }
        }
      } catch (e) {
        console.warn("Innertube trending failed, falling back to yt-search");
      }

      // Attempt 2: Fallback to yt-search
      if (items.length === 0) {
        const results = await yts({ query: "trending music videos", type: 'video' });
        items = results.videos.map(v => normalizeVideoData(v));
      }

      res.json({ items });
    } catch (error: any) {
      console.error("Trending critical failure:", error);
      res.status(500).json({ items: [], error: error.message });
    }
  });

  // Search Endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });
      
      console.log(`Searching for: ${query}`);
      const client = await getYT();
      let items: any[] = [];

      // Attempt 1: InnerTube (Search provides more info)
      try {
        if (client) {
          const search = await client.search(query, { type: 'video' });
          items = search.results?.filter((v: any) => v.type === 'Video').map((v: any) => normalizeVideoData(v)) || [];
        }
      } catch (e) {
        console.warn("Innertube search failed, falling back to yt-search");
      }

      // Attempt 2: yt-search
      if (items.length === 0) {
        const results = await yts(query);
        items = results.videos.map(v => normalizeVideoData(v));
      }

      res.json({ items });
    } catch (error: any) {
      console.error("Search critical failure:", error);
      res.status(500).json({ items: [], error: error.message });
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
        // Try getting info with the default client
        info = await client.getInfo(videoId);
      } catch (e: any) {
        console.warn(`Primary extraction failed for ${videoId}: ${e.message}`);
        // NewPipe-like fallback: Try a different endpoint or client configuration if possible
        // For now, we'll rely on our existing fallbacks below if info remains null
      }

      if (info) {
        const streamingData = info.streaming_data || (info as any).playability_status?.streaming_data;
        const basicInfo = info.basic_info;
        const adaptiveFormats = streamingData?.adaptive_formats || [];
        const regularFormats = streamingData?.formats || [];

        const processFormat = (f: any) => {
          let directUrl = "";
          try {
            // Deciphering is key for high-quality formats, same as NewPipe
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

        const normalized = normalizeVideoData(basicInfo);

        return res.json({
          ...normalized,
          formats: {
            audio: audioFormats.length > 0 ? audioFormats : regularFormats.map(processFormat),
            video: videoFormats
          }
        });
      }

      // Fallback 1: YTDL-Core
      try {
        const ytdlInfo = await ytdl.getInfo(videoId);
        const formats = ytdlInfo.formats || [];
        return res.json({
          ...normalizeVideoData(ytdlInfo.videoDetails),
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

      // Fallback 2: Metadata only (yt-search)
      const searchRes = await yts({ videoId });
      if (searchRes) {
        return res.json({
          ...normalizeVideoData(searchRes),
          error: true,
          message: "Video streams unavailable on server. Try Native Mode.",
          isMetadataOnly: true
        });
      }
      
      throw new Error("All extraction methods failed for this video");
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
