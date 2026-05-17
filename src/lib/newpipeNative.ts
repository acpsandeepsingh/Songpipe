import { registerPlugin } from '@capacitor/core';

export interface Stream {
  url: string;
  quality: string;
  format: string;
  bitrate?: number;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  views: string;
  duration: string;
  description: string;
  videoStreams: Stream[];
  audioStreams: Stream[];
}

export interface NewPipeExtractorPlugin {
  getVideoInfo(options: { url: string }): Promise<VideoInfo>;
}

const NewPipeExtractor = registerPlugin<NewPipeExtractorPlugin>('NewPipeExtractor');

export default NewPipeExtractor;
