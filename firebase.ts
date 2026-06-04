import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, Firestore } from 'firebase/firestore';

const env = (import.meta as any).env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const hasValidConfig = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
export const isDemoMode = !hasValidConfig;

let app;
let dbInstance: Firestore | null = null;

if (hasValidConfig) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  dbInstance = initializeFirestore(app, {
    ignoreUndefinedProperties: true
  });
}

export const db: Firestore | null = dbInstance;
