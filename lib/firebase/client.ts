import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getClientEnv } from "@/lib/env";

let firebaseApp: FirebaseApp | null = null;

export function getFirebaseClientApp() {
  if (firebaseApp) return firebaseApp;

  const config = getClientEnv();

  firebaseApp =
    getApps().find((app) => app.name === "[DEFAULT]") ??
    initializeApp({
      apiKey: config.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: config.NEXT_PUBLIC_FIREBASE_APP_ID,
      messagingSenderId: config.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      storageBucket: config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });

  return firebaseApp;
}

export function getFirebaseClientAuth() {
  getFirebaseClientApp();
  return getAuth(getApp());
}
