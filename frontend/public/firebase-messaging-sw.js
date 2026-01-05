importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyAvbKWE4cfIZHdMDwubjvEY8aYBanqHHHQ",
    authDomain: "smarthome-alertfire.firebaseapp.com",
    projectId: "smarthome-alertfire",
    messagingSenderId: "16022525154",
    appId: "1:16022525154:web:f1f6674dab383c2fafbabb",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    self.registration.showNotification(
        payload.notification.title,
        { body: payload.notification.body }
    );
});
