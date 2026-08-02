import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAINXzEjnYcDFYD10fHaVNnL1PMdvcWJik",
  authDomain: "malik-enterprises-72c06.firebaseapp.com",
  projectId: "malik-enterprises-72c06",
  storageBucket: "malik-enterprises-72c06.firebasestorage.app",
  messagingSenderId: "805399463856",
  appId: "1:805399463856:web:7b772203ac4905f9b97875"
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
