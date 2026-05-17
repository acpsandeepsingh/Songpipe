import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import ytdl from "@distube/ytdl-core";
import yts from "yt-search";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Search Endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });
      
      const r = await yts(query);
      const videos = r.videos.slice(0, 20);
      
      res.json({
        items: videos.map(v => ({
          type: 'video',
          id: v.videoId,
          title: v.title,
          bestThumbnail: { url: v.image },
          author: { 
            name: v.author.name,
            bestAvatar: { url: `https://i.pravatar.cc/150?u=${v.author.name}` }
          },
          views: v.views,
          uploadedAt: v.ago,
          duration: v.timestamp
        }))
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Video Info & Extraction Endpoint
  app.get("/api/video-info", async (req, res) => {
    try {
      const videoId = req.query.id as string;
      if (!videoId) return res.status(400).json({ error: "Video ID required" });

      const info = await ytdl.getInfo(videoId, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        }
      });
      
      // Filter for audio only formats
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
      // Filter for video + audio formats
      const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');

      res.json({
        title: info.videoDetails.title,
        description: info.videoDetails.description,
        thumbnails: info.videoDetails.thumbnails,
        author: info.videoDetails.author,
        viewCount: info.videoDetails.viewCount,
        publishDate: info.videoDetails.publishDate,
        formats: {
          audio: audioFormats.map(f => ({ url: f.url, quality: f.audioQuality, container: f.container })),
          video: videoFormats.map(f => ({ url: f.url, qualityLabel: f.qualityLabel, container: f.container }))
        }
      });
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ 
        error: "Extraction failed", 
        message: error.message,
        isBotError: error.message.includes('confirm you’re not a bot')
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
