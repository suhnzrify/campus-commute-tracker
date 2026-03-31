import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Intercept all network fetches to forcefully bypass Tunnel warning pages natively in Mobile App builds.
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (!config) config = {};
  if (!config.headers) config.headers = {};
  config.headers = {
    ...config.headers,
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true'
  };
  return originalFetch(resource, config);
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element. Ensure #root exists in index.html");
}

createRoot(rootElement).render(<App />);
