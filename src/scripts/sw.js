import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BASE_URL } from './config';

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ request }) =>
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'berbagi-cerita-assets',
  }),
);

registerRoute(
  ({ url }) =>
    url.origin === 'https://story-api.dicoding.dev' &&
    url.pathname.startsWith('/v1/stories'),
  new NetworkFirst({
    cacheName: 'dicoding-story-api',
    networkTimeoutSeconds: 5,
  }),
);

registerRoute(
  ({ request, url }) =>
    request.destination === 'image' &&
    url.origin === 'https://story-api.dicoding.dev',
  new StaleWhileRevalidate({
    cacheName: 'dicoding-story-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

registerRoute(
  ({ url }) =>
    url.origin.includes('tile.openstreetmap.org') ||
    url.origin.includes('tile.opentopomap.org'),
  new CacheFirst({
    cacheName: 'leaflet-map-tiles',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

self.addEventListener("push", (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, data.options);
});