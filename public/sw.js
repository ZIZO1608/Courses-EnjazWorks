/* enjazwork courses — service worker: shows push notifications and opens the right page on tap. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "إنجازوورك", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "إنجازوورك";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      dir: data.dir || "auto",
      lang: data.lang || "ar",
      data: { url: data.url || "/me" },
      tag: data.tag,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/me", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (win.url.startsWith(self.location.origin) && "focus" in win) {
          win.navigate(url);
          return win.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

// A fetch handler is required for Android's install prompt. Network-first, no offline caching
// of pages (data must always be fresh).
self.addEventListener("fetch", () => {});
