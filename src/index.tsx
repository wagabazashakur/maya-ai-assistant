import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
} else {
    document.body.innerHTML = `<div style="color: red; font-family: sans-serif; padding: 2rem;">Error: Root container not found.</div>`;
}

// Optional: warn if Gemini API key is missing. The helpers in src/core/gemini.ts will
// throw lazily when called, so we avoid blocking app startup here.
if (!(import.meta as any).env?.VITE_GEMINI_API_KEY) {
    console.warn('VITE_GEMINI_API_KEY not set. Add it to .env.local to enable Gemini-backed features.');
}