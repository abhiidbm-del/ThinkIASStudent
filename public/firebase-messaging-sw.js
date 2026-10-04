importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js');

const encoded = new URL(self.location.href).searchParams.get('config');
if (encoded) {
  firebase.initializeApp(JSON.parse(atob(encoded)));
  firebase.messaging().onBackgroundMessage(payload => {
    const notification = payload.notification || {};
    self.registration.showNotification(notification.title || 'ThinkCivil IAS', {
      body: notification.body || '',
      data: { link: payload.data?.link || '/' }
    });
  });
}

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.link || '/'));
});
