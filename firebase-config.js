const firebaseConfig = {
  apiKey: "AIzaSyBTInhJBnA4i5YONwcv-hnKj_JIZEOHPy0",
  authDomain: "sk-tech-c4b11.firebaseapp.com",
  projectId: "sk-tech-c4b11",
  storageBucket: "sk-tech-c4b11.firebasestorage.app",
  messagingSenderId: "1028806558698",
  appId: "1:1028806558698:web:9440bfda22f89d93122893"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();