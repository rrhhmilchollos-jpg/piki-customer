import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pikidelivery.customer',
  appName: 'PIKI Clientes',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
