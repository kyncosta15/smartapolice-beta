import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Auto-recover from stale chunk hashes after a new deploy.
// When the bundler ships new hashed assets, old tabs try to import
// files that no longer exist and throw "Failed to fetch dynamically imported module".
// We force a single reload to pick up the fresh asset manifest.
const handleChunkLoadError = (message: string | undefined) => {
  if (!message) return;
  const isChunkError =
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes("error loading dynamically imported module");
  if (!isChunkError) return;
  const RELOAD_KEY = '__chunk_reload_at';
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  // Only auto-reload once per minute to avoid loops
  if (Date.now() - last < 60_000) return;
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  window.location.reload();
};

window.addEventListener('error', (event) => {
  handleChunkLoadError(event?.message);
});
window.addEventListener('unhandledrejection', (event) => {
  const reason: any = event?.reason;
  handleChunkLoadError(typeof reason === 'string' ? reason : reason?.message);
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
