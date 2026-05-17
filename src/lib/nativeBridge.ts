import { registerPlugin } from '@capacitor/core';

interface YoutubeExtractorPlugin {
  extractVideo(options: { videoId: string }): Promise<any>;
  getNativeHeaders(): Promise<Record<string, string>>;
}

const YoutubeExtractor = registerPlugin<YoutubeExtractorPlugin>('YoutubeExtractor');

export default YoutubeExtractor;
