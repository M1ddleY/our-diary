/* 咱俩的日记 · Service Worker（仅注册，不缓存，避免页面更新延迟） */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function () { self.clients.claim(); });
// 不拦截 fetch：始终走网络，改代码即时生效
