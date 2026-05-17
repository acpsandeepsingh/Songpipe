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
        } catch (innerErr) {}

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
  app.get("/api/video-info", async (req, res) => {
    const videoId = req.query.id as string;
    const isNative = req.headers['x-native-mode'] === 'true';
    try {
      if (!videoId) return res.status(400).json({ error: "Video ID required" });

      console.log(`Extracting ${isNative ? '[NATIVE]' : ''} for: ${videoId}`);
      const client = await getYT();
      
      let info: any;
      let streamingData: any;
      let basicInfo: any;

      try {
        // Method 1: Innertube getInfo
        info = await client.getInfo(videoId);
        streamingData = info.streaming_data || (info as any).playability_status?.streaming_data;
        basicInfo = info.basic_info;
        
        if (!streamingData && !basicInfo) throw new Error("Innertube returned empty data");
      } catch (e: any) {
        console.warn(`Innertube failed for ${videoId}, trying ytdl-core...`);
        try {
          // Method 2: YTDL-Core with more robust options
          const ytdlInfo = await ytdl.getInfo(videoId, {
            requestOptions: {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
              }
            }
          });
          
          const formats = ytdlInfo.formats || [];
          if (formats.length === 0) throw new Error("No formats found via ytdl-core");

          return res.json({
            id: videoId,
            title: ytdlInfo.videoDetails.title,
            description: ytdlInfo.videoDetails.description,
            thumbnails: ytdlInfo.videoDetails.thumbnails,
            author: {
              name: ytdlInfo.videoDetails.author.name,
              avatar: ytdlInfo.videoDetails.author.thumbnails?.[0]?.url
            },
            viewCount: ytdlInfo.videoDetails.viewCount,
            publishDate: ytdlInfo.videoDetails.publishDate,
            formats: {
              audio: formats.filter(f => f.hasAudio && !f.hasVideo).map(f => ({
                url: f.url,
                proxyUrl: `/api/stream?url=${encodeURIComponent(f.url || '')}`,
                quality: f.audioQuality || 'Standard',
                container: f.mimeType || 'audio/mp4',
                bitrate: f.bitrate,
                id: f.itag
              })),
              video: formats.filter(f => f.hasVideo).map(f => ({
                url: f.url,
                proxyUrl: `/api/stream?url=${encodeURIComponent(f.url || '')}`,
                quality: f.qualityLabel || 'Standard',
                container: f.mimeType || 'video/mp4',
                bitrate: f.bitrate,
                id: f.itag
              }))
            }
          });
        } catch (e2: any) {
          console.error(`Final extraction failure for ${videoId}:`, e2.message);
          // Method 3: Search fallback (Only metadata, no streams)
          const results = await yts({ videoId });
          return res.json({
            id: videoId,
            title: (results as any).title,
            thumbnails: [{ url: (results as any).thumbnail }],
            author: { name: (results as any).author?.name },
            formats: { audio: [], video: [] },
            error: true,
            message: e2.message
          });
        }
      }

      const adaptiveFormats = streamingData?.adaptive_formats || [];
      const regularFormats = streamingData?.formats || [];

      const isNative = req.headers['x-native-mode'] === 'true';

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
