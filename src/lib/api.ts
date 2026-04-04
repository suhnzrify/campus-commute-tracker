/**
 * Centralized API Config
 * Reads VITE_API_URL from .env for the backend base URL.
 * Falls back to localhost:4000 for local development.
 */

// VITE_API_URL in .env should be the full API base, e.g.:
//   http://localhost:4000/api        (local dev)
//   https://lbs-bus-tracker.onrender.com/api  (production)
const rawUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:4000/api';

export const API_URL = rawUrl.replace(/\/+$/, '');

console.log('🚀 LBS Bus Tracker API:', API_URL);