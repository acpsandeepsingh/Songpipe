import axios from 'axios';

export class YouTubeScraper {
  private static HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
  };

  static async getTrending() {
    try {
      console.log("[Scraper] Fetching trending page...");
      const response = await axios.get('https://www.youtube.com/feed/trending?bp=4gINGgt5dG1hX2NoYXJ0cw%3D%3D', {
        headers: this.HEADERS
      });
      return this.parseInitialData(response.data);
    } catch (error) {
      console.error("[Scraper] Trending fetch failed:", error);
      return [];
    }
  }

  static async search(query: string) {
    try {
      console.log(`[Scraper] Searching for: ${query}`);
      const response = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`, {
        headers: this.HEADERS
      });
      return this.parseInitialData(response.data);
    } catch (error) {
      console.error("[Scraper] Search fetch failed:", error);
      return [];
    }
  }

  static async getVideoInfo(videoId: string) {
    try {
      console.log(`[Scraper] Fetching info for: ${videoId}`);
      const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: this.HEADERS
      });
      const html = response.data;
      
      // Extract ytInitialPlayerResponse
      const playerStart = html.indexOf('var ytInitialPlayerResponse = ');
      if (playerStart !== -1) {
        const start = playerStart + 'var ytInitialPlayerResponse = '.length;
        const end = html.indexOf(';</script>', start);
        if (end !== -1) {
          const jsonStr = html.substring(start, end);
          return JSON.parse(jsonStr);
        }
      }
      return null;
    } catch (error) {
      console.error("[Scraper] Info fetch failed:", error);
      return null;
    }
  }

  private static parseInitialData(html: string) {
    try {
      const jsonStart = html.indexOf('var ytInitialData = ');
      if (jsonStart === -1) return [];
      
      const start = jsonStart + 'var ytInitialData = '.length;
      const jsonEnd = html.indexOf(';</script>', start);
      if (jsonEnd === -1) return [];
      
      const jsonStr = html.substring(start, jsonEnd);
      const data = JSON.parse(jsonStr);
      
      return this.extractVideos(data);
    } catch (e) {
      console.error("[Scraper] Parse failed:", e);
      return [];
    }
  }

  private static extractVideos(data: any) {
    const videos: any[] = [];
    
    const findVideos = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      const renderer = obj.videoRenderer || 
                       obj.playlistVideoRenderer || 
                       obj.gridVideoRenderer || 
                       obj.musicResponsiveListItemRenderer ||
                       obj.compactVideoRenderer;

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
            thumbnail = thumbs.sort((a: any, b: any) => (b.width || 0) - (a.width || 0))[0]?.url;
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
            title: title,
            thumbnail: thumbnail,
            channelName: channelName,
            views: views,
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
    
    const seen = new Set();
    return videos.filter(v => {
      if (!v.id || seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }
}
