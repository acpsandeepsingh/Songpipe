import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.newpipe.web',
  appName: 'NewPipe Web',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
