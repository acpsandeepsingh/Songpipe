import { registerPlugin } from '@capacitor/core';

interface YoutubeExtractorPlugin {
  extractVideo(options: { videoId: string }): Promise<{
    nativeMode?: boolean;
    videoId: string;
    url?: string;
    status?: string;
  }>;
  getNativeHeaders(): Promise<Record<string, string>>;
}

const YoutubeExtractor = registerPlugin<YoutubeExtractorPlugin>('YoutubeExtractor');

export default YoutubeExtractor;
