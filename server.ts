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
      console.log("Fetching trending results via yt-search...");
      // yt-search is much faster and more reliable than Innertube for general lists
      const results = await yts("trending songs 2024 music");
      
      const items = (results.videos || []).slice(0, 40).map((v: any) => ({
        id: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail || v.image,
        channelName: v.author?.name || 'Unknown',
        channelAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.author?.name}`,
        views: (v.views || 0).toLocaleString() + ' views',
        uploadedAt: v.ago || 'Trending',
        duration: v.timestamp || '0:00'
      }));

      res.json({ items });
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
      
      console.log(`Searching for: ${query} via yt-search`);
      // yt-search is extremely fast and reliable
      const results = await yts(query);
      
      const items = (results.videos || []).map((v: any) => ({
        type: 'video',
        id: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail || v.image,
        channelName: v.author?.name || 'Unknown',
        channelAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.author?.name}`,
        views: (v.views || 0).toLocaleString() + ' views',
        uploadedAt: v.ago || 'Recently',
        duration: v.timestamp || '0:00'
      }));

      // No fallback needed if yt-search works, it's very reliable
      res.json({ items });
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

      console.log(`Proxying stream: ${url.substring(0, 100)}...`);

      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Connection': 'keep-alive',
          'Range': req.headers.range || 'bytes=0-',
          'Referer': 'https://www.youtube.com/',
          'Origin': 'https://www.youtube.com'
        },
        timeout: 15000 
      });

      // Transfer headers
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

      if (response.status === 206 || req.headers.range) {
        res.status(206);
      }

      if (!res.getHeader('content-type')) {
        if (url.includes('mime=audio')) res.setHeader('content-type', 'audio/mp4');
        else res.setHeader('content-type', 'video/mp4');
      }

      response.data.pipe(res);

      res.on('close', () => {
        if (response.data.destroy) response.data.destroy();
      });

    } catch (error: any) {
      console.error("Stream proxy error:", error.message);
      if (error.response) {
        res.status(error.response.status).send(error.response.data);
      } else {
        res.status(500).send("Stream proxy failed: " + error.message);
      }
    }
  });

  // Video Info & Extraction Endpoint
  app.get("/api/video-info", async (req, res) => {
    const videoId = req.query.id as string;
    try {
      if (!videoId) return res.status(400).json({ error: "Video ID required" });

      console.log(`Extracting for: ${videoId}`);
      const client = await getYT();
      
      let info: any;
      let streamingData: any;
      let basicInfo: any;

      try {
        // Method 1: Innertube getInfo (Most detailed)
        info = await client.getInfo(videoId);
        streamingData = info.streaming_data || (info as any).playability_status?.streaming_data;
        basicInfo = info.basic_info;
      } catch (e: any) {
        console.warn(`Innertube getInfo failed for ${videoId}:`, e.message);
        try {
          // Method 2: Innertube getBasicInfo
          info = await client.getBasicInfo(videoId);
          streamingData = info.streaming_data || (info as any).playability_status?.streaming_data;
          basicInfo = info.basic_info;
        } catch (e2: any) {
          console.warn(`Innertube failed, trying ytdl-core fallback...`);
          // Method 3: YTDL-Core
          try {
             const ytdlInfo = await ytdl.getInfo(videoId, {
                requestOptions: {
                   headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                   }
                }
             });
             const bestThumbnail = ytdlInfo.videoDetails.thumbnails.pop();
             
             return res.json({
               id: videoId,
               title: ytdlInfo.videoDetails.title,
               description: ytdlInfo.videoDetails.description,
               thumbnails: bestThumbnail ? [bestThumbnail] : [],
               author: {
                 name: ytdlInfo.videoDetails.author.name,
                 avatar: ytdlInfo.videoDetails.author.thumbnails?.[0]?.url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ytdlInfo.videoDetails.author.name}`
               },
               viewCount: ytdlInfo.videoDetails.viewCount,
               publishDate: ytdlInfo.videoDetails.publishDate || 'Recently',
               formats: {
                 audio: ytdlInfo.formats.filter(f => f.hasAudio && !f.hasVideo).map(f => ({
                   url: f.url,
                   proxyUrl: `/api/stream?url=${encodeURIComponent(f.url || '')}`,
                   quality: f.audioQuality || 'Standard',
                   container: f.mimeType || 'audio/mp4',
                   bitrate: f.bitrate,
                   id: f.itag
                 })),
                 video: ytdlInfo.formats.filter(f => f.hasVideo).map(f => ({
                   url: f.url,
                   proxyUrl: `/api/stream?url=${encodeURIComponent(f.url || '')}`,
                   quality: f.qualityLabel || 'Standard',
                   container: f.mimeType || 'video/mp4',
                   bitrate: f.bitrate,
                   id: f.itag
                 }))
               }
             });
          } catch (e3: any) {
             console.error("YTDL-Core also failed:", e3.message);
             // Method 4: Scrape search results for basic data if nothing else works
             try {
               const searchResults = await yts({ videoId });
               if (searchResults) {
                 return res.json({
                   id: videoId,
                   title: (searchResults as any).title,
                   thumbnails: [{ url: (searchResults as any).thumbnail }],
                   author: { name: (searchResults as any).author?.name },
                   formats: { audio: [], video: [] },
                   error: true,
                   message: "Direct extraction blocked. Using YouTube fallback."
                 });
               }
             } catch (e4) {
                return res.status(500).json({ error: "All extraction methods failed", message: e3.message });
             }
          }
        }
      }
      
      if (!streamingData && !basicInfo) {
        throw new Error("No playback data available (potentially age restricted or private)");
      }

      const adaptiveFormats = streamingData?.adaptive_formats || [];
      const regularFormats = streamingData?.formats || [];

      const processFormat = (f: any) => {
        let directUrl = "";
        try {
          directUrl = f.decipher ? f.decipher(client.session.player) : (f.url || "");
        } catch (e) {
          directUrl = f.url || "";
        }
        
        return {
          url: directUrl,
          proxyUrl: directUrl ? `/api/stream?url=${encodeURIComponent(directUrl)}` : "",
          quality: f.quality_label || f.audio_quality || f.quality || 'Standard',
          container: f.mime_type || 'video/mp4',
          bitrate: f.bitrate,
          id: f.itag
        };
      };

      const audioFormats = adaptiveFormats.filter((f: any) => f.has_audio && !f.has_video).map(processFormat);
      const videoFormats = [...regularFormats, ...adaptiveFormats.filter((f: any) => f.has_video)].map(processFormat);

      res.json({
        id: videoId,
        title: basicInfo?.title || "Untitled Video",
        description: basicInfo?.short_description || basicInfo?.description || "",
        thumbnails: basicInfo?.thumbnail || [],
        author: {
          name: basicInfo?.author || "Unknown Artist",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${basicInfo?.author || 'YouTube'}`
        },
        viewCount: basicInfo?.view_count || "0",
        publishDate: basicInfo?.is_live ? 'LIVE' : 'Recently',
        formats: {
          audio: audioFormats.length > 0 ? audioFormats : regularFormats.map(processFormat),
          video: videoFormats
        }
      });
    } catch (error: any) {
      console.error(`Extraction error for ${videoId}:`, error.message);
      // Try to return at least something from yt-search if Innertube fails completely
      try {
        const results = await yts({ videoId: videoId });
        if (results) {
           return res.json({
             id: videoId,
             title: (results as any).title,
             thumbnails: [{ url: (results as any).thumbnail }],
             author: { name: (results as any).author?.name },
             error: true,
             message: error.message
           });
        }
      } catch (e) {}

      res.status(500).json({ 
        error: "Extraction failed", 
        message: error.message,
        videoId: videoId
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
