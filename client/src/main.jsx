import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

// Шрифт Manrope розміщений локально (без запитів до Google Fonts) — швидше і без стороннього трекінгу
import '@fontsource-variable/manrope';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* basename = шлях публікації (на GitHub Pages це /vetdim-clinic/) */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// PWA: реєструємо service worker лише у production-збірці
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((err) => console.warn('SW:', err));
  });
}
