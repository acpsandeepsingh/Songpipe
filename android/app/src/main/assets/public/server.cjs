var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_vite = require("vite");
var import_youtubei = require("youtubei.js");
var import_yt_search = __toESM(require("yt-search"), 1);
var import_axios2 = __toESM(require("axios"), 1);

// src/lib/youtubeScraper.ts
var import_axios = __toESM(require("axios"), 1);
var YouTubeScraper = class {
  static {
    this.HEADERS = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.164 Mobile Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "X-YouTube-Client-Name": "1",
      "X-YouTube-Client-Version": "2.20240210.00.00"
    };
  }
  static async getTrending() {
    try {
      console.log("[Scraper] Fetching trending music...");
      const response = await import_axios.default.get("https://www.youtube.com/feed/trending?bp=4gINGgt5dG1hX2NoYXJ0cw%3D%3D", {
        headers: { ...this.HEADERS, "Referer": "https://www.youtube.com/" }
      });
      return this.parseInitialData(response.data);
    } catch (error) {
      console.error("[Scraper] Trending fetch failed:", error);
      return [];
    }
  }
  static async search(query) {
    try {
      console.log(`[Scraper] Searching for: ${query}`);
      const response = await import_axios.default.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D&pbj=1`, {
        headers: {
          ...this.HEADERS,
          "X-YouTube-Client-Name": "1",
          "X-YouTube-Client-Version": "2.20240210.00.00"
        }
      });
      let html = response.data;
      if (typeof html !== "string") html = JSON.stringify(html);
      return this.parseInitialData(html);
    } catch (error) {
      console.error("[Scraper] Search fetch failed:", error);
      return [];
    }
  }
  static async getVideoInfo(videoId) {
    try {
      console.log(`[Scraper] Fetching info for: ${videoId}`);
      let response = await import_axios.default.get(`https://www.youtube.com/watch?v=${videoId}&pbj=1`, {
        headers: this.HEADERS
      });
      let html = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
      let info = this.extractPlayerResponse(html);
      if (!info) {
        console.log(`[Scraper] Watch page failed for ${videoId}, trying Embed...`);
        response = await import_axios.default.get(`https://www.youtube.com/embed/${videoId}`, {
          headers: { ...this.HEADERS, "Referer": "https://www.youtube.com/" }
        });
        html = response.data;
        info = this.extractPlayerResponse(html);
      }
      return info;
    } catch (error) {
      console.error("[Scraper] Info fetch failed:", error);
      return null;
    }
  }
  static extractPlayerResponse(html) {
    try {
      let start = html.indexOf("ytInitialPlayerResponse = ");
      if (start !== -1) {
        start += "ytInitialPlayerResponse = ".length();
        const end = html.indexOf(";</script>", start);
        if (end !== -1) return JSON.parse(html.substring(start, end));
      }
      start = html.indexOf('"ytInitialPlayerResponse":');
      if (start !== -1) {
        start += '"ytInitialPlayerResponse":'.length;
        let depth = 0;
        let end = -1;
        for (let i = start; i < html.length; i++) {
          if (html[i] === "{") depth++;
          else if (html[i] === "}") {
            depth--;
            if (depth === 0) {
              end = i + 1;
              break;
            }
          }
        }
        if (end !== -1) return JSON.parse(html.substring(start, end));
      }
      if (html.trim().startsWith("[")) {
        const pbj = JSON.parse(html);
        const playerEntry = pbj.find((e) => e.playerResponse);
        if (playerEntry) return playerEntry.playerResponse;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  static parseInitialData(html) {
    try {
      const jsonStart = html.indexOf("ytInitialData = ");
      if (jsonStart !== -1) {
        const start = jsonStart + "ytInitialData = ".length;
        const jsonEnd = html.indexOf(";</script>", start);
        if (jsonEnd !== -1) {
          const jsonStr = html.substring(start, jsonEnd);
          return this.extractVideos(JSON.parse(jsonStr));
        }
      }
      if (html.trim().startsWith("[")) {
        const pbj = JSON.parse(html);
        const dataEntry = pbj.find((e) => e.response)?.response || pbj.find((e) => e.data)?.data;
        if (dataEntry) return this.extractVideos(dataEntry);
      }
      const match = html.match(/"ytInitialData":(\{.+?\})/);
      if (match) {
        return this.extractVideos(JSON.parse(match[1]));
      }
      return [];
    } catch (e) {
      console.error("[Scraper] Parse failed:", e);
      return [];
    }
  }
  static extractVideos(data) {
    const videos = [];
    const findVideos = (obj) => {
      if (!obj || typeof obj !== "object") return;
      const renderer = obj.videoRenderer || obj.playlistVideoRenderer || obj.gridVideoRenderer || obj.musicResponsiveListItemRenderer || obj.compactVideoRenderer;
      if (renderer) {
        const v = renderer;
        const videoId = v.videoId || v.navigationEndpoint?.watchEndpoint?.videoId;
        if (videoId) {
          let title = "Untitled";
          if (v.title?.runs?.[0]?.text) title = v.title.runs[0].text;
          else if (v.title?.simpleText) title = v.title.simpleText;
          else if (v.flexColumns) {
            title = v.flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || title;
          }
          let thumbnail = "";
          const thumbs = v.thumbnail?.thumbnails || v.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails;
          if (thumbs && thumbs.length > 0) {
            thumbnail = thumbs.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url;
          }
          let channelName = "YouTube Artist";
          if (v.ownerText?.runs?.[0]?.text) channelName = v.ownerText.runs[0].text;
          else if (v.shortBylineText?.runs?.[0]?.text) channelName = v.shortBylineText.runs[0].text;
          else if (v.flexColumns && v.flexColumns.length > 1) {
            channelName = v.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || channelName;
          }
          let views = "0 views";
          if (v.viewCountText?.simpleText) views = v.viewCountText.simpleText;
          else if (v.viewCountText?.runs?.[0]?.text) views = v.viewCountText.runs[0].text;
          videos.push({
            id: videoId,
            title,
            thumbnail,
            channelName,
            views,
            uploadedAt: v.publishedTimeText?.simpleText || "Recently",
            duration: v.lengthText?.simpleText || v.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text || "0:00"
          });
        }
        return;
      }
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          findVideos(obj[key]);
        }
      }
    };
    findVideos(data);
    const seen = /* @__PURE__ */ new Set();
    return videos.filter((v) => {
      if (!v.id || seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }
};

// server.ts
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  let yt = null;
  const initInnertube = async () => {
    try {
      yt = await import_youtubei.Innertube.create({ generate_session_locally: true });
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
  const normalizeVideoData = (raw) => {
    if (!raw) return null;
    const id = raw.id || raw.videoId || raw.v || raw.navigationEndpoint?.watchEndpoint?.videoId;
    const title = raw.title?.toString() || raw.title?.simpleText || raw.text || raw.title?.runs?.[0]?.text || "Untitled";
    let thumbnail = "";
    if (raw.thumbnails && raw.thumbnails.length > 0) thumbnail = raw.thumbnails[0].url;
    else if (raw.thumbnail) thumbnail = raw.thumbnail;
    else if (raw.image) thumbnail = raw.image;
    else if (raw.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url) thumbnail = raw.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails[0].url;
    const channelName = raw.author?.name || raw.author || raw.channelName || raw.ownerText?.runs?.[0]?.text || raw.shortBylineText?.runs?.[0]?.text || "YouTube Music";
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
  app.use((0, import_cors.default)());
  app.use(import_express.default.json());
  const apiRouter = import_express.default.Router();
  apiRouter.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    res.setHeader("Content-Type", "application/json");
    next();
  });
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
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
        const results = await (0, import_yt_search.default)({ query: "trending music videos", type: "video" });
        items = results.videos.map(normalizeVideoData);
      }
      res.json({ items: items.slice(0, 50) });
    } catch (error) {
      console.error("[API] Trending error:", error);
      res.status(500).json({ items: [], error: error.message });
    }
  });
  apiRouter.get("/search", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) return res.status(400).json({ error: "Query required" });
      console.log(`[API] Search for: ${query}`);
      let items = await YouTubeScraper.search(query);
      if (items.length === 0) {
        console.warn("[API] Scraper failed, falling back to InnerTube");
        const client = await getYT();
        if (client) {
          const search = await client.search(query, { type: "video" });
          items = search.results?.map(normalizeVideoData) || [];
        }
      }
      if (items.length === 0) {
        const results = await (0, import_yt_search.default)(query);
        items = results.videos.map(normalizeVideoData);
      }
      res.json({ items: items.slice(0, 50) });
    } catch (error) {
      console.error("[API] Search error:", error);
      res.status(500).json({ items: [], error: error.message });
    }
  });
  apiRouter.get("/video-info", async (req, res) => {
    const videoId = req.query.id || req.params.id;
    const isNative = req.headers["x-native-mode"] === "true" || req.query.native === "true";
    try {
      if (!videoId) return res.status(400).json({ error: "Video ID required" });
      console.log(`[API] Info for: ${videoId}`);
      const playerResponse = await YouTubeScraper.getVideoInfo(videoId);
      if (playerResponse && playerResponse.videoDetails) {
        const sd = playerResponse.streamingData || {};
        const formats = [...sd.formats || [], ...sd.adaptiveFormats || []];
        const processScrapedFormat = (f) => ({
          url: f.url || f.signatureCipher || f.cipher,
          proxyUrl: f.url || f.signatureCipher || f.cipher ? `/api/stream?url=${encodeURIComponent(f.url || f.signatureCipher || f.cipher)}${isNative ? "&native=true" : ""}` : "",
          quality: f.qualityLabel || f.quality || "Standard",
          container: f.mimeType,
          bitrate: f.bitrate,
          id: f.itag
        });
        return res.json({
          ...normalizeVideoData(playerResponse.videoDetails),
          formats: {
            audio: formats.filter((f) => f.mimeType?.includes("audio")).map(processScrapedFormat),
            video: formats.filter((f) => f.mimeType?.includes("video")).map(processScrapedFormat)
          }
        });
      }
      const client = await getYT();
      let info = await client?.getInfo(videoId);
      if (info) {
        const streamingData = info.streaming_data || info.playability_status?.streaming_data;
        const adaptiveFormats = streamingData?.adaptive_formats || [];
        const processFormat = (f) => ({
          url: f.url || "",
          proxyUrl: f.url ? `/api/stream?url=${encodeURIComponent(f.url)}${isNative ? "&native=true" : ""}` : "",
          quality: f.quality_label || f.quality || "Standard",
          container: f.mime_type
        });
        return res.json({
          ...normalizeVideoData(info.basic_info),
          formats: {
            audio: adaptiveFormats.filter((f) => f.has_audio && !f.has_video).map(processFormat),
            video: adaptiveFormats.filter((f) => f.has_video).map(processFormat)
          }
        });
      }
      res.status(404).json({ error: "Could not extract video info" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  apiRouter.get("/stream", async (req, res) => {
    try {
      const url = req.query.url;
      if (!url) return res.status(400).send("URL required");
      const isNative = req.headers["x-native-mode"] === "true" || req.query.native === "true";
      const response = await (0, import_axios2.default)({
        method: "get",
        url,
        responseType: "stream",
        headers: {
          "User-Agent": isNative ? "com.google.android.youtube/19.11.38 (Linux; U; Android 14; en_US) gzip" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Range": req.headers.range || "bytes=0-",
          "Referer": "https://www.youtube.com/"
        },
        timeout: 2e4
      });
      res.status(response.status);
      ["content-type", "content-length", "accept-ranges", "content-range"].forEach((h) => {
        if (response.headers[h]) res.setHeader(h, response.headers[h]);
      });
      response.data.pipe(res);
    } catch (e) {
      res.status(500).send(e.message);
    }
  });
  app.use("/api", apiRouter);
  app.use("/api", (err, req, res, next) => {
    console.error(`[API Global Error] ${req.url}:`, err);
    res.status(500).json({ error: "Internal Server Error", message: err.message, stack: process.env.NODE_ENV === "development" ? err.stack : void 0 });
  });
  app.all("/api/*", (req, res) => {
    console.log(`[API 404] ${req.url}`);
    res.status(404).json({ error: "API route not found" });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] YouTube Music Proxy running at http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
