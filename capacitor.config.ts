import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pikidelivery.customer',
  appName: 'Piki: comida a domicilio',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
