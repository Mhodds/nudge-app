import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ruckkick.app',
  appName: 'RUCK KICK',
  webDir: 'build',
  // For local builds - the app is bundled within the native app
  // No server URL means the app runs from local assets
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#171D2B',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#171D2B',
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#171D2B',
  },
};

export default config;
