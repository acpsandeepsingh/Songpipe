import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { Innertube } from 'youtubei.js';
import yts from 'yt-search';
import axios from 'axios';
import ytdl from '@distube/ytdl-core';
import { YouTubeScraper } from './src/lib/youtubeScraper.js';

async function startServer() {
  const app = express();
  const apiRouter = express.Router();
  const PORT = 3000;
  
  let yt: Innertube | null = null;
  const initInnertube = async () => {
    try {
      yt = await Innertube.create({ generate_session_locally: true });
      console.log("YouTube InnerTube initialized");
    } catch (err) {
      console.error("Failed to initialize InnerTube:", err);
    }
  };
  await initInnertube();

  const getYT = async () => {
    if (!yt) await initInnertube();
    return yt;
  };

  const normalizeVideoData = (raw: any) => {
    return {
      id: raw.id || raw.videoId || raw.v,
      title: raw.title?.toString() || raw.title?.simpleText || "Untitled",
      description: raw.description || raw.short_description || "",
      thumbnail: raw.thumbnails?.[0]?.url || raw.thumbnail || raw.image || "",
      channelName: raw.author?.name || raw.author || raw.channelName || raw.ownerText?.runs?.[0]?.text || "YouTube Artist",
      views: raw.view_count?.toString() || raw.views?.toString() || raw.viewCountText?.simpleText || "0 views",
      uploadedAt: raw.published?.toString() || raw.ago || raw.publishedTimeText?.simpleText || "Recently",
      duration: raw.duration?.toString() || raw.timestamp || raw.lengthText?.simpleText || "0:00"
    };
  };

  app.use(cors());
  app.use(express.json());
  
  // API Router setup
  apiRouter.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    next();
  });

  apiRouter.get("/trending", async (req, res) => {
    try {
      let items = await YouTubeScraper.getTrending();
      if (items.length === 0) {
        const client = await getYT();
        if (client) {
          const trending = await client.getTrending();
          const musicTab = trending.tabs?.find((t: any) => t.title === 'Music' || t.title?.toString() === 'Music');
          const videos = musicTab ? musicTab.content?.contents : trending.videos;
          if (videos) items = videos.map(normalizeVideoData);
        }
      }
      if (items.length === 0) {
        const results = await yts({ query: "trending music videos", type: 'video' });
        items = results.videos.map(normalizeVideoData);
      }
      res.json({ items: items.slice(0, 50) });
    } catch (error: any) {
      res.status(500).json({ items: [], error: error.message });
    }
  });

  apiRouter.get("/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Query required" });
      
      let items = await YouTubeScraper.search(query);
      if (items.length === 0) {
        const client = await getYT();
        if (client) {
          const search = await client.search(query, { type: 'video' });
          items = search.results?.filter((v: any) => v.type === 'Video').map(normalizeVideoData) || [];
        }
      }
      if (items.length === 0) {
        const results = await yts(query);
        items = results.videos.map(normalizeVideoData);
      }
      res.json({ items: items.slice(0, 50) });
    } catch (error: any) {
      res.status(500).json({ items: [], error: error.message });
    }
  });

  apiRouter.get("/video-info", async (req, res) => {
    const videoId = req.query.id as string;
    const isNative = req.headers['x-native-mode'] === 'true' || req.query.native === 'true';
    try {
      if (!videoId) return res.status(400).json({ error: "Video ID required" });
      
      const client = await getYT();
      let info: any;
      try {
        info = await client?.getInfo(videoId);
      } catch (e) {}

      if (info) {
        const streamingData = info.streaming_data || info.playability_status?.streaming_data;
        const basicInfo = info.basic_info;
        const adaptiveFormats = streamingData?.adaptive_formats || [];
        const regularFormats = streamingData?.formats || [];

        const processFormat = (f: any) => {
          let directUrl = "";
          try {
            directUrl = f.decipher ? f.decipher(client?.session.player) : (f.url || "");
          } catch (e) {
            directUrl = f.url || "";
          }
          return {
            url: directUrl,
            proxyUrl: directUrl ? `/api/stream?url=${encodeURIComponent(directUrl)}${isNative ? '&native=true' : ''}` : "",
            quality: f.quality_label || f.audio_quality || f.quality || 'Standard',
            container: f.mime_type || 'video/mp4',
            bitrate: f.bitrate,
            id: f.itag
          };
        };

        return res.json({
          ...normalizeVideoData(basicInfo),
          formats: {
            audio: adaptiveFormats.filter((f: any) => f.has_audio && !f.has_video).map(processFormat),
            video: [...regularFormats, ...adaptiveFormats.filter((f: any) => f.has_video)].map(processFormat)
          }
        });
      }

      // Fallback
      const ytdlInfo = await ytdl.getInfo(videoId).catch(() => null);
      if (ytdlInfo) {
        return res.json({
          ...normalizeVideoData(ytdlInfo.videoDetails),
          formats: {
            audio: ytdlInfo.formats.filter(f => f.hasAudio && !f.hasVideo).map(f => ({
              proxyUrl: `/api/stream?url=${encodeURIComponent(f.url)}`,
              quality: f.audioQuality,
              container: f.mimeType
            })),
            video: ytdlInfo.formats.filter(f => f.hasVideo).map(f => ({
              proxyUrl: `/api/stream?url=${encodeURIComponent(f.url)}`,
              quality: f.qualityLabel,
              container: f.mimeType
            }))
          }
        });
      }

      const searchRes = await yts({ videoId });
      res.json({ ...normalizeVideoData(searchRes), isMetadataOnly: true, error: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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
      Object.keys(response.headers).forEach(h => {
        if (['content-type', 'content-length', 'accept-ranges', 'content-range'].includes(h)) {
          res.setHeader(h, response.headers[h] as string);
        }
      });
      response.data.pipe(res);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  });

  // Mount API Router
  app.use("/api", apiRouter);

  // Fallback for unmatched API routes
  app.all("/api/*", (req, res) => res.status(404).json({ error: "Not Found" }));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer();
