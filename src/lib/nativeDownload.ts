import { registerPlugin } from '@capacitor/core';

export interface NativeDownloadPlugin {
  downloadFile(options: { 
    url: string; 
    filename: string; 
    title?: string;
  }): Promise<void>;
}

const NativeDownload = registerPlugin<NativeDownloadPlugin>('NativeDownload');

export default NativeDownload;
