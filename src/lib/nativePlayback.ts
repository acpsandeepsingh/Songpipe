import { registerPlugin } from '@capacitor/core';

export interface NativePlaybackPlugin {
  play(options: { 
    url: string; 
    title?: string; 
    artist?: string; 
    artUrl?: string; 
  }): Promise<void>;
  stop(): Promise<void>;
  enterPip(): Promise<void>;
}

const NativePlayback = registerPlugin<NativePlaybackPlugin>('NativePlayback');

export default NativePlayback;
