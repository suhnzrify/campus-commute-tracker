/**
 * Centralized API Config for Campus Commute Tracker
 * Ensures the Android app points to Render and bypasses 'localhost' issues.
 */

// 1. Your Live Render Backend URL (The "Cloud")
const productionApiUrl = 'https://lbs-bus-tracker.onrender.com/api';

// 2. Fallback for local development (Laptop testing)
const localApiUrl = 'http://localhost:4000/api';

/**
 * Logic:
 * 1. Check if VITE_API_URL is defined in your .env file.
 * 2. If not, check if we are running in "development" mode on a browser.
 * 3. Otherwise, default to Render (Production) so the APK works on any phone.
 */
export const API_URL = 
  import.meta.env.VITE_API_URL 
    ? String(import.meta.env.VITE_API_URL).trim() 
    : (import.meta.env.DEV ? localApiUrl : productionApiUrl);

// Important for debugging: Open Chrome Inspect or Logcat to see this!
console.log('🚀 LBS Bus Tracker connecting to:', API_URL);  
  
