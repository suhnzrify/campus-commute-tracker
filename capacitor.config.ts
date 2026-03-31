import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campus.commute',
  appName: 'Campus Commute Tracker',
  webDir: 'dist',
  plugins: {
    Geolocation: { // Explicitly tell Capacitor to bundle GPS
    }
  }
};

export default config;
