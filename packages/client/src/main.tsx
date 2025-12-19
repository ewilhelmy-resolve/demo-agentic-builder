import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { useAuthStore } from './stores/auth-store';

// Check if running in demo mode (GitHub Pages)
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

// Initialize authentication before React renders (skip in demo mode)
if (!IS_DEMO_MODE) {
  console.log('Main: Starting authentication initialization...');
  useAuthStore.getState().initialize();
} else {
  console.log('Main: Demo mode - skipping Keycloak initialization');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);