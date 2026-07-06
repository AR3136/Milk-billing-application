import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dairyledger.app',
  appName: 'DairyLedger',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
