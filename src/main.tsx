import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global safeguard: prevent "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
// and "Unexpected token '<', '<!DOCTYPE '... is not valid JSON" across the entire application
if (typeof window !== 'undefined' && typeof window.Response !== 'undefined' && window.Response.prototype) {
  const originalJson = window.Response.prototype.json;
  window.Response.prototype.json = async function () {
    try {
      const text = await this.text();
      if (!text || !text.trim()) {
        return null;
      }
      if (text.trim().startsWith('<')) {
        return null;
      }
      return JSON.parse(text);
    } catch {
      try {
        return await originalJson.call(this);
      } catch {
        return null;
      }
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
