import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gangadairy.app',
  appName: 'Milk Billing System',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
