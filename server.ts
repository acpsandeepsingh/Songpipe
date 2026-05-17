import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { Innertube } from 'youtubei.js';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  let yt: Innertube;
  try {
    yt = await Innertube.create();
    console.log("YouTube InnerTube initialized");
  } catch (err) {
    console.error("Failed to initialize InnerTube:", err);
  }

  app.use(cors());
  app.use(express.json());

  // Search Endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });
      
      const search = await yt.search(query, { type: 'video' });
      
      res.json({
        items: search.videos.map((v: any) => ({
          type: 'video',
          id: v.id,
          title: v.title?.toString(),
          bestThumbnail: { url: v.thumbnails?.[0]?.url },
          author: { 
            name: v.author?.name,
            bestAvatar: { url: v.author?.thumbnails?.[0]?.url || `https://i.pravatar.cc/150?u=${v.author?.name}` }
          },
          views: v.short_view_count?.toString() || v.view_count?.toString(),
          uploadedAt: v.published?.toString(),
          duration: v.duration?.toString()
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

      const info = await yt.getInfo(videoId);
      
      // Get formats using basic grouping (InnerTube makes this easy)
      const formats = info.streaming_data?.formats || [];
      const adaptiveFormats = info.streaming_data?.adaptive_formats || [];

      res.json({
        title: info.basic_info.title,
        description: info.basic_info.short_description,
        thumbnails: info.basic_info.thumbnail,
        author: {
          name: info.basic_info.author,
          subscriber_count: info.basic_info.view_count 
        },
        viewCount: info.basic_info.view_count,
        publishDate: info.basic_info.is_live ? 'LIVE' : 'Recently',
        formats: {
          audio: adaptiveFormats.filter((f: any) => f.has_audio && !f.has_video).map((f: any) => ({
            url: f.decipher(yt.session.player),
            quality: f.quality_label || f.audio_quality,
            container: f.mime_type
          })),
          video: adaptiveFormats.filter((f: any) => f.has_video).map((f: any) => ({
            url: f.decipher(yt.session.player),
            qualityLabel: f.quality_label,
            container: f.mime_type
          }))
        }
      });
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ 
        error: "Extraction failed", 
        message: error.message,
        isBotError: error.message.includes('Sign in') || error.message.includes('bot')
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
