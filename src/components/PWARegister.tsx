'use client';

import { useEffect } from 'react';

/**
 * PWARegister — registers the service worker and handles updates.
 * Works with Next.js static export (output: 'export') and Vercel.
 * Must be used inside a Client Component.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        // Check for updates every 60 seconds
        const checkInterval = setInterval(() => reg.update(), 60_000);

        // Handle new service worker waiting
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New version available — send skip-waiting signal
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // Reload when new SW takes control
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });

        return () => clearInterval(checkInterval);
      } catch (err) {
        console.warn('[PWA] Service Worker registration failed:', err);
      }
    };

    // Defer registration until page is loaded
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
