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
      const response = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
        headers: this.HEADERS
      });
      return this.parseInitialData(response.data);
    } catch (error) {
      console.error("[Scraper] Search fetch failed:", error);
      return [];
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
      
      // Support multiple renderer types
      if (obj.videoRenderer || obj.playlistVideoRenderer || obj.gridVideoRenderer || obj.musicResponsiveListItemRenderer) {
        const v = obj.videoRenderer || obj.playlistVideoRenderer || obj.gridVideoRenderer || obj.musicResponsiveListItemRenderer;
        
        // Handle differences in structure between renderers
        const videoId = v.videoId || (v.navigationEndpoint?.watchEndpoint?.videoId);
        const title = v.title?.runs?.[0]?.text || v.title?.simpleText || v.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "Untitled";
        const thumbnail = v.thumbnail?.thumbnails?.sort((a: any, b: any) => b.width - a.width)[0]?.url || "";
        const channelName = v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || v.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "YouTube";
        const views = v.viewCountText?.simpleText || v.viewCountText?.runs?.[0]?.text || v.flexColumns?.[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "0 views";
        
        if (videoId && title) {
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
        if (obj.hasOwnProperty(key)) {
          findVideos(obj[key]);
        }
      }
    };

    findVideos(data);
    
    // De-duplicate by ID
    const seen = new Set();
    return videos.filter(v => {
      const duplicate = seen.has(v.id);
      seen.add(v.id);
      return !duplicate && v.id;
    });
  }
}
