/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/8.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.0.0/firebase-messaging.js');

// firebase.initializeApp({
//   'messagingSenderId': '240965235389',
  
// });
firebase.initializeApp({
    apiKey: "AIzaSyBv8K7EfFbjG0Bb_Ji7_bQirZ1LXaK7ylw",
    authDomain: "llog-9e6bc.firebaseapp.com",
    projectId: "llog-9e6bc",
    storageBucket: "llog-9e6bc.appspot.com",
    messagingSenderId: "240965235389",
    appId: "1:240965235389:web:e580f88807edc926227dd4",
    measurementId: "G-1WTVS2RTGR",
  });
  
const messaging = firebase.messaging();
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
