/**
 * Centralized API Config
 * When running as a Mobile Native app (Capacitor/Cordova), localhost points to the phone.
 * VITE_API_URL should be set to the remote backend IPv4 or domain during production build.
 */
const localApiUrl = 'http://localhost:4000/api';

export const API_URL =
  typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL.trim() !== ''
    ? String(import.meta.env.VITE_API_URL).trim()
    : localApiUrl;

if (API_URL === 'https://singing-findings-forest-tax.trycloudflare.com/api') {
  console.warn('VITE_API_URL is set to the demo remote API; switching to local API for development.', API_URL);
}

