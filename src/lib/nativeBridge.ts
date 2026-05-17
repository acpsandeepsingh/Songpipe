import { registerPlugin } from '@capacitor/core';

export interface Stream {
  url: string;
  quality: string;
  mimeType: string;
  bitrate?: number;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  views: number;
  description: string;
  formats: {
    video: Stream[];
    audio: Stream[];
  };
  nativeMode: boolean;
  playerResponse?: any; // To maintain compatibility with existing code
}

export interface YoutubeExtractorPlugin {
  extractVideo(options: { videoId: string }): Promise<VideoInfo>;
  getNativeHeaders(): Promise<Record<string, string>>;
}

const YoutubeExtractor = registerPlugin<YoutubeExtractorPlugin>('YoutubeExtractor');

export default YoutubeExtractor;
