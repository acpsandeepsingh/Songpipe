import { registerPlugin } from '@capacitor/core';

interface YoutubeExtractorPlugin {
  extractVideo(options: { videoId: string }): Promise<{
    extracted: boolean;
    videoId: string;
    url?: string;
    status?: string;
  }>;
}

const YoutubeExtractor = registerPlugin<YoutubeExtractorPlugin>('YoutubeExtractor');

export default YoutubeExtractor;
