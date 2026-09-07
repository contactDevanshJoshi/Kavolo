import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration for Kavolo (SAD §2, §7.1)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBphlC2fPKSLt_wj3oNqgwtc4ZllV9RawM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kavolo-e1921.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kavolo-e1921",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kavolo-e1921.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "93595114962",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:93595114962:web:6e46af27d92557670e7c0b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-TFB420QDCH"
};

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Google Sign-In Provider (AUTH-1)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Auth Helper Functions
export const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const logout = () => {
  return signOut(auth);
};

export { onAuthStateChanged };
export default app;
