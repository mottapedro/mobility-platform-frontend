/**
 * Push notification stub.
 * Full FCM integration requires `npm install firebase` and setting
 * NEXT_PUBLIC_FIREBASE_* env vars. Until then, this module is a safe no-op.
 */

export type NotificationPermission = 'default' | 'granted' | 'denied'

export function getNotificationPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'default'
  return Notification.permission as NotificationPermission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'default'
  const result = await Notification.requestPermission()
  return result as NotificationPermission
}

/**
 * Save FCM token to backend.
 * Placeholder — replace with real FCM init once firebase is installed.
 */
export async function saveFcmToken(_userId: string): Promise<void> {
  // TODO: import { initializeApp } from 'firebase/app'
  // TODO: import { getMessaging, getToken } from 'firebase/messaging'
  // const app = initializeApp({ ... })
  // const messaging = getMessaging(app)
  // const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY })
  // await fetch('/api/fcm-token', { method: 'POST', body: JSON.stringify({ userId, token }) })
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[notifications] saveFcmToken: stub called for userId', _userId)
  }
}
