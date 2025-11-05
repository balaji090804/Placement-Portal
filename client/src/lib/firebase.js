// Firebase client SDK initialization
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTwnDyNO7CY4LBMC-0whfexpWhGM0kkEw",
  authDomain: "placement-portal-6e68d.firebaseapp.com",
  projectId: "placement-portal-6e68d",
  storageBucket: "placement-portal-6e68d.firebasestorage.app",
  messagingSenderId: "1007746359747",
  appId: "1:1007746359747:web:b586d1f2c0a23557901d76",
  measurementId: "G-Z25D9PDWZR",
};

// Basic guard to ensure required config values are present
const requiredConfig = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];
const missing = requiredConfig.filter((k) => !firebaseConfig[k]);
if (missing.length > 0) {
  // Throwing here will surface in the console to catch misconfiguration early
  throw new Error(
    `Missing Firebase configuration: ${missing.join(
      ", "
    )}. Please verify firebaseConfig.`
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithEmailAndPassword, signInWithPopup };
