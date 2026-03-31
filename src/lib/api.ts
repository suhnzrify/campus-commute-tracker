/**
 * Centralized API Config - PRODUCTION FIXED
 * This version forces the app to use Render, bypassing all localhost issues.
 */

// 1. Your Live Render Backend URL
const productionApiUrl = 'https://lbs-bus-tracker.onrender.com/api';

// 2. We force the Production URL for the APK build
// This ensures that the Android APK always connects to Render.
export const API_URL = productionApiUrl;

// This will show up in your Android Studio Logcat for debugging
console.log('🚀 LBS Bus Tracker HARD-CONNECTED TO:', API_URL);