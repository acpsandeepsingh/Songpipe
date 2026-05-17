import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { Innertube, UniversalCache } from 'youtubei.js';
import yts from 'yt-search';
import axios from 'axios';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  let yt: Innertube | null = null;
  const initInnertube = async () => {
    try {
      yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
        retrieve_player: true
      });
      console.log("YouTube InnerTube initialized (Standard Mode with Player)");
    } catch (err) {
      console.error("Failed to initialize InnerTube:", err);
    }
  };
  await initInnertube();

  app.use(cors());
  app.use(express.json());

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
      
      const searchTerms = ["trending music 2024", "top songs today", "popular music videos"];
      let videos: any[] = [];
      
      for (const term of searchTerms) {
        try {
          const search = await client.search(term, { type: 'video' });
          videos = search.videos || [];
          if (videos.length > 0) break;
        } catch (e) {
          console.warn(`Search failed for term: ${term}`);
        }
      }
      
      if (videos.length === 0) {
        console.log("Innertube search returned no trending videos, trying yt-search fallback...");
        const results = await yts("trending music songs 2024");
        return res.json({
          items: (results.videos || []).map((v: any) => ({
            id: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail || v.image,
            channelName: v.author?.name || 'Unknown',
            channelAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.author?.name}`,
            views: v.views?.toLocaleString() || '0 views',
            uploadedAt: v.ago || 'Trending',
            duration: v.timestamp || '0:00'
          }))
        });
      }

      res.json({
        items: videos.map((v: any) => ({
          id: v.id,
          title: v.title?.toString() || "Untitled",
          thumbnail: v.thumbnails?.[0]?.url || v.thumbnail?.[0]?.url || "",
          channelName: v.author?.name || 'Unknown',
          channelAvatar: v.author?.thumbnails?.[0]?.url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.author?.name}`,
          views: v.short_view_count?.toString() || v.view_count?.toString() || '0 views',
          uploadedAt: v.published?.toString() || 'Trending',
          duration: v.duration?.toString() || '0:00'
        }))
      });
    } catch (error: any) {
      console.error("Trending fetch failed:", error);
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
      const search = await client.search(query, { type: 'video' });
      const videos = (search.videos || []).length > 0 ? search.videos : (search.results || []);

      if (videos.length === 0) {
        console.log(`Innertube returned no results, trying yt-search fallback...`);
        const results = await yts(query);
        return res.json({
          items: (results.videos || []).map((v: any) => ({
            type: 'video',
            id: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail || v.image,
            channelName: v.author?.name || 'Unknown',
            channelAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.author?.name}`,
            views: v.views?.toLocaleString() || '0 views',
            uploadedAt: v.ago || 'Recently',
            duration: v.timestamp || '0:00'
          }))
        });
      }

      res.json({
        items: videos.map((v: any) => ({
          type: 'video',
          id: v.id,
          title: v.title?.toString() || "Untitled",
          thumbnail: v.thumbnails?.[0]?.url || v.thumbnail?.[0]?.url || "",
          channelName: v.author?.name || 'Unknown',
          channelAvatar: v.author?.thumbnails?.[0]?.url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.author?.name}`,
          views: v.short_view_count?.toString() || v.view_count?.toString() || '0 views',
          uploadedAt: v.published?.toString() || 'Recently',
          duration: v.duration?.toString() || '0:00'
        }))
      });
    } catch (error: any) {
      console.error("Search error:", error);
      res.json({ items: [] });
    }
  });

  // Stream Proxy Endpoint (NewPipe style)
  app.get("/api/stream", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).send("URL required");

      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Range': req.headers.range || 'bytes=0-'
        }
      });

      res.set(response.headers);
      if (req.headers.range) res.status(206);
      
      response.data.pipe(res);
    } catch (error: any) {
      console.error("Stream proxy error:", error.message);
      res.status(500).send("Stream proxy failed");
    }
  });

  // Video Info & Extraction Endpoint
  app.get("/api/video-info", async (req, res) => {
    try {
      const client = await getYT();
      const videoId = req.query.id as string;
      if (!videoId) return res.status(400).json({ error: "Video ID required" });

      console.log(`Extracting: ${videoId}`);
      const info = await client.getInfo(videoId);
      
      const adaptiveFormats = info.streaming_data?.adaptive_formats || [];
      const regularFormats = info.streaming_data?.formats || [];

      const getProxyUrl = (f: any) => {
        try {
          const url = f.decipher(client.session.player);
          return `/api/stream?url=${encodeURIComponent(url)}`;
        } catch (e) {
          return f.url;
        }
      };

      res.json({
        title: info.basic_info.title,
        description: (info.basic_info as any).short_description || (info.basic_info as any).description,
        thumbnails: info.basic_info.thumbnail,
        author: {
          name: info.basic_info.author,
          view_count: info.basic_info.view_count 
        },
        viewCount: info.basic_info.view_count,
        publishDate: info.basic_info.is_live ? 'LIVE' : 'Recently',
        formats: {
          audio: adaptiveFormats.filter((f: any) => f.has_audio && !f.has_video).map((f: any) => ({
            url: getProxyUrl(f),
            quality: f.quality_label || f.audio_quality || 'High',
            container: f.mime_type
          })),
          video: [...regularFormats, ...adaptiveFormats.filter((f: any) => f.has_video)].map((f: any) => ({
            url: getProxyUrl(f),
            qualityLabel: f.quality_label || 'High',
            container: f.mime_type
          }))
        }
      });
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ 
        error: "Extraction failed", 
        message: error.message,
        isBotError: error.message.includes('Sign in') || error.message.includes('bot') || error.message.includes('403')
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
