import axios from 'axios';

export class YouTubeScraper {
  private static HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.164 Mobile Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'X-YouTube-Client-Name': '1',
    'X-YouTube-Client-Version': '2.20240210.00.00'
  };

  static async getTrending() {
    try {
      console.log("[Scraper] Fetching trending music...");
      // Using the music-specific trending endpoint often used by scrapers
      const response = await axios.get('https://www.youtube.com/feed/trending?bp=4gINGgt5dG1hX2NoYXJ0cw%3D%3D', {
        headers: { ...this.HEADERS, 'Referer': 'https://www.youtube.com/' }
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
      // Use PBJ and Music identifiers
      const response = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D&pbj=1`, {
        headers: {
          ...this.HEADERS,
          'X-YouTube-Client-Name': '1',
          'X-YouTube-Client-Version': '2.20240210.00.00'
        }
      });
      
      let html = response.data;
      if (typeof html !== 'string') html = JSON.stringify(html);
      
      return this.parseInitialData(html);
    } catch (error) {
      console.error("[Scraper] Search fetch failed:", error);
      return [];
    }
  }

  static async getVideoInfo(videoId: string) {
    try {
      console.log(`[Scraper] Fetching info for: ${videoId}`);
      
      // Try 1: Standard Watch page with PBJ
      let response = await axios.get(`https://www.youtube.com/watch?v=${videoId}&pbj=1`, {
        headers: this.HEADERS
      });
      let html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      
      let info = this.extractPlayerResponse(html);
      
      // Try 2: Embed page (often has cleaner JSON and stays up longer)
      if (!info) {
        console.log(`[Scraper] Watch page failed for ${videoId}, trying Embed...`);
        response = await axios.get(`https://www.youtube.com/embed/${videoId}`, {
          headers: { ...this.HEADERS, 'Referer': 'https://www.youtube.com/' }
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

  private static extractPlayerResponse(html: string) {
    try {
      // Pattern 1: ytInitialPlayerResponse = {...}
      let start = html.indexOf('ytInitialPlayerResponse = ');
      if (start !== -1) {
        start += 'ytInitialPlayerResponse = '.length;
        const end = html.indexOf(';</script>', start);
        if (end !== -1) return JSON.parse(html.substring(start, end));
      }
      
      // Pattern 2: "ytInitialPlayerResponse":{...}
      start = html.indexOf('"ytInitialPlayerResponse":');
      if (start !== -1) {
        start += '"ytInitialPlayerResponse":'.length;
        // Find matching closing brace for the JSON object
        let depth = 0;
        let end = -1;
        for (let i = start; i < html.length; i++) {
          if (html[i] === '{') depth++;
          else if (html[i] === '}') {
            depth--;
            if (depth === 0) {
              end = i + 1;
              break;
            }
          }
        }
        if (end !== -1) return JSON.parse(html.substring(start, end));
      }

      // Pattern 3: PBJ array response
      if (html.trim().startsWith('[')) {
         const pbj = JSON.parse(html);
         const playerEntry = pbj.find((e: any) => e.playerResponse);
         if (playerEntry) return playerEntry.playerResponse;
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  private static parseInitialData(html: string) {
    try {
      // Try 1: ytInitialData variable
      const jsonStart = html.indexOf('ytInitialData = ');
      if (jsonStart !== -1) {
        const start = jsonStart + 'ytInitialData = '.length;
        const jsonEnd = html.indexOf(';</script>', start);
        if (jsonEnd !== -1) {
          const jsonStr = html.substring(start, jsonEnd);
          return this.extractVideos(JSON.parse(jsonStr));
        }
      }
      
      // Try 2: PBJ response (array of objects)
      if (html.trim().startsWith('[')) {
        const pbj = JSON.parse(html);
        const dataEntry = pbj.find((e: any) => e.response)?.response || pbj.find((e: any) => e.data)?.data;
        if (dataEntry) return this.extractVideos(dataEntry);
      }

      // Try 3: Search within the whole HTML for "ytInitialData":{...}
      const marker = '"ytInitialData":';
      const markerIndex = html.indexOf(marker);
      if (markerIndex !== -1) {
        let start = markerIndex + marker.length;
        while (start < html.length && /\s/.test(html[start])) start++;
        if (html[start] === '{') {
          let depth = 0;
          for (let i = start; i < html.length; i++) {
            if (html[i] === '{') depth++;
            else if (html[i] === '}') {
              depth--;
              if (depth === 0) {
                return this.extractVideos(JSON.parse(html.substring(start, i + 1)));
              }
            }
          }
        }
      }

      return [];
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
