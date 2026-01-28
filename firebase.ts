import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Helper safe access for Vite environment variables
const getMetaEnv = () => {
  try {
    return (import.meta as any).env || {};
  } catch {
    return {};
  }
}

const env = getMetaEnv();

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Check if we have a valid project ID. If not, we are in Demo/Offline Mode.
export const isDemoMode = !firebaseConfig.projectId;

// Use placeholder config if in Demo Mode to prevent SDK crashes during initialization
const finalConfig = isDemoMode ? {
    apiKey: "placeholder",
    authDomain: "placeholder.firebaseapp.com",
    projectId: "placeholder-project", 
    storageBucket: "placeholder.appspot.com",
    messagingSenderId: "00000000",
    appId: "1:00000000:web:00000000"
} : firebaseConfig;

if (isDemoMode) {
    console.warn("⚠️ Firebase Config missing. Running in DEMO MODE (Local Data Only).");
}

const app = initializeApp(finalConfig);
export const db = getFirestore(app);