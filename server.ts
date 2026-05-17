import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { Innertube } from 'youtubei.js';
import yts from 'yt-search';
import axios from 'axios';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  let yt: Innertube | null = null;
  const initInnertube = async () => {
    try {
      yt = await Innertube.create();
      console.log("YouTube InnerTube initialized (Standard)");
    } catch (err) {
      console.error("Failed to initialize InnerTube:", err);
    }
  };
  await initInnertube();

  app.use(cors());
  app.use(express.json());
  
  // Prevent aggressive caching on mobile
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  // Helper to ensure yt is ready
  const getYT = async () => {
    if (!yt) await initInnertube();
    if (!yt) throw new Error("YouTube client not available");
    return yt;
  };

  // Trending Music Endpoint
  app.get("/api/trending", async (req, res) => {
    try {
      console.log("Fetching trending results...");
      const client = await getYT();
      
      let videos: any[] = [];
      try {
        const searchTerm = "trending music 2024 billboard";
        const search = await client.search(searchTerm, { type: 'video' });
        videos = search.videos || search.results || [];
      } catch (innerError: any) {
        console.error("Innertube trending search failed, falling back:", innerError.message);
      }
      
      if (videos.length === 0) {
        console.log("Using yt-search for trending fallback...");
        const results = await yts("trending 2024 music charts");
        return res.json({
          items: (results.videos || []).map((v: any) => ({
            id: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail || v.image,
            channelName: v.author?.name || 'Unknown',
            channelAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.author?.name}`,
            views: (v.views || 0).toLocaleString() + ' views',
            uploadedAt: v.ago || 'Trending',
            duration: v.timestamp || '0:00'
          }))
        });
      }

      res.json({
        items: videos.filter((v: any) => v.id).map((v: any) => ({
          id: v.id,
          title: v.title?.toString() || "Untitled",
          thumbnail: v.thumbnails?.[0]?.url || (v as any).thumbnail?.[0]?.url || "",
          channelName: v.author?.name || 'Unknown',
          channelAvatar: v.author?.thumbnails?.[0]?.url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.author?.name}`,
          views: (v.short_view_count || v.view_count || '0').toString() + ' views',
          uploadedAt: v.published?.toString() || 'Trending',
          duration: v.duration?.toString() || '0:00'
        })).slice(0, 30)
      });
    } catch (error: any) {
      console.error("Trending fetch critical failure:", error);
      res.json({ items: [] });
    }
  });

  // Search Endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });
      
      console.log(`Searching for: ${query}`);
      const client = await getYT();
      
      let videos: any[] = [];
      try {
        const searchPromise = client.search(query, { type: 'video' });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000));
        const search = await Promise.race([searchPromise, timeoutPromise]) as any;
        videos = search.videos || search.results || [];
      } catch (e: any) {
        console.warn("Innertube search failed or timed out:", e.message);
      }

      if (videos.length === 0) {
        console.log(`Using yt-search for query "${query}" fallback...`);
        const results = await yts(query);
        return res.json({
          items: (results.videos || []).map((v: any) => ({
            type: 'video',
            id: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail || v.image,
            channelName: v.author?.name || 'Unknown',
            channelAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.author?.name}`,
            views: (v.views || 0).toLocaleString() + ' views',
            uploadedAt: v.ago || 'Recently',
            duration: v.timestamp || '0:00'
          }))
        });
      }

      res.json({
        items: videos.filter((v: any) => v.id).map((v: any) => ({
          type: 'video',
          id: v.id,
          title: v.title?.toString() || "Untitled",
          thumbnail: v.thumbnails?.[0]?.url || (v as any).thumbnail?.[0]?.url || "",
          channelName: v.author?.name || 'Unknown',
          channelAvatar: v.author?.thumbnails?.[0]?.url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.author?.name}`,
          views: (v.short_view_count || v.view_count || '0').toString() + ' views',
          uploadedAt: v.published?.toString() || 'Recently',
          duration: v.duration?.toString() || '0:00'
        }))
      });
    } catch (error: any) {
      console.error("Search critical failure:", error);
      res.json({ items: [] });
    }
  });

  // Stream Proxy Endpoint (NewPipe style)
  app.get("/api/stream", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).send("URL required");

      console.log(`Proxying stream for mobile: ${url.substring(0, 100)}...`);

      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        headers: {
          'User-Agent': 'com.google.android.youtube/19.11.38 (Linux; U; Android 14; en_US) gzip',
          'Connection': 'keep-alive',
          'Range': req.headers.range || 'bytes=0-'
        }
      });

      // Pick only relevant headers to forward
      const headersToForward = [
        'content-type',
        'content-length',
        'accept-ranges',
        'content-range',
        'cache-control',
        'content-disposition',
        'expires',
        'last-modified'
      ];

      headersToForward.forEach(h => {
        if (response.headers[h]) {
          res.setHeader(h, response.headers[h]);
        }
      });

      // Force content-type if missing
      if (!res.getHeader('content-type')) {
        if (url.includes('mime=audio')) res.setHeader('content-type', 'audio/mp4');
        else res.setHeader('content-type', 'video/mp4');
      }

      if (req.headers.range) {
        res.status(206);
      }
      
      response.data.pipe(res);
      
      response.data.on('error', (err: any) => {
        console.error("Stream pipe error:", err.message);
      });

    } catch (error: any) {
      console.error("Stream proxy error:", error.message);
      if (error.response) {
        console.error("YouTube response status:", error.response.status);
        res.status(error.response.status).send(error.response.data);
      } else {
        res.status(500).send("Stream proxy failed: " + error.message);
      }
    }
  });

  // Video Info & Extraction Endpoint
  app.get("/api/video-info", async (req, res) => {
    try {
      const client = await getYT();
      const videoId = req.query.id as string;
      if (!videoId) return res.status(400).json({ error: "Video ID required" });

      console.log(`Extracting metadata and streams for: ${videoId}`);
      const info = await client.getInfo(videoId);
      
      const adaptiveFormats = info.streaming_data?.adaptive_formats || [];
      const regularFormats = info.streaming_data?.formats || [];

      // Improved extraction logic similar to NewPipe's extractor
      const processFormat = (f: any) => {
        let directUrl = "";
        try {
          directUrl = f.decipher(client.session.player);
        } catch (e) {
          directUrl = f.url || "";
        }
        
        return {
          url: directUrl,
          proxyUrl: directUrl ? `/api/stream?url=${encodeURIComponent(directUrl)}` : "",
          quality: f.quality_label || f.audio_quality || 'Standard',
          container: f.mime_type,
          bitrate: f.bitrate,
          id: f.itag
        };
      };

      const audioFormats = adaptiveFormats.filter((f: any) => f.has_audio && !f.has_video).map(processFormat);
      const videoFormats = [...regularFormats, ...adaptiveFormats.filter((f: any) => f.has_video)].map(processFormat);

      res.json({
        id: videoId,
        title: info.basic_info.title,
        description: (info.basic_info as any).short_description || (info.basic_info as any).description,
        thumbnails: info.basic_info.thumbnail,
        author: {
          name: info.basic_info.author,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${info.basic_info.author}`
        },
        viewCount: info.basic_info.view_count,
        publishDate: info.basic_info.is_live ? 'LIVE' : 'Recently',
        formats: {
          audio: audioFormats.length > 0 ? audioFormats : regularFormats.map(processFormat),
          video: videoFormats
        }
      });
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ 
        error: "Extraction failed", 
        message: error.message,
        videoId: req.query.id
      });
    }
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
