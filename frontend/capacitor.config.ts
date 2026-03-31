import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nudgecheck.app', // Updated ID
  appName: 'Nudge Check',       // Updated Name
  webDir: 'build',
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