if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      await Promise.all(
        registrations.map((registration) => registration.unregister())
      );

      if ('caches' in window) {
        const cacheNames = await caches.keys();

        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }

      console.log('FitCircle: service workers e caches antigos limpos.');
    } catch (error) {
      console.warn('FitCircle: não foi possível limpar cache antigo.', error);
    }
  });
}
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);