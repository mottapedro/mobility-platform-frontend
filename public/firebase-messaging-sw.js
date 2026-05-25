// Background push handler for Firebase Cloud Messaging
// This file is served as a Service Worker from /public/

self.addEventListener('push', function (event) {
    if (!event.data) return
    let payload
    try {
        payload = event.data.json()
    } catch {
        payload = { notification: { title: 'Aliado', body: event.data.text() } }
    }

    const title = payload?.notification?.title ?? 'Aliado'
    const options = {
        body: payload?.notification?.body ?? '',
        icon: '/logo.png',
        badge: '/logo.png',
        data: payload?.data ?? {},
    }

    event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
    event.notification.close()
    const url = event.notification.data?.url ?? '/'
    event.waitUntil(clients.openWindow(url))
})
